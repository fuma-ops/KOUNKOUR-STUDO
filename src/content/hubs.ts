// Pages de regroupement (SEO programmatique) : tous les concours d'un organisme, d'une région,
// d'une ville, d'un grade, d'une spécialité ou d'un niveau d'études, à partir des vraies fiches
// publiées. Module partagé par le rendu serveur (api/_lib/seo.ts) et l'application (HubPage) :
// même découpage, mêmes chiffres, mêmes textes.
//
// Règles :
//  - aucune donnée inventée : chiffres, dates, diplômes et échelles viennent des fiches ;
//  - une page n'est indexable que si elle a assez de contenu (MIN_INDEX concours), sinon noindex ;
//  - les versions « archive » (fiches remplacées) et les brouillons ne comptent pas.

export type HubKind = 'organisme' | 'region' | 'ville' | 'grade' | 'specialite' | 'niveau';
export type HubLang = 'fr' | 'ar';
export const HUB_KINDS: HubKind[] = ['organisme', 'ville', 'region', 'specialite', 'niveau', 'grade'];

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
  diploma: string; // diplôme(s) exigé(s), lus dans l'arrêté (fiche + détail des postes)
  specialties: string; // spécialités du détail des postes
  places: string; // lieux d'affectation du détail des postes
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
  diploma_fr?: string | null;
  posts?: { province?: string | null; diploma?: string | null; specialty?: string | null }[] | null;
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
  const posts = r.posts || [];
  const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.map((x) => (x || '').trim()).filter(Boolean))].join(' | ');
  return {
    slug: r.slug,
    titleFr,
    titleAr: (r.title_ar || titleFr).replace(/\s+/g, ' ').trim(),
    adminFr: (r.admin_fr || '').replace(/''/g, "'").trim(),
    adminAr: (r.admin_ar || r.admin_fr || '').replace(/''/g, "'").trim(),
    grade: r.grade_fr || '',
    region: r.region_fr || '',
    positions: typeof r.positions === 'number' ? r.positions : 0,
    deadline: r.deadline_date,
    published: r.publication_date || (r.published_at || '').slice(0, 10) || null,
    state,
    diploma: uniq([r.diploma_fr, ...posts.map((p) => p.diploma)]),
    specialties: uniq(posts.map((p) => p.specialty)),
    places: uniq(posts.map((p) => p.province)),
  };
}

export const HUB_BASE: Record<HubKind, string> = { organisme: '/organisme', region: '/region', ville: '/ville', grade: '/grade', specialite: '/specialite', niveau: '/niveau' };
export const HUB_INDEX: Record<HubKind, string> = { organisme: '/organismes', region: '/regions', ville: '/villes', grade: '/grades', specialite: '/specialites', niveau: '/niveaux' };
export const HUB_INDEX_LABEL: Record<HubKind, Record<HubLang, string>> = {
  organisme: { fr: 'Concours par organisme', ar: 'المباريات حسب الإدارة' },
  ville: { fr: 'Concours par ville', ar: 'المباريات حسب المدينة' },
  region: { fr: 'Concours par région', ar: 'المباريات حسب الجهة' },
  specialite: { fr: 'Concours par spécialité', ar: 'المباريات حسب التخصص' },
  niveau: { fr: "Concours par niveau d'études", ar: 'المباريات حسب المستوى الدراسي' },
  grade: { fr: 'Concours par grade', ar: 'المباريات حسب الدرجة' },
};
export const HUB_SHORT_LABEL: Record<HubKind, Record<HubLang, string>> = {
  organisme: { fr: 'Par organisme', ar: 'حسب الإدارة' },
  ville: { fr: 'Par ville', ar: 'حسب المدينة' },
  region: { fr: 'Par région', ar: 'حسب الجهة' },
  specialite: { fr: 'Par spécialité', ar: 'حسب التخصص' },
  niveau: { fr: "Par niveau d'études", ar: 'حسب المستوى' },
  grade: { fr: 'Par grade', ar: 'حسب الدرجة' },
};
const INDEX_NOUN: Record<HubKind, Record<HubLang, string>> = {
  organisme: { fr: 'organismes', ar: 'إدارة' },
  ville: { fr: 'villes', ar: 'مدينة' },
  region: { fr: 'régions', ar: 'جهة' },
  specialite: { fr: 'spécialités', ar: 'تخصصاً' },
  niveau: { fr: "niveaux d'études", ar: 'مستويات' },
  grade: { fr: 'grades', ar: 'درجة' },
};
export const MIN_INDEX = 3; // nombre minimal de concours pour qu'une page soit indexée

export const hubPath = (kind: HubKind, slug: string) => `${HUB_BASE[kind]}/${encodeURIComponent(slug)}`;

const fold = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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

// ─── Villes (lieu cité dans le titre, l'organisme ou le détail des postes) ──────────────────
export const CITIES: { slug: string; fr: string; ar: string; re: RegExp }[] = [
  { slug: 'rabat', fr: 'Rabat', ar: 'الرباط', re: /\brabat\b/ },
  { slug: 'sale', fr: 'Salé', ar: 'سلا', re: /\bsale\b/ },
  { slug: 'kenitra', fr: 'Kénitra', ar: 'القنيطرة', re: /kenitra/ },
  { slug: 'temara', fr: 'Témara', ar: 'تمارة', re: /temara/ },
  { slug: 'khemisset', fr: 'Khémisset', ar: 'الخميسات', re: /khemisset/ },
  { slug: 'sidi-kacem', fr: 'Sidi Kacem', ar: 'سيدي قاسم', re: /sidi kacem/ },
  { slug: 'sidi-slimane', fr: 'Sidi Slimane', ar: 'سيدي سليمان', re: /sidi slimane/ },
  { slug: 'casablanca', fr: 'Casablanca', ar: 'الدار البيضاء', re: /casablanca/ },
  { slug: 'mohammedia', fr: 'Mohammedia', ar: 'المحمدية', re: /mohamm[ae]dia/ },
  { slug: 'el-jadida', fr: 'El Jadida', ar: 'الجديدة', re: /el jadida/ },
  { slug: 'settat', fr: 'Settat', ar: 'سطات', re: /\bsettat\b/ },
  { slug: 'berrechid', fr: 'Berrechid', ar: 'برشيد', re: /berrechid/ },
  { slug: 'benslimane', fr: 'Benslimane', ar: 'بنسليمان', re: /benslimane|ben slimane/ },
  { slug: 'sidi-bennour', fr: 'Sidi Bennour', ar: 'سيدي بنور', re: /sidi bennour/ },
  { slug: 'marrakech', fr: 'Marrakech', ar: 'مراكش', re: /marrakech/ },
  { slug: 'safi', fr: 'Safi', ar: 'آسفي', re: /\bsafi\b/ },
  { slug: 'essaouira', fr: 'Essaouira', ar: 'الصويرة', re: /essaouira/ },
  { slug: 'el-kelaa-des-sraghna', fr: 'El Kelaâ des Sraghna', ar: 'قلعة السراغنة', re: /kelaa des sraghna/ },
  { slug: 'youssoufia', fr: 'Youssoufia', ar: 'اليوسفية', re: /youssoufia/ },
  { slug: 'agadir', fr: 'Agadir', ar: 'أكادير', re: /agadir/ },
  { slug: 'inezgane-ait-melloul', fr: 'Inezgane-Aït Melloul', ar: 'إنزكان أيت ملول', re: /inezgane|ait melloul/ },
  { slug: 'taroudant', fr: 'Taroudant', ar: 'تارودانت', re: /taroudant/ },
  { slug: 'tiznit', fr: 'Tiznit', ar: 'تيزنيت', re: /tiznit/ },
  { slug: 'fes', fr: 'Fès', ar: 'فاس', re: /\bfes\b/ },
  { slug: 'meknes', fr: 'Meknès', ar: 'مكناس', re: /meknes/ },
  { slug: 'taza', fr: 'Taza', ar: 'تازة', re: /\btaza\b/ },
  { slug: 'sefrou', fr: 'Sefrou', ar: 'صفرو', re: /sefrou/ },
  { slug: 'ifrane', fr: 'Ifrane', ar: 'إفران', re: /ifrane/ },
  { slug: 'taounate', fr: 'Taounate', ar: 'تاونات', re: /taounate/ },
  { slug: 'tanger', fr: 'Tanger', ar: 'طنجة', re: /tanger/ },
  { slug: 'tetouan', fr: 'Tétouan', ar: 'تطوان', re: /tetouan/ },
  { slug: 'larache', fr: 'Larache', ar: 'العرائش', re: /larache/ },
  { slug: 'al-hoceima', fr: 'Al Hoceïma', ar: 'الحسيمة', re: /hoceima/ },
  { slug: 'chefchaouen', fr: 'Chefchaouen', ar: 'شفشاون', re: /chefchaouen/ },
  { slug: 'ouezzane', fr: 'Ouezzane', ar: 'وزان', re: /ouezzane/ },
  { slug: 'oujda', fr: 'Oujda', ar: 'وجدة', re: /oujda/ },
  { slug: 'nador', fr: 'Nador', ar: 'الناظور', re: /nador/ },
  { slug: 'berkane', fr: 'Berkane', ar: 'بركان', re: /berkane/ },
  { slug: 'taourirt', fr: 'Taourirt', ar: 'تاوريرت', re: /taourirt/ },
  { slug: 'guercif', fr: 'Guercif', ar: 'جرسيف', re: /guercif/ },
  { slug: 'beni-mellal', fr: 'Béni Mellal', ar: 'بني ملال', re: /beni mellal/ },
  { slug: 'khouribga', fr: 'Khouribga', ar: 'خريبكة', re: /khouribga/ },
  { slug: 'khenifra', fr: 'Khénifra', ar: 'خنيفرة', re: /khenifra/ },
  { slug: 'fquih-ben-salah', fr: 'Fquih Ben Salah', ar: 'الفقيه بن صالح', re: /fquih ben salah/ },
  { slug: 'azilal', fr: 'Azilal', ar: 'أزيلال', re: /azilal/ },
  { slug: 'errachidia', fr: 'Errachidia', ar: 'الرشيدية', re: /errachidia/ },
  { slug: 'ouarzazate', fr: 'Ouarzazate', ar: 'ورزازات', re: /ouarzazate/ },
  { slug: 'zagora', fr: 'Zagora', ar: 'زاكورة', re: /zagora/ },
  { slug: 'tinghir', fr: 'Tinghir', ar: 'تنغير', re: /tinghir/ },
  { slug: 'midelt', fr: 'Midelt', ar: 'ميدلت', re: /midelt/ },
  { slug: 'guelmim', fr: 'Guelmim', ar: 'كلميم', re: /guelmim/ },
  { slug: 'tan-tan', fr: 'Tan-Tan', ar: 'طانطان', re: /tan-?tan|tan tan/ },
  { slug: 'laayoune', fr: 'Laâyoune', ar: 'العيون', re: /laayoune/ },
  { slug: 'smara', fr: 'Smara', ar: 'السمارة', re: /smara|semara/ },
  { slug: 'boujdour', fr: 'Boujdour', ar: 'بوجدور', re: /boujdour/ },
  { slug: 'tarfaya', fr: 'Tarfaya', ar: 'طرفاية', re: /tarfaya/ },
  { slug: 'dakhla', fr: 'Dakhla', ar: 'الداخلة', re: /dakhla/ },
];

// Noms de régions composés de noms de villes (« Direction régionale – Béni Mellal-Khénifra ») :
// retirés avant la recherche de villes, pour ne pas attribuer une ville à un service régional.
const REGION_NAMES = [
  /tanger[\s\-–,]+tetouan[\s\-–,]+(al[\s\-–]+)?hoceima/g,
  /rabat[\s\-–,]+sale[\s\-–,]+kenitra/g,
  /casablanca[\s\-–,]+settat/g,
  /marrakech[\s\-–,]+safi/g,
  /fes[\s\-–,]+meknes/g,
  /beni[\s\-–]+mellal[\s\-–,]+khenifra/g,
  /guelmim[\s\-–,]+oued[\s\-–]+noun/g,
  /laayoune[\s\-–,]+(boujdour?[\s\-–,]+)?sakia[\s\-–]+(el|al)[\s\-–]+hamra/g,
  /dakhla[\s\-–,]+oued[\s\-–]+(ed[\s\-–]*)?dahab/g,
];
const stripRegions = (t: string) => REGION_NAMES.reduce((s, re) => s.replace(re, ' '), fold(t));

export function citiesOf(c: Pick<HubContest, 'titleFr' | 'adminFr' | 'places' | 'region'>): string[] {
  const text = stripRegions(`${c.titleFr} • ${c.adminFr} • ${c.places} • ${c.region}`);
  return CITIES.filter((x) => x.re.test(text)).map((x) => x.slug);
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
  { slug: 'architecte', fr: 'Architecte', ar: 'مهندس معماري', test: (t) => /architecte(?! (cyber|logiciel|solutions?|si\b|systemes?|reseaux?|data|cloud|it\b|technique|d'entreprise|applicati))/.test(t) },
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

// ─── Spécialités (détail des postes, sinon intitulé sans le nom de l'établissement) ──────────
export const SPECIALTIES: { slug: string; fr: string; ar: string; en: string; re: RegExp }[] = [
  { slug: 'informatique', fr: 'Informatique', ar: 'المعلوميات', en: 'en informatique', re: /informati|developpement (digital|web|logiciel|des applications)|reseaux? informatiques?|reseaux et (systemes|telecom)|systemes? d'information|cybersecur|genie logiciel|developpeur|\bdata\b|intelligence artificielle/ },
  { slug: 'genie-civil', fr: 'Génie civil et BTP', ar: 'الهندسة المدنية', en: 'en génie civil et BTP', re: /genie civil|\bbtp\b|batiment|travaux publics|gros oeuvres?|ouvrages d'art|genie rural/ },
  { slug: 'electricite', fr: 'Électricité et électrotechnique', ar: 'الكهرباء', en: 'en électricité et électrotechnique', re: /electricit|electrotechn|genie electrique|electromecan|electronique/ },
  { slug: 'mecanique', fr: 'Mécanique et maintenance', ar: 'الميكانيك والصيانة', en: 'en mécanique et maintenance', re: /mecanique|maintenance industrielle|genie industriel|conduite d'engins/ },
  { slug: 'finance-comptabilite', fr: 'Finance et comptabilité', ar: 'المالية والمحاسبة', en: 'en finance et comptabilité', re: /comptab|financ|audit|controle de gestion|fiscal/ },
  { slug: 'gestion-economie', fr: 'Gestion, économie et commerce', ar: 'التدبير والاقتصاد', en: 'en gestion, économie et commerce', re: /gestion des entreprises|sciences economiques|\beconomi|management|commerce|marketing|sciences de gestion/ },
  { slug: 'droit', fr: 'Droit', ar: 'القانون', en: 'en droit', re: /\bdroit\b|sciences juridiques|sciences politiques/ },
  { slug: 'ressources-humaines', fr: 'Ressources humaines', ar: 'الموارد البشرية', en: 'en ressources humaines', re: /ressources humaines|\bgrh\b/ },
  { slug: 'secretariat', fr: 'Secrétariat et bureautique', ar: 'الكتابة والمكتبيات', en: 'en secrétariat et bureautique', re: /secretari|assistan(t|te|ts) de direction|bureautique/ },
  { slug: 'hydraulique-eau', fr: 'Hydraulique, eau et assainissement', ar: 'الهيدروليك والماء والتطهير', en: 'en hydraulique, eau et assainissement', re: /hydraul|\beau\b|assainissement|hydrolog|plomberie/ },
  { slug: 'topographie', fr: 'Topographie et géomatique', ar: 'الطبوغرافيا', en: 'en topographie et géomatique', re: /topograph|geomat|geodes|cadastr/ },
  { slug: 'architecture-urbanisme', fr: 'Architecture et urbanisme', ar: 'الهندسة المعمارية والتعمير', en: 'en architecture et urbanisme', re: /architect(?!e (cyber|logiciel|solutions?|si\b|systemes?|reseaux?|data|cloud|it\b|technique|d'entreprise|applicati))|urbanis|amenagement du territoire/ },
  { slug: 'agronomie', fr: 'Agronomie et agriculture', ar: 'الفلاحة', en: 'en agronomie et agriculture', re: /agronom|agricole|agriculture|zootechn|horticult|forestier|halieut|aquacult/ },
  { slug: 'biologie-chimie', fr: 'Biologie, chimie et laboratoire', ar: 'البيولوجيا والكيمياء', en: 'en biologie, chimie et laboratoire', re: /biolog|chimi|laboratoire/ },
  { slug: 'sante-paramedical', fr: 'Santé : infirmiers et techniciens de santé', ar: 'الصحة: الممرضون وتقنيو الصحة', en: 'en soins infirmiers et techniques de santé', re: /infirmi|soins|sages?-femmes?|kinesith|radiolog|anesthes|preparateur en pharmacie|technicien de sante|reeducation|nutrition|orthophon|psychomotric/ },
  { slug: 'medecine', fr: 'Médecine (spécialités médicales)', ar: 'الطب', en: 'en médecine', re: /pediatr|nephrolog|cardiolog|chirurg|gyneco|immunolog|hematolog|anatomie|pneumo|dermato|neurolog|psychiatr|ophtalmo|radiotherap|reanimation|medecine (generale|interne|legale|du travail)|urolog|oncolog|endocrinolog|gastro|pharmacolog|microbiolog|parasitolog|histolog/ },
  { slug: 'communication-journalisme', fr: 'Communication et journalisme', ar: 'التواصل والصحافة', en: 'en communication et journalisme', re: /journalis|(?<!tele)communication|audiovisuel|multimedia/ },
  { slug: 'langues-traduction', fr: 'Langues et traduction', ar: 'اللغات والترجمة', en: 'en langues et traduction', re: /traduct|interpret|etudes (anglaises|arabes|francaises|hispaniques)|langue (anglaise|francaise|arabe|espagnole|amazighe)|linguisti/ },
  { slug: 'logistique-transport', fr: 'Logistique et transport', ar: 'اللوجستيك والنقل', en: 'en logistique et transport', re: /logisti|transport/ },
  { slug: 'statistique', fr: 'Statistique et actuariat', ar: 'الإحصاء', en: 'en statistique et actuariat', re: /statisti|actuar|econometr/ },
  { slug: 'environnement', fr: 'Environnement', ar: 'البيئة', en: 'en environnement', re: /environnement|developpement durable|energies? renouvelables?/ },
];

/** Spécialités d'un concours : détail des postes + intitulé (sans son dernier segment, qui nomme l'établissement). */
export function specialtiesOf(c: Pick<HubContest, 'titleFr' | 'specialties'>): string[] {
  const parts = (c.titleFr || '').split(/\s[–—-]\s/);
  const title = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0];
  const text = fold(`${c.specialties} • ${title}`);
  return SPECIALTIES.filter((x) => x.re.test(text)).map((x) => x.slug);
}

// ─── Niveaux d'études (diplôme exigé, lu dans l'arrêté ; rien n'est déduit du grade) ────────
export const LEVELS: { slug: string; fr: string; ar: string; en: string; re: RegExp }[] = [
  { slug: 'doctorat', fr: 'Doctorat', ar: 'الدكتوراه', en: 'avec un doctorat', re: /doctorat|docteur en|residanat/ },
  { slug: 'master', fr: 'Master, ingénieur (Bac+5)', ar: 'الماستر والهندسة (باك+5)', en: 'niveau Bac+5 (master, ingénieur)', re: /\bmasters?\b|\bdesa\b|\bdess\b|\bdea\b|ingenieur d'etat|diplome d'ingenieur|bac ?\+ ?5|diplome d'architecte|cycle superieur/ },
  { slug: 'licence', fr: 'Licence (Bac+3)', ar: 'الإجازة (باك+3)', en: 'niveau licence (Bac+3)', re: /licence|bac ?\+ ?3|ispits|premier cycle des etudes/ },
  { slug: 'bac-plus-2', fr: 'Bac+2 : technicien spécialisé, DUT, BTS', ar: 'باك+2: تقني متخصص', en: 'niveau Bac+2 (DTS, DUT, BTS)', re: /technicien specialise|\bdut\b|\bbts\b|\bdeug\b|\bdeust\b|bac ?\+ ?2|diplome universitaire de technologie/ },
  { slug: 'bac', fr: 'Baccalauréat, diplôme de technicien', ar: 'البكالوريا ودبلوم التقني', en: 'niveau bac', re: /baccalaureat|\bbac\b(?! ?\+)|diplome de technicien(?! specialise)|niveau bac\b(?! ?\+)/ },
  { slug: 'sans-bac', fr: 'Sans bac : qualification, spécialisation, niveau scolaire', ar: 'بدون بكالوريا', en: 'sans bac', re: /qualification professionnelle|specialisation professionnelle|certificat d'aptitude|niveau (de la )?(6e|9e|sixieme|neuvieme)|certificat d'etudes primaires|\bcap\b|niveau scolaire|diplome de qualification|diplome de specialisation/ },
];

export function levelsOf(c: Pick<HubContest, 'diploma'>): string[] {
  const t = fold(c.diploma || '');
  return t ? LEVELS.filter((x) => x.re.test(t)).map((x) => x.slug) : [];
}

// ─── Organismes : un nom = une page (l'acronyme entre parenthèses ne crée pas de doublon) ───
export const orgSlug = (adminFr: string) => slugify((adminFr || '').replace(/''/g, "'").replace(/\s*\([^)]*\)\s*$/, ''));

/** Clés d'un concours pour chaque dimension. */
export function keysOf(kind: HubKind, c: HubContest): string[] {
  switch (kind) {
    case 'organisme':
      return c.adminFr ? [orgSlug(c.adminFr)] : [];
    case 'region':
      return regionsOf(c);
    case 'ville':
      return citiesOf(c);
    case 'grade':
      return gradesOf(c);
    case 'specialite':
      return specialtiesOf(c);
    case 'niveau':
      return levelsOf(c);
  }
}

const STATIC_NAMES: Partial<Record<HubKind, { slug: string; fr: string; ar: string }[]>> = { region: REGIONS, ville: CITIES, grade: GRADES, specialite: SPECIALTIES, niveau: LEVELS };

// ─── Construction des pages ────────────────────────────────────────────────────────────────
export interface Hub {
  kind: HubKind;
  slug: string;
  name: { fr: string; ar: string };
  contests: HubContest[]; // du plus récent au plus ancien
}
export type Hubs = Record<HubKind, Map<string, Hub>>;

/** Statuts publics : les fiches « archive » (versions remplacées) et brouillons sont exclus en amont. */
export function buildHubs(all: HubContest[]): Hubs {
  const out = Object.fromEntries(HUB_KINDS.map((k) => [k, new Map<string, Hub>()])) as Hubs;
  const orgNames = new Map<string, Map<string, { n: number; ar: string }>>(); // variantes d'écriture d'un organisme
  for (const c of all) {
    for (const kind of HUB_KINDS) {
      for (const slug of keysOf(kind, c)) {
        if (!slug) continue;
        let h = out[kind].get(slug);
        if (!h) {
          const s = STATIC_NAMES[kind]?.find((x) => x.slug === slug);
          h = { kind, slug, name: s ? { fr: s.fr, ar: s.ar } : { fr: c.adminFr, ar: c.adminAr || c.adminFr }, contests: [] };
          out[kind].set(slug, h);
        }
        if (!h.contests.some((x) => x.slug === c.slug)) h.contests.push(c);
        if (kind === 'organisme') {
          const m = orgNames.get(slug) || new Map();
          const v = m.get(c.adminFr) || { n: 0, ar: c.adminAr };
          v.n++;
          m.set(c.adminFr, v);
          orgNames.set(slug, m);
        }
      }
    }
  }
  // Nom affiché d'un organisme : l'écriture la plus fréquente dans ses fiches.
  for (const [slug, m] of orgNames) {
    const [fr, v] = [...m.entries()].sort((a, b) => b[1].n - a[1].n)[0];
    out.organisme.get(slug)!.name = { fr, ar: v.ar || fr };
  }
  const recent = (a: HubContest, b: HubContest) => (b.published || b.deadline || '').localeCompare(a.published || a.deadline || '');
  for (const k of HUB_KINDS) for (const h of out[k].values()) h.contests.sort(recent);
  return out;
}

const ofOriental = (h: Pick<Hub, 'kind' | 'slug'>, n: string) => (h.kind === 'region' && h.slug === 'oriental' ? 'de l’Oriental' : n);

/** Libellé d'un lien vers une page de regroupement (« Concours région Souss-Massa »). */
export function hubLabel(h: Hub, lang: HubLang): string {
  const n = h.name[lang] || h.name.fr;
  if (lang === 'ar')
    return h.kind === 'region' ? `مباريات جهة ${n}` : h.kind === 'ville' ? `مباريات ${n}` : h.kind === 'specialite' ? `مباريات تخصص ${n}` : h.kind === 'niveau' ? `مباريات مستوى ${n}` : `مباريات ${n}`;
  switch (h.kind) {
    case 'region':
      return `Concours région ${ofOriental(h, n)}`;
    case 'ville':
      return `Concours à ${n}`;
    case 'specialite':
      return `Concours ${SPECIALTIES.find((x) => x.slug === h.slug)?.en || n}`;
    case 'niveau':
      return `Concours ${LEVELS.find((x) => x.slug === h.slug)?.en || n}`;
    default:
      return `Concours ${n}`;
  }
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

// Pages voisines proposées depuis chaque type de page (liens internes).
const RELATED: Record<HubKind, HubKind[]> = {
  organisme: ['ville', 'specialite', 'grade'],
  region: ['ville', 'organisme', 'specialite'],
  ville: ['organisme', 'specialite', 'region'],
  grade: ['specialite', 'ville', 'organisme'],
  specialite: ['niveau', 'grade', 'ville'],
  niveau: ['specialite', 'grade', 'ville'],
};

/** Contenu complet d'une page de regroupement, dans la langue demandée. */
export function hubView(hub: Hub, hubs: Hubs, lang: HubLang, today: string): HubView {
  const fr = lang === 'fr';
  // En arabe, un nom en lettres latines est isolé (FSI…PDI) pour ne pas mélanger l'ordre de la phrase.
  const raw = hub.name[lang] || hub.name.fr;
  const name = !fr && /[A-Za-z]/.test(raw) ? `⁨${raw}⁩` : raw;
  const year = today.slice(0, 4);
  const all = hub.contests.filter((c) => c.state !== 'cancelled');
  const open = all.filter((c) => isOpen(c, today)).sort((a, b) => (a.deadline || '9').localeCompare(b.deadline || '9'));
  const recent = all.filter((c) => !isOpen(c, today)).slice(0, 12);
  // Les postes d'un concours ne sont additionnés que pour un organisme : ailleurs (ville, spécialité,
  // niveau, grade, région) un même concours peut ouvrir des postes hors du regroupement.
  const exact = hub.kind === 'organisme';
  const posts = exact ? all.reduce((n, c) => n + (c.positions || 0), 0) : 0;
  const openPosts = exact ? open.reduce((n, c) => n + (c.positions || 0), 0) : 0;
  const first = all.map((c) => c.published || c.deadline || '').filter(Boolean).sort()[0] || '';
  const last = all.map((c) => c.published || '').filter(Boolean).sort().pop() || '';
  const next = open[0];

  const related: HubView['related'] = [];
  for (const k of RELATED[hub.kind]) {
    for (const { key, count } of topCounts(all.flatMap((c) => keysOf(k, c)), 6)) {
      const h = hubs[k].get(key);
      if (h && !(k === hub.kind && h.slug === hub.slug) && hubIndexable(h)) related.push({ kind: k, slug: key, name: hubLabel(h, lang), count });
    }
  }

  // Faits tirés des fiches.
  const names = (k: HubKind, n: number) => topCounts(all.flatMap((c) => keysOf(k, c)), n).map((x) => hubs[k].get(x.key)?.name[lang] || x.key);
  const echelles = topCounts(all.map((c) => (/echelle\s*(\d{1,2})/.exec(fold(`${c.grade} ${c.titleFr}`)) || [])[1] || ''), 1);
  const facts: HubView['facts'] = [];
  facts.push({ label: fr ? 'Concours publiés' : 'مباريات منشورة', value: String(all.length) });
  if (posts) facts.push({ label: fr ? 'Postes au total' : 'مجموع المناصب', value: String(posts) });
  facts.push({ label: fr ? 'Ouverts actuellement' : 'مفتوحة حالياً', value: String(open.length) });
  if (echelles[0]?.key && hub.kind === 'grade') facts.push({ label: fr ? 'Échelle (avis)' : 'السلم (الإعلانات)', value: echelles[0].key });
  if (hub.kind !== 'organisme') {
    const v = names('organisme', 3);
    if (v.length) facts.push({ label: fr ? 'Principaux recruteurs' : 'أبرز الجهات المشغلة', value: v.join(' · ') });
  }
  if (hub.kind !== 'grade') {
    const v = names('grade', 3);
    if (v.length) facts.push({ label: fr ? 'Grades les plus recrutés' : 'الدرجات الأكثر طلباً', value: v.join(' · ') });
  }
  if (hub.kind !== 'niveau' && hub.kind !== 'grade') {
    const v = names('niveau', 2);
    if (v.length) facts.push({ label: fr ? 'Diplômes les plus demandés' : 'الشهادات الأكثر طلباً', value: v.join(' · ') });
  }

  const lc = name.charAt(0).toLowerCase() + name.slice(1);
  const spec = SPECIALTIES.find((x) => x.slug === hub.slug);
  const lvl = LEVELS.find((x) => x.slug === hub.slug);
  const what = fr
    ? {
        organisme: `de l’organisme ${name}`,
        region: `dans la région ${ofOriental(hub, name)}`,
        ville: `à ${name}`,
        grade: `${/^[aeiouyhéèêâîôû]/i.test(lc) ? 'd’' : 'de '}${lc}`,
        specialite: spec?.en || `en ${lc}`,
        niveau: lvl?.en || `niveau ${name}`,
      }[hub.kind]
    : { organisme: name, region: `بجهة ${name}`, ville: `بمدينة ${name}`, grade: name, specialite: `في تخصص ${name}`, niveau: `لمستوى ${name}` }[hub.kind];
  const h1 = fr
    ? {
        organisme: `Concours ${name} ${year}`,
        region: `Concours dans la région ${ofOriental(hub, name)} ${year}`,
        ville: `Concours à ${name} ${year}`,
        grade: `Concours ${lc} ${year}`,
        specialite: `Concours ${spec?.en || lc} ${year}`,
        niveau: `Concours ${lvl?.en || `niveau ${name}`} ${year}`,
      }[hub.kind]
    : { organisme: `مباريات ${name} ${year}`, region: `مباريات جهة ${name} ${year}`, ville: `مباريات ${name} ${year}`, grade: `مباريات ${name} ${year}`, specialite: `مباريات تخصص ${name} ${year}`, niveau: `مباريات ${year} لمستوى ${name}` }[hub.kind];

  const intro: string[] = [];
  if (fr) {
    intro.push(
      `KounKour a publié ${all.length} concours ${what}${first ? ` depuis le ${hubDate(first, 'fr')}` : ''}${posts ? `, pour un total de ${posts} postes` : ''}. ` +
        (open.length
          ? `${open.length} ${open.length > 1 ? 'sont ouverts' : 'est ouvert'} actuellement${openPosts ? ` (${openPosts} postes)` : ''}${next?.deadline ? ` ; la date limite la plus proche est le ${hubDate(next.deadline, 'fr')}` : ''}.`
          : `Aucun concours n’est ouvert actuellement${last ? ` ; le dernier avis a été publié le ${hubDate(last, 'fr')}` : ''}. Activez les alertes pour être prévenu du prochain.`)
    );
    if (hub.kind === 'niveau') intro.push('Le niveau est lu dans le diplôme exigé par chaque arrêté. Vérifiez toujours la spécialité demandée dans la fiche avant de candidater.');
    if (hub.kind === 'specialite') intro.push('La spécialité est lue dans le détail des postes de chaque arrêté. Un même concours peut ouvrir des postes dans plusieurs spécialités.');
    intro.push('Chaque fiche reprend l’arrêté officiel : conditions, diplôme exigé, pièces du dossier, épreuves, dates et lien de candidature, avec la préparation gratuite correspondante.');
  } else {
    intro.push(
      `نشر موقع ⁨KounKour⁩ ${all.length} مباراة ${what}${first ? ` منذ ${hubDate(first, 'ar')}` : ''}${posts ? `، بما مجموعه ${posts} منصبا` : ''}. ` +
        (open.length
          ? `${open.length} منها مفتوحة حالياً${openPosts ? ` (${openPosts} منصبا)` : ''}${next?.deadline ? `، وأقرب آخر أجل هو ${hubDate(next.deadline, 'ar')}` : ''}.`
          : `لا توجد مباراة مفتوحة حالياً${last ? `، وآخر إعلان نُشر في ${hubDate(last, 'ar')}` : ''}. فعّل التنبيهات ليصلك الجديد.`)
    );
    if (hub.kind === 'niveau') intro.push('المستوى مأخوذ من الشهادة المطلوبة في قرار كل مباراة. تحقق دائماً من التخصص المطلوب في البطاقة قبل الترشح.');
    if (hub.kind === 'specialite') intro.push('التخصص مأخوذ من تفاصيل المناصب في قرار كل مباراة، وقد تفتح المباراة الواحدة مناصب في عدة تخصصات.');
    intro.push('كل بطاقة تعتمد القرار الرسمي: الشروط، الشهادة المطلوبة، ملف الترشيح، الاختبارات، الآجال ورابط الترشيح، مع التحضير المجاني المناسب.');
  }

  const faq: HubView['faq'] = [];
  if (fr) {
    faq.push({
      q: `Y a-t-il un concours ${what} ouvert en ce moment ?`,
      a: open.length
        ? `Oui : ${open.length} concours ${open.length > 1 ? 'sont ouverts' : 'est ouvert'}${openPosts ? ` (${openPosts} postes)` : ''}${next?.deadline ? `. La date limite la plus proche est le ${hubDate(next.deadline, 'fr')}` : ''}.`
        : `Pas en ce moment. Le dernier avis publié sur KounKour date du ${hubDate(last || first, 'fr')}.`,
    });
    faq.push(
      posts
        ? { q: `Combien de postes ont été proposés ${what} ?`, a: `${posts} postes répartis sur ${all.length} concours publiés sur KounKour${first ? ` depuis le ${hubDate(first, 'fr')}` : ''}.` }
        : { q: `Combien de concours ${what} ont été publiés ?`, a: `${all.length} concours publiés sur KounKour${first ? ` depuis le ${hubDate(first, 'fr')}` : ''}, dont ${open.length} ouvert${open.length > 1 ? 's' : ''} actuellement.` },
    );
    const recruiters = names('organisme', 3);
    if (hub.kind !== 'organisme' && recruiters.length) faq.push({ q: `Qui recrute le plus ${what} ?`, a: `D’après les avis publiés sur KounKour : ${recruiters.join(', ')}.` });
  } else {
    faq.push({
      q: `هل توجد مباراة مفتوحة حالياً ${what}؟`,
      a: open.length
        ? `نعم: ${open.length} مباراة مفتوحة${openPosts ? ` (${openPosts} منصبا)` : ''}${next?.deadline ? `، وأقرب آخر أجل هو ${hubDate(next.deadline, 'ar')}` : ''}.`
        : `ليس حالياً. آخر إعلان منشور على KounKour بتاريخ ${hubDate(last || first, 'ar')}.`,
    });
    faq.push(
      posts
        ? { q: `كم عدد المناصب المعروضة ${what}؟`, a: `${posts} منصبا موزعة على ${all.length} مباراة منشورة على KounKour${first ? ` منذ ${hubDate(first, 'ar')}` : ''}.` }
        : { q: `كم عدد المباريات المنشورة ${what}؟`, a: `${all.length} مباراة منشورة على KounKour${first ? ` منذ ${hubDate(first, 'ar')}` : ''}، منها ${open.length} مفتوحة حالياً.` },
    );
    const recruiters = names('organisme', 3);
    if (hub.kind !== 'organisme' && recruiters.length) faq.push({ q: `من هي أبرز الجهات المشغلة ${what}؟`, a: `حسب الإعلانات المنشورة على KounKour: ${recruiters.join('، ')}.` });
  }

  const title = fr
    ? open.length ? `${h1} : ${open.length} ouvert${open.length > 1 ? 's' : ''}` : `${h1} : dates et conditions`
    : open.length ? `${h1}: ${open.length} مفتوحة` : `${h1}: الآجال والشروط`;
  const description = fr
    ? `${open.length ? `${open.length} concours ouvert${open.length > 1 ? 's' : ''}${openPosts ? ` (${openPosts} postes)` : ''}. ` : ''}${all.length} concours ${what} publiés sur KounKour : dates limites, conditions, pièces et préparation gratuite.`
    : `${open.length ? `${open.length} مباراة مفتوحة${openPosts ? ` (${openPosts} منصبا)` : ''}. ` : ''}${all.length} مباراة ${what} على KounKour: الآجال والشروط والملف والتحضير المجاني.`;

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

/** Pages d'index : la liste des regroupements indexables d'un type. */
export function hubIndexView(kind: HubKind, hubs: Hubs, lang: HubLang, today: string) {
  const fr = lang === 'fr';
  const list = [...hubs[kind].values()]
    .filter(hubIndexable)
    .map((h) => ({ slug: h.slug, name: h.name[lang] || h.name.fr, count: h.contests.length, open: h.contests.filter((c) => isOpen(c, today)).length }));
  // Niveaux : du plus élevé au plus accessible ; sinon du plus actif au moins actif.
  if (kind === 'niveau') list.sort((a, b) => LEVELS.findIndex((x) => x.slug === a.slug) - LEVELS.findIndex((x) => x.slug === b.slug));
  else list.sort((a, b) => b.open - a.open || b.count - a.count || a.name.localeCompare(b.name));
  const h1 = HUB_INDEX_LABEL[kind][lang];
  const description = fr
    ? `${list.length} ${INDEX_NOUN[kind].fr} : tous les concours publiés sur KounKour, avec les concours ouverts et les dates limites.`
    : `${list.length} ${INDEX_NOUN[kind].ar}: كل المباريات المنشورة على KounKour مع المباريات المفتوحة والآجال.`;
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

/** Liens d'une fiche vers ses pages de regroupement indexables. */
export function hubLinksOf(c: HubContest, hubs: Hubs, lang: HubLang): { kind: HubKind; slug: string; href: string; text: string }[] {
  const out: { kind: HubKind; slug: string; href: string; text: string }[] = [];
  for (const kind of ['organisme', 'grade', 'specialite', 'niveau', 'ville', 'region'] as HubKind[]) {
    for (const slug of keysOf(kind, c).slice(0, 2)) {
      const h = hubs[kind].get(slug);
      if (h && hubIndexable(h) && !out.some((x) => x.kind === kind && x.slug === slug)) out.push({ kind, slug, href: hubPath(kind, slug), text: hubLabel(h, lang) });
    }
  }
  return out.slice(0, 8);
}
