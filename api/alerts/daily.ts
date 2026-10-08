/**
 * Fonction serverless Vercel — alertes e-mail Smart Match (une fois par jour).
 *
 * GET /api/alerts/daily?key=<clé robot>            envoi réel
 * GET /api/alerts/daily?key=<clé robot>&dry=1      aperçu (rien n'est envoyé ni enregistré)
 *     &only=<e-mail>                              limite à un abonné (test)
 *
 * Appelée par la tâche planifiée Supabase (pg_cron + pg_net), après l'analyse du
 * matin. Pour chaque candidat abonné (opt-in) : nouveaux concours ouverts qui
 * correspondent à son profil ou sont à vérifier, et rappel des concours déjà
 * signalés qui ferment dans 3 jours. Chaque envoi est journalisé (alert_log) :
 * un concours n'est jamais signalé deux fois.
 */
import { createClient } from '@supabase/supabase-js';
import { mailProvider, planFor, renderEmail, sendMail, SITE_URL, toContest, type ContestRow, type Subscriber } from '../_lib/alerts.ts';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zcxkxqsqzwtdnrupxlah.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_YfuzhtBBjs7CM1YxjphZzQ__r3Q3VZM';
// Plan gratuit des fournisseurs : ~100 (Resend) à 300 (Brevo) e-mails par jour.
const MAX_EMAILS = Math.max(1, Number(process.env.ALERT_MAX_PER_RUN) || 90);
const TIME_BUDGET_MS = 50000;

export default async function handler(req: any, res: any) {
  const key = typeof req.query?.key === 'string' && /^[0-9a-f]{64}$/.test(req.query.key) ? req.query.key : null;
  if (!key) {
    res.status(401).json({ ok: false, error: 'Clé robot requise.' });
    return;
  }
  const dry = req.query?.dry === '1' || req.query?.dry === 'true';
  const only = typeof req.query?.only === 'string' ? req.query.only.toLowerCase() : null;
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
    .filter((s) => !only || s.email.toLowerCase() === only)
    .sort((a, b) => (a.last_alert_at || '').localeCompare(b.last_alert_at || ''));

  const provider = mailProvider();
  const report: any[] = [];
  let sent = 0;
  for (const s of subs) {
    if (sent >= MAX_EMAILS || Date.now() - started > TIME_BUDGET_MS) break;
    const plan = planFor(s, contests);
    if (!plan) continue;
    const mail = renderEmail(plan);
    const entry: any = {
      email: s.email.replace(/^(.).*(@.*)$/, '$1***$2'),
      subject: mail.subject,
      nouveaux: plan.fresh.length,
      rappels: plan.reminders.length,
    };
    if (dry) {
      if (only) entry.html = mail.html;
      report.push(entry);
      continue;
    }
    if (!provider) {
      entry.error = 'aucun fournisseur e-mail configuré (BREVO_API_KEY ou RESEND_API_KEY + ALERT_FROM_EMAIL)';
      report.push(entry);
      continue;
    }
    const r = await sendMail(s.email, mail, `${SITE_URL}/api/alerts/unsubscribe?t=${s.token}`);
    if (!r.ok) {
      entry.error = r.error;
      report.push(entry);
      continue;
    }
    // Tous les concours proposés sont enregistrés (ceux au-delà de la liste
    // affichée restent visibles dans « Pour vous » via le lien de l'e-mail).
    const rows = [
      ...plan.fresh.map((p) => ({ user_id: s.user_id, contest_id: p.contest.id, kind: 'nouveau' })),
      ...plan.reminders.map((p) => ({ user_id: s.user_id, contest_id: p.contest.id, kind: 'rappel' })),
    ];
    const { error: e2 } = await supabase.rpc('alerts_record', { p: rows });
    if (e2) entry.error = `envoyé mais non journalisé : ${e2.message}`;
    sent++;
    report.push(entry);
  }
  res.status(200).json({ ok: true, dry, provider, today, abonnes: subs.length, concours: contests.length, envoyes: sent, report });
}
