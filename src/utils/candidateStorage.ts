import { CandidateProfile, CandidateTrackingItem, ApplicationStatus, Contest, Language } from '../types';

export type { CandidateProfile, CandidateTrackingItem, ApplicationStatus };

export const DEFAULT_PROFILE: CandidateProfile = {
  fullName: 'Fatima-Zahra El Mansouri',
  email: 'fz.elmansouri@etudiant.um5.ac.ma',
  phone: '0661234567',
  age: 24,
  degreeLevel: 'Licence',
  specialty: 'Droit',
  region: 'Rabat-Salé-Kénitra',
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
export interface EligibilityResult {
  isEligible: boolean;
  isHighMatch: boolean;
  score: number; // 0 to 100%
  degreeMatch: boolean;
  ageMatch: boolean;
  specialtyMatch: boolean;
  regionMatch: boolean;
  reasons: { fr: string; ar: string }[];
}

export function checkEligibility(contest: Contest, profile: CandidateProfile): EligibilityResult {
  const reasons: { fr: string; ar: string }[] = [];
  let degreeMatch = true;
  let ageMatch = true;
  let specialtyMatch = false;
  let regionMatch = true;
  let score = 0;

  // 1. Age condition
  // Most civil service in Morocco is max 45 years, education/AREF is 30 years
  let maxAge = 45;
  if (contest.id.includes('education') || contest.administration.id === 'adm-education') {
    maxAge = 30;
  } else if (contest.id.includes('oncf') || contest.id.includes('tech')) {
    maxAge = 40;
  }

  if (profile.age > maxAge) {
    ageMatch = false;
    reasons.push({
      fr: `Âge supérieur à la limite légale pour ce concours (max ${maxAge} ans).`,
      ar: `السن يتجاوز الحد الأقصى المسموح به قانوناً لهذه المباراة (أقصى حد ${maxAge} سنة).`,
    });
  } else {
    score += 15;
  }

  // 2. Degree condition
  // Degree hierarchy: Bac (1) < Bac+2 (2) < Licence (3) < Master / Ingénieur (4) < Doctorat (5)
  const degreeRank: Record<string, number> = {
    'Bac': 1,
    'Bac+2': 2,
    'Technicien': 2,
    'Technicien Spécialisé': 2,
    'DUT': 2,
    'BTS': 2,
    'Licence': 3,
    'Licence Professionnelle': 3,
    'Master': 4,
    'Master / Doctorat': 4,
    'Ingénieur': 4,
    'Ingénieur d’État': 4,
    'Doctorat': 5,
    'Médecin': 5,
  };

  // 0 = niveau inconnu → on n'exclut JAMAIS sur un diplôme non déterminé (ne jamais rater).
  const contestDegreeRank = degreeRank[contest.degreeLevel] ||
    (contest.title.fr.toLowerCase().includes('ingénieur') || contest.degreeLevel.toLowerCase().includes('master') ? 4 : 0);
  const profileDegreeRank = degreeRank[profile.degreeLevel] || 3;

  if (contestDegreeRank > 0 && profileDegreeRank < contestDegreeRank) {
    degreeMatch = false;
    reasons.push({
      fr: `Diplôme minimum requis : ${contest.degreeLevel} (Votre profil : ${profile.degreeLevel}).`,
      ar: `المستوى الدراسي الأدنى المطلوب: ${contest.degreeLevel} (ملفك: ${profile.degreeLevel}).`,
    });
  } else {
    score += 40;
  }

  // 3. Specialty matching — par mots-clés DISTINCTIFS (généralisable à toute
  //    spécialité, pas seulement une liste codée en dur).
  //    3 états : 'match' (correspond) / 'unknown' (concours "toutes spécialités"
  //    ou profil vide → à vérifier, on ne rate pas) / 'different' (spécialité
  //    précise clairement différente → on n'affiche pas comme adapté).
  const strip = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  // Mots trop génériques pour distinguer une spécialité.
  const STOP = new Set([
    'genie', 'sciences', 'science', 'technique', 'techniques', 'specialite',
    'specialites', 'option', 'etat', 'grade', 'echelle', 'niveau', 'poste',
    'concours', 'recrutement', 'appliquee', 'appliquees', 'generale', 'mentionnee',
    'mentionnees', 'arrete', 'annonce', 'officiel', 'officielle', 'officielles',
    'dans', 'pour', 'avec', 'des', 'les', 'une', 'aux', 'sur', 'par',
  ]);
  const toks = (s: string) =>
    strip(s)
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 4 && !STOP.has(t));

  const profileSpecRaw = profile.specialty || '';
  const contestSpecRaw = contest.specialty?.fr || '';
  const contestSpecStrip = strip(contestSpecRaw);

  // Concours "toutes spécialités" / non précisées → inconnu (à vérifier).
  const genericSpecialty =
    !contestSpecStrip ||
    contestSpecStrip.includes('mentionn') ||
    contestSpecStrip.includes('arrete') ||
    contestSpecStrip.includes('annonce') ||
    contestSpecStrip.includes('non specifie');

  let specialtyStatus: 'match' | 'unknown' | 'different';
  if (!profileSpecRaw.trim() || genericSpecialty) {
    specialtyStatus = 'unknown';
  } else {
    const pt = toks(profileSpecRaw);
    const haystack = toks(
      `${contestSpecRaw} ${(contest.specialtiesList || []).join(' ')} ${contest.title?.fr || ''}`
    );
    const shared = pt.some((t) => haystack.includes(t));
    specialtyStatus = shared ? 'match' : 'different';
  }

  if (specialtyStatus === 'match') {
    specialtyMatch = true;
    score += 40;
  } else if (specialtyStatus === 'unknown') {
    specialtyMatch = true; // à vérifier : on ne rate pas
    score += 15;
    reasons.push({
      fr: `Spécialité à vérifier sur l'arrêté officiel (le concours ne précise pas de filière unique).`,
      ar: `يُنصح بالتحقق من التخصص في القرار الرسمي (المباراة لا تحدد شعبة وحيدة).`,
    });
  } else {
    specialtyMatch = false;
    reasons.push({
      fr: `Spécialité officielle requise : ${contest.specialty.fr} (Votre spécialité : ${profile.specialty}).`,
      ar: `التخصص الرسمي المطلوب: ${contest.specialty.ar} (تخصصك: ${profile.specialty}).`,
    });
  }

  // 4. Regional matching
  const profileRegion = (profile.region || '').toLowerCase();
  const contestRegion = (contest.region?.fr || '').toLowerCase();
  if (contestRegion.includes('national') || contestRegion.includes('toutes') || contestRegion.includes(profileRegion) || profileRegion.includes(contestRegion)) {
    regionMatch = true;
    score += 5;
  } else {
    regionMatch = false;
  }

  // Rigueur (cahier §14) : on exclut uniquement les cas CERTAINS de non-éligibilité
  //  - diplôme connu et clairement insuffisant ;
  //  - spécialité précise clairement DIFFÉRENTE de celle du candidat.
  // On ne rate jamais un concours "toutes spécialités" ou incertain (→ à vérifier).
  // L'âge n'est jamais éliminatoire ici (seulement signalé).
  const isEligible = degreeMatch && specialtyStatus !== 'different';
  const isHighMatch = isEligible && ageMatch && specialtyStatus === 'match' && score >= 80;

  if (isEligible) {
    reasons.push({
      fr: `Votre profil correspond aux critères : diplôme (${contest.degreeLevel}), spécialité (${contest.specialty.fr}) et âge.`,
      ar: `ملفك يستوفي الشروط الرسمية: الدبلوم (${contest.degreeLevel})، التخصص (${contest.specialty.ar}) والسن.`,
    });
  } else if (!specialtyMatch && degreeMatch && ageMatch) {
    reasons.push({
      fr: `Diplôme et âge valides, mais la spécialité officielle exigée est "${contest.specialty.fr}".`,
      ar: `المستوى والسن مستوفيان، لكن التخصص الرسمي المطلوب للمباراة هو "${contest.specialty.ar}".`,
    });
  }

  return {
    isEligible,
    isHighMatch,
    score: Math.min(score, 100),
    degreeMatch,
    ageMatch,
    specialtyMatch,
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
