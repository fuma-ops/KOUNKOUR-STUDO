import type { CandidateProfile, Contest, ContestPost } from '../types';

// =============================================================================
// Smart Match V2 — moteur de règles déterministe (cahier des charges §14).
//
// Objectif produit : qu'aucun candidat ne RATE un concours fait pour lui.
//  - « eligible »     : diplôme, spécialité et âge correspondent à l'annonce ;
//  - « verify »       : à vérifier — spécialité voisine, information manquante ou
//                       ambiguë. Affiché au candidat (« ne le ratez pas »), jamais
//                       caché ;
//  - « not_eligible » : non-correspondance certaine (clôturé, autre niveau de
//                       diplôme, autre domaine, âge au-delà de la limite lue).
// Une information manquante ou ambiguë n'exclut JAMAIS : elle donne « verify ».
// Aucun verdict n'est garanti : l'organisme recruteur décide.
// =============================================================================

export type EligibilityVerdict = 'eligible' | 'verify' | 'not_eligible';
export type CriterionStatus = 'ok' | 'verify' | 'ko';
export type CriterionKey = 'status' | 'diploma' | 'specialty' | 'age';

export interface CriterionCheck {
  key: CriterionKey;
  status: CriterionStatus;
  fr: string;
  ar: string;
}

export interface MatchedPost {
  province: string | null;
  specialty: string | null;
  count: number | null;
}

export interface EligibilityResult {
  verdict: EligibilityVerdict;
  isEligible: boolean; // === (verdict === 'eligible')
  isHighMatch: boolean;
  score: number; // 0 à 100 — sert au classement, pas à une promesse
  degreeMatch: boolean;
  ageMatch: boolean;
  specialtyMatch: boolean;
  specialtyStatus: 'match' | 'unknown' | 'different';
  regionMatch: boolean;
  /** Détail critère par critère (règle appliquée + valeur de l'annonce). */
  checks: CriterionCheck[];
  /** Postes de l'avis qui correspondent à la spécialité du candidat. */
  matchedPosts: MatchedPost[];
  matchedPostsCount: number;
  reasons: { fr: string; ar: string }[];
}

export const MATCH_DISCLAIMER = {
  fr: "Cette estimation ne remplace pas la lecture de l'annonce officielle ; l'organisme recruteur décide de l'admissibilité.",
  ar: 'هذا التقدير لا يعوض قراءة الإعلان الرسمي؛ الجهة المنظمة هي التي تقرر الأهلية.',
};

// -----------------------------------------------------------------------------
// Normalisation
// -----------------------------------------------------------------------------
export const norm = (s: string | null | undefined) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`]/g, "'")
    .replace(/œ/g, 'oe');

// -----------------------------------------------------------------------------
// 1. Diplôme : nombre d'années après le bac (Bac = 0, Bac+2, Licence = 3, Bac+4,
//    Master / Ingénieur d'État = 5, Doctorat = 8, CQP = -1).
// -----------------------------------------------------------------------------
export function degreeYearsIn(text: string | undefined | null): number[] {
  const t = norm(text);
  if (!t.trim()) return [];
  const found = new Set<number>();
  if (/doctorat|docteur/.test(t)) found.add(8);
  if (/master|bac ?\+ ?5|ingenieur d.etat|ingenieur agronome|diplome d.ingenieur|ecoles? d.ingenieurs|\bdesa\b|\bdess\b|\bdea\b|\bingenieurs?\b(?! d.application)/.test(t)) found.add(5);
  if (/bac ?\+ ?4|\bmaitrise\b|\bmst\b/.test(t)) found.add(4);
  if (/licence|bac ?\+ ?3|ingenieur d.application/.test(t)) found.add(3);
  if (/bac ?\+ ?2|\bdts\b|\bdut\b|\bbts\b|\bdeug\b|technicien specialise/.test(t)) found.add(2);
  if (/diplome de technicien(?! specialise)|\btechnicien\b(?! specialise)/.test(t) && !found.size) found.add(1);
  if (/\bcqp\b|certificat de qualification/.test(t)) found.add(-1);
  if (/baccalaureat|\bbac\b(?! ?\+)/.test(t) && !found.size) found.add(0);
  return [...found].sort((x, y) => x - y);
}

export function degreeRankOf(text: string | undefined | null): number | null {
  const y = degreeYearsIn(text);
  return y.length === 1 ? y[0] : null;
}

const YEARS_LABEL: Record<number, { fr: string; ar: string }> = {
  [-1]: { fr: 'CQP', ar: 'شهادة التأهيل المهني' },
  1: { fr: 'Diplôme de technicien', ar: 'دبلوم التقني' },
  0: { fr: 'Bac', ar: 'الباكالوريا' },
  2: { fr: 'Bac+2', ar: 'باك+2' },
  3: { fr: 'Bac+3 (Licence)', ar: 'باك+3 (الإجازة)' },
  4: { fr: 'Bac+4', ar: 'باك+4' },
  5: { fr: 'Bac+5 (Master / Ingénieur)', ar: 'باك+5 (ماستر / مهندس)' },
  8: { fr: 'Doctorat', ar: 'الدكتوراه' },
};
const yl = (y: number, lang: 'fr' | 'ar') => YEARS_LABEL[y]?.[lang] || `Bac+${y}`;

type DegreeCheck = { status: CriterionStatus; fr: string; ar: string };

function checkDegree(required: string, mine: number | null): DegreeCheck {
  if (mine === null) {
    return { status: 'verify', fr: 'Renseignez votre niveau de diplôme dans votre profil.', ar: 'يرجى تحديد مستواك الدراسي في ملفك.' };
  }
  const req = degreeYearsIn(required);
  if (req.length === 0) {
    return {
      status: 'verify',
      fr: "Diplôme exigé non précisé par l'annonce : à vérifier dans l'arrêté officiel.",
      ar: 'الدبلوم المطلوب غير محدد في الإعلان: يرجى التحقق من القرار الرسمي.',
    };
  }
  const t = norm(required);
  const isMinimum = /au moins|au minimum|minimum|ou plus|et plus/.test(t);
  const isLevelOnly = /\bniveau\b/.test(t);
  if (isMinimum) {
    const min = Math.min(...req);
    if (mine >= min) {
      return {
        status: 'ok',
        fr: `Diplôme : ${yl(min, 'fr')} au minimum exigé, le vôtre (${yl(mine, 'fr')}) convient.`,
        ar: `الدبلوم: يشترط ${yl(min, 'ar')} على الأقل، ودبلومك (${yl(mine, 'ar')}) مناسب.`,
      };
    }
    return {
      status: 'ko',
      fr: `Diplôme : ${yl(min, 'fr')} au minimum exigé, le vôtre est ${yl(mine, 'fr')}.`,
      ar: `الدبلوم: يشترط ${yl(min, 'ar')} على الأقل، ودبلومك ${yl(mine, 'ar')}.`,
    };
  }
  if (isLevelOnly || req.includes(4) || req.includes(1)) {
    // « Niveau … » ou Bac+4 : formulation qui ne permet pas de trancher.
    const near = req.some((r) => Math.abs(r - mine) <= 1);
    if (near || req.includes(mine)) {
      return {
        status: 'verify',
        fr: `Diplôme : l'annonce demande « ${required} » ; vérifiez que votre ${yl(mine, 'fr')} est accepté.`,
        ar: `الدبلوم: الإعلان يطلب « ${required} »؛ تحقق من قبول دبلومك (${yl(mine, 'ar')}).`,
      };
    }
  }
  if (req.includes(mine)) {
    if (req.length > 1 && (/selon le poste/.test(t) || !/\bou\b/.test(t))) {
      return {
        status: 'verify',
        fr: `Diplôme : niveau ambigu dans l'annonce (« ${required} ») ; vérifiez dans l'arrêté.`,
        ar: `الدبلوم: المستوى غير دقيق في الإعلان (« ${required} »)؛ تحقق من القرار.`,
      };
    }
    return {
      status: 'ok',
      fr: `Diplôme : ${yl(mine, 'fr')} exigé, comme le vôtre.`,
      ar: `الدبلوم: يشترط ${yl(mine, 'ar')} كدبلومك.`,
    };
  }
  // Règle KounKour : le diplôme doit avoir le même nombre d'années après le bac
  // que celui demandé (ni plus bas, ni plus haut), sauf mention « au moins ».
  const reqTxt = req.map((r) => yl(r, 'fr')).join(' ou ');
  const reqAr = req.map((r) => yl(r, 'ar')).join(' أو ');
  return {
    status: 'ko',
    fr: `Diplôme : ce concours demande ${reqTxt}, le vôtre est ${yl(mine, 'fr')}.`,
    ar: `الدبلوم: هذه المباراة تشترط ${reqAr}، ودبلومك ${yl(mine, 'ar')}.`,
  };
}

// -----------------------------------------------------------------------------
// 2. Spécialités : concepts regroupés en domaines.
//    Même concept → correspond ; même domaine → à vérifier (« proche ») ;
//    domaines différents → ne correspond pas. Concept « général » d'un domaine
//    côté annonce (ex. « Informatique ») → accepte tout le domaine.
// -----------------------------------------------------------------------------
type Concept = { id: string; domains: string[]; re: RegExp; general?: boolean; label: string };

const C = (id: string, domains: string, label: string, re: RegExp, general = false): Concept => ({ id, domains: domains.split('|'), label, re, general });

// Concept « général » (general = true) : désigne tout un domaine (« Informatique »,
// « Droit », « Gestion »). Côté annonce, il accepte toutes les sous-spécialités
// du domaine ; côté candidat, il est trop vague pour confirmer une sous-spécialité.
// Les spécialités médicales (urologie, pédiatrie…) n'ont pas de concept : elles
// sont comparées mot à mot, pour ne jamais confondre deux spécialités.
export const CONCEPTS: Concept[] = [
  // Informatique & numérique
  C('info', 'informatique', 'Informatique', /informatique|informaticien|\bdigital|numerique|\btic\b/, true),
  C('info_dev', 'informatique', 'Développement informatique / logiciel', /developpement (informatique|digital|logiciel|web|mobile)|genie logiciel|full ?stack|programmation|developpeur|logiciel/),
  C('info_res', 'informatique', 'Réseaux et systèmes informatiques', /reseaux? (informatiques?|et systemes|et securite|et telecom)|systemes (et|&) reseaux|infrastructure digitale|telecom|administration (des )?(systemes|reseaux)/),
  C('info_sec', 'informatique', 'Cybersécurité', /cyber|securite (des )?(si|systemes d.information|informatique)|securite si\b/),
  C('info_data', 'informatique', 'Data, IA et big data', /\bdata\b|donnees|big ?data|intelligence artificielle|business intelligence|decisionnel/),
  C('info_si', 'informatique', "Systèmes d'information", /systemes? d.information(?! geographique)|gestion de l.information|\bsi\b/),
  C('info_maint', 'informatique', 'Maintenance et support informatique', /maintenance (et support )?informatique|support informatique/),
  C('info_emb', 'informatique|electricite', 'Systèmes embarqués', /embarque/),
  C('infographie', 'communication', 'Infographie / multimédia', /infographi|communication visuelle|multimedia|design graphique/),
  // Gestion, économie, finance
  C('gestion', 'gestion', 'Gestion des entreprises / management', /gestion (des |d.)?entreprises?|sciences de gestion|(?<!controle de |innovation et |agricole )management(?! des ressources| de l.innovation| et ingenierie| agricole| technologique)|business administration|gestion administrative|economie et gestion|^gestion$/),
  C('compta', 'gestion', 'Comptabilité / fiscalité', /comptab|fiscal/),
  C('finance', 'gestion', 'Finance', /financ(?!es publiques)/),
  C('audit', 'gestion', 'Audit et contrôle de gestion', /audit|controle de gestion/),
  C('eco', 'gestion', 'Sciences économiques', /econom(?!ie rurale)/),
  C('rh', 'gestion', 'Ressources humaines', /ressources humaines|\brh\b|\bgrh\b/),
  C('innovation', 'gestion', "Management de l'innovation", /innovation|management technologique/),
  C('commerce', 'commerce', 'Commerce / marketing', /commerc|marketing|vente|relation client|evenementiel/),
  C('logistique', 'logistique', 'Logistique / transport', /logisti|transport|supply chain|magasinier/),
  C('stat', 'statistique', 'Statistique / démographie', /statisti|demograph|actuari|econometr/),
  C('secretariat', 'secretariat', 'Secrétariat / assistanat', /secretar|assistanat|assistant (de direction|administratif)|bureautique|techniques administratives/),
  // Droit
  C('droit', 'droit', 'Droit', /\bdroit\b|juridi/, true),
  C('droit_prive', 'droit', 'Droit privé / des affaires', /droit prive|droit des affaires|droit civil|droit des societes|droit financier|droit maritime|propriete industrielle|droit du contentieux|droit medical|droit commercial/),
  C('droit_public', 'droit', 'Droit public / administratif', /droit public|droit administratif|sciences administratives|relations internationales|finances publiques|sciences politiques/),
  // BTP, eau, topographie, architecture
  C('gc', 'btp', 'Génie civil / BTP', /genie civil|batiment|travaux publics|\bbtp\b|ponts et chaussees|gros (oeuvres?|travaux)|grands travaux|\bvrd\b|construction|infrastructures? de transport|travaux des gros/),
  C('hydro', 'btp|eau', 'Hydraulique / eau', /hydrauli|genie de l.eau|maitrise de l.eau|irrigation|traitement des eaux|techniques de l.eau|science de l.eau|eau et (de l.)?environnement/),
  C('genie_rural', 'btp|agriculture|eau', 'Génie rural', /genie rural/),
  C('topo', 'btp', 'Topographie / géomatique / SIG', /topograph|geomati|cartograph|\bsig\b|information geographique|geodesie|dessinateur/),
  C('archi', 'architecture', 'Architecture / urbanisme', /architect|urbanis|amenagement du territoire|developpement territorial|gestion territoriale/),
  C('paysage', 'architecture|agriculture', 'Aménagement paysager / espaces verts', /paysag|espaces verts/),
  C('environnement', 'environnement', 'Environnement / QHSE', /environnement|qhse|hygiene et securite|qualite, hygiene/),
  // Électricité, mécanique, industrie, énergie
  C('elec', 'electricite', 'Génie électrique / électricité', /electri|electrotechni|electronique|reseaux electriques|photovolta/),
  C('electromeca', 'electricite|mecanique', 'Électromécanique / automatisme', /electromecani|mecatroni|automatis|automatisme|instrumentation/),
  C('energie', 'electricite', 'Énergétique / énergies renouvelables', /energ/),
  C('meca', 'mecanique', 'Génie mécanique / mécanique', /(?<!electro)mecani|fabrication mecanique|engins? (a moteur|de travaux)|moteur/),
  C('auto', 'mecanique', 'Mécanique et électricité automobiles', /automobile|diagnostic et electronique embarquee/),
  C('indus', 'industrie', 'Génie industriel / procédés', /genie industriel|genie des procedes|procedes industriels|industriel|maintenance industrielle|entretien industriel/),
  C('biomed', 'industrie|sante_tech', 'Génie biomédical', /biomedical/),
  C('mines', 'mines', 'Mines / géologie', /minier|miniere|\bmines\b|geolog/),
  C('plomberie', 'plomberie', 'Plomberie', /plomberie/),
  C('conduite', 'conduite', 'Conduite (permis)', /conduite|permis|chauffeur/),
  C('textile', 'textile', 'Textile / tapis / couture', /tissage|tapis|textile|couture|stylisme|modelisme|design de mode|\bmode\b/),
  // Agriculture, élevage, agroalimentaire, pêche
  C('agri', 'agriculture', 'Agronomie / agriculture', /agri|agro(?!alimentaire)|agronom|horticult|arboricult|production vegetale|phoenicicult|palmier|developpement rural|economie rurale/),
  C('elevage', 'agriculture', 'Production animale / élevage', /production animale|zootechn|elevage|ruminant|veterinaire|ingenierie animale/),
  C('agroalim', 'agroalimentaire', 'Agroalimentaire / restauration', /agroalimentaire|industrie alimentaire|technologie des aliments|bio-industriel|restauration|catering|hotellerie|tourisme/),
  C('peche', 'mer', 'Pêche / ressources halieutiques / marine', /halieuti|peche|marine marchande|capitaine|officier mecanicien/),
  // Santé
  C('medecine', 'medecine', 'Médecine générale', /\bmedecin\b|medecine generale|doctorat en medecine/),
  C('med_specialites', 'medecine', 'Spécialités médicales', /specialites (medicales|chirurgicales)/),
  C('infirmier', 'infirmier', 'Soins infirmiers', /infirm|soins infirmiers/, true),
  C('inf_poly', 'infirmier', 'Infirmier polyvalent', /polyvalent/),
  C('inf_anesth', 'infirmier', 'Anesthésie et réanimation', /anesthesi|reanimation/),
  C('inf_mental', 'infirmier', 'Santé mentale', /sante mentale/),
  C('inf_urg', 'infirmier', 'Urgences et soins intensifs', /urgences|soins intensifs/),
  C('inf_ped', 'infirmier', 'Soins aux nouveau-nés et aux enfants', /nouveau-nes|soins aux enfants/),
  C('aide_soignant', 'aide_soignant', 'Aide-soignant', /aide.?soignant|aide.?therapeute/),
  C('sage_femme', 'sage_femme', 'Sage-femme', /sage.?femme/),
  C('tech_radio', 'sante_tech', 'Technicien de radiologie', /technicien de radiologie|imagerie medicale|manipulateur/),
  C('tech_labo', 'sante_tech', 'Technicien de laboratoire / analyses biologiques', /technicien de laboratoire|analyses biologiques|biologie medicale/),
  C('prep_pharma', 'sante_tech', 'Préparateur en pharmacie', /preparateur en pharmacie/),
  C('kine', 'reeducation', 'Kinésithérapie', /kinesi|reeducation medicale/),
  C('orthophonie', 'reeducation', 'Orthophonie', /orthophon/),
  C('pharma', 'pharmacie', 'Pharmacie', /pharmac(?!ie\b.*preparateur)/),
  C('dentaire', 'dentaire', 'Médecine dentaire', /dentaire|odontolog|parodont|pedodont|prothese/),
  C('bio', 'biologie', 'Biologie / biotechnologie', /biolog|biochim|biotechnolog|physiolog|neuroscience|parasitolog|microbiolog|sciences de la vie|phytochim/),
  C('chimie', 'chimie', 'Chimie', /chimi/),
  // Sciences, lettres, communication
  C('math', 'mathematiques', 'Mathématiques', /mathemat/),
  C('physique', 'physique', 'Physique', /physique(?! et sport)/),
  C('langues', 'langues', 'Langues / lettres / traduction', /anglais|francais|arabe|espagnol|allemand|italien|\blangues?\b|linguisti|litterature|\blettres\b|traduction|etudes anglaises/),
  C('communication', 'communication', 'Communication / journalisme / audiovisuel', /communication(?! visuelle)|journalis|audiovisuel|son et de l.image|option son|sciences de l.information/),
  C('sciences_hum', 'sciences_humaines', 'Sciences humaines / éducation', /sciences humaines|sociolog|psycholog|histoire|geographie|philosoph|sciences de l.education|enseignement/),
  C('sport', 'sport', 'Sport', /\bsport/),
];

const ALL_SPECIALTIES_RE = /toutes (les )?specialites|toute specialite|toutes filieres|sans specialite/;
const GENERIC_ANNOUNCE_RE = /mentionn|voir l.arrete|voir l.annonce|selon l.arrete|non precis|non specifi/;

export function conceptsOf(text: string): Concept[] {
  // « Droit privé en arabe », « (section française) » : langue d'enseignement, pas une spécialité.
  const t = norm(text)
    .replace(/\(?(en|section) (langue )?(francaise?|arabe)\)?/g, ' ')
    .replace(/[\u0600-\u06FF]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return [];
  return CONCEPTS.filter((c) => c.re.test(t));
}

// Mots génériques, ignorés pour la comparaison de secours (vocabulaire hors dictionnaire).
const SPEC_STOP = new Set([
  'genie', 'sciences', 'science', 'technique', 'techniques', 'technicien', 'techniciens', 'specialite',
  'specialites', 'specialise', 'specialisee', 'option', 'options', 'etat', 'grade', 'echelle', 'niveau',
  'poste', 'postes', 'concours', 'recrutement', 'generale', 'general', 'dans', 'pour', 'avec', 'domaine',
  'connexe', 'equivalent', 'similaire', 'ingenieur', 'ingenieurs', 'ingenierie', 'systemes', 'systeme',
  'appliquee', 'appliquees', 'autre', 'autres', 'filiere', 'filieres', 'section',
]);
function stemToken(t: string): string {
  return t.length >= 7 ? t.slice(0, 6) : t;
}
export function specialtyTokens(s: string | undefined | null): string[] {
  return norm(s)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !SPEC_STOP.has(t))
    .map(stemToken);
}

// Découpe « A, B ou C ; D / E (F) » en spécialités élémentaires. Le « ou » sépare
// des alternatives ; le « et » est gardé (« Audit et contrôle de gestion »).
export function splitSpecialties(text: string): string[] {
  return (text || '')
    .replace(/^une des sp[ée]cialit[ée]s\s*:/i, '')
    .split(/\s[-–]\s|[,;|&()]|\n|\s\/\s|\/|\s+ou\s+|:\s/i)
    .map((x) => x.replace(/^[\s\-–]+|[\s\-–.]+$/g, '').trim())
    .filter((x) => x.length > 1 && !/^(ou|et|domaine connexe|equivalent|équivalent|similaire)$/i.test(x));
}

export type SpecLevel = 'match' | 'close' | 'none' | 'unknown';
export type SpecResult = { level: SpecLevel; label?: string };

const RANK: Record<SpecLevel, number> = { match: 3, close: 2, unknown: 1, none: 0 };
const better = (a: SpecResult, b: SpecResult) => (RANK[b.level] > RANK[a.level] ? b : a);

/** Compare UNE spécialité exigée aux spécialités du candidat. */
export function compareSpecialty(required: string, mine: string[]): SpecResult {
  const r = norm(required);
  if (!r.trim() || GENERIC_ANNOUNCE_RE.test(r)) return { level: 'unknown' };
  if (ALL_SPECIALTIES_RE.test(r)) return { level: 'match', label: required };

  const reqC = conceptsOf(required);
  const mineC = mine.flatMap(conceptsOf);
  if (reqC.length && mineC.length) {
    const has = (list: Concept[], d: string, general: boolean) => list.some((c) => !!c.general === general && c.domains.includes(d));
    const mineIds = new Set(mineC.filter((c) => !c.general).map((c) => c.id));
    // a) Sous-spécialité précise commune → correspond.
    if (reqC.some((c) => !c.general && mineIds.has(c.id))) return { level: 'match', label: required };
    for (const c of reqC.filter((x) => x.general)) {
      for (const d of c.domains) {
        // b) L'annonce vise tout le domaine (« Informatique ») sans sous-spécialité → correspond.
        if (!has(reqC, d, false) && mineC.some((m) => m.domains.includes(d))) return { level: 'match', label: required };
      }
    }
    // c) Même domaine, sous-spécialité différente ou profil trop vague → à vérifier.
    const mineDomains = new Set(mineC.flatMap((c) => c.domains));
    if (reqC.some((c) => c.domains.some((d) => mineDomains.has(d)))) return { level: 'close', label: required };
    return { level: 'none', label: required };
  }

  // Vocabulaire hors dictionnaire : comparaison par mots-clés.
  const reqT = [...new Set(specialtyTokens(required))];
  if (!reqT.length) return { level: 'unknown' };
  let best: SpecResult = { level: 'none', label: required };
  for (const m of mine) {
    const mt = new Set(specialtyTokens(m));
    if (!mt.size) continue;
    if (reqT.every((t) => mt.has(t))) return { level: 'match', label: required };
    if (reqT.some((t) => mt.has(t))) best = better(best, { level: 'close', label: required });
  }
  return best;
}

/** Compare une liste de spécialités exigées (une annonce, ou un poste). */
export function compareSpecialtyList(requiredList: string[], mine: string[]): SpecResult {
  const items = requiredList.flatMap((x) => [x, ...splitSpecialties(x)]).filter(Boolean);
  // Un libellé illisible (arabe seul, « voir l'arrêté ») ne l'emporte jamais sur un libellé lu.
  let best: SpecResult | null = null;
  for (const it of items) {
    const res = compareSpecialty(it, mine);
    if (res.level === 'unknown') continue;
    best = best ? better(best, res) : res;
    if (best.level === 'match') return best;
  }
  return best || { level: 'unknown' };
}

export function profileSpecialties(profile: CandidateProfile): string[] {
  const list = [...(profile.specialties || []), profile.specialty || '']
    .flatMap((s) => s.split(/\s*;\s*/))
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(list)];
}

// -----------------------------------------------------------------------------
// 3. Âge : limites lues dans l'arrêté (critère « age »), sinon règle générale.
// -----------------------------------------------------------------------------
export type AgeRule = { min: number | null; max: number | null; strictMax: boolean; extendedMax: number | null; civilServantNoLimit: boolean; noUpperLimit: boolean };

export function parseAgeRule(text: string | null | undefined): AgeRule | null {
  const t = norm(text);
  if (!t.trim()) return null;
  const rule: AgeRule = { min: null, max: null, strictMax: false, extendedMax: null, civilServantNoLimit: /sans limite (d.age )?pour les fonctionnaires/.test(t), noUpperLimit: /age de la retraite/.test(t) };
  const mMin = t.match(/(\d{2}) ans (au moins|minimum|au minimum)/) || t.match(/au moins (\d{2}) ans/);
  if (mMin) rule.min = Number(mMin[1]);
  const maxes: { n: number; strict: boolean }[] = [];
  for (const m of t.matchAll(/(\d{2}) ans (au plus|au maximum|maximum)/g)) maxes.push({ n: Number(m[1]), strict: false });
  for (const m of t.matchAll(/(?:au plus|au maximum|n.excedant pas|ne depassant pas) (\d{2}) ans/g)) maxes.push({ n: Number(m[1]), strict: false });
  for (const m of t.matchAll(/moins de (\d{2}) ans/g)) maxes.push({ n: Number(m[1]), strict: true });
  const ext = t.match(/sans depasser (\d{2}) ans/);
  if (ext) rule.extendedMax = Number(ext[1]);
  const plain = maxes.filter((x) => x.n !== rule.extendedMax);
  if (plain.length) {
    // Plusieurs limites (« moins de 45 ans (moins de 40 ans avec le diplôme de
    // technicien) ») : la plus haute exclut, la plus basse se vérifie.
    const top = plain.reduce((a, b) => (b.n > a.n ? b : a));
    rule.max = top.n;
    rule.strictMax = top.strict;
  }
  return rule;
}

function checkAge(profile: CandidateProfile, ageText: string): DegreeCheck {
  const age = Number(profile.age) || 0;
  if (age <= 0) return { status: 'verify', fr: 'Renseignez votre âge dans votre profil.', ar: 'يرجى تحديد سنك في ملفك.' };
  const rule = parseAgeRule(ageText);
  const isCivil = profile.currentSituation === 'civil_servant';
  if (!rule || (rule.max === null && rule.min === null && !rule.noUpperLimit)) {
    if (age < 18) return { status: 'ko', fr: 'Âge : 18 ans minimum.', ar: 'السن: 18 سنة على الأقل.' };
    if (age > 45) {
      return {
        status: 'verify',
        fr: "Âge : au-delà de 45 ans (limite générale de la fonction publique) ; l'annonce ne précise pas la limite, vérifiez l'arrêté.",
        ar: 'السن: يتجاوز 45 سنة (الحد العام)؛ الإعلان لا يحدد السن، تحقق من القرار.',
      };
    }
    return {
      status: 'ok',
      fr: ageText ? `Âge : ${ageText}.` : "Âge : l'annonce n'indique pas de limite d'âge (vous avez entre 18 et 45 ans).",
      ar: ageText ? `السن: ${ageText}.` : 'السن: الإعلان لا يحدد سناً قصوى (سنك بين 18 و45 سنة).',
    };
  }
  const min = rule.min ?? 18;
  if (age < min) return { status: 'ko', fr: `Âge : ${min} ans minimum (${ageText}).`, ar: `السن: ${min} سنة على الأقل.` };
  if (rule.noUpperLimit || rule.max === null) return { status: 'ok', fr: `Âge : ${ageText}.`, ar: `السن: ${ageText}.` };
  const limit = rule.strictMax ? rule.max - 1 : rule.max;
  if (age < limit) return { status: 'ok', fr: `Âge : ${ageText} — vous êtes dans la limite.`, ar: `السن: ${ageText} — سنك ضمن الحد.` };
  if (age === limit) {
    return {
      status: 'verify',
      fr: `Âge : vous êtes à la limite (${ageText}) ; vérifiez votre âge à la date de référence indiquée.`,
      ar: `السن: أنت في الحد الأقصى (${ageText})؛ تحقق من سنك في التاريخ المرجعي.`,
    };
  }
  if (rule.civilServantNoLimit && isCivil) {
    return { status: 'ok', fr: `Âge : pas de limite pour les fonctionnaires (${ageText}).`, ar: `السن: لا حد للموظفين (${ageText}).` };
  }
  if (rule.extendedMax && age <= rule.extendedMax) {
    return {
      status: 'verify',
      fr: `Âge : au-delà de ${rule.max} ans, limite prolongeable jusqu'à ${rule.extendedMax} ans selon vos services validables pour la retraite ; vérifiez votre situation.`,
      ar: `السن: يتجاوز ${rule.max} سنة، ويمكن تمديد الحد إلى ${rule.extendedMax} سنة حسب الخدمات المعتبرة للتقاعد.`,
    };
  }
  if (rule.civilServantNoLimit) {
    return {
      status: 'ko',
      fr: `Âge : ${ageText}. Si vous êtes fonctionnaire, indiquez-le dans votre profil (pas de limite pour eux).`,
      ar: `السن: ${ageText}. إذا كنت موظفاً، حدده في ملفك (لا حد للموظفين).`,
    };
  }
  return { status: 'ko', fr: `Âge : ${ageText} ; vous avez ${age} ans.`, ar: `السن: ${ageText}؛ سنك ${age} سنة.` };
}

// -----------------------------------------------------------------------------
// 4. Verdict global, poste par poste.
// -----------------------------------------------------------------------------
const PROFILE_YEARS: Record<string, number> = { Doctorat: 8, Master: 5, Licence: 3, 'Bac+2': 2, Technicien: 1, Bac: 0, CQP: -1 };

export function profileDegreeYears(profile: CandidateProfile): number | null {
  if (!profile.degreeLevel) return null;
  if (profile.degreeLevel in PROFILE_YEARS) return PROFILE_YEARS[profile.degreeLevel];
  const y = degreeYearsIn(profile.degreeLevel);
  return y.length === 1 ? y[0] : null;
}

const worst = (a: CriterionStatus, b: CriterionStatus): CriterionStatus =>
  a === 'ko' || b === 'ko' ? 'ko' : a === 'verify' || b === 'verify' ? 'verify' : 'ok';

function specCheck(res: SpecResult, mine: string[], contestSpec: string): DegreeCheck {
  const mineTxt = mine.join(', ');
  if (!mine.length) return { status: 'verify', fr: 'Renseignez votre spécialité dans votre profil.', ar: 'يرجى تحديد تخصصك في ملفك.' };
  switch (res.level) {
    case 'match':
      return { status: 'ok', fr: `Spécialité : « ${res.label} » correspond à votre profil (${mineTxt}).`, ar: `التخصص: « ${res.label} » يطابق ملفك (${mineTxt}).` };
    case 'close':
      return {
        status: 'verify',
        fr: `Spécialité proche : l'annonce demande « ${res.label} », vous avez « ${mineTxt} ». Vérifiez dans l'arrêté que votre diplôme est accepté.`,
        ar: `تخصص قريب: الإعلان يطلب « ${res.label} »، وتخصصك « ${mineTxt} ». تحقق من القرار.`,
      };
    case 'unknown':
      return {
        status: 'verify',
        fr: "Spécialité non précisée par l'annonce : vérifiez dans l'arrêté officiel.",
        ar: 'التخصص غير محدد في الإعلان: تحقق من القرار الرسمي.',
      };
    default:
      return {
        status: 'ko',
        fr: `Spécialité : l'annonce demande ${contestSpec || 'une autre spécialité'} ; la vôtre (${mineTxt}) n'y figure pas.`,
        ar: `التخصص: الإعلان يطلب ${contestSpec || 'تخصصاً آخر'}؛ تخصصك (${mineTxt}) غير وارد.`,
      };
  }
}

export function checkEligibility(contest: Contest, profile: CandidateProfile): EligibilityResult {
  const checks: CriterionCheck[] = [];

  // 0. Statut
  const closed = contest.status === 'closed' || contest.status === 'results' || contest.status === 'in_progress';
  checks.push(
    closed
      ? { key: 'status', status: 'ko', fr: 'Candidatures closes : la date limite est dépassée.', ar: 'انتهى أجل إيداع الترشيحات.' }
      : {
          key: 'status',
          status: 'ok',
          fr: contest.deadlineDate ? `Candidatures ouvertes jusqu'au ${contest.deadlineDate}.` : 'Candidatures ouvertes.',
          ar: contest.deadlineDate ? `الترشيحات مفتوحة إلى غاية ${contest.deadlineDate}.` : 'الترشيحات مفتوحة.',
        }
  );

  const mine = profileSpecialties(profile);
  const myYears = profileDegreeYears(profile);
  const contestSpecs = [...(contest.specialtiesList || [])];
  if (!contestSpecs.length && contest.specialty?.fr) contestSpecs.push(contest.specialty.fr);
  const contestSpecTxt = contestSpecs.join(', ');

  // 1+2. Diplôme et spécialité — poste par poste quand l'avis détaille ses postes.
  const posts: ContestPost[] = (contest.posts || []).filter((p) => p.specialty || p.diploma);
  let degree: DegreeCheck;
  let spec: SpecResult;
  let matchedPosts: MatchedPost[] = [];
  if (posts.length > 1 || (posts.length === 1 && posts[0].specialty)) {
    type Row = { p: ContestPost; d: DegreeCheck; s: SpecResult };
    const rows: Row[] = posts.map((p) => ({
      p,
      d: checkDegree(p.diploma || contest.degreeLevel, myYears),
      s: p.specialty ? compareSpecialtyList([p.specialty], mine) : compareSpecialtyList(contestSpecs, mine),
    }));
    const tier = (r: Row) => (r.d.status === 'ko' || r.s.level === 'none' ? 0 : r.d.status === 'ok' && r.s.level === 'match' ? 2 : 1);
    const bestTier = Math.max(...rows.map(tier));
    const bestRows = rows.filter((r) => tier(r) === bestTier);
    const pick = bestRows.find((r) => r.s.level === 'match') || bestRows[0];
    degree = pick.d;
    spec = pick.s;
    if (bestTier > 0) {
      matchedPosts = bestRows.map((r) => ({ province: r.p.province, specialty: r.p.specialty, count: r.p.count }));
    }
  } else {
    degree = checkDegree(contest.degreeLevel, myYears);
    spec = compareSpecialtyList(contestSpecs, mine);
  }
  checks.push({ key: 'diploma', ...degree });
  checks.push({ key: 'specialty', ...specCheck(spec, mine, contestSpecTxt) });

  // 3. Âge
  checks.push({ key: 'age', ...checkAge(profile, contest.criteria?.ageLimit?.fr || '') });

  const overall = checks.reduce<CriterionStatus>((acc, c) => worst(acc, c.status), 'ok');
  const verdict: EligibilityVerdict = overall === 'ko' ? 'not_eligible' : overall === 'verify' ? 'verify' : 'eligible';

  // Région (information, non éliminatoire)
  const profileRegion = norm(profile.region);
  const contestRegion = norm(contest.region?.fr);
  const regionMatch =
    !contestRegion || (!!profileRegion && (contestRegion.includes(profileRegion) || profileRegion.includes(contestRegion)));

  const st = (k: CriterionKey) => checks.find((c) => c.key === k)!.status;
  const score =
    (st('diploma') === 'ok' ? 35 : st('diploma') === 'verify' ? 15 : 0) +
    (st('specialty') === 'ok' ? 45 : spec.level === 'close' ? 25 : st('specialty') === 'verify' ? 10 : 0) +
    (st('age') === 'ok' ? 10 : st('age') === 'verify' ? 5 : 0) +
    (st('status') === 'ok' ? 10 : 0);

  // Raisons à afficher : d'abord ce qui bloque, puis ce qui est à vérifier, puis le reste.
  const order: Record<CriterionStatus, number> = { ko: 0, verify: 1, ok: 2 };
  const reasons = [...checks]
    .filter((c) => !(c.key === 'status' && c.status === 'ok'))
    .sort((a, b) => order[a.status] - order[b.status])
    .map(({ fr, ar }) => ({ fr, ar }));

  const matchedPostsCount = matchedPosts.reduce((n, p) => n + (p.count || 0), 0);

  return {
    verdict,
    isEligible: verdict === 'eligible',
    isHighMatch: verdict === 'eligible' && regionMatch,
    score,
    degreeMatch: st('diploma') === 'ok',
    ageMatch: st('age') === 'ok',
    specialtyMatch: st('specialty') === 'ok',
    specialtyStatus: spec.level === 'match' ? 'match' : spec.level === 'none' ? 'different' : 'unknown',
    regionMatch,
    checks,
    matchedPosts,
    matchedPostsCount,
    reasons,
  };
}

/** Le profil est-il assez rempli pour un matching utile ? */
export function isProfileReady(profile: CandidateProfile): boolean {
  return profileSpecialties(profile).length > 0 && profileDegreeYears(profile) !== null;
}

/** Libellés de spécialités proposés au candidat : dictionnaire + annonces réelles. */
export function specialtySuggestions(contests: Contest[]): string[] {
  const set = new Map<string, string>();
  const add = (s: string) => {
    const v = s.trim().replace(/\s+/g, ' ');
    if (v.length < 3 || v.length > 60 || GENERIC_ANNOUNCE_RE.test(norm(v)) || ALL_SPECIALTIES_RE.test(norm(v))) return;
    const k = norm(v);
    if (!set.has(k)) set.set(k, v.charAt(0).toUpperCase() + v.slice(1));
  };
  CONCEPTS.forEach((c) => add(c.label));
  for (const c of contests) {
    for (const s of c.specialtiesList || []) splitSpecialties(s).forEach(add);
    for (const p of c.posts || []) if (p.specialty) splitSpecialties(p.specialty).forEach(add);
  }
  return [...set.values()].sort((a, b) => a.localeCompare(b, 'fr'));
}
