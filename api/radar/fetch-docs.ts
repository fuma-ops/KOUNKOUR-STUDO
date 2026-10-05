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
import { AnnouncementMedia, extractAnnouncement, extractFromWordpressFeed, wpMediaToList, wpPostToHtml } from '../_lib/announcement.ts';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zcxkxqsqzwtdnrupxlah.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_YfuzhtBBjs7CM1YxjphZzQ__r3Q3VZM';

const MAX_FILE_BYTES = 3 * 1024 * 1024; // au-delà : lien conservé, fichier non stocké
const MAX_FILES = 6;
const MAX_LIMIT = 4;
const TIME_BUDGET_MS = 40000; // la fonction est limitée à 60 s
const ALLOWED_HOSTS = /(^|\.)(dreamjob\.ma|emploi-public\.ma|gov\.ma|ac\.ma|ma)$/i;

// Politesse envers dreamjob.ma (cahier §13.1 : délai entre requêtes, pas de contournement).
const DREAMJOB_HOST = /(^|\.)dreamjob\.ma$/i;
// 8 s entre deux requêtes : la première version (≈ 1 requête/s, 04/10 21:07)
// a déclenché la protection de dreamjob, qui refuse depuis notre serveur.
const DREAMJOB_DELAY_MS = 8000;
const DREAMJOB_MAX_FILES = 2;
let lastDreamjobAt = 0;
async function politeWait(url: string) {
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    return;
  }
  if (!DREAMJOB_HOST.test(host)) return;
  const wait = lastDreamjobAt + DREAMJOB_DELAY_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastDreamjobAt = Date.now();
}

// Flux RSS public de WordPress pour un article (?feed=rss2&name=<slug>) :
// canal prévu pour la lecture automatique, utilisé si la page HTML est refusée.
async function fetchFromFeed(pageUrl: string): Promise<string | null> {
  const u = new URL(pageUrl);
  const slug = u.pathname.split('/').filter(Boolean).pop();
  if (!slug) return null;
  const feedUrl = `${u.origin}/?feed=rss2&name=${encodeURIComponent(slug)}`;
  await politeWait(feedUrl);
  const r = await fetch(feedUrl, { headers: { ...BROWSER_HEADERS, Accept: 'application/rss+xml,application/xml,text/xml' }, signal: AbortSignal.timeout(12000) });
  if (!r.ok) return null;
  return extractFromWordpressFeed(await r.text(), pageUrl);
}

// API REST publique de WordPress (/wp-json/wp/v2) : article complet, avec les
// images de l'arrêté insérées dans le texte et les fichiers rattachés.
async function fetchFromWpApi(pageUrl: string): Promise<{ html: string; attachments: AnnouncementMedia[] } | null> {
  const u = new URL(pageUrl);
  const slug = u.pathname.split('/').filter(Boolean).pop();
  if (!slug) return null;
  const headers = { ...BROWSER_HEADERS, Accept: 'application/json' };
  const postUrl = `${u.origin}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=id,title,content`;
  await politeWait(postUrl);
  const r = await fetch(postUrl, { headers, signal: AbortSignal.timeout(12000) });
  if (!r.ok) return null;
  const post = wpPostToHtml(await r.json().catch(() => null));
  if (!post) return null;
  let attachments: AnnouncementMedia[] = [];
  const mediaUrl = `${u.origin}/wp-json/wp/v2/media?parent=${post.id}&per_page=20&_fields=source_url,mime_type`;
  await politeWait(mediaUrl);
  const m = await fetch(mediaUrl, { headers, signal: AbortSignal.timeout(12000) }).catch(() => null);
  if (m?.ok) attachments = wpMediaToList(await m.json().catch(() => null));
  return { html: post.html, attachments };
}

async function download(url: string): Promise<{ kind: 'image' | 'pdf'; mime: string; bytes: Buffer } | { error: string }> {
  try {
    await politeWait(url);
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
  // Préparation quotidienne : la tâche planifiée Supabase passe ?key= (vérifiée par les RLS).
  const robotKey = !token && typeof req.query?.key === 'string' && /^[0-9a-f]{64}$/.test(req.query.key) ? req.query.key : null;
  if (!token && !robotKey) {
    res.status(401).json({ ok: false, error: 'Connexion admin requise.' });
    return;
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : { 'x-radar-key': robotKey as string } },
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
      let extraMedia: AnnouncementMedia[] = [];
      try {
        // dreamjob : le flux RSS d'abord (canal prévu pour la lecture automatique,
        // contenu de l'article sans le menu du site), la page en secours.
        // La page d'abord : c'est elle qui contient le texte complet (spécialités,
        // diplômes, dates). Pour dreamjob, si elle est refusée : API WordPress,
        // puis flux RSS (extrait seulement). Lentement, sans contournement.
        await politeWait(c.source_url);
        const r = await fetch(c.source_url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(12000) });
        if (r.ok) {
          html = await r.text();
          report.method = 'page';
        } else if (DREAMJOB_HOST.test(host)) {
          const fromApi = await fetchFromWpApi(c.source_url).catch(() => null);
          const fromFeed = fromApi ? null : await fetchFromFeed(c.source_url).catch(() => null);
          if (fromApi) {
            html = fromApi.html;
            extraMedia = fromApi.attachments;
            report.method = 'API WordPress';
          } else if (fromFeed) {
            html = fromFeed;
            report.method = 'flux RSS (extrait seulement)';
          } else {
            throw new Error(`HTTP ${r.status} (page, API et flux refusés)`);
          }
        } else {
          throw new Error(`HTTP ${r.status}`);
        }
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

      const extracted = extractAnnouncement(html, c.source_url);
      const text = extracted.text;
      const media = [...extracted.media, ...extraMedia.filter((x) => !extracted.media.some((y) => y.url === x.url))];
      report.pageChars = text.length;
      const docs: any[] = [
        { candidate_id: c.id, url: c.source_url, kind: 'page', mime: 'text/plain', size_bytes: text.length, sha256: createHash('sha256').update(text).digest('hex'), text_content: text, fetch_error: null, raw_html: report.method === 'page' ? html.slice(0, 400000) : null },
      ];
      for (const m of media.slice(0, DREAMJOB_HOST.test(host) ? DREAMJOB_MAX_FILES : MAX_FILES)) {
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
            fetch_error: null,
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
