/**
 * Fonction serverless Vercel — suivi des concours après la clôture.
 *
 * GET /api/radar/track-stages?key=<clé robot>&limit=25     vérifie un lot de concours
 *     &dry=1                                              aperçu (rien n'est enregistré ni envoyé)
 *
 * Appelée par la tâche du matin (radar_daily_tick, phase « stages ») jusqu'à ce qu'il ne
 * reste plus de concours à vérifier. Pour chaque concours emploi-public clos depuis moins
 * d'un an : ouvre la fiche officielle, relève les listes publiées (convoqués à l'écrit,
 * à l'oral, résultats) et les rattache au concours (même identifiant emploi-public :
 * aucun rapprochement approximatif). Les candidats qui suivent le concours (favori +
 * notifications activées) sont prévenus une seule fois par liste.
 */
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { BROWSER_HEADERS } from '../_lib/parsers.ts';
import { epContestId, parseEpStages, renderStagePush, type StageEvent } from '../_lib/stages.ts';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zcxkxqsqzwtdnrupxlah.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_YfuzhtBBjs7CM1YxjphZzQ__r3Q3VZM';
const SITE_URL = (process.env.SITE_URL || 'https://kounkour.com').replace(/\/$/, '');
const TIME_BUDGET_MS = 42000; // fonction limitée à 60 s
const CONCURRENCY = 5;

interface Target {
  id: string;
  slug: string;
  source_url: string;
  stage: string | null;
  docs: string[];
}

export default async function handler(req: any, res: any) {
  const key = typeof req.query?.key === 'string' && /^[0-9a-f]{64}$/.test(req.query.key) ? req.query.key : null;
  if (!key) {
    res.status(401).json({ ok: false, error: 'Clé robot requise.' });
    return;
  }
  const dry = req.query?.dry === '1' || req.query?.dry === 'true';
  const limit = Math.max(1, Math.min(60, Number(req.query?.limit) || 25));
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { 'x-radar-key': key } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const started = Date.now();

  const { data, error } = await supabase.rpc('contest_stage_targets', { p_limit: limit });
  if (error || !data) {
    res.status(500).json({ ok: false, error: error?.message || 'données indisponibles' });
    return;
  }
  const targets = (data.targets || []) as Target[];

  // Lecture des fiches, quelques-unes à la fois (politesse envers emploi-public.ma).
  const checked: string[] = [];
  const updates: any[] = [];
  const report: any[] = [];
  let i = 0;
  async function worker() {
    while (i < targets.length && Date.now() - started < TIME_BUDGET_MS) {
      const t = targets[i++];
      const epId = epContestId(t.source_url);
      if (!epId) {
        checked.push(t.id);
        continue;
      }
      try {
        const r = await fetch(t.source_url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(12000) });
        if (!r.ok) {
          report.push({ slug: t.slug, http: r.status });
          // Fiche retirée (404) : vérifiée, rien de nouveau ; autre erreur : réessai au prochain passage.
          if (r.status === 404) checked.push(t.id);
          continue;
        }
        const { stage, docs } = parseEpStages(await r.text(), epId);
        checked.push(t.id);
        const fresh = docs.filter((d) => !t.docs.includes(d.url));
        if (fresh.length || (stage && stage !== t.stage)) {
          updates.push({ id: t.id, stage, docs: fresh });
          report.push({ slug: t.slug, etape: stage, nouvelles_listes: fresh.map((d) => d.doc_type) });
        }
      } catch (e: any) {
        report.push({ slug: t.slug, erreur: String(e?.message || e).slice(0, 80) });
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (dry) {
    res.status(200).json({ ok: true, dry, restants_avant: data.remaining, verifies: checked.length, changements: updates.length, report });
    return;
  }

  const { data: events, error: e2 } = await supabase.rpc('contest_stage_record', { p: { checked, updates } });
  if (e2) {
    res.status(500).json({ ok: false, error: e2.message, report });
    return;
  }

  // Notifications aux candidats qui suivent ces concours.
  const evs = (events || []) as StageEvent[];
  let notified = 0;
  if (evs.length) notified = await notify(supabase, evs).catch(() => 0);

  const remaining = Math.max(0, (data.remaining as number) - checked.length);
  res.status(200).json({ ok: true, remaining, verifies: checked.length, changements: updates.length, nouvelles_listes: evs.length, notifies: notified, report });
}

async function notify(supabase: any, evs: StageEvent[]): Promise<number> {
  const ids = [...new Set(evs.map((e) => e.contest_id))];
  const { data: subs, error } = await supabase.rpc('contest_stage_subscribers', { p_contest_ids: ids });
  if (error || !subs?.length) return 0;
  const { data: cfg } = await supabase.rpc('push_secret');
  if (!cfg?.public || !cfg?.private || cfg.private === 'PLACEHOLDER') return 0;
  webpush.setVapidDetails(cfg.subject || SITE_URL, cfg.public, cfg.private);

  const logged: any[] = [];
  const gone: string[] = [];
  const ok: string[] = [];
  for (const s of subs as any[]) {
    // La liste la plus avancée publiée pour ce concours, si elle n'a pas déjà été signalée.
    const ev = evs
      .filter((e) => e.contest_id === s.contest_id && !(s.sent || []).includes(e.doc_type))
      .sort((a, b) => b.doc_type.localeCompare(a.doc_type))[0];
    if (!ev) continue;
    const push = renderStagePush(ev, s.language === 'ar' ? 'ar' : 'fr', SITE_URL);
    let delivered = false;
    for (const d of s.subs || []) {
      try {
        await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }, JSON.stringify(push), {
          TTL: 86400,
          urgency: 'normal',
          topic: 'suivi',
        });
        delivered = true;
        ok.push(d.endpoint);
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) gone.push(d.endpoint);
      }
    }
    if (delivered) logged.push({ user_id: s.user_id, contest_id: s.contest_id, kind: ev.doc_type });
  }
  if (logged.length) await supabase.rpc('alerts_record', { p: logged });
  if (gone.length || ok.length) await supabase.rpc('push_drop', { p_endpoints: gone, p_ok: ok });
  return logged.length;
}
