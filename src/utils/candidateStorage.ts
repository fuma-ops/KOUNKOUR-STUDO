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
  specialties: [],
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

// Moteur Smart Match : voir smartMatch.ts (source unique des règles).
export { checkEligibility, degreeYearsIn, degreeRankOf, splitSpecialties, specialtyTokens } from './smartMatch';
export type { EligibilityResult, EligibilityVerdict } from './smartMatch';

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
