// Moteur des tests psychotechniques KounKour : questions générées en code (JSON-first),
// dessinées en SVG / CSS (aucune image). Partagé par l'application et le rendu serveur
// (api/_lib/seo.ts) : imports avec extension .ts.

export type PsyCategory = 'matrices' | 'dominos' | 'cubes' | 'mecanique' | 'attention' | 'suites';
export type PsyLevel = 'facile' | 'moyen' | 'difficile';

export interface PsyOption<V = unknown> {
  id: string;
  value: V;
}

export interface PsyQuestion<D = any, V = any> {
  id: string;
  category: PsyCategory;
  time_limit: number; // secondes
  difficulty: PsyLevel;
  prompt: string;
  question_data: D;
  options: PsyOption<V>[];
  correct_option_id: string;
  explanation: string;
}

export const LEVELS: PsyLevel[] = ['facile', 'moyen', 'difficile'];

// ─── Hasard reproductible (mulberry32) : une graine = une question, identique serveur / client ───
export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(a: readonly T[]): T;
  shuffle<T>(a: readonly T[]): T[];
}
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
export function rng(seed: number | string): Rng {
  let t = typeof seed === 'string' ? hashSeed(seed) : seed >>> 0;
  const next = () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  const r: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (a) => a[Math.floor(next() * a.length)],
    shuffle: (a) => {
      const c = [...a];
      for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [c[i], c[j]] = [c[j], c[i]];
      }
      return c;
    },
  };
  return r;
}

// Réponses : la bonne + des pièges distincts, mélangés, identifiants a, b, c…
export function buildOptions<V>(r: Rng, correct: V, distractors: V[], n: number): { options: PsyOption<V>[]; correct: string } {
  const key = (v: V) => JSON.stringify(v);
  const seen = new Set([key(correct)]);
  const pool: V[] = [];
  for (const d of distractors) {
    const k = key(d);
    if (!seen.has(k)) {
      seen.add(k);
      pool.push(d);
    }
    if (pool.length === n - 1) break;
  }
  const all = r.shuffle([correct, ...pool]);
  const ids = 'abcdef';
  const options = all.map((value, i) => ({ id: ids[i], value }));
  return { options, correct: ids[all.findIndex((v) => key(v) === key(correct))] };
}

export const optionCount = (l: PsyLevel) => (l === 'difficile' ? 5 : 4);
