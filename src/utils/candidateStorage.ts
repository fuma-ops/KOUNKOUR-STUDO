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
export function degreeRankOf(text: string | undefined | null): number | null {
  const t = stripAccents(text || '').replace(/\s+/g, '');
  if (!t) return null;
  if (t.includes('master') || t.includes('bac+5') || t.includes('ingenieur')) return 4;
  if (t.includes('doctorat') || t.includes('docteur')) return 5;
  if (t.includes('licence') || t.includes('bac+3')) return 3;
  if (t.includes('bac+2') || t.includes('dts') || t.includes('dut') || t.includes('bts') || t.includes('technicienspecialise')) return 2;
  if (t.includes('bac') || t.includes('cqp')) return 1;
  return null;
}

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

  // 1. Diplôme
  const required = degreeRankOf(contest.degreeLevel);
  const mine = degreeRankOf(profile.degreeLevel);
  let degreeMatch = false;
  if (mine === null) {
    needVerify = true;
    add('Renseignez votre niveau de diplôme dans votre profil.', 'يرجى تحديد مستواك الدراسي في ملفك.');
  } else if (required === null) {
    needVerify = true;
    add(
      `Niveau de diplôme exigé non précisé par l'annonce : à vérifier sur l'arrêté officiel.`,
      'المستوى الدراسي المطلوب غير محدد في الإعلان: يرجى التحقق من القرار الرسمي.'
    );
  } else if (mine < required) {
    hardNo = true;
    add(
      `Diplôme insuffisant : ${contest.degreeLevel} requis (votre niveau : ${profile.degreeLevel}).`,
      `المستوى الدراسي غير كافٍ: المطلوب ${contest.degreeLevel} (مستواك: ${profile.degreeLevel}).`
    );
  } else if (required <= 2 && mine > required) {
    hardNo = true;
    add(
      `Surqualification statutaire : ce concours est réservé au grade de Technicien / Bac (${contest.degreeLevel}). Un diplôme de ${profile.degreeLevel} n'est pas recevable pour ce grade selon la réglementation de la fonction publique.`,
      `عدم تطابق نظامي: هذه المباراة مخصصة لدرجة تقني / بكالوريا (${contest.degreeLevel}). شهادة ${profile.degreeLevel} غير مقبولة للترشح لهذه الدرجة وفقاً للنظام الأساسي للوظيفة العمومية.`
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
  } else if (isGenericSpecialty(contestSpec) || contestTokens.length === 0) {
    needVerify = true;
    add(
      `L'annonce ne précise pas la spécialité exigée (« Spécialités mentionnées dans l'arrêté ») : impossible de confirmer. Consultez l'arrêté officiel.`,
      'الإعلان لا يحدد التخصص المطلوب: لا يمكن التأكيد. يرجى الاطلاع على القرار الرسمي.'
    );
  } else if (profileTokens.some((t) => contestTokens.includes(t))) {
    specialtyMatch = true;
    specialtyStatus = 'match';
  } else {
    specialtyStatus = 'different';
    hardNo = true;
    add(
      `Spécialité exigée : ${contestSpec}. Votre spécialité (${profileSpec}) ne correspond pas.`,
      `التخصص المطلوب: ${contest.specialty?.ar || contestSpec}. تخصصك (${profileSpec}) غير مطابق.`
    );
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
