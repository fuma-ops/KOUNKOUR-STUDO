/**
 * Notifications Smart Match — sélection des concours et texte de la notification.
 * Le verdict vient du MÊME moteur que le site (src/utils/smartMatch.ts) : ce que
 * le candidat lit dans la notification est exactement ce qu'il voit dans « Pour vous ».
 */
import { checkEligibility, type EligibilityResult } from '../../src/utils/smartMatch.ts';
import type { CandidateProfile, Contest } from '../../src/types/index.ts';

export const SITE_URL = (process.env.SITE_URL || 'https://kounkour-studo.vercel.app').replace(/\/$/, '');

const DEGREE_BY_YEARS: Record<number, string> = { 8: 'Doctorat', 5: 'Master', 3: 'Licence', 2: 'Bac+2', 1: 'Technicien', 0: 'Bac' };

export interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface Subscriber {
  user_id: string;
  diploma_level: number | null;
  specialty: string | null;
  region: string | null;
  age: number | null;
  situation: CandidateProfile['currentSituation'] | null;
  language: string | null;
  last_alert_at: string | null;
  subs: PushSub[] | null;
  sent: [string, 'nouveau' | 'rappel'][];
}

export interface ContestRow {
  id: string;
  slug: string;
  title_fr: string;
  title_ar: string | null;
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
    id: r.id, slug: r.slug, referenceCode: '', title: { fr: r.title_fr, ar: r.title_ar || r.title_fr },
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
    fullName: '', email: '', phone: '', age: s.age || 0,
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
// Texte de la notification (FR ou AR selon la langue du compte)
// ---------------------------------------------------------------------------
export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
  lang: 'fr' | 'ar';
}

const cut = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

function closing(c: Contest, ar: boolean): string {
  if (c.daysRemaining <= 1) return ar ? 'آخر أجل: اليوم' : "dernier jour aujourd'hui";
  if (c.daysRemaining === 2) return ar ? 'آخر أجل: غدا' : 'clôture demain';
  return ar ? `آخر أجل: ${c.deadlineDate}` : `clôture le ${c.deadlineDate}`;
}

export function renderPush(plan: AlertPlan): PushPayload {
  const ar = plan.subscriber.language === 'ar';
  const lang = ar ? 'ar' : 'fr';
  const name = (p: Pick) => cut(ar ? p.contest.title.ar : p.contest.title.fr, 90);
  const n = plan.fresh.length;
  const soon = plan.reminders.length;
  const forYou = `${SITE_URL}/profil?onglet=pour-vous${ar ? '&lang=ar' : ''}&utm_source=alerte&utm_medium=push`;
  const one = n + soon === 1 ? (plan.fresh[0] || plan.reminders[0]).contest : null;
  const url = one ? `${SITE_URL}/concours/${one.slug}?${ar ? 'lang=ar&' : ''}utm_source=alerte&utm_medium=push` : forYou;

  let title: string;
  let body: string;
  if (n) {
    const eligibleN = plan.fresh.filter((p) => p.elig.verdict === 'eligible').length;
    if (ar) title = plan.first ? `🎯 ${n} مباراة مفتوحة تناسب ملفك` : `🎯 ${n} مباراة جديدة لك`;
    else if (plan.first) title = `🎯 ${n} concours ouvert${n > 1 ? 's' : ''} pour votre profil`;
    else title = `🎯 ${n} nouveau${n > 1 ? 'x' : ''} concours pour vous${eligibleN ? ` (${eligibleN} correspond${eligibleN > 1 ? 'ent' : ''})` : ''}`;
    const first = plan.fresh[0];
    body = `${name(first)} · ${closing(first.contest, ar)}`;
    if (n > 1) body += ar ? `\n+ ${n - 1} أخرى في « لك »` : `\n+ ${n - 1} autre${n > 2 ? 's' : ''} dans « Pour vous »`;
    if (soon) body += ar ? `\n⏰ ${soon} تنتهي قريبا` : `\n⏰ ${soon} ferme${soon > 1 ? 'nt' : ''} bientôt`;
  } else {
    title = ar ? `⏰ ${soon} مباراة تنتهي قريبا` : `⏰ ${soon} concours ferme${soon > 1 ? 'nt' : ''} bientôt`;
    const r = plan.reminders[0];
    body = `${name(r)} · ${closing(r.contest, ar)}`;
    if (soon > 1) body += ar ? `\n+ ${soon - 1} أخرى` : `\n+ ${soon - 1} autre${soon > 2 ? 's' : ''}`;
  }
  return { title, body, url, tag: 'kounkour-alertes', lang };
}
