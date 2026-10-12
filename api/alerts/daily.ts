/**
 * Fonction serverless Vercel — notifications push Smart Match (une fois par jour).
 *
 * GET /api/alerts/daily?key=<clé robot>            envoi réel
 * GET /api/alerts/daily?key=<clé robot>&dry=1      aperçu (rien n'est envoyé ni enregistré)
 *     &only=<user_id>                             limite à un abonné (test)
 *
 * Appelée par la tâche planifiée Supabase (pg_cron + pg_net), après l'analyse du
 * matin. Pour chaque candidat abonné (opt-in, au moins un appareil abonné) :
 * nouveaux concours ouverts qui correspondent à son profil ou sont à vérifier,
 * et rappel des concours déjà signalés qui ferment dans 3 jours. Chaque envoi
 * est journalisé (alert_log) : un concours n'est jamais signalé deux fois.
 * Les clés VAPID sont lues en base (push_secret, clé robot requise).
 */
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { planFor, renderPush, toContest, type ContestRow, type Subscriber } from '../_lib/alerts.ts';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zcxkxqsqzwtdnrupxlah.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_YfuzhtBBjs7CM1YxjphZzQ__r3Q3VZM';
const TIME_BUDGET_MS = 50000;

export default async function handler(req: any, res: any) {
  const key = typeof req.query?.key === 'string' && /^[0-9a-f]{64}$/.test(req.query.key) ? req.query.key : null;
  if (!key) {
    res.status(401).json({ ok: false, error: 'Clé robot requise.' });
    return;
  }
  const dry = req.query?.dry === '1' || req.query?.dry === 'true';
  const only = typeof req.query?.only === 'string' ? req.query.only : null;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { 'x-radar-key': key } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const started = Date.now();
  const { data, error } = await supabase.rpc('alerts_due');
  if (error || !data) {
    res.status(500).json({ ok: false, error: error?.message || 'données indisponibles' });
    return;
  }
  const today: string = data.today;
  const contests = (data.contests as ContestRow[]).map((r) => toContest(r, today));
  const subs = (data.subscribers as Subscriber[])
    .filter((s) => !only || s.user_id === only)
    .sort((a, b) => (a.last_alert_at || '').localeCompare(b.last_alert_at || ''));

  if (!dry) {
    const { data: cfg, error: e1 } = await supabase.rpc('push_secret');
    if (e1 || !cfg?.public || !cfg?.private || cfg.private === 'PLACEHOLDER') {
      res.status(500).json({ ok: false, error: e1?.message || 'clés VAPID absentes (table push_config)' });
      return;
    }
    webpush.setVapidDetails(cfg.subject || 'https://kounkour-studo.vercel.app', cfg.public, cfg.private);
  }

  const report: any[] = [];
  const gone: string[] = [];
  const okEndpoints: string[] = [];
  let sent = 0;
  for (const s of subs) {
    if (Date.now() - started > TIME_BUDGET_MS) break;
    const plan = planFor(s, contests);
    if (!plan) continue;
    const push = renderPush(plan);
    const entry: any = {
      user: s.user_id.slice(0, 8),
      title: push.title,
      nouveaux: plan.fresh.length,
      rappels: plan.reminders.length,
      appareils: (s.subs || []).length,
    };
    if (dry) {
      if (only) entry.push = push;
      report.push(entry);
      continue;
    }
    let delivered = 0;
    const errors: string[] = [];
    for (const d of s.subs || []) {
      try {
        await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }, JSON.stringify(push), {
          TTL: 86400,
          urgency: 'normal',
          topic: 'alertes',
        });
        delivered++;
        okEndpoints.push(d.endpoint);
      } catch (e: any) {
        // 404 / 410 : abonnement expiré ou retiré par l'utilisateur.
        if (e?.statusCode === 404 || e?.statusCode === 410) gone.push(d.endpoint);
        else errors.push(`${e?.statusCode || ''} ${String(e?.body || e?.message || 'erreur').slice(0, 120)}`.trim());
      }
    }
    if (errors.length) entry.errors = errors;
    if (!delivered) {
      entry.error = 'aucun appareil joignable';
      report.push(entry);
      continue;
    }
    // Tous les concours proposés sont enregistrés (le détail reste dans « Pour vous »).
    const rows = [
      ...plan.fresh.map((p) => ({ user_id: s.user_id, contest_id: p.contest.id, kind: 'nouveau' })),
      ...plan.reminders.map((p) => ({ user_id: s.user_id, contest_id: p.contest.id, kind: 'rappel' })),
    ];
    const { error: e2 } = await supabase.rpc('alerts_record', { p: rows });
    if (e2) entry.error = `envoyé mais non journalisé : ${e2.message}`;
    entry.envoyes = delivered;
    sent++;
    report.push(entry);
  }
  if (!dry && (gone.length || okEndpoints.length)) {
    await supabase.rpc('push_drop', { p_endpoints: gone, p_ok: okEndpoints });
  }
  res.status(200).json({ ok: true, dry, today, abonnes: subs.length, concours: contests.length, notifies: sent, expires: gone.length, report });
}
