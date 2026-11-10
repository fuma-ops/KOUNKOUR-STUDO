// Pages de regroupement (SEO programmatique) : tous les concours d'un organisme, d'une région
// ou d'un grade, à partir des vraies fiches publiées. Module partagé par le rendu serveur
// (api/_lib/seo.ts) et l'application (HubPage) : même découpage, mêmes textes.
//
// Règles :
//  - aucune donnée inventée : chiffres, dates, diplômes et échelles viennent des fiches ;
//  - une page n'est indexable que si elle a assez de contenu (MIN_INDEX concours), sinon noindex ;
//  - les versions « archive » (fiches remplacées) et les brouillons ne comptent pas.

export type HubKind = 'organisme' | 'region' | 'grade';
export type HubLang = 'fr' | 'ar';

/** Forme minimale d'un concours, commune au serveur (ContestRow) et à l'application (Contest). */
export interface HubContest {
  slug: string;
  titleFr: string;
  titleAr: string;
  adminFr: string;
  adminAr: string;
  grade: string;
  region: string;
  positions: number;
  deadline: string | null; // AAAA-MM-JJ
  published: string | null; // AAAA-MM-JJ
  state: 'open' | 'closed' | 'results' | 'cancelled' | 'published';
  diploma?: string | null;
}

/** Champs bruts d'un concours (lignes Supabase), lus de la même façon côté serveur et côté application. */
export interface HubRaw {
  slug: string;
  status: string;
  stage?: string | null;
  title_fr: string | null;
  title_ar: string | null;
  title_original?: string | null;
  admin_fr: string;
  admin_ar: string;
  grade_fr: string | null;
  region_fr: string | null;
  positions: number | null;
  deadline_date: string | null;
  publication_date: string | null;
  published_at: string | null;
}

const PUBLIC = new Set(['publie', 'mis_a_jour', 'cloture', 'annule', 'resultats_publies']);

/** Concours public → forme commune (null pour un brouillon ou une version archivée). Même règle d'état que la fiche. */
export function toHubContest(r: HubRaw, today: string): HubContest | null {
  if (!PUBLIC.has(r.status)) return null;
  const state: HubContest['state'] =
    r.status === 'annule' ? 'cancelled'
    : r.status === 'resultats_publies' || r.stage === 'resultat' ? 'results'
    : r.status === 'cloture' ? 'closed'
    : r.deadline_date ? (r.deadline_date < today ? 'closed' : 'open')
    : 'published';
  const titleFr = (r.title_fr || r.title_original || r.slug).replace(/\s+/g, ' ').trim();
  return {
    slug: r.slug,
    titleFr,
    titleAr: (r.title_ar || titleFr).replace(/\s+/g, ' ').trim(),
    adminFr: (r.admin_fr || '').trim(),
    adminAr: (r.admin_ar || r.admin_fr || '').trim(),
    grade: r.grade_fr || '',
    region: r.region_fr || '',
    positions: typeof r.positions === 'number' ? r.positions : 0,
    deadline: r.deadline_date,
    published: r.publication_date || (r.published_at || '').slice(0, 10) || null,
    state,
  };
}

export const HUB_BASE: Record<HubKind, string> = { organisme: '/organisme', region: '/region', grade: '/grade' };
export const HUB_INDEX: Record<HubKind, string> = { organisme: '/organismes', region: '/regions', grade: '/grades' };
export const MIN_INDEX = 3; // nombre minimal de concours pour qu'une page soit indexée

export const hubPath = (kind: HubKind, slug: string) => `${HUB_BASE[kind]}/${encodeURIComponent(slug)}`;

const fold = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’`]/g, "'");

export const slugify = (s: string) =>
  fold(s)
    .replace(/'/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');

// ─── Régions (12 régions officielles ; villes et provinces rattachées) ──────────────────────
export const REGIONS: { slug: string; fr: string; ar: string; re: RegExp }[] = [
  { slug: 'tanger-tetouan-al-hoceima', fr: 'Tanger-Tétouan-Al Hoceïma', ar: 'طنجة تطوان الحسيمة', re: /tanger|tetouan|hoceima|larache|ouezzane|chefchaouen|fnideq|m'diq|ksar el kebir/ },
  { slug: 'oriental', fr: 'Oriental', ar: 'الشرق', re: /oriental|oujda|nador|berkane|figuig|taourirt|jerada|driouch|guercif/ },
  { slug: 'fes-meknes', fr: 'Fès-Meknès', ar: 'فاس مكناس', re: /\bfes\b|meknes|\btaza\b|taounate|ifrane|sefrou|boulemane|el hajeb|moulay yacoub/ },
  { slug: 'rabat-sale-kenitra', fr: 'Rabat-Salé-Kénitra', ar: 'الرباط سلا القنيطرة', re: /rabat|\bsale\b|kenitra|khemisset|sidi kacem|sidi slimane|skhirat|temara/ },
  { slug: 'beni-mellal-khenifra', fr: 'Béni Mellal-Khénifra', ar: 'بني ملال خنيفرة', re: /beni mellal|khenifra|khouribga|fquih ben salah|azilal/ },
  { slug: 'casablanca-settat', fr: 'Casablanca-Settat', ar: 'الدار البيضاء سطات', re: /casablanca|settat|el jadida|nouaceur|bouskoura|mohammedia|berrechid|benslimane|sidi bennour|mediouna|jorf lasfar/ },
  { slug: 'marrakech-safi', fr: 'Marrakech-Safi', ar: 'مراكش آسفي', re: /marrakech|\bsafi\b|essaouira|kelaa des sraghna|chichaoua|al haouz|youssoufia|rehamna/ },
  { slug: 'draa-tafilalet', fr: 'Drâa-Tafilalet', ar: 'درعة تافيلالت', re: /draa|tafilalet|errachidia|erfoud|ouarzazate|zagora|tinghir|midelt/ },
  { slug: 'souss-massa', fr: 'Souss-Massa', ar: 'سوس ماسة', re: /souss|agadir|taroudant|tiznit|chtouka|inezgane|\btata\b|amskroud|\bmassa\b|ait melloul/ },
  { slug: 'guelmim-oued-noun', fr: 'Guelmim-Oued Noun', ar: 'كلميم واد نون', re: /guelmim|oued noun|tan-tan|tan tan|sidi ifni|\bassa\b/ },
  { slug: 'laayoune-sakia-el-hamra', fr: 'Laâyoune-Sakia El Hamra', ar: 'العيون الساقية الحمراء', re: /laayoune|sakia|tarfaya|boujdour|smara|semara/ },
  { slug: 'dakhla-oued-ed-dahab', fr: 'Dakhla-Oued Ed-Dahab', ar: 'الداخلة وادي الذهب', re: /dakhla|oued ed-?dahab|aousserd/ },
];

/** Régions d'un concours : d'abord le champ région, sinon la ville présente dans le nom de l'organisme. */
export function regionsOf(c: Pick<HubContest, 'region' | 'adminFr'>): string[] {
  const pick = (text: string) => REGIONS.filter((r) => r.re.test(fold(text))).map((r) => r.slug);
  const fromRegion = pick(c.region || '');
  if (fromRegion.length || /plusieurs|national|\d+\s*regions/.test(fold(c.region || ''))) return fromRegion;
  return pick(c.adminFr || '').slice(0, 1);
}

// ─── Grades (familles de métiers de la fonction publique) ───────────────────────────────────
export const GRADES: { slug: string; fr: string; ar: string; test: (t: string) => boolean }[] = [
  { slug: 'maitre-de-conferences', fr: 'Maître de conférences', ar: 'أستاذ محاضر', test: (t) => /maitres? de conferences|professeurs? assistants?/.test(t) },
  { slug: 'technicien-de-sante', fr: 'Technicien de santé', ar: 'تقني الصحة', test: (t) => /techniciens? de sante/.test(t) },
  { slug: 'technicien-2e-grade', fr: 'Technicien 2e grade', ar: 'تقني من الدرجة الثانية', test: (t) => /technicien/.test(t) && /\b2 ?(e|eme)\b grade|deuxieme grade|echelle 10\b/.test(t) },
  { slug: 'technicien-3e-grade', fr: 'Technicien 3e grade', ar: 'تقني من الدرجة الثالثة', test: (t) => /technicien/.test(t) && /\b3 ?(e|eme)\b grade|troisieme grade|echelle 9\b/.test(t) },
  { slug: 'technicien-4e-grade', fr: 'Technicien 4e grade', ar: 'تقني من الدرجة الرابعة', test: (t) => /technicien/.test(t) && /\b4 ?(e|eme)\b grade|quatrieme grade|echelle 8\b/.test(t) },
  { slug: 'administrateur-2e-grade', fr: 'Administrateur 2e grade', ar: 'متصرف من الدرجة الثانية', test: (t) => /administrateur/.test(t) && /\b2 ?(e|eme)\b grade|deuxieme grade|echelle 11\b/.test(t) },
  { slug: 'administrateur-3e-grade', fr: 'Administrateur 3e grade', ar: 'متصرف من الدرجة الثالثة', test: (t) => /administrateur/.test(t) && /\b3 ?(e|eme)\b grade|troisieme grade|echelle 10\b/.test(t) },
  { slug: 'ingenieur-etat', fr: "Ingénieur d'État", ar: 'مهندس دولة', test: (t) => /ingenieurs? d'etat/.test(t) },
  { slug: 'infirmier', fr: 'Infirmier', ar: 'ممرض', test: (t) => /infirmi/.test(t) },
  { slug: 'sage-femme', fr: 'Sage-femme', ar: 'قابلة', test: (t) => /sages?-femmes?/.test(t) },
  { slug: 'medecin-veterinaire', fr: 'Médecin vétérinaire', ar: 'طبيب بيطري', test: (t) => /veterinaire/.test(t) },
  { slug: 'medecin', fr: 'Médecin', ar: 'طبيب', test: (t) => /\bmedecins?\b/.test(t) && !/veterinaire|resident|residanat/.test(t) },
  { slug: 'pharmacien', fr: 'Pharmacien', ar: 'صيدلي', test: (t) => /pharmaciens?\b/.test(t) },
  { slug: 'architecte', fr: 'Architecte', ar: 'مهندس معماري', test: (t) => /architecte/.test(t) },
  { slug: 'adjoint-administratif', fr: 'Adjoint administratif', ar: 'مساعد إداري', test: (t) => /adjoints? administratifs?/.test(t) },
  { slug: 'adjoint-technique', fr: 'Adjoint technique', ar: 'مساعد تقني', test: (t) => /adjoints? techniques?/.test(t) },
  { slug: 'teleconseiller', fr: 'Téléconseiller', ar: 'مستشار هاتفي', test: (t) => /teleconseill/.test(t) },
];

/** Grades d'un concours (lus dans le grade, sinon dans le titre). Un concours peut couvrir deux familles. */
export function gradesOf(c: Pick<HubContest, 'grade' | 'titleFr'>): string[] {
  const g = fold(c.grade || '');
  const fromGrade = g ? GRADES.filter((x) => x.test(g)).map((x) => x.slug) : [];
  if (fromGrade.length) return fromGrade;
  const t = fold(c.titleFr || '');
  return GRADES.filter((x) => x.test(t)).map((x) => x.slug);
}

export const orgSlug = (adminFr: string) => slugify(adminFr);

// ─── Construction des pages ────────────────────────────────────────────────────────────────
export interface Hub {
  kind: HubKind;
  slug: string;
  name: { fr: string; ar: string };
  contests: HubContest[]; // du plus récent au plus ancien
}

/** Statuts publics : les fiches « archive » (versions remplacées) et brouillons sont exclus en amont. */
export function buildHubs(all: HubContest[]): Record<HubKind, Map<string, Hub>> {
  const out: Record<HubKind, Map<string, Hub>> = { organisme: new Map(), region: new Map(), grade: new Map() };
  const add = (kind: HubKind, slug: string, name: { fr: string; ar: string }, c: HubContest) => {
    if (!slug) return;
    const h = out[kind].get(slug) || { kind, slug, name, contests: [] };
    if (!h.contests.some((x) => x.slug === c.slug)) h.contests.push(c);
    out[kind].set(slug, h);
  };
  for (const c of all) {
    if (c.adminFr) add('organisme', orgSlug(c.adminFr), { fr: c.adminFr, ar: c.adminAr || c.adminFr }, c);
    for (const r of regionsOf(c)) {
      const R = REGIONS.find((x) => x.slug === r)!;
      add('region', r, { fr: R.fr, ar: R.ar }, c);
    }
    for (const g of gradesOf(c)) {
      const G = GRADES.find((x) => x.slug === g)!;
      add('grade', g, { fr: G.fr, ar: G.ar }, c);
    }
  }
  const recent = (a: HubContest, b: HubContest) => (b.published || b.deadline || '').localeCompare(a.published || a.deadline || '');
  for (const k of Object.keys(out) as HubKind[]) for (const h of out[k].values()) h.contests.sort(recent);
  return out;
}

/** Libellé d'un lien vers une page de regroupement (« Concours région Souss-Massa »). */
export function hubLabel(h: Hub, lang: HubLang): string {
  const n = h.name[lang] || h.name.fr;
  if (lang === 'ar') return h.kind === 'region' ? `مباريات جهة ${n}` : `مباريات ${n}`;
  return h.kind === 'region' ? `Concours région ${h.slug === 'oriental' ? 'de l’Oriental' : n}` : `Concours ${n}`;
}

export const hubIndexable = (h: Hub) => h.contests.length >= MIN_INDEX;

const isOpen = (c: HubContest, today: string) => c.state === 'open' || (c.state === 'published' && (!c.deadline || c.deadline >= today));

function topCounts(list: string[], n: number): { key: string; count: number }[] {
  const m = new Map<string, number>();
  for (const k of list) if (k) m.set(k, (m.get(k) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, count]) => ({ key, count }));
}

const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
export function hubDate(iso: string | null | undefined, lang: HubLang): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';
  return lang === 'ar' ? `${d} ${MONTHS_AR[m - 1]} ${y}` : `${d} ${MONTHS_FR[m - 1]} ${y}`;
}

export interface HubView {
  kind: HubKind;
  slug: string;
  path: string;
  indexable: boolean;
  title: string; // balise <title>
  h1: string;
  description: string;
  intro: string[]; // paragraphes (données réelles)
  facts: { label: string; value: string }[];
  open: HubContest[];
  recent: HubContest[];
  related: { kind: HubKind; slug: string; name: string; count: number }[];
  faq: { q: string; a: string }[];
  labels: { open: string; recent: string; related: string; prep: string; none: string; deadline: string; posts: string; faq: string; all: string };
}

/** Contenu complet d'une page de regroupement, dans la langue demandée. */
export function hubView(hub: Hub, hubs: Record<HubKind, Map<string, Hub>>, lang: HubLang, today: string): HubView {
  const fr = lang === 'fr';
  // En arabe, un nom en lettres latines est isolé (FSI…PDI) pour ne pas mélanger l'ordre de la phrase.
  const raw = hub.name[lang] || hub.name.fr;
  const name = !fr && /[A-Za-z]/.test(raw) ? `\u2068${raw}\u2069` : raw;
  const year = today.slice(0, 4);
  const all = hub.contests.filter((c) => c.state !== 'cancelled');
  const open = all.filter((c) => isOpen(c, today)).sort((a, b) => (a.deadline || '9').localeCompare(b.deadline || '9'));
  const recent = all.filter((c) => !isOpen(c, today)).slice(0, 12);
  const posts = all.reduce((n, c) => n + (c.positions || 0), 0);
  const openPosts = open.reduce((n, c) => n + (c.positions || 0), 0);
  const first = all.map((c) => c.published || c.deadline || '').filter(Boolean).sort()[0] || '';
  const last = all.map((c) => c.published || '').filter(Boolean).sort().pop() || '';
  const next = open[0];

  // Ce qui relie cette page aux autres regroupements (liens internes).
  const relKinds: HubKind[] = hub.kind === 'organisme' ? ['grade', 'region'] : hub.kind === 'region' ? ['organisme', 'grade'] : ['organisme', 'region'];
  const related: HubView['related'] = [];
  for (const k of relKinds) {
    const keys = all.flatMap((c) => (k === 'organisme' ? [orgSlug(c.adminFr)] : k === 'region' ? regionsOf(c) : gradesOf(c)));
    for (const { key, count } of topCounts(keys, 6)) {
      const h = hubs[k].get(key);
      if (h && h.slug !== hub.slug && hubIndexable(h)) related.push({ kind: k, slug: key, name: hubLabel(h, lang), count });
    }
  }

  // Faits tirés des fiches : diplôme le plus demandé, échelle lue dans les intitulés.
  const echelles = topCounts(all.map((c) => (/echelle\s*(\d{1,2})/.exec(fold(`${c.grade} ${c.titleFr}`)) || [])[1] || ''), 1);
  const topAdmins = topCounts(all.map((c) => c.adminFr), 3).map((x) => {
    const h = hubs.organisme.get(orgSlug(x.key));
    return h ? h.name[lang] || h.name.fr : x.key;
  });
  const topGrades = topCounts(all.flatMap((c) => gradesOf(c)), 3).map((x) => hubs.grade.get(x.key)?.name[lang] || x.key);
  const facts: HubView['facts'] = [];
  facts.push({ label: fr ? 'Concours publiés' : 'مباريات منشورة', value: String(all.length) });
  if (posts) facts.push({ label: fr ? 'Postes au total' : 'مجموع المناصب', value: String(posts) });
  facts.push({ label: fr ? 'Ouverts actuellement' : 'مفتوحة حالياً', value: String(open.length) });
  if (echelles[0]?.key && hub.kind === 'grade') facts.push({ label: fr ? 'Échelle (avis)' : 'السلم (الإعلانات)', value: echelles[0].key });
  if (hub.kind !== 'organisme' && topAdmins.length) facts.push({ label: fr ? 'Principaux recruteurs' : 'أبرز الجهات المشغلة', value: topAdmins.join(' · ') });
  if (hub.kind !== 'grade' && topGrades.length) facts.push({ label: fr ? 'Grades les plus recrutés' : 'الدرجات الأكثر طلباً', value: topGrades.join(' · ') });

  const lc = name.charAt(0).toLowerCase() + name.slice(1);
  const what = fr
    ? hub.kind === 'organisme' ? `de l’organisme ${name}` : hub.kind === 'region' ? `dans la région ${hub.slug === 'oriental' ? 'de l’Oriental' : name}` : `${/^[aeiouyhéèêâîôû]/i.test(lc) ? 'd’' : 'de '}${lc}`
    : hub.kind === 'organisme' ? `${name}` : hub.kind === 'region' ? `بجهة ${name}` : `${name}`;
  const h1 = fr
    ? hub.kind === 'organisme' ? `Concours ${name} ${year}` : hub.kind === 'region' ? `Concours dans la région ${hub.slug === 'oriental' ? 'de l’Oriental' : name} ${year}` : `Concours ${lc} ${year}`
    : hub.kind === 'region' ? `مباريات جهة ${name} ${year}` : `مباريات ${name} ${year}`;

  const intro: string[] = [];
  if (fr) {
    intro.push(
      `KounKour a publié ${all.length} concours ${what}${first ? ` depuis le ${hubDate(first, 'fr')}` : ''}${posts ? `, pour un total de ${posts} postes` : ''}. ` +
        (open.length
          ? `${open.length} ${open.length > 1 ? 'sont ouverts' : 'est ouvert'} actuellement (${openPosts} postes)${next?.deadline ? ` ; la date limite la plus proche est le ${hubDate(next.deadline, 'fr')}` : ''}.`
          : `Aucun concours n’est ouvert actuellement${last ? ` ; le dernier avis a été publié le ${hubDate(last, 'fr')}` : ''}. Activez les alertes pour être prévenu du prochain.`)
    );
    intro.push('Chaque fiche reprend l’arrêté officiel : conditions, diplôme exigé, pièces du dossier, épreuves, dates et lien de candidature, avec la préparation gratuite correspondante.');
  } else {
    intro.push(
      `نشر موقع \u2068KounKour\u2069 ${all.length} مباراة ${what}${first ? ` منذ ${hubDate(first, 'ar')}` : ''}${posts ? `، بما مجموعه ${posts} منصبا` : ''}. ` +
        (open.length
          ? `${open.length} منها مفتوحة حالياً (${openPosts} منصبا)${next?.deadline ? `، وأقرب آخر أجل هو ${hubDate(next.deadline, 'ar')}` : ''}.`
          : `لا توجد مباراة مفتوحة حالياً${last ? `، وآخر إعلان نُشر في ${hubDate(last, 'ar')}` : ''}. فعّل التنبيهات ليصلك الجديد.`)
    );
    intro.push('كل بطاقة تعتمد القرار الرسمي: الشروط، الشهادة المطلوبة، ملف الترشيح، الاختبارات، الآجال ورابط الترشيح، مع التحضير المجاني المناسب.');
  }

  const faq: HubView['faq'] = [];
  if (fr) {
    faq.push({
      q: `Y a-t-il un concours ${what} ouvert en ce moment ?`,
      a: open.length
        ? `Oui : ${open.length} concours ${open.length > 1 ? 'sont ouverts' : 'est ouvert'} (${openPosts} postes)${next?.deadline ? `. La date limite la plus proche est le ${hubDate(next.deadline, 'fr')}` : ''}.`
        : `Pas en ce moment. Le dernier avis publié sur KounKour date du ${hubDate(last || first, 'fr')}.`,
    });
    faq.push({ q: `Combien de postes ont été proposés ${what} ?`, a: `${posts} postes répartis sur ${all.length} concours publiés sur KounKour${first ? ` depuis le ${hubDate(first, 'fr')}` : ''}.` });
  } else {
    faq.push({
      q: `هل توجد مباراة مفتوحة حالياً ${what}؟`,
      a: open.length
        ? `نعم: ${open.length} مباراة مفتوحة (${openPosts} منصبا)${next?.deadline ? `، وأقرب آخر أجل هو ${hubDate(next.deadline, 'ar')}` : ''}.`
        : `ليس حالياً. آخر إعلان منشور على KounKour بتاريخ ${hubDate(last || first, 'ar')}.`,
    });
    faq.push({ q: `كم عدد المناصب المعروضة ${what}؟`, a: `${posts} منصبا موزعة على ${all.length} مباراة منشورة على KounKour${first ? ` منذ ${hubDate(first, 'ar')}` : ''}.` });
  }

  const title = fr
    ? open.length ? `${h1} : ${open.length} ouvert${open.length > 1 ? 's' : ''}` : `${h1} : dates et conditions`
    : open.length ? `${h1}: ${open.length} مفتوحة` : `${h1}: الآجال والشروط`;
  const description = fr
    ? `${open.length ? `${open.length} concours ouvert${open.length > 1 ? 's' : ''} (${openPosts} postes). ` : ''}${all.length} concours ${what} publiés sur KounKour : dates limites, conditions, pièces et préparation gratuite.`
    : `${open.length ? `${open.length} مباراة مفتوحة (${openPosts} منصبا). ` : ''}${all.length} مباراة ${what} على KounKour: الآجال والشروط والملف والتحضير المجاني.`;

  return {
    kind: hub.kind,
    slug: hub.slug,
    path: hubPath(hub.kind, hub.slug),
    indexable: hubIndexable(hub),
    title,
    h1,
    description,
    intro,
    facts,
    open,
    recent,
    related,
    faq,
    labels: fr
      ? { open: 'Concours ouverts', recent: 'Concours récents (clos)', related: 'Voir aussi', prep: 'Se préparer gratuitement', none: 'Aucun concours ouvert actuellement.', deadline: 'Date limite', posts: 'postes', faq: 'Questions fréquentes', all: 'Tous les regroupements' }
      : { open: 'المباريات المفتوحة', recent: 'مباريات حديثة (منتهية)', related: 'انظر أيضاً', prep: 'التحضير المجاني', none: 'لا توجد مباراة مفتوحة حالياً.', deadline: 'آخر أجل', posts: 'منصبا', faq: 'أسئلة شائعة', all: 'كل التصنيفات' },
  };
}

/** Pages d'index : la liste des regroupements indexables d'un type, du plus fourni au moins fourni. */
export function hubIndexView(kind: HubKind, hubs: Record<HubKind, Map<string, Hub>>, lang: HubLang, today: string) {
  const fr = lang === 'fr';
  const list = [...hubs[kind].values()]
    .filter(hubIndexable)
    .map((h) => ({ slug: h.slug, name: h.name[lang] || h.name.fr, count: h.contests.length, open: h.contests.filter((c) => isOpen(c, today)).length }))
    .sort((a, b) => b.open - a.open || b.count - a.count || a.name.localeCompare(b.name));
  const h1 = fr
    ? kind === 'organisme' ? 'Concours par organisme' : kind === 'region' ? 'Concours par région' : 'Concours par grade'
    : kind === 'organisme' ? 'المباريات حسب الإدارة' : kind === 'region' ? 'المباريات حسب الجهة' : 'المباريات حسب الدرجة';
  const description = fr
    ? `${list.length} ${kind === 'organisme' ? 'organismes' : kind === 'region' ? 'régions' : 'grades'} : tous les concours publiés sur KounKour, avec les concours ouverts et les dates limites.`
    : `${list.length} ${kind === 'organisme' ? 'إدارة' : kind === 'region' ? 'جهة' : 'درجة'}: كل المباريات المنشورة على KounKour مع المباريات المفتوحة والآجال.`;
  return { kind, path: HUB_INDEX[kind], h1, title: `${h1} | KounKour`, description, list };
}

/** « Avis de concours de recrutement de X » → « Concours X » (même reformulation que la fiche). */
export function hubShortTitle(c: HubContest, lang: HubLang): string {
  if (lang === 'ar') return c.titleAr || c.titleFr;
  const t = c.titleFr;
  const s = t.replace(/^avis\s+(de\s+|d[’'])?(concours|examen)\s+(de\s+recrutement\s+)?(de\s+la\s+|de\s+l[’']|des\s+|de\s+|d[’'])?/i, '$2 ');
  const out = s === t ? t : s.charAt(0).toUpperCase() + s.slice(1);
  return /^(concours|examen)/i.test(out) ? out : `Concours ${out}`;
}

/** Dossiers de préparation les plus utiles pour les concours d'une page (règles partagées prepMatch). */
export function hubPrepSlugs(hub: Hub, match: (c: HubContest) => string[], n = 4): string[] {
  return topCounts(hub.contests.flatMap((c) => match(c)), n).map((x) => x.key);
}

/** Liens d'une fiche vers ses pages de regroupement indexables (organisme, grades, régions). */
export function hubLinksOf(c: HubContest, hubs: Record<HubKind, Map<string, Hub>>, lang: HubLang): { kind: HubKind; slug: string; href: string; text: string }[] {
  const out: { kind: HubKind; slug: string; href: string; text: string }[] = [];
  const push = (kind: HubKind, slug: string) => {
    const h = hubs[kind].get(slug);
    if (h && hubIndexable(h) && !out.some((x) => x.kind === kind && x.slug === slug)) out.push({ kind, slug, href: hubPath(kind, slug), text: hubLabel(h, lang) });
  };
  if (c.adminFr) push('organisme', orgSlug(c.adminFr));
  for (const g of gradesOf(c)) push('grade', g);
  for (const r of regionsOf(c)) push('region', r);
  return out.slice(0, 5);
}
