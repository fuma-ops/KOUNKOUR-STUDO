import type { CandidateProfile, Contest } from '../types';
import { checkEligibility, isProfileReady, type EligibilityResult } from './smartMatch';

// Flux « Pour vous » : concours OUVERTS qui correspondent au profil, ou à vérifier.
// Objectif : qu'aucun candidat ne rate un concours fait pour lui.

export interface MatchItem {
  contest: Contest;
  elig: EligibilityResult;
  isNew: boolean;
}

export interface MatchFeed {
  ready: boolean;
  eligible: MatchItem[];
  verify: MatchItem[];
  excluded: MatchItem[];
  closingSoon: number; // correspondants ou à vérifier, clôture dans 7 jours ou moins
  newCount: number;
}

const SEEN_KEY = 'kounkour_match_seen_v1';

function loadSeen(): Set<string> | null {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

/** Marque comme « vus » les concours actuellement proposés (appelé à l'ouverture de « Pour vous »). */
export function markMatchesSeen(ids: string[]): void {
  try {
    const seen = loadSeen() || new Set<string>();
    ids.forEach((id) => seen.add(id));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-2000)));
  } catch {
    /* stockage indisponible : les nouveautés ne sont simplement pas suivies */
  }
}

const isOpen = (c: Contest) => c.status === 'open' || c.status === 'closing_soon' || c.status === 'upcoming';

export function buildMatchFeed(contests: Contest[], profile: CandidateProfile): MatchFeed {
  const ready = isProfileReady(profile);
  const seen = loadSeen();
  const items: MatchItem[] = contests.filter(isOpen).map((contest) => ({
    contest,
    elig: checkEligibility(contest, profile),
    // Première visite : rien n'est « nouveau » (sinon tout le serait).
    isNew: !!seen && !seen.has(contest.id),
  }));
  const byUrgency = (a: MatchItem, b: MatchItem) =>
    Number(b.isNew) - Number(a.isNew) || (a.contest.daysRemaining || 999) - (b.contest.daysRemaining || 999);
  const eligible = ready ? items.filter((i) => i.elig.verdict === 'eligible').sort(byUrgency) : [];
  const verify = ready
    ? items
        .filter((i) => i.elig.verdict === 'verify')
        .sort((a, b) => b.elig.score - a.elig.score || byUrgency(a, b))
    : [];
  const excluded = ready ? items.filter((i) => i.elig.verdict === 'not_eligible') : [];
  const shown = [...eligible, ...verify];
  // Point de départ : à la première utilisation, les concours actuels servent de
  // référence ; seuls ceux publiés ensuite seront signalés « nouveau ».
  if (ready && seen === null) markMatchesSeen(items.map((i) => i.contest.id));
  return {
    ready,
    eligible,
    verify,
    excluded,
    closingSoon: shown.filter((i) => i.contest.daysRemaining > 0 && i.contest.daysRemaining <= 7).length,
    newCount: shown.filter((i) => i.isNew).length,
  };
}

/** « Dernier jour » le jour de la date limite, sinon « J-n » (n = jours restants après aujourd'hui). */
export function deadlineBadge(daysRemaining: number, lang: 'fr' | 'ar'): string {
  if (daysRemaining <= 1) return lang === 'fr' ? 'Dernier jour' : 'آخر يوم';
  const n = daysRemaining - 1;
  return lang === 'fr' ? `J-${n}` : `${n} ${n === 1 ? 'يوم' : 'أيام'}`;
}
