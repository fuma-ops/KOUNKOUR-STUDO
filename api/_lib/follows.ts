// Alertes des abonnements sans compte (ou sans profil Smart Match) : rappel avant la date
// limite des concours suivis et résumé des nouveaux concours du jour. Une alerte n'est
// jamais envoyée deux fois (journal push_follow_log, une ligne par appareil, concours, type).

export interface FollowContest {
  id: string;
  slug: string;
  title_fr: string | null;
  title_ar: string | null;
  deadline_date: string;
  published_at: string | null;
  positions: number | null;
}
export interface FollowSub {
  endpoint: string;
  p256dh: string;
  auth: string;
  lang: string;
  new_contests: boolean;
  since: string;
  follows: string[];
  sent: [string, string][];
}
export interface FollowPlan {
  sub: FollowSub;
  reminders: FollowContest[];
  fresh: FollowContest[];
}

export const REMINDER_DAYS = 3;
const DAY = 86400000;
const daysLeft = (deadline: string, today: string) => Math.round((Date.parse(deadline) - Date.parse(today)) / DAY);
const cut = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

export function followPlan(s: FollowSub, contests: FollowContest[], today: string): FollowPlan | null {
  const sent = new Set((s.sent || []).map(([id, kind]) => `${id}|${kind}`));
  const follows = new Set(s.follows || []);
  const reminders = contests
    .filter((c) => follows.has(c.id) && !sent.has(`${c.id}|rappel`))
    .filter((c) => {
      const d = daysLeft(c.deadline_date, today);
      return d >= 0 && d <= REMINDER_DAYS;
    })
    .sort((a, b) => a.deadline_date.localeCompare(b.deadline_date));
  const fresh = s.new_contests
    ? contests
        .filter((c) => c.published_at && c.published_at > s.since && !follows.has(c.id) && !sent.has(`${c.id}|nouveau`))
        .sort((a, b) => (b.positions || 0) - (a.positions || 0))
    : [];
  if (!reminders.length && !fresh.length) return null;
  return { sub: s, reminders, fresh };
}

export function renderFollowPush(p: FollowPlan, today: string, site: string) {
  const ar = p.sub.lang === 'ar';
  const lang: 'fr' | 'ar' = ar ? 'ar' : 'fr';
  const name = (c: FollowContest) => cut((ar ? c.title_ar : null) || c.title_fr || '', 90);
  const q = `${ar ? 'lang=ar&' : ''}utm_source=alerte&utm_medium=push`;
  const when = (c: FollowContest) => {
    const d = daysLeft(c.deadline_date, today);
    if (d <= 0) return ar ? 'آخر أجل: اليوم' : "dernier jour aujourd'hui";
    if (d === 1) return ar ? 'آخر أجل: غدا' : 'clôture demain';
    return ar ? `آخر أجل بعد ${d} أيام` : `clôture dans ${d} jours`;
  };
  const n = p.fresh.length;
  if (p.reminders.length) {
    const r = p.reminders[0];
    let body = `${name(r)} · ${when(r)}`;
    if (p.reminders.length > 1) body += ar ? `\n+ ${p.reminders.length - 1} أخرى` : `\n+ ${p.reminders.length - 1} autre${p.reminders.length > 2 ? 's' : ''} concours suivi${p.reminders.length > 2 ? 's' : ''}`;
    if (n) body += ar ? `\n🆕 ${n} مباراة جديدة اليوم` : `\n🆕 ${n} nouveau${n > 1 ? 'x' : ''} concours aujourd'hui`;
    return {
      title: ar ? '⏰ لا تنس إيداع ترشيحك' : '⏰ N’oubliez pas de déposer votre candidature',
      body,
      url: `${site}/concours/${r.slug}?${q}`,
      tag: 'kounkour-rappel',
      lang,
    };
  }
  const first = p.fresh[0];
  let body = name(first);
  if (n > 1) body += ar ? `\n+ ${n - 1} أخرى على KounKour` : `\n+ ${n - 1} autre${n > 2 ? 's' : ''} sur KounKour`;
  return {
    title: ar ? `🆕 ${n} مباراة جديدة اليوم` : `🆕 ${n} nouveau${n > 1 ? 'x' : ''} concours aujourd'hui`,
    body,
    url: n === 1 ? `${site}/concours/${first.slug}?${q}` : `${site}/concours?${q}`,
    tag: 'kounkour-nouveaux',
    lang,
  };
}
