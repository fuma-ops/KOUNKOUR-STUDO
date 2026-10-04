/**
 * Fonction serverless Vercel — récupération des documents d'annonces Radar.
 *
 * GET /api/radar/fetch-docs?limit=2   (jeton admin obligatoire)
 *
 * Pour chaque annonce en attente (radar_candidates.status = pending_review et
 * documents pas encore récupérés), le serveur — qui a accès aux sites sources —
 * ouvre la page, stocke son texte et télécharge les fichiers de l'arrêté
 * (images, PDF) dans radar_documents. L'annonce passe alors en
 * analysis_status = 'a_analyser'. L'analyse elle-même est faite ensuite par
 * Claude, sur « go » du propriétaire (voir docs/radar-analyse-ia.md).
 * Rien n'est publié ici.
 */
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { BROWSER_HEADERS } from '../_lib/parsers.ts';
import { extractAnnouncement } from '../_lib/announcement.ts';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zcxkxqsqzwtdnrupxlah.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_YfuzhtBBjs7CM1YxjphZzQ__r3Q3VZM';

const MAX_FILE_BYTES = 3 * 1024 * 1024; // au-delà : lien conservé, fichier non stocké
const MAX_FILES = 6;
const MAX_LIMIT = 4;
const TIME_BUDGET_MS = 40000; // la fonction est limitée à 60 s
const ALLOWED_HOSTS = /(^|\.)(dreamjob\.ma|emploi-public\.ma|gov\.ma|ac\.ma|ma)$/i;

async function download(url: string): Promise<{ kind: 'image' | 'pdf'; mime: string; bytes: Buffer } | { error: string }> {
  try {
    const r = await fetch(url, { headers: { ...BROWSER_HEADERS, Accept: 'image/*,application/pdf,*/*' }, signal: AbortSignal.timeout(15000), redirect: 'follow' });
    if (!r.ok) return { error: `HTTP ${r.status}` };
    const mime = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const kind = mime === 'application/pdf' ? 'pdf' : mime.startsWith('image/') && mime !== 'image/svg+xml' && mime !== 'image/gif' ? 'image' : null;
    if (!kind) return { error: `type non pris en charge (${mime || 'inconnu'})` };
    const len = Number(r.headers.get('content-length') || 0);
    if (len > MAX_FILE_BYTES) return { error: `fichier trop lourd (${Math.round(len / 1024)} Ko)` };
    const bytes = Buffer.from(await r.arrayBuffer());
    if (bytes.length > MAX_FILE_BYTES) return { error: `fichier trop lourd (${Math.round(bytes.length / 1024)} Ko)` };
    if (kind === 'image' && bytes.length < 15 * 1024) return { error: 'image trop petite (icône/vignette)' };
    return { kind, mime, bytes };
  } catch (e: any) {
    return { error: e?.name === 'TimeoutError' ? 'délai dépassé' : e?.message || 'erreur réseau' };
  }
}

export default async function handler(req: any, res: any) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ ok: false, error: 'Connexion admin requise.' });
    return;
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query?.limit) || 2));
  const started = Date.now();

  try {
    const { data: rows, error } = await supabase
      .from('radar_candidates')
      .select('id, title_original, source_url')
      .eq('status', 'pending_review')
      .is('docs_fetched_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);

    const processed: any[] = [];
    for (const c of rows || []) {
      if (Date.now() - started > TIME_BUDGET_MS) break; // le reste au prochain appel
      const report: any = { id: c.id, title: c.title_original, url: c.source_url, files: 0, errors: [] as string[] };
      let host = '';
      try {
        host = new URL(c.source_url).hostname;
      } catch {
        /* URL invalide */
      }
      if (!host || !ALLOWED_HOSTS.test(host)) {
        report.errors.push(`domaine non autorisé (${host || 'URL invalide'})`);
        await supabase.from('radar_candidates').update({ docs_fetched_at: new Date().toISOString(), analysis_status: 'erreur' }).eq('id', c.id);
        processed.push(report);
        continue;
      }

      let html = '';
      try {
        const r = await fetch(c.source_url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(12000) });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        html = await r.text();
      } catch (e: any) {
        report.errors.push(`page injoignable : ${e?.message || e}`);
        await supabase.from('radar_documents').upsert(
          { candidate_id: c.id, url: c.source_url, kind: 'page', fetch_error: String(e?.message || e) },
          { onConflict: 'candidate_id,url' }
        );
        await supabase.from('radar_candidates').update({ docs_fetched_at: new Date().toISOString(), analysis_status: 'erreur' }).eq('id', c.id);
        processed.push(report);
        continue;
      }

      const { text, media } = extractAnnouncement(html, c.source_url);
      report.pageChars = text.length;
      const docs: any[] = [
        { candidate_id: c.id, url: c.source_url, kind: 'page', mime: 'text/plain', size_bytes: text.length, sha256: createHash('sha256').update(text).digest('hex'), text_content: text },
      ];
      for (const m of media.slice(0, MAX_FILES)) {
        let src = m.url;
        let d = await download(src);
        if ('error' in d && m.fallbackUrl) {
          src = m.fallbackUrl;
          d = await download(src);
        }
        if ('error' in d) {
          docs.push({ candidate_id: c.id, url: m.url, kind: m.kind, fetch_error: d.error });
          report.errors.push(`${m.url.split('/').pop()} : ${d.error}`);
        } else {
          docs.push({
            candidate_id: c.id,
            url: src,
            kind: d.kind,
            mime: d.mime,
            size_bytes: d.bytes.length,
            sha256: createHash('sha256').update(d.bytes).digest('hex'),
            content_b64: d.bytes.toString('base64'),
          });
          report.files++;
        }
      }

      for (const doc of docs) {
        const { error: e } = await supabase.from('radar_documents').upsert(doc, { onConflict: 'candidate_id,url' });
        if (e) report.errors.push(`stockage : ${e.message}`);
      }
      await supabase
        .from('radar_candidates')
        .update({ docs_fetched_at: new Date().toISOString(), analysis_status: 'a_analyser' })
        .eq('id', c.id);
      processed.push(report);
    }

    const { count } = await supabase
      .from('radar_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_review')
      .is('docs_fetched_at', null);

    res.status(200).json({ ok: true, processed, remaining: count ?? 0 });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Erreur' });
  }
}
