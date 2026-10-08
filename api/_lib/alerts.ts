/**
 * Alertes e-mail Smart Match — sélection des concours et contenu de l'e-mail.
 * Le verdict vient du MÊME moteur que le site (src/utils/smartMatch.ts) : ce que
 * le candidat lit dans l'e-mail est exactement ce qu'il voit dans « Pour vous ».
 */
import { checkEligibility, MATCH_DISCLAIMER, type EligibilityResult } from '../../src/utils/smartMatch.ts';
import type { CandidateProfile, Contest } from '../../src/types/index.ts';

export const SITE_URL = (process.env.SITE_URL || 'https://kounkour-studo.vercel.app').replace(/\/$/, '');

const DEGREE_BY_YEARS: Record<number, string> = { 8: 'Doctorat', 5: 'Master', 3: 'Licence', 2: 'Bac+2', 1: 'Technicien', 0: 'Bac' };

export interface Subscriber {
  user_id: string;
  email: string;
  diploma_level: number | null;
  specialty: string | null;
  region: string | null;
  age: number | null;
  situation: CandidateProfile['currentSituation'] | null;
  token: string;
  name: string | null;
  last_alert_at: string | null;
  sent: [string, 'nouveau' | 'rappel'][];
}

export interface ContestRow {
  id: string;
  slug: string;
  title_fr: string;
  diploma_fr: string | null;
  deadline_date: string;
  region_fr: string | null;
  org: string | null;
  positions: number | null;
  criteria: { t: string; v: string }[] | null;
  posts: { province: string | null; category: string | null; diploma: string | null; specialty: string | null; count: number | null; note: string | null }[] | null;
}

/** Jours restants (date limite incluse), à l'heure du Maroc : 1 = dernier jour. */
export function daysLeft(deadline: string, today: string): number {
  const d = Date.parse(`${deadline}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`);
  return Math.round(d / 86_400_000) + 1;
}

const frDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export function toContest(r: ContestRow, today: string): Contest {
  const specs = (r.criteria || []).filter((k) => k.t === 'specialite').map((k) => k.v).filter(Boolean);
  const age = (r.criteria || []).find((k) => k.t === 'age')?.v || '';
  const days = daysLeft(r.deadline_date, today);
  const empty = { fr: '', ar: '' };
  return {
    id: r.id, slug: r.slug, referenceCode: '', title: { fr: r.title_fr, ar: r.title_fr },
    administration: { id: '', name: { fr: r.org || '', ar: r.org || '' }, shortName: empty, logo: '', category: 'autres', officialWebsite: '' },
    type: empty, status: days <= 0 ? 'closed' : days <= 7 ? 'closing_soon' : 'open', postsCount: r.positions || 0,
    posts: r.posts || [], degreeLevel: r.diploma_fr || '', specialtiesList: specs, specialty: { fr: specs.join(', '), ar: '' },
    region: { fr: r.region_fr || '', ar: '' }, location: empty, publicationDate: '', deadlineDate: frDate(r.deadline_date),
    daysRemaining: days, isVerifiedSource: true, officialSourceUrl: '', overviewSummary: empty,
    criteria: { nationality: empty, ageLimit: { fr: age, ar: age }, diplomas: [], experience: empty, specialties: [] },
    exams: { written: [], oral: [] }, documents: [], isDemo: false,
  } as Contest;
}

export function toProfile(s: Subscriber): CandidateProfile {
  const specialties = String(s.specialty || '').split(/\s*;\s*/).filter(Boolean);
  return {
    fullName: s.name || '', email: s.email, phone: '', age: s.age || 0,
    degreeLevel: s.diploma_level !== null ? DEGREE_BY_YEARS[s.diploma_level] || '' : '',
    specialty: specialties[0] || '', specialties, region: s.region || '',
    currentSituation: s.situation || 'job_seeker', notificationsEnabled: true, alertDaysBefore: 3,
  };
}

export interface Pick { contest: Contest; elig: EligibilityResult }
export interface AlertPlan {
  subscriber: Subscriber;
  first: boolean;
  fresh: Pick[]; // nouveaux concours pour le profil (correspondent puis à vérifier)
  reminders: Pick[]; // déjà signalés, clôture dans 3 jours ou moins
}

const REMINDER_DAYS = 3;

export function planFor(s: Subscriber, contests: Contest[]): AlertPlan | null {
  const profile = toProfile(s);
  const sentNew = new Set(s.sent.filter((x) => x[1] === 'nouveau').map((x) => x[0]));
  const sentRem = new Set(s.sent.filter((x) => x[1] === 'rappel').map((x) => x[0]));
  const picks = contests
    .filter((c) => c.daysRemaining >= 1)
    .map((contest) => ({ contest, elig: checkEligibility(contest, profile) }))
    .filter((p) => p.elig.verdict !== 'not_eligible');
  const rank = (a: Pick, b: Pick) =>
    Number(b.elig.verdict === 'eligible') - Number(a.elig.verdict === 'eligible') || b.elig.score - a.elig.score || a.contest.daysRemaining - b.contest.daysRemaining;
  const fresh = picks.filter((p) => !sentNew.has(p.contest.id)).sort(rank);
  const reminders = picks
    // Rappel seulement si la spécialité correspond (pas pour les annonces trop vagues).
    .filter((p) => p.elig.specialtyStatus === 'match' && sentNew.has(p.contest.id) && !sentRem.has(p.contest.id) && p.contest.daysRemaining <= REMINDER_DAYS)
    .sort((a, b) => a.contest.daysRemaining - b.contest.daysRemaining);
  if (!fresh.length && !reminders.length) return null;
  return { subscriber: s, first: !s.last_alert_at, fresh, reminders };
}

// ---------------------------------------------------------------------------
// Contenu de l'e-mail
// ---------------------------------------------------------------------------
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const MAX_LIST = 15;

function deadlineTxt(c: Contest) {
  if (c.daysRemaining <= 1) return "Dernier jour : aujourd'hui";
  if (c.daysRemaining === 2) return `Clôture demain (${c.deadlineDate})`;
  return `Date limite : ${c.deadlineDate} (J-${c.daysRemaining - 1})`;
}

function item(p: Pick, campaign: string): { html: string; text: string } {
  const c = p.contest;
  const url = `${SITE_URL}/concours/${c.slug}?utm_source=alerte&utm_medium=email&utm_campaign=${campaign}`;
  const badge = p.elig.verdict === 'eligible' ? 'Correspond à votre profil' : 'À vérifier';
  const color = p.elig.verdict === 'eligible' ? '#047857' : '#B45309';
  const issue = p.elig.checks.find((k) => k.status === 'verify' && k.key !== 'status');
  const posts = p.elig.matchedPostsCount > 0 ? `${p.elig.matchedPostsCount} poste${p.elig.matchedPostsCount > 1 ? 's' : ''} pour votre profil` : '';
  const urgent = c.daysRemaining <= 3;
  const html = `
<tr><td style="padding:12px 0;border-bottom:1px solid #F1E5EC">
  <div style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase">${badge}</div>
  <a href="${url}" style="font-size:15px;font-weight:700;color:#242126;text-decoration:none">${esc(c.title.fr)}</a>
  <div style="font-size:13px;color:${urgent ? '#BE123C' : '#6E6773'};margin-top:2px">${esc(deadlineTxt(c))}${posts ? ` · ${posts}` : ''}</div>
  ${issue ? `<div style="font-size:12px;color:#92400E;margin-top:4px">${esc(issue.fr)}</div>` : ''}
</td></tr>`;
  const text = `- [${badge}] ${c.title.fr}\n  ${deadlineTxt(c)}${posts ? ` · ${posts}` : ''}\n  ${url}${issue ? `\n  ${issue.fr}` : ''}`;
  return { html, text };
}

export function renderEmail(plan: AlertPlan): { subject: string; html: string; text: string; shown: Pick[] } {
  const s = plan.subscriber;
  const unsub = `${SITE_URL}/api/alerts/unsubscribe?t=${s.token}`;
  const forYou = `${SITE_URL}/profil?utm_source=alerte&utm_medium=email`;
  const eligibleN = plan.fresh.filter((p) => p.elig.verdict === 'eligible').length;
  const shown = plan.fresh.slice(0, MAX_LIST);
  const more = plan.fresh.length - shown.length;
  const soon = plan.reminders.length;

  let subject: string;
  if (plan.first) subject = `🎯 ${plan.fresh.length} concours ouverts pour votre profil sur KounKour`;
  else if (plan.fresh.length) subject = `🎯 ${plan.fresh.length} nouveau${plan.fresh.length > 1 ? 'x' : ''} concours pour votre profil${eligibleN ? ` (${eligibleN} correspondent)` : ''}`;
  else subject = `⏰ ${soon} concours pour vous ferme${soon > 1 ? 'nt' : ''} bientôt`;
  if (plan.fresh.length && soon) subject += ` · ${soon} ferme${soon > 1 ? 'nt' : ''} bientôt`;

  const hello = s.name ? `Bonjour ${esc(s.name)},` : 'Bonjour,';
  const intro = plan.first
    ? 'Voici les concours ouverts qui correspondent à votre profil (diplôme, spécialité, âge). Ensuite, vous ne recevrez que les nouveaux concours et les rappels avant clôture.'
    : 'De nouveaux concours correspondant à votre profil ont été publiés.';
  const sec = (title: string, rows: Pick[], campaign: string) =>
    rows.length ? `<h2 style="font-size:15px;color:#8D174B;margin:22px 0 4px">${title}</h2><table width="100%" cellpadding="0" cellspacing="0">${rows.map((p) => item(p, campaign).html).join('')}</table>` : '';

  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#FAF7F9;font-family:Arial,Helvetica,sans-serif;color:#242126">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 12px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #F1E5EC;border-radius:16px">
<tr><td style="background:#8D174B;color:#fff;padding:18px 22px;border-radius:16px 16px 0 0;font-size:18px;font-weight:700">KounKour · Concours pour vous</td></tr>
<tr><td style="padding:20px 22px">
<p style="margin:0 0 8px">${hello}</p><p style="margin:0;color:#4A4250;font-size:14px">${intro}</p>
${sec(soon ? '⏰ Derniers jours pour déposer votre dossier' : '', plan.reminders, 'rappel')}
${sec(plan.first ? 'Vos concours ouverts' : 'Nouveaux concours pour vous', shown, plan.first ? 'bienvenue' : 'nouveaux')}
${more > 0 ? `<p style="font-size:13px;margin:12px 0 0"><a href="${forYou}" style="color:#8D174B">+ ${more} autre${more > 1 ? 's' : ''} concours dans « Pour vous »</a></p>` : ''}
<p style="margin:24px 0 0"><a href="${forYou}" style="display:inline-block;background:#8D174B;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:700;font-size:14px">Voir tous mes concours</a></p>
<p style="font-size:11px;color:#9A93A0;margin:22px 0 0">${MATCH_DISCLAIMER.fr}</p>
<p style="font-size:11px;color:#9A93A0;margin:8px 0 0">Vous recevez cet e-mail car vous avez activé les alertes dans votre profil KounKour. <a href="${unsub}" style="color:#9A93A0">Se désabonner</a></p>
</td></tr></table></td></tr></table></body></html>`;

  const text = [
    hello.replace(/&amp;/g, '&'),
    '',
    intro,
    plan.reminders.length ? '\nDERNIERS JOURS :\n' + plan.reminders.map((p) => item(p, 'rappel').text).join('\n') : '',
    shown.length ? `\n${plan.first ? 'VOS CONCOURS OUVERTS' : 'NOUVEAUX CONCOURS POUR VOUS'} :\n` + shown.map((p) => item(p, 'nouveaux').text).join('\n') : '',
    more > 0 ? `\n+ ${more} autres : ${forYou}` : '',
    `\nTous vos concours : ${forYou}`,
    `\n${MATCH_DISCLAIMER.fr}`,
    `Se désabonner : ${unsub}`,
  ].join('\n');
  return { subject, html, text, shown };
}

// ---------------------------------------------------------------------------
// Envoi : Brevo (BREVO_API_KEY) ou Resend (RESEND_API_KEY). Expéditeur :
// ALERT_FROM_EMAIL (adresse vérifiée chez le fournisseur), ALERT_FROM_NAME.
// ---------------------------------------------------------------------------
export function mailProvider(): 'brevo' | 'resend' | null {
  if (!process.env.ALERT_FROM_EMAIL) return null;
  if (process.env.BREVO_API_KEY) return 'brevo';
  if (process.env.RESEND_API_KEY) return 'resend';
  return null;
}

export async function sendMail(to: string, mail: { subject: string; html: string; text: string }, unsubUrl: string): Promise<{ ok: boolean; error?: string }> {
  const from = process.env.ALERT_FROM_EMAIL as string;
  const name = process.env.ALERT_FROM_NAME || 'KounKour';
  const headers = { 'List-Unsubscribe': `<${unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' };
  const provider = mailProvider();
  try {
    if (provider === 'brevo') {
      const r = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': process.env.BREVO_API_KEY as string, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sender: { name, email: from }, to: [{ email: to }], subject: mail.subject, htmlContent: mail.html, textContent: mail.text, headers }),
        signal: AbortSignal.timeout(15000),
      });
      return r.ok ? { ok: true } : { ok: false, error: `Brevo ${r.status} ${(await r.text()).slice(0, 200)}` };
    }
    if (provider === 'resend') {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from: `${name} <${from}>`, to: [to], subject: mail.subject, html: mail.html, text: mail.text, headers }),
        signal: AbortSignal.timeout(15000),
      });
      return r.ok ? { ok: true } : { ok: false, error: `Resend ${r.status} ${(await r.text()).slice(0, 200)}` };
    }
    return { ok: false, error: 'aucun fournisseur e-mail configuré' };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'erreur réseau' };
  }
}
