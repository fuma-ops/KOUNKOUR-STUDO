// Rendu HTML serveur des pages publiques (cahier des charges §15) :
// contenu essentiel dans le HTML initial, titre/description uniques,
// canonical, hreflang FR/AR, Open Graph, JSON-LD exact, sitemap et robots.
// Uniquement des données réelles lues dans Supabase (RLS publique) ; un champ
// absent n'est jamais inventé, il est simplement omis.

export type Lang = 'fr' | 'ar';

export interface ContestRow {
  id: string;
  slug: string;
  title_fr: string | null;
  title_ar: string | null;
  title_original: string | null;
  status: string;
  summary_fr: string | null;
  summary_ar: string | null;
  diploma_fr: string | null;
  positions: number | null;
  region_fr: string | null;
  deadline_date: string | null;
  exam_date: string | null;
  apply_url: string | null;
  source_url: string | null;
  source_org: string | null;
  publication_date: string | null;
  published_at: string | null;
  verified_at: string | null;
  updated_at: string | null;
  grade_fr: string | null;
  reference: string | null;
  administration_id: string | null;
  administrations?: { name_fr: string | null; name_ar: string | null } | null;
}

export interface FolderRow {
  slug: string;
  title_fr: string;
  title_ar: string | null;
  organization: string | null;
  description_fr: string | null;
  description_ar: string | null;
}

export interface QcmSetRow {
  id: string;
  slug: string;
  folder_slug: string | null;
  title_fr: string;
  title_ar: string | null;
  description_fr: string | null;
  description_ar: string | null;
  language: string | null;
  kind: string | null;
  concours_label: string | null;
  exam_year: number | null;
  source_note: string | null;
  qcm_questions?: { id: string; position: number; source_number: number | null; question: string; options: string[] }[];
}

export interface Page {
  status: number;
  lang: Lang;
  title: string;
  description: string;
  path: string; // chemin canonique sans ?lang
  indexable: boolean;
  ogType?: 'website' | 'article';
  jsonLd?: object[];
  body: string;
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

export function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function truncate(s: string, n: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n - 1);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.–-]+$/, '')}…`;
}

// Date du jour au Maroc (les dates limites sont des jours locaux).
export function todayMorocco(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca' }).format(now);
}

const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];

export function fmtDate(iso: string | null | undefined, lang: Lang): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return '';
  const d = Number(m[3]);
  const mo = Number(m[2]) - 1;
  return lang === 'ar' ? `${d} ${MONTHS_AR[mo]} ${m[1]}` : `${d === 1 ? '1er' : d} ${MONTHS_FR[mo]} ${m[1]}`;
}

const L = {
  fr: {
    home: 'Accueil',
    contests: 'Concours',
    prep: 'Préparation',
    community: 'Communauté',
    open: 'Candidatures ouvertes',
    closed: 'Clôturé',
    cancelled: 'Annulé',
    results: 'Résultats publiés',
    published: 'Publié',
    admin: 'Administration',
    status: 'Statut',
    reference: 'Référence',
    grade: 'Grade',
    diploma: 'Diplôme exigé',
    positions: 'Nombre de postes',
    region: 'Région / lieu',
    pubDate: 'Date de publication',
    deadline: 'Date limite de dépôt',
    examDate: 'Date du concours',
    source: 'Source officielle',
    seeOfficial: 'Voir l’annonce officielle',
    apply: 'Candidater sur le site officiel',
    prevails: 'L’annonce officielle prévaut en cas de différence. Seul l’arrêté officiel fait foi.',
    verified: 'Vérifié le',
    others: 'Autres concours de la même administration',
    discuss: 'Discuter de ce concours avec les candidats',
    prepLink: 'Se préparer : annales réelles et QCM',
    allContests: 'Tous les concours',
    openNow: 'Concours ouverts',
    archives: 'Clôturés, annulés et résultats',
    deadlineShort: 'date limite',
    questions: 'questions',
    realExam: 'Annales réelles',
    training: 'Entraînement',
    answersAfter: 'Les réponses et la correction s’affichent après avoir répondu au QCM.',
    start: 'Faire ce QCM',
    supports: 'Supports de préparation',
    noSupports: 'Aucune annale réelle publiée pour ce concours pour l’instant.',
  },
  ar: {
    home: 'الرئيسية',
    contests: 'المباريات',
    prep: 'التحضير',
    community: 'المجتمع',
    open: 'الترشيح مفتوح',
    closed: 'منتهية',
    cancelled: 'ملغاة',
    results: 'النتائج منشورة',
    published: 'منشورة',
    admin: 'الإدارة',
    status: 'الحالة',
    reference: 'المرجع',
    grade: 'الدرجة',
    diploma: 'الشهادة المطلوبة',
    positions: 'عدد المناصب',
    region: 'الجهة / المكان',
    pubDate: 'تاريخ النشر',
    deadline: 'آخر أجل لإيداع الترشيحات',
    examDate: 'تاريخ المباراة',
    source: 'المصدر الرسمي',
    seeOfficial: 'الاطلاع على الإعلان الرسمي',
    apply: 'الترشيح عبر الموقع الرسمي',
    prevails: 'يُعتمد الإعلان الرسمي في حالة أي اختلاف. القرار الرسمي هو المرجع.',
    verified: 'تم التحقق في',
    others: 'مباريات أخرى لنفس الإدارة',
    discuss: 'ناقش هذه المباراة مع المترشحين',
    prepLink: 'التحضير: نماذج حقيقية وأسئلة متعددة الاختيارات',
    allContests: 'جميع المباريات',
    openNow: 'مباريات مفتوحة',
    archives: 'منتهية أو ملغاة أو بنتائج منشورة',
    deadlineShort: 'آخر أجل',
    questions: 'سؤال',
    realExam: 'نماذج حقيقية',
    training: 'تدريب',
    answersAfter: 'تظهر الأجوبة والتصحيح بعد الإجابة على الاختبار.',
    start: 'إجراء هذا الاختبار',
    supports: 'دعامات التحضير',
    noSupports: 'لا توجد نماذج حقيقية منشورة لهذه المباراة حالياً.',
  },
};

export type ContestState = 'open' | 'closed' | 'cancelled' | 'results' | 'published';

export function contestState(c: Pick<ContestRow, 'status' | 'deadline_date'>, today: string): ContestState {
  if (c.status === 'annule') return 'cancelled';
  if (c.status === 'resultats_publies') return 'results';
  if (c.status === 'cloture') return 'closed';
  if (c.deadline_date) return c.deadline_date < today ? 'closed' : 'open';
  return 'published';
}

const stateLabel = (s: ContestState, lang: Lang) => L[lang][s];

const adminName = (c: ContestRow, lang: Lang) =>
  (lang === 'ar' ? c.administrations?.name_ar || c.administrations?.name_fr : c.administrations?.name_fr) || c.source_org || '';

export function contestTitle(c: ContestRow, lang: Lang): string {
  const fr = c.title_fr || c.title_original || c.slug;
  return (lang === 'ar' ? c.title_ar || fr : fr).replace(/\s+/g, ' ').trim();
}

// « Avis de concours de recrutement de X » → « Concours X » (reformulation, aucune donnée ajoutée).
export function shortContestTitle(c: ContestRow, lang: Lang): string {
  const t = contestTitle(c, lang);
  if (lang === 'ar') return t;
  const s = t.replace(/^avis\s+(de\s+|d[’'])?(concours|examen)\s+(de\s+recrutement\s+)?(de\s+la\s+|de\s+l[’']|des\s+|de\s+|d[’'])?/i, '$2 ');
  const out = s === t ? t : s.charAt(0).toUpperCase() + s.slice(1);
  return /^(concours|examen)/i.test(out) ? out : `Concours ${out}`;
}

function yearOf(c: ContestRow): string {
  return (c.deadline_date || c.publication_date || c.published_at || '').slice(0, 4);
}

function link(href: string, text: string, lang: Lang) {
  return `<a href="${esc(withLangPath(href, lang))}">${esc(text)}</a>`;
}

export function withLangPath(path: string, lang: Lang) {
  return lang === 'ar' ? `${path}${path.includes('?') ? '&' : '?'}lang=ar` : path;
}

const STYLE = `<style>.kk-ssr{max-width:760px;margin:0 auto;padding:24px 16px 48px;font-family:"Plus Jakarta Sans","Alexandria",system-ui,sans-serif;color:#242126;line-height:1.6;font-size:15px}.kk-ssr a{color:#8D174B}.kk-ssr h1{font-size:1.6rem;line-height:1.3;margin:.4em 0}.kk-ssr h2{font-size:1.15rem;margin:1.6em 0 .5em}.kk-ssr nav{font-size:13px;color:#6E6773}.kk-ssr dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 16px}.kk-ssr dt{color:#6E6773}.kk-ssr dd{margin:0;font-weight:600}.kk-ssr li{margin:.35em 0}.kk-ssr .muted{color:#6E6773;font-size:13px}.kk-ssr ol ul{list-style:upper-alpha;color:#3f3a43}</style>`;

function frame(lang: Lang, crumbs: { href?: string; text: string }[], inner: string) {
  const sep = lang === 'ar' ? ' ‹ ' : ' › ';
  const trail = crumbs.map((c) => (c.href ? link(c.href, c.text, lang) : `<span>${esc(c.text)}</span>`)).join(sep);
  const t = L[lang];
  return `<div class="kk-ssr" lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">${STYLE}<nav aria-label="breadcrumb">${trail}</nav>${inner}<nav style="margin-top:32px">${[
    link('/concours', t.allContests, lang),
    link('/preparation', t.prep, lang),
    link('/communaute', t.community, lang),
  ].join(' · ')}</nav></div>`;
}

function breadcrumbLd(base: string, lang: Lang, items: { href: string; text: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.text, item: base + withLangPath(it.href, lang) })),
  };
}

function contestLi(c: ContestRow, lang: Lang, today: string) {
  const t = L[lang];
  const st = contestState(c, today);
  const bits = [adminName(c, lang), stateLabel(st, lang), c.deadline_date ? `${t.deadlineShort} : ${fmtDate(c.deadline_date, lang)}` : ''].filter(Boolean);
  return `<li>${link(`/concours/${encodeURIComponent(c.slug)}`, shortContestTitle(c, lang), lang)} <span class="muted">— ${esc(bits.join(' · '))}</span></li>`;
}

// ─── Pages ───────────────────────────────────────────────────────────────────

export function renderHome(lang: Lang, contests: ContestRow[], folders: FolderRow[], sets: QcmSetRow[], today: string): Page {
  const t = L[lang];
  const open = contests
    .filter((c) => contestState(c, today) === 'open')
    .sort((a, b) => (a.deadline_date || '').localeCompare(b.deadline_date || ''))
    .slice(0, 12);
  const withSets = folders.filter((f) => sets.some((s) => s.folder_slug === f.slug));
  const h1 = lang === 'ar' ? 'كونكور — المباريات العمومية بالمغرب' : 'KounKour — Concours publics au Maroc';
  const intro =
    lang === 'ar'
      ? 'مباريات التوظيف في القطاع العام بالمغرب من المصادر الرسمية، مع آخر الآجال، الشروط والرابط الرسمي، ونماذج حقيقية للتحضير.'
      : 'Les concours de recrutement du secteur public marocain issus des sources officielles : dates limites, conditions, lien officiel, et annales réelles pour se préparer.';
  const body = frame(
    lang,
    [{ text: t.home }],
    `<h1>${esc(h1)}</h1><p>${esc(intro)}</p>` +
      (open.length ? `<h2>${esc(t.openNow)}</h2><ul>${open.map((c) => contestLi(c, lang, today)).join('')}</ul><p>${link('/concours', t.allContests, lang)}</p>` : '') +
      (withSets.length
        ? `<h2>${esc(t.prep)}</h2><ul>${withSets.map((f) => `<li>${link(`/preparation/${encodeURIComponent(f.slug)}`, (lang === 'ar' ? f.title_ar : null) || f.title_fr, lang)}</li>`).join('')}</ul>`
        : '')
  );
  return {
    status: 200,
    lang,
    title: lang === 'ar' ? 'كونكور — مباريات التوظيف العمومي بالمغرب' : 'KounKour — Concours publics au Maroc : dates limites et annales',
    description: truncate(intro, 158),
    path: '/',
    indexable: true,
    jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'KounKour', url: '' }],
    body,
  };
}

export function renderContests(lang: Lang, contests: ContestRow[], today: string): Page {
  const t = L[lang];
  const open = contests.filter((c) => contestState(c, today) === 'open').sort((a, b) => (a.deadline_date || '').localeCompare(b.deadline_date || ''));
  const rest = contests.filter((c) => contestState(c, today) !== 'open');
  const h1 = lang === 'ar' ? 'المباريات العمومية بالمغرب' : 'Concours publics au Maroc';
  const desc =
    lang === 'ar'
      ? `${open.length} مباراة مفتوحة حالياً من أصل ${contests.length} منشورة: آخر الآجال، الشروط والرابط الرسمي لكل مباراة.`
      : `${open.length} concours ouverts sur ${contests.length} publiés : date limite, conditions et lien officiel de chaque concours de la fonction publique au Maroc.`;
  const body = frame(
    lang,
    [{ href: '/', text: t.home }, { text: t.contests }],
    `<h1>${esc(h1)}</h1><p>${esc(desc)}</p>` +
      (open.length ? `<h2>${esc(t.openNow)} (${open.length})</h2><ul>${open.map((c) => contestLi(c, lang, today)).join('')}</ul>` : '') +
      (rest.length ? `<h2>${esc(t.archives)} (${rest.length})</h2><ul>${rest.map((c) => contestLi(c, lang, today)).join('')}</ul>` : '')
  );
  return { status: 200, lang, title: lang === 'ar' ? 'المباريات العمومية بالمغرب | كونكور' : 'Concours publics au Maroc : liste et dates limites | KounKour', description: truncate(desc, 158), path: '/concours', indexable: true, body };
}

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Dossiers de préparation de la même administration (ex. « Sûreté nationale »),
// rapprochés par le nom exact de l'organisme, jamais par supposition.
export function prepFoldersFor(c: ContestRow, folders: FolderRow[], sets: QcmSetRow[]): FolderRow[] {
  const admin = norm(`${c.administrations?.name_fr || ''} ${c.source_org || ''}`);
  return folders.filter((f) => {
    const key = norm((f.organization || '').split('—').pop() || '');
    return key.length >= 6 && admin.includes(key) && sets.some((s) => s.folder_slug === f.slug && (s.qcm_questions?.length ?? 0) > 0);
  });
}

export function renderContest(lang: Lang, c: ContestRow, related: ContestRow[], base: string, today: string, prepFolders: FolderRow[] = []): Page {
  const t = L[lang];
  const st = contestState(c, today);
  const title = contestTitle(c, lang);
  const admin = adminName(c, lang);
  const year = yearOf(c);
  const short = shortContestTitle(c, lang);
  // Titre : intitulé + année ; l'administration seulement si elle tient en entier.
  const withYear = `${short}${year && !short.includes(year) ? ` ${year}` : ''}`;
  const pageTitle = admin && !short.toLowerCase().includes(admin.toLowerCase()) && `${withYear} – ${admin}`.length <= 62 ? `${withYear} – ${admin}` : withYear;
  const summary = lang === 'ar' ? c.summary_ar || c.summary_fr : c.summary_fr;
  const summaryIsFallback = lang === 'ar' && !c.summary_ar && !!c.summary_fr;

  const facts: [string, string][] = [];
  if (admin) facts.push([t.admin, admin]);
  facts.push([t.status, stateLabel(st, lang)]);
  if (c.reference) facts.push([t.reference, c.reference]);
  if (c.grade_fr) facts.push([t.grade, c.grade_fr]);
  if (c.diploma_fr) facts.push([t.diploma, c.diploma_fr]);
  if (c.positions) facts.push([t.positions, String(c.positions)]);
  if (c.region_fr) facts.push([t.region, c.region_fr]);
  if (c.publication_date) facts.push([t.pubDate, fmtDate(c.publication_date, lang)]);
  if (c.deadline_date) facts.push([t.deadline, fmtDate(c.deadline_date, lang)]);
  if (c.exam_date) facts.push([t.examDate, fmtDate(c.exam_date, lang)]);

  let description: string;
  if (summary) description = truncate(summary, 158);
  else {
    const bits = [
      `${short}${admin ? ` – ${admin}` : ''}.`,
      c.positions ? (lang === 'ar' ? `${c.positions} منصب.` : `${c.positions} postes.`) : '',
      c.deadline_date ? `${t.deadline} : ${fmtDate(c.deadline_date, lang)}.` : '',
      lang === 'ar' ? 'الشروط والرابط الرسمي.' : 'Conditions, diplôme exigé et lien officiel.',
    ];
    description = truncate(bits.filter(Boolean).join(' '), 158);
  }

  const officialLinks = [
    c.source_url ? `<li><a href="${esc(c.source_url)}" rel="nofollow noopener" target="_blank">${esc(t.seeOfficial)}</a></li>` : '',
    c.apply_url && c.apply_url !== c.source_url ? `<li><a href="${esc(c.apply_url)}" rel="nofollow noopener" target="_blank">${esc(t.apply)}</a></li>` : '',
  ].join('');

  const body = frame(
    lang,
    [{ href: '/', text: t.home }, { href: '/concours', text: t.contests }, { text: short }],
    `<h1>${esc(title)}</h1>` +
      `<dl>${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` +
      (summary ? `<h2>${lang === 'ar' ? 'ملخص' : 'Résumé'}</h2><p${summaryIsFallback ? ' lang="fr" dir="ltr"' : ''}>${esc(summary)}</p>` : '') +
      `<h2>${esc(t.source)}</h2>` +
      (c.source_org ? `<p>${esc(c.source_org)}</p>` : '') +
      (officialLinks ? `<ul>${officialLinks}</ul>` : '') +
      (c.verified_at ? `<p class="muted">${esc(t.verified)} ${esc(fmtDate(c.verified_at, lang))}</p>` : '') +
      `<p class="muted">${esc(t.prevails)}</p>` +
      (prepFolders.length
        ? `<h2>${esc(t.prepLink)}</h2><ul>${prepFolders.map((f) => `<li>${link(`/preparation/${encodeURIComponent(f.slug)}`, folderTitle(f, lang), lang)}</li>`).join('')}</ul>`
        : `<p>${link('/preparation', t.prepLink, lang)}</p>`) +
      `<p>${link('/communaute', t.discuss, lang)}</p>` +
      (related.length ? `<h2>${esc(t.others)}</h2><ul>${related.map((r) => contestLi(r, lang, today)).join('')}</ul>` : '')
  );

  const jsonLd: object[] = [
    breadcrumbLd(base, lang, [
      { href: '/', text: t.home },
      { href: '/concours', text: t.contests },
      { href: `/concours/${encodeURIComponent(c.slug)}`, text: short },
    ]),
  ];
  // JobPosting seulement si l'annonce fournit réellement les champs exigés
  // (titre, description, date de publication, recruteur, lieu) et n'est pas annulée.
  const datePosted = c.publication_date || (c.published_at || '').slice(0, 10);
  const hiring = c.administrations?.name_fr || c.source_org;
  if (st !== 'cancelled' && c.summary_fr && datePosted && hiring && c.region_fr && c.title_fr) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: c.title_fr,
      description: c.summary_fr,
      datePosted,
      ...(c.deadline_date ? { validThrough: `${c.deadline_date}T23:59:59+01:00` } : {}),
      hiringOrganization: { '@type': 'Organization', name: hiring },
      jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressRegion: c.region_fr, addressCountry: 'MA' } },
      ...(c.positions ? { totalJobOpenings: c.positions } : {}),
      ...(c.reference ? { identifier: { '@type': 'PropertyValue', name: hiring, value: c.reference } } : {}),
    });
  }

  return {
    status: 200,
    lang,
    title: `${truncate(pageTitle, 62)} | KounKour`,
    description,
    path: `/concours/${encodeURIComponent(c.slug)}`,
    indexable: true,
    ogType: 'article',
    jsonLd,
    body,
  };
}

const folderTitle = (f: FolderRow, lang: Lang) => (lang === 'ar' ? f.title_ar || f.title_fr : f.title_fr);
const setTitle = (s: QcmSetRow, lang: Lang) => (lang === 'ar' ? s.title_ar || s.title_fr : s.title_fr);
const qCount = (s: QcmSetRow) => s.qcm_questions?.length ?? 0;

function setLi(s: QcmSetRow, lang: Lang) {
  const t = L[lang];
  const meta = [s.kind === 'annales' ? t.realExam : t.training, s.concours_label, s.exam_year ? String(s.exam_year) : '', `${qCount(s)} ${t.questions}`].filter(Boolean);
  return `<li>${link(`/preparation/qcm/${encodeURIComponent(s.slug)}`, setTitle(s, lang), lang)} <span class="muted">— ${esc(meta.join(' · '))}</span></li>`;
}

export function renderPrep(lang: Lang, folders: FolderRow[], sets: QcmSetRow[]): Page {
  const t = L[lang];
  const h1 = lang === 'ar' ? 'التحضير للمباريات: نماذج حقيقية وأسئلة متعددة الاختيارات' : 'Préparation aux concours : annales réelles et QCM';
  const desc =
    lang === 'ar'
      ? 'ملف لكل مباراة: نماذج حقيقية منقولة حرفياً مع التصحيح بعد الإجابة، وتتبع تقدمك.'
      : 'Un dossier par concours : sujets réels transcrits mot pour mot, correction après réponse et suivi de votre progression.';
  const items = folders
    .map((f) => ({ f, n: sets.filter((s) => s.folder_slug === f.slug) }))
    .filter((x) => x.n.length > 0)
    .map(({ f, n }) => `<li>${link(`/preparation/${encodeURIComponent(f.slug)}`, folderTitle(f, lang), lang)} <span class="muted">— ${n.length} ${lang === 'ar' ? 'دعامة' : n.length > 1 ? 'supports' : 'support'}, ${n.reduce((a, s) => a + qCount(s), 0)} ${esc(t.questions)}</span></li>`)
    .join('');
  const body = frame(lang, [{ href: '/', text: t.home }, { text: t.prep }], `<h1>${esc(h1)}</h1><p>${esc(desc)}</p>${items ? `<ul>${items}</ul>` : ''}`);
  return { status: 200, lang, title: lang === 'ar' ? 'التحضير للمباريات: نماذج حقيقية | كونكور' : 'Préparation concours Maroc : annales réelles et QCM | KounKour', description: truncate(desc, 158), path: '/preparation', indexable: true, body };
}

export function renderFolder(lang: Lang, f: FolderRow, sets: QcmSetRow[], base: string): Page {
  const t = L[lang];
  const name = folderTitle(f, lang);
  const h1 = lang === 'ar' ? `${name}: نماذج حقيقية وأسئلة للتحضير` : `${name} : annales et QCM pour préparer le concours`;
  const fdesc = (lang === 'ar' ? f.description_ar : null) || f.description_fr || '';
  const desc = truncate(
    [fdesc, sets.length ? (lang === 'ar' ? `${sets.length} دعامة، ${sets.reduce((a, s) => a + qCount(s), 0)} سؤال.` : `${sets.length} ${sets.length > 1 ? 'supports' : 'support'}, ${sets.reduce((a, s) => a + qCount(s), 0)} questions.`) : ''].filter(Boolean).join(' '),
    158
  );
  const body = frame(
    lang,
    [{ href: '/', text: t.home }, { href: '/preparation', text: t.prep }, { text: name }],
    `<h1>${esc(h1)}</h1>${f.organization ? `<p class="muted">${esc(f.organization)}</p>` : ''}${fdesc ? `<p>${esc(fdesc)}</p>` : ''}<h2>${esc(t.supports)}</h2>${sets.length ? `<ul>${sets.map((s) => setLi(s, lang)).join('')}</ul>` : `<p>${esc(t.noSupports)}</p>`}`
  );
  return {
    status: 200,
    lang,
    title: `${truncate(lang === 'ar' ? `${name}: نماذج حقيقية` : `${name} : annales et QCM corrigés`, 62)} | KounKour`,
    description: desc || truncate(h1, 158),
    path: `/preparation/${encodeURIComponent(f.slug)}`,
    // Un dossier sans annale réelle n'a pas de contenu utile : non indexé (§15).
    indexable: sets.length > 0,
    jsonLd: [breadcrumbLd(base, lang, [{ href: '/', text: t.home }, { href: '/preparation', text: t.prep }, { href: `/preparation/${encodeURIComponent(f.slug)}`, text: name }])],
    body,
  };
}

export function renderQcm(lang: Lang, s: QcmSetRow, folder: FolderRow | null, base: string): Page {
  const t = L[lang];
  const name = setTitle(s, lang);
  const qs = [...(s.qcm_questions || [])].sort((a, b) => a.position - b.position);
  const cl = s.language === 'ar' ? 'ar' : 'fr';
  const desc = (lang === 'ar' ? s.description_ar : null) || s.description_fr || '';
  const crumbs = [{ href: '/', text: t.home }, { href: '/preparation', text: t.prep }];
  if (folder) crumbs.push({ href: `/preparation/${encodeURIComponent(folder.slug)}`, text: folderTitle(folder, lang) });
  const meta = [s.kind === 'annales' ? t.realExam : t.training, s.concours_label, s.exam_year ? String(s.exam_year) : '', `${qs.length} ${t.questions}`].filter(Boolean);
  const list = qs
    .map((q) => `<li${q.source_number ? ` value="${q.source_number}"` : ''}><p>${esc(q.question)}</p><ul>${(q.options || []).map((o) => `<li>${esc(o)}</li>`).join('')}</ul></li>`)
    .join('');
  const body = frame(
    lang,
    [...crumbs, { text: name }],
    `<h1>${esc(name)}</h1><p class="muted">${esc(meta.join(' · '))}</p>${desc ? `<p>${esc(desc)}</p>` : ''}${s.source_note ? `<p class="muted">${esc(s.source_note)}</p>` : ''}<p><strong>${esc(t.answersAfter)}</strong></p><ol lang="${cl}" dir="${cl === 'ar' ? 'rtl' : 'ltr'}">${list}</ol>`
  );
  return {
    status: 200,
    lang,
    title: `${truncate(name, 62)} | KounKour`,
    description: truncate(desc || `${name} — ${meta.join(' · ')}`, 158),
    path: `/preparation/qcm/${encodeURIComponent(s.slug)}`,
    indexable: qs.length > 0,
    ogType: 'article',
    jsonLd: [breadcrumbLd(base, lang, [...crumbs, { href: `/preparation/qcm/${encodeURIComponent(s.slug)}`, text: name }] as { href: string; text: string }[])],
    body,
  };
}

export function renderCommunity(lang: Lang): Page {
  const t = L[lang];
  const h1 = lang === 'ar' ? 'مجتمع المترشحين للمباريات العمومية' : 'Communauté des candidats aux concours publics';
  const desc =
    lang === 'ar'
      ? 'أسئلة وأجوبة ونقاشات حسب المباراة بين المترشحين للمباريات العمومية بالمغرب.'
      : 'Questions, réponses et discussions par concours entre candidats aux concours publics au Maroc.';
  return { status: 200, lang, title: `${lang === 'ar' ? 'مجتمع المترشحين' : 'Communauté des candidats'} | KounKour`, description: desc, path: '/communaute', indexable: true, body: frame(lang, [{ href: '/', text: t.home }, { text: t.community }], `<h1>${esc(h1)}</h1><p>${esc(desc)}</p>`) };
}

export function renderPrivate(lang: Lang, path: string): Page {
  return { status: 200, lang, title: 'KounKour', description: '', path, indexable: false, body: '' };
}

export function renderNotFound(lang: Lang, path: string): Page {
  const t = L[lang];
  const h1 = lang === 'ar' ? 'الصفحة غير موجودة' : 'Page introuvable';
  return { status: 404, lang, title: `${h1} | KounKour`, description: '', path, indexable: false, body: frame(lang, [{ href: '/', text: t.home }, { text: h1 }], `<h1>${esc(h1)}</h1>`) };
}

// ─── Document complet ────────────────────────────────────────────────────────

const OG_IMAGE = '/images/morocco_hero.jpg';

export function headTags(p: Page, base: string): string {
  const self = base + withLangPath(p.path, p.lang);
  const tags = [
    `<title>${esc(p.title)}</title>`,
    p.description ? `<meta name="description" content="${esc(p.description)}" />` : '',
    `<meta name="robots" content="${p.indexable ? 'index,follow' : 'noindex,follow'}" />`,
  ];
  if (p.indexable) {
    tags.push(
      `<link rel="canonical" href="${esc(self)}" />`,
      `<link rel="alternate" hreflang="fr" href="${esc(base + p.path)}" />`,
      `<link rel="alternate" hreflang="ar" href="${esc(base + withLangPath(p.path, 'ar'))}" />`,
      `<link rel="alternate" hreflang="x-default" href="${esc(base + p.path)}" />`
    );
  }
  tags.push(
    `<meta property="og:site_name" content="KounKour" />`,
    `<meta property="og:title" content="${esc(p.title)}" />`,
    p.description ? `<meta property="og:description" content="${esc(p.description)}" />` : '',
    `<meta property="og:type" content="${p.ogType || 'website'}" />`,
    `<meta property="og:url" content="${esc(self)}" />`,
    `<meta property="og:locale" content="${p.lang === 'ar' ? 'ar_MA' : 'fr_MA'}" />`,
    `<meta property="og:image" content="${esc(base + OG_IMAGE)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`
  );
  for (const ld of p.jsonLd || []) {
    const filled = JSON.parse(JSON.stringify(ld).replace(/"url":""/g, `"url":${JSON.stringify(base + '/')}`));
    tags.push(`<script type="application/ld+json">${JSON.stringify(filled).replace(/</g, '\\u003c')}</script>`);
  }
  return tags.filter(Boolean).join('\n    ');
}

// Injecte la page dans le HTML de l'application (app.html construit par Vite).
export function renderDocument(template: string, p: Page, base: string): string {
  const cleaned = template
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+(name|property)="(description|robots|og:[^"]*|twitter:[^"]*)"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="(canonical|alternate)"[^>]*>\s*/gi, '');
  return cleaned
    .replace(/<html[^>]*>/i, `<html lang="${p.lang}" dir="${p.lang === 'ar' ? 'rtl' : 'ltr'}">`)
    .replace(/<\/head>/i, `    ${headTags(p, base)}\n  </head>`)
    .replace(/<div id="root"><\/div>/i, `<div id="root">${p.body}</div>`);
}

// Repli si app.html ne peut pas être lu : même application, chargée par ses noms
// de fichiers fixes (vite.config.ts, vérifiés par scripts/postbuild-vercel.mjs).
export function fallbackTemplate(): string {
  return `<!doctype html>
<html lang="fr" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script type="module" crossorigin src="/assets/app.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/app.css">
  </head>
  <body class="bg-[#FFFDFE] text-[#242126] antialiased selection:bg-[#8D174B]/15 selection:text-[#8D174B]">
    <div id="root"></div>
  </body>
</html>`;
}

export function renderRobots(base: string): string {
  return ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /profil', 'Disallow: /api/', '', `Sitemap: ${base}/sitemap.xml`, ''].join('\n');
}

export function renderSitemap(base: string, contests: ContestRow[], folders: FolderRow[], sets: QcmSetRow[]): string {
  const urls: { loc: string; lastmod?: string }[] = [{ loc: '/' }, { loc: '/concours' }, { loc: '/preparation' }, { loc: '/communaute' }];
  for (const c of contests) urls.push({ loc: `/concours/${encodeURIComponent(c.slug)}`, lastmod: (c.updated_at || '').slice(0, 10) || undefined });
  for (const f of folders) if (sets.some((s) => s.folder_slug === f.slug)) urls.push({ loc: `/preparation/${encodeURIComponent(f.slug)}` });
  // Pas de lastmod pour les QCM : aucune date de modification fiable n'est stockée.
  for (const s of sets) if (qCount(s) > 0) urls.push({ loc: `/preparation/qcm/${encodeURIComponent(s.slug)}` });
  const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${x(base + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
    .join('\n')}\n</urlset>\n`;
}
