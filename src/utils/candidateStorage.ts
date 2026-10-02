import { CandidateProfile, CandidateTrackingItem, ApplicationStatus, Contest, Language } from '../types';

export type { CandidateProfile, CandidateTrackingItem, ApplicationStatus };

export const DEFAULT_PROFILE: CandidateProfile = {
  // Profil vide par défaut : aucune éligibilité n'est affirmée tant que le
  // candidat n'a pas renseigné SON diplôme, SA spécialité et SON âge.
  fullName: '',
  email: '',
  phone: '',
  age: 0,
  degreeLevel: '',
  specialty: '',
  region: '',
  currentSituation: 'student',
  notificationsEnabled: true,
  alertDaysBefore: 7,
};

export const DEFAULT_CHECKLIST = {
  cinCertified: true,
  diplomaCertified: true,
  policeRecord: false,
  cvUpdated: true,
  motivationLetter: false,
  officialForm: false,
};

const STORAGE_KEYS = {
  PROFILE: 'kounkour_candidate_profile_v1',
  TRACKING: 'kounkour_candidate_tracking_v1',
  BOOKMARKS: 'kounkour_bookmarks',
  QCM_SCORES: 'kounkour_qcm_scores',
};

// Profile storage
export function loadCandidateProfile(): CandidateProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading candidate profile from localStorage', e);
    return DEFAULT_PROFILE;
  }
}

export function saveCandidateProfile(profile: CandidateProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving candidate profile to localStorage', e);
  }
}

// Tracking items (pipeline status, checklist, notes)
export function loadCandidateTracking(): Record<string, CandidateTrackingItem> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRACKING);
    if (!raw) {
      // Seed initial sample tracking for the default bookmarked item
      const initial: Record<string, CandidateTrackingItem> = {
        'c-interieur-tech-2026': {
          contestId: 'c-interieur-tech-2026',
          status: 'preparing_dossier',
          checklist: {
            cinCertified: true,
            diplomaCertified: true,
            policeRecord: false,
            cvUpdated: true,
            motivationLetter: true,
            officialForm: false,
          },
          savedAt: '2026-09-20',
          notes: 'Légaliser la copie du diplôme à la commune avant vendredi.',
        },
      };
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading tracking from localStorage', e);
    return {};
  }
}

export function saveCandidateTracking(tracking: Record<string, CandidateTrackingItem>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRACKING, JSON.stringify(tracking));
  } catch (e) {
    console.error('Error saving tracking to localStorage', e);
  }
}

export function updateContestTracking(
  contestId: string,
  partial: Partial<CandidateTrackingItem>
): Record<string, CandidateTrackingItem> {
  const current = loadCandidateTracking();
  const existing = current[contestId] || {
    contestId,
    status: 'interested',
    checklist: { ...DEFAULT_CHECKLIST },
    savedAt: new Date().toISOString().split('T')[0],
  };

  const updated: CandidateTrackingItem = {
    ...existing,
    ...partial,
    checklist: partial.checklist ? { ...existing.checklist, ...partial.checklist } : existing.checklist,
  };

  const next = { ...current, [contestId]: updated };
  saveCandidateTracking(next);
  return next;
}

// Eligibility and Smart Matching Engine
// Verdict d'éligibilité. SEUL « eligible » est compté comme éligible : on ne
// l'affirme que si diplôme, spécialité, âge ET statut ouvert sont confirmés.
// « verify » = une information manque (profil incomplet ou annonce qui ne précise
// pas la spécialité / le diplôme) → affiché « à vérifier », jamais « éligible ».
// « not_eligible » = disqualification certaine (clôturé, diplôme insuffisant,
// spécialité précise différente).
export type EligibilityVerdict = 'eligible' | 'verify' | 'not_eligible';

export interface EligibilityResult {
  verdict: EligibilityVerdict;
  isEligible: boolean; // === (verdict === 'eligible')
  isHighMatch: boolean;
  score: number; // 0 to 100%
  degreeMatch: boolean;
  ageMatch: boolean;
  specialtyMatch: boolean;
  specialtyStatus: 'match' | 'unknown' | 'different';
  regionMatch: boolean;
  reasons: { fr: string; ar: string }[];
}

const stripAccents = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

// Rang d'un niveau de diplôme (exigé ou détenu). null = indéterminable.
// « Master / Doctorat » = minimum Master (4).
// Niveau d'études exprimé en ANNÉES APRÈS LE BAC : Bac = 0, Bac+2, Licence = 3,
// Master / Ingénieur d'État = 5, Doctorat = 8. CQP (sans bac) = -1.
// Renvoie TOUS les niveaux cités : « Master / Doctorat » → [5, 8] (ambigu).
export function degreeYearsIn(text: string | undefined | null): number[] {
  const t = stripAccents(text || '').replace(/\s+/g, '');
  if (!t) return [];
  const found = new Set<number>();
  if (/doctorat|docteur/.test(t)) found.add(8);
  if (/master|bac\+5|ingenieur/.test(t)) found.add(5);
  if (/licence|bac\+3/.test(t)) found.add(3);
  if (/bac\+2|dts|dut|bts|deug|technicienspecialise/.test(t)) found.add(2);
  if (/baccalaureat|bac(?!\+)/.test(t)) found.add(0);
  if (/cqp/.test(t)) found.add(-1);
  return [...found].sort((x, y) => x - y);
}

// Compatibilité : niveau unique (null si absent ou ambigu).
export function degreeRankOf(text: string | undefined | null): number | null {
  const y = degreeYearsIn(text);
  return y.length === 1 ? y[0] : null;
}

const YEARS_LABEL: Record<number, string> = { [-1]: 'CQP', 0: 'Bac', 2: 'Bac+2', 3: 'Bac+3 (Licence)', 5: 'Bac+5 (Master / Ingénieur)', 8: 'Doctorat' };

// Mots trop génériques pour distinguer une spécialité.
const SPEC_STOP = new Set([
  'genie', 'sciences', 'science', 'technique', 'techniques', 'technicien', 'techniciens',
  'technico', 'specialite', 'specialites', 'specialise', 'specialisee', 'option', 'options',
  'etat', 'grade', 'echelle', 'niveau', 'poste', 'postes', 'concours', 'recrutement',
  'generale', 'general', 'mentionnee', 'mentionnees', 'arrete', 'annonce', 'officiel',
  'officielle', 'officielles', 'dans', 'pour', 'avec', 'aux', 'sur', 'par', 'des', 'les',
  'une', 'ingenieur', 'ingenieurs', 'ingenierie', 'administrateur', 'systemes', 'systeme',
  'appliquee', 'appliquees', 'applique', 'appliques', 'autre', 'autres', 'filiere', 'filieres',
]);

// Familles de mots équivalents (agricole ≈ agriculture ≈ agronomie, etc.).
function stemToken(t: string): string {
  if (/^(agric|agro)/.test(t)) return 'agri';
  if (/^(medec|medic)/.test(t)) return 'medic';
  if (/^(juridi|droit)/.test(t)) return 'droit';
  if (/^(informati|numeri)/.test(t)) return 'inform';
  if (/^electr/.test(t)) return 'electr';
  if (/^infirm/.test(t)) return 'infirm';
  return t.length >= 7 ? t.slice(0, 6) : t;
}

// Découpe une liste de spécialités : « A - B, C ; D & E (F) ».
export function splitSpecialties(text: string): string[] {
  return (text || '')
    .split(/\s[-–]\s|[,;|&()]|\n/)
    .map((x) => x.replace(/^[\s\-–]+|[\s\-–]+$/g, ''))
    .filter((x) => x.length > 1);
}

export function specialtyTokens(s: string | undefined | null): string[] {
  return stripAccents(s || '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !SPEC_STOP.has(t))
    .map(stemToken);
}

function isGenericSpecialty(s: string | undefined | null): boolean {
  const t = stripAccents(s || '');
  return (
    !t.trim() ||
    t.includes('mentionn') ||
    t.includes('arrete') ||
    t.includes('annonce') ||
    t.includes('non specifi') ||
    t.includes('non precis')
  );
}

export function checkEligibility(contest: Contest, profile: CandidateProfile): EligibilityResult {
  const reasons: { fr: string; ar: string }[] = [];
  const add = (fr: string, ar: string) => reasons.push({ fr, ar });
  let hardNo = false;
  let needVerify = false;

  // 0. Statut : on ne peut plus postuler à un concours clôturé / en épreuves.
  const closed =
    contest.status === 'closed' || contest.status === 'results' || contest.status === 'in_progress';
  if (closed) {
    hardNo = true;
    add('Candidatures closes : la date limite de dépôt est dépassée.', 'انتهى أجل إيداع الترشيحات لهذه المباراة.');
  }

  // 1. Diplôme — règle KounKour : le profil correspond UNIQUEMENT si le diplôme
  //    a EXACTEMENT le même nombre d'années après le bac que celui exigé.
  //    Plus bas OU plus haut → non éligible. Annonce muette ou ambiguë → à vérifier.
  const requiredYears = degreeYearsIn(contest.degreeLevel);
  const mineYears = degreeYearsIn(profile.degreeLevel);
  let degreeMatch = false;
  if (mineYears.length !== 1) {
    needVerify = true;
    add('Renseignez votre niveau de diplôme dans votre profil.', 'يرجى تحديد مستواك الدراسي في ملفك.');
  } else if (requiredYears.length === 0) {
    needVerify = true;
    add(
      `Niveau de diplôme exigé non précisé par l'annonce : à vérifier sur l'arrêté officiel.`,
      'المستوى الدراسي المطلوب غير محدد في الإعلان: يرجى التحقق من القرار الرسمي.'
    );
  } else if (requiredYears.length > 1 && !requiredYears.includes(mineYears[0])) {
    hardNo = true;
    add(
      `Diplôme différent : ce concours exige ${requiredYears.map((y) => YEARS_LABEL[y]).join(' ou ')}, votre diplôme est ${YEARS_LABEL[mineYears[0]]}.`,
      `دبلوم غير مطابق: هذه المباراة تشترط ${requiredYears.map((y) => YEARS_LABEL[y]).join(' أو ')}، ودبلومك ${YEARS_LABEL[mineYears[0]]}.`
    );
  } else if (requiredYears.length > 1) {
    needVerify = true;
    add(
      `Niveau exigé ambigu dans l'annonce (« ${contest.degreeLevel} ») : vérifiez sur l'arrêté officiel le diplôme exact demandé.`,
      `المستوى المطلوب غير دقيق في الإعلان (« ${contest.degreeLevel} »): يرجى التحقق من الدبلوم المطلوب في القرار الرسمي.`
    );
  } else if (mineYears[0] !== requiredYears[0]) {
    hardNo = true;
    add(
      `Diplôme différent : ce concours exige ${YEARS_LABEL[requiredYears[0]]}, votre diplôme est ${YEARS_LABEL[mineYears[0]]}.`,
      `دبلوم غير مطابق: هذه المباراة تشترط ${YEARS_LABEL[requiredYears[0]]}، ودبلومك ${YEARS_LABEL[mineYears[0]]}.`
    );
  } else {
    degreeMatch = true;
  }

  // 2. Spécialité — comparée UNIQUEMENT au champ spécialité de l'annonce (pas au
  //    titre, qui contient « Ingénieur », « Administrateur »… et créait des faux positifs).
  let specialtyMatch = false;
  let specialtyStatus: 'match' | 'unknown' | 'different' = 'unknown';
  const profileSpec = (profile.specialty || '').trim();
  const contestSpec = contest.specialty?.fr || '';
  const profileTokens = specialtyTokens(profileSpec);
  const contestTokens = specialtyTokens([contestSpec, ...(contest.specialtiesList || [])].join(' '));
  if (!profileSpec) {
    needVerify = true;
    add('Renseignez votre spécialité dans votre profil.', 'يرجى تحديد تخصصك في ملفك.');
  } else if (profileTokens.length === 0) {
    needVerify = true;
    add(
      'Saisissez votre spécialité en français pour permettre la comparaison avec les annonces.',
      'يرجى كتابة تخصصك بالفرنسية لتمكين المقارنة مع الإعلانات.'
    );
  } else if (contestTokens.length === 0 && /[\u0600-\u06FF]/.test(contestSpec) && !isGenericSpecialty(contestSpec)) {
    needVerify = true;
    add(
      `Spécialité indiquée en arabe (« ${contestSpec} ») : comparaison automatique impossible, vérifiez qu'elle correspond à votre diplôme.`,
      `التخصص مكتوب بالعربية (« ${contestSpec} »): تعذّرت المقارنة الآلية، تحقق من مطابقته لدبلومك.`
    );
  } else if (isGenericSpecialty(contestSpec) || contestTokens.length === 0) {
    needVerify = true;
    add(
      `L'annonce ne précise pas la spécialité exigée (« Spécialités mentionnées dans l'arrêté ») : impossible de confirmer. Consultez l'arrêté officiel.`,
      'الإعلان لا يحدد التخصص المطلوب: لا يمكن التأكيد. يرجى الاطلاع على القرار الرسمي.'
    );
  } else {
    // Comparaison spécialité PAR spécialité de l'annonce (liste « A - B, C »).
    //  - mêmes mots-clés qu'une spécialité exigée → correspond ;
    //  - mots-clés seulement en partie communs (« Gestion » vs « Gestion des sols »)
    //    → à vérifier ; aucun mot commun → non éligible.
    const items = [...(contest.specialtiesList || []), ...splitSpecialties(contestSpec)]
      .map((it) => ({ label: it.trim(), tokens: [...new Set(specialtyTokens(it))] }))
      .filter((it) => it.tokens.length > 0);
    const mine = new Set(profileTokens);
    const same = items.find((it) => it.tokens.length === mine.size && it.tokens.every((t) => mine.has(t)));
    const close = items.find((it) => it.tokens.some((t) => mine.has(t)));
    if (same) {
      specialtyMatch = true;
      specialtyStatus = 'match';
    } else if (close) {
      needVerify = true;
      add(
        `Spécialité proche mais pas identique : l'annonce demande « ${close.label} », votre spécialité est « ${profileSpec} ». Vérifiez sur l'arrêté que votre diplôme est accepté.`,
        `تخصص قريب وليس مطابقاً: الإعلان يطلب « ${close.label} » وتخصصك « ${profileSpec} ». تحقق من القرار الرسمي.`
      );
    } else {
      specialtyStatus = 'different';
      hardNo = true;
      add(
        `Spécialité exigée : ${contestSpec}. Votre spécialité (${profileSpec}) ne correspond pas.`,
        `التخصص المطلوب: ${contest.specialty?.ar || contestSpec}. تخصصك (${profileSpec}) غير مطابق.`
      );
    }
  }

  // 3. Âge — limite générale de la fonction publique : 18 à 45 ans.
  let ageMatch = false;
  const age = Number(profile.age) || 0;
  if (age <= 0) {
    needVerify = true;
    add('Renseignez votre âge dans votre profil.', 'يرجى تحديد سنك في ملفك.');
  } else if (age < 18) {
    hardNo = true;
    add('Âge minimum requis : 18 ans.', 'السن الأدنى المطلوب: 18 سنة.');
  } else if (age > 45) {
    needVerify = true;
    add(
      `Âge supérieur à la limite générale de 45 ans : vérifiez l'arrêté (dérogations possibles).`,
      'السن يتجاوز الحد العام (45 سنة): يرجى التحقق من القرار (استثناءات ممكنة).'
    );
  } else {
    ageMatch = true;
  }

  // 4. Région (information, non éliminatoire)
  const profileRegion = stripAccents(profile.region || '');
  const contestRegion = stripAccents(contest.region?.fr || '');
  const regionMatch =
    !contestRegion ||
    contestRegion.includes('national') ||
    contestRegion.includes('royaume') ||
    (!!profileRegion && (contestRegion.includes(profileRegion) || profileRegion.includes(contestRegion)));

  const verdict: EligibilityVerdict = hardNo ? 'not_eligible' : needVerify ? 'verify' : 'eligible';
  if (verdict === 'eligible') {
    add(
      `Éligible : diplôme (${contest.degreeLevel}), spécialité (${contestSpec}) et âge conformes.`,
      `مؤهل: الدبلوم (${contest.degreeLevel}) والتخصص والسن مطابقة للشروط.`
    );
  }

  const score =
    (degreeMatch ? 35 : 0) + (specialtyMatch ? 45 : 0) + (ageMatch ? 10 : 0) + (!closed ? 10 : 0);

  return {
    verdict,
    isEligible: verdict === 'eligible',
    isHighMatch: verdict === 'eligible' && regionMatch,
    score,
    degreeMatch,
    ageMatch,
    specialtyMatch,
    specialtyStatus,
    regionMatch,
    reasons,
  };
}

// Export / Import / Backup
export function exportAllBrowserData(): string {
  const data = {
    exportDate: new Date().toISOString(),
    profile: loadCandidateProfile(),
    tracking: loadCandidateTracking(),
    bookmarks: JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS) || '[]'),
    qcmScores: JSON.parse(localStorage.getItem(STORAGE_KEYS.QCM_SCORES) || '[]'),
  };
  return JSON.stringify(data, null, 2);
}

export function importBrowserData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.profile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.profile));
    if (data.tracking) localStorage.setItem(STORAGE_KEYS.TRACKING, JSON.stringify(data.tracking));
    if (data.bookmarks) localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(data.bookmarks));
    if (data.qcmScores) localStorage.setItem(STORAGE_KEYS.QCM_SCORES, JSON.stringify(data.qcmScores));
    return true;
  } catch (e) {
    console.error('Import failed', e);
    return false;
  }
}

export function clearAllBrowserData(): void {
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
  localStorage.removeItem(STORAGE_KEYS.TRACKING);
  localStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
  localStorage.removeItem(STORAGE_KEYS.QCM_SCORES);
}
