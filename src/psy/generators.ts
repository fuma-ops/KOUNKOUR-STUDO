// Générateurs des 6 familles de questions. Chaque générateur reçoit une graine et un niveau
// et renvoie une question complète (données, réponses, bonne réponse, explication).
import { buildOptions, optionCount, rng, type PsyCategory, type PsyLevel, type PsyQuestion, type Rng } from './core.ts';

// ═══════════════════════════ 1. Matrices (style Raven) ═══════════════════════════
export type Shape = 'circle' | 'square' | 'triangle' | 'diamond';
export type Fill = 'empty' | 'hatched' | 'solid';
export interface MatrixCell { shape: Shape; count: number; fill: Fill }
type Rule = 'ligne' | 'colonne' | 'latin' | 'latin-inverse' | 'fixe';

const SHAPES: Shape[] = ['circle', 'square', 'triangle', 'diamond'];
const FILLS: Fill[] = ['empty', 'hatched', 'solid'];
const FR_SHAPE: Record<Shape, [string, string]> = { circle: ['cercle', 'cercles'], square: ['carré', 'carrés'], triangle: ['triangle', 'triangles'], diamond: ['losange', 'losanges'] };
const FR_FILL: Record<Fill, string> = { empty: 'vide', hatched: 'hachuré', solid: 'plein' };
export const describeCell = (c: MatrixCell) => `${c.count} ${FR_SHAPE[c.shape][c.count > 1 ? 1 : 0]} ${FR_FILL[c.fill]}${c.count > 1 ? 's' : ''}`;

const idx = (rule: Rule, r: number, c: number) =>
  rule === 'ligne' ? r : rule === 'colonne' ? c : rule === 'latin' ? (r + c) % 3 : rule === 'latin-inverse' ? (c - r + 3) % 3 : 0;
const RULE_TEXT: Record<Rule, (what: string) => string> = {
  ligne: (w) => `${w} ne change pas le long d'une ligne, mais change d'une ligne à l'autre`,
  colonne: (w) => `${w} ne change pas le long d'une colonne, mais change d'une colonne à l'autre`,
  latin: (w) => `${w} change dans chaque ligne (chaque valeur une seule fois) et l'ordre se décale d'une case vers la gauche à chaque ligne`,
  'latin-inverse': (w) => `${w} change dans chaque ligne (chaque valeur une seule fois) et l'ordre se décale d'une case vers la droite à chaque ligne`,
  fixe: (w) => `${w} ne change pas`,
};

export function genMatrix(seed: number | string, level: PsyLevel): PsyQuestion {
  const r = rng(seed);
  const pool: Rule[] = level === 'facile' ? ['ligne', 'colonne'] : level === 'moyen' ? ['ligne', 'colonne', 'latin'] : ['latin', 'latin-inverse', 'colonne', 'ligne'];
  // Facile : un attribut fixe ; moyen et difficile : les trois varient.
  const attrs = r.shuffle(['shape', 'count', 'fill'] as const);
  const rules: Record<'shape' | 'count' | 'fill', Rule> = { shape: 'fixe', count: 'fixe', fill: 'fixe' };
  const used = r.shuffle(pool);
  attrs.forEach((a, i) => {
    if (level === 'facile' && i === 2) return;
    rules[a] = level === 'difficile' ? (i === 0 ? r.pick(['latin', 'latin-inverse'] as Rule[]) : used[i % used.length]) : used[i % used.length];
  });
  const shapes = r.shuffle(SHAPES).slice(0, 3);
  const counts = r.shuffle([1, 2, 3]);
  const fills = r.shuffle(FILLS);
  const cell = (row: number, col: number): MatrixCell => ({
    shape: shapes[idx(rules.shape, row, col)],
    count: counts[idx(rules.count, row, col)],
    fill: fills[idx(rules.fill, row, col)],
  });
  const grid = [0, 1, 2].map((row) => [0, 1, 2].map((col) => (row === 2 && col === 2 ? null : cell(row, col))));
  const answer = cell(2, 2);
  // Pièges : une seule propriété fausse à la fois (comme dans les vrais tests), puis deux.
  const d: MatrixCell[] = [];
  for (const s of shapes) d.push({ ...answer, shape: s });
  for (const c of [1, 2, 3]) d.push({ ...answer, count: c });
  for (const f of FILLS) d.push({ ...answer, fill: f });
  const single = r.shuffle(d.filter((x) => JSON.stringify(x) !== JSON.stringify(answer)));
  const double = r.shuffle(single.map((x) => ({ ...x, fill: x.fill === answer.fill ? r.pick(FILLS.filter((f) => f !== answer.fill)) : x.fill })));
  const { options, correct } = buildOptions(r, answer, [...single, ...double], optionCount(level));
  const names = { shape: 'la forme', count: 'le nombre de figures', fill: 'le remplissage' };
  const parts = (Object.keys(rules) as (keyof typeof rules)[]).map((k) => RULE_TEXT[rules[k]](names[k]));
  parts[0] = parts[0][0].toUpperCase() + parts[0].slice(1);
  return {
    id: `mat-${level}-${typeof seed === 'number' ? seed : seed}`,
    category: 'matrices',
    time_limit: level === 'facile' ? 60 : level === 'moyen' ? 75 : 90,
    difficulty: level,
    prompt: 'Quelle figure complète la matrice ?',
    question_data: { grid, rules },
    options,
    correct_option_id: correct,
    explanation: `${parts.join(' ; ')}. La case manquante contient donc ${describeCell(answer)}. Chaque mauvaise réponse ne respecte pas l'une de ces règles.`,
  };
}

// ═══════════════════════════ 2. Dominos ═══════════════════════════
export type DominoV = [number, number];
const m7 = (n: number) => ((n % 7) + 7) % 7;

export function genDomino(seed: number | string, level: PsyLevel): PsyQuestion {
  const r = rng(seed);
  const len = level === 'facile' ? 5 : 6;
  const steps = level === 'facile' ? [1, 2, -1] : level === 'moyen' ? [1, 2, 3, -1, -2] : [2, 3, -2, -3];
  const sTop = r.pick(steps);
  let sBot = r.pick(steps);
  if (sBot === sTop) sBot = -sTop;
  // Difficile : la partie haute alterne deux pas (+a, +b, +a, +b…).
  const alt = level === 'difficile' ? r.pick([1, 2, -1].filter((x) => x !== sTop)) : null;
  const t0 = r.int(0, 6);
  const b0 = r.int(0, 6);
  const seq: DominoV[] = [];
  let t = t0;
  let b = b0;
  for (let i = 0; i < len; i++) {
    seq.push([t, b]);
    t = m7(t + (alt !== null && i % 2 === 1 ? alt : sTop));
    b = m7(b + sBot);
  }
  const miss = level === 'facile' ? len - 1 : r.int(2, len - 1);
  const answer = seq[miss];
  const shown = seq.map((v, i) => (i === miss ? null : v));
  const [at, ab] = answer;
  const { options, correct } = buildOptions(
    r,
    answer,
    r.shuffle<DominoV>([[ab, at], [m7(at + 1), ab], [at, m7(ab + 1)], [m7(at - 1), m7(ab - 1)], [m7(at + sTop), ab], [at, m7(ab - sBot)]]),
    optionCount(level),
  );
  const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`);
  const topRule = alt !== null ? `on ajoute alternativement ${sign(sTop)} et ${sign(alt)}` : `on fait ${sign(sTop)} à chaque domino`;
  return {
    id: `dom-${level}-${seed}`,
    category: 'dominos',
    time_limit: level === 'facile' ? 45 : level === 'moyen' ? 60 : 75,
    difficulty: level,
    prompt: 'Quel domino remplace le point d’interrogation ?',
    question_data: { layout: 'ligne', sequence: shown, rule: { haut: alt !== null ? [sTop, alt] : sTop, bas: sBot } },
    options,
    correct_option_id: correct,
    explanation: `Partie haute : ${topRule}. Partie basse : ${sign(sBot)} à chaque domino. Un domino va de 0 à 6 : après 6 on repart à 0 (et avant 0 on revient à 6). Le domino manquant est donc ${at} en haut et ${ab} en bas.`,
  };
}

// ═══════════════════════════ 3. Cubes (patron → cube monté) ═══════════════════════════
// Symboles invariants par rotation de 90° : seule la position des faces compte.
export type Sym = 'disc' | 'ring' | 'plus' | 'cross' | 'square' | 'dots' | 'target' | 'diamond';
const SYMS: Sym[] = ['disc', 'ring', 'plus', 'cross', 'square', 'dots', 'target', 'diamond'];
type Face = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';
const NORMAL: Record<Face, [number, number, number]> = { R: [1, 0, 0], L: [-1, 0, 0], U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1] };
const OPP: Record<Face, Face> = { U: 'D', D: 'U', F: 'B', B: 'F', L: 'R', R: 'L' };
export interface CubeView { top: Sym; front: Sym; right: Sym }

// Les 24 orientations du cube : matrices de permutation signées de déterminant +1.
function orientations(): [Face, Face, Face][] {
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  const out: [Face, Face, Face][] = [];
  for (const p of perms)
    for (let s = 0; s < 8; s++) {
      const sg = [s & 1 ? -1 : 1, s & 2 ? -1 : 1, s & 4 ? -1 : 1];
      const M = [0, 1, 2].map((i) => [0, 1, 2].map((j) => (p[i] === j ? sg[i] : 0)));
      const det = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
      if (det !== 1) continue;
      const rot = (v: number[]) => M.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
      const at = (target: number[]) => (Object.keys(NORMAL) as Face[]).find((f) => rot(NORMAL[f]).every((x, k) => x === target[k]))!;
      out.push([at([0, 1, 0]), at([0, 0, 1]), at([1, 0, 0])]);
    }
  return out;
}
const ORIENT = orientations();

export function genCube(seed: number | string, level: PsyLevel): PsyQuestion {
  const r = rng(seed);
  const syms = r.shuffle(SYMS).slice(0, 6);
  const faces: Record<Face, Sym> = { U: syms[0], L: syms[1], F: syms[2], R: syms[3], B: syms[4], D: syms[5] };
  const valid = new Set(ORIENT.map((o) => o.join('')));
  const view = (o: Face[]): CubeView => ({ top: faces[o[0]], front: faces[o[1]], right: faces[o[2]] });
  const good = r.pick(ORIENT);
  // Pièges : faces opposées visibles ensemble (impossible) et images miroir (ordre inversé).
  // Facile : surtout des faces opposées (élimination directe) ; difficile : surtout des miroirs.
  const mirrors: Face[][] = [];
  const opposite: Face[][] = [];
  for (const o of r.shuffle(ORIENT)) {
    mirrors.push([o[0], o[2], o[1]]);
    opposite.push([o[0], o[1], OPP[o[0]]], [OPP[o[1]], o[1], o[2]]);
  }
  const traps = level === 'facile' ? [...opposite, ...mirrors] : level === 'moyen' ? r.shuffle([...opposite.slice(0, 6), ...mirrors.slice(0, 6)]).concat(opposite, mirrors) : [...mirrors, ...opposite];
  const bad = traps.filter((t) => !valid.has(t.join('')) && new Set(t.map((f) => faces[f])).size === 3);
  const { options, correct } = buildOptions(r, view(good), bad.map(view), optionCount(level));
  return {
    id: `cube-${level}-${seed}`,
    category: 'cubes',
    time_limit: level === 'facile' ? 60 : level === 'moyen' ? 75 : 90,
    difficulty: level,
    prompt: 'Quel cube peut être obtenu en pliant ce patron ?',
    question_data: { net: 'croix', faces },
    options,
    correct_option_id: correct,
    explanation:
      'Sur le patron en croix, deux faces séparées par une seule autre face sont opposées sur le cube : elles ne sont jamais visibles en même temps. ' +
      `Ici, les paires opposées sont : ${[['U', 'D'], ['F', 'B'], ['L', 'R']].map(([a, b]) => `${SYM_FR[faces[a as Face]]} / ${SYM_FR[faces[b as Face]]}`).join(', ')}. ` +
      'Parmi les cubes restants, il faut aussi vérifier l’ordre des trois faces autour du coin visible : un cube « en miroir » montre les bonnes faces dans le mauvais sens.',
  };
}
export const SYM_FR: Record<Sym, string> = { disc: 'disque', ring: 'anneau', plus: 'croix droite', cross: 'croix en X', square: 'carré', dots: 'quatre points', target: 'cible', diamond: 'losange' };

// ═══════════════════════════ 4. Logique mécanique (engrenages et poulies) ═══════════════════════════
export type Link = 'engrenage' | 'courroie' | 'courroie-croisee';
export interface Wheel { teeth: number }
export type Dir = 'horaire' | 'antihoraire';
export interface MecaAnswer { dir: Dir; rpm: number }

export function genMeca(seed: number | string, level: PsyLevel): PsyQuestion {
  const r = rng(seed);
  const n = level === 'facile' ? 3 : level === 'moyen' ? 4 : 5;
  const linkPool: Link[] = level === 'facile' ? ['engrenage'] : level === 'moyen' ? ['engrenage', 'engrenage', 'courroie'] : ['engrenage', 'courroie', 'courroie-croisee'];
  const teethPool = [10, 12, 15, 20, 24, 30, 40];
  for (let attempt = 0; attempt < 200; attempt++) {
    const wheels: Wheel[] = Array.from({ length: n }, () => ({ teeth: r.pick(teethPool) }));
    const links: Link[] = Array.from({ length: n - 1 }, () => r.pick(linkPool));
    if (level !== 'facile' && !links.some((l) => l !== 'engrenage')) links[r.int(0, n - 2)] = linkPool[linkPool.length - 1];
    const rpm0 = r.pick([30, 60, 120]);
    // Le rapport ne dépend que de la première et de la dernière roue (roues intermédiaires « folles »).
    const rpm = (rpm0 * wheels[0].teeth) / wheels[n - 1].teeth;
    if (!Number.isInteger(rpm) || wheels[0].teeth === wheels[n - 1].teeth) continue;
    const flips = links.filter((l) => l !== 'courroie').length;
    const dir: Dir = flips % 2 === 0 ? 'horaire' : 'antihoraire';
    const other: Dir = dir === 'horaire' ? 'antihoraire' : 'horaire';
    const wrongRpm = (rpm0 * wheels[n - 1].teeth) / wheels[0].teeth;
    const { options, correct } = buildOptions<MecaAnswer>(
      r,
      { dir, rpm },
      [{ dir: other, rpm }, { dir, rpm: wrongRpm }, { dir: other, rpm: wrongRpm }, { dir, rpm: rpm0 }, { dir: other, rpm: rpm0 }],
      optionCount(level),
    );
    const linkFr = (l: Link) => (l === 'engrenage' ? 'deux roues dentées en contact tournent en sens inverse' : l === 'courroie' ? 'une courroie droite garde le même sens' : 'une courroie croisée inverse le sens');
    const kinds = [...new Set(links)].map(linkFr).join(' ; ');
    return {
      id: `meca-${level}-${seed}`,
      category: 'mecanique',
      time_limit: level === 'facile' ? 45 : level === 'moyen' ? 60 : 75,
      difficulty: level,
      prompt: `La roue A tourne dans le sens horaire à ${rpm0} tours par minute. Dans quel sens et à quelle vitesse tourne la dernière roue ?`,
      question_data: { wheels, links, start: { dir: 'horaire', rpm: rpm0 } },
      options,
      correct_option_id: correct,
      explanation: `Sens : ${kinds}. Il y a ${flips} inversion${flips > 1 ? 's' : ''} de sens, donc la dernière roue tourne dans le sens ${dir}. Vitesse : les roues intermédiaires ne changent pas le rapport ; seul compte le rapport entre A et la dernière roue (dents ou diamètre) : ${rpm0} × ${wheels[0].teeth} ÷ ${wheels[n - 1].teeth} = ${rpm} tours par minute. Une petite roue tourne plus vite qu'une grande.`,
    };
  }
  return genMeca(`${seed}-bis`, level);
}

// ═══════════════════════════ 5. Attention et barrage ═══════════════════════════
// Carré avec une encoche sur l'un des 8 côtés ou coins (style Toulouse-Piéron).
export const NOTCHES = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'] as const;
export type Notch = (typeof NOTCHES)[number];

export function genAttention(seed: number | string, level: PsyLevel): PsyQuestion {
  const r = rng(seed);
  const [rows, cols] = level === 'facile' ? [5, 8] : level === 'moyen' ? [6, 10] : [8, 10];
  const targets: Notch[] = r.shuffle(NOTCHES).slice(0, level === 'facile' ? 1 : 2);
  const total = rows * cols;
  const want = r.int(Math.round(total * 0.14), Math.round(total * 0.24));
  const others = NOTCHES.filter((x) => !targets.includes(x));
  // Difficile : la plupart des distracteurs ressemblent aux modèles (encoche voisine).
  const gap = (a: Notch, b: Notch) => {
    const d = Math.abs(NOTCHES.indexOf(a) - NOTCHES.indexOf(b));
    return Math.min(d, 8 - d);
  };
  const near = others.filter((x) => targets.some((t) => gap(x, t) === 1));
  const cells: Notch[] = Array.from({ length: total }, (_, i) =>
    i < want ? r.pick(targets) : level === 'difficile' && near.length && r.next() < 0.6 ? r.pick(near) : r.pick(others),
  );
  const grid = r.shuffle(cells);
  const count = grid.filter((x) => targets.includes(x)).length;
  const { options, correct } = buildOptions(r, count, r.shuffle([count - 1, count + 1, count - 2, count + 2, count + 3, count - 3]).filter((x) => x > 0), optionCount(level));
  return {
    id: `att-${level}-${seed}`,
    category: 'attention',
    time_limit: level === 'facile' ? 45 : level === 'moyen' ? 60 : 75,
    difficulty: level,
    prompt: `Combien de figures identiques ${targets.length > 1 ? 'à l’un des deux modèles' : 'au modèle'} y a-t-il dans la grille ?`,
    question_data: { rows, cols, targets, grid },
    options,
    correct_option_id: correct,
    explanation: `La grille contient ${count} figure${count > 1 ? 's' : ''} identique${count > 1 ? 's' : ''} ${targets.length > 1 ? 'aux modèles' : 'au modèle'} (surlignées après la réponse). Méthode : balayez ligne par ligne, de gauche à droite, sans revenir en arrière, et regardez seulement la position de l'encoche.`,
  };
}

// ═══════════════════════════ 6. Suites numériques et de lettres ═══════════════════════════
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function genSuite(seed: number | string, level: PsyLevel): PsyQuestion {
  const r = rng(seed);
  const kinds =
    level === 'facile' ? ['arith', 'geo', 'lettres'] : level === 'moyen' ? ['alterne', 'ecarts', 'carres', 'lettres-alt', 'geo'] : ['fibo', 'entrelacee', 'ecarts2', 'mult-add', 'lettres-alt'];
  const kind = r.pick(kinds);
  let terms: (number | string)[] = [];
  let rule = '';
  const n = 6;
  if (kind === 'arith') {
    const a = r.int(2, 30), k = r.pick([3, 4, 5, 6, 7, 9, 11]);
    terms = Array.from({ length: n }, (_, i) => a + k * i);
    rule = `on ajoute ${k} à chaque fois`;
  } else if (kind === 'geo') {
    const a = r.int(1, 5), k = r.pick([2, 3]);
    terms = Array.from({ length: n }, (_, i) => a * k ** i);
    rule = `on multiplie par ${k} à chaque fois`;
  } else if (kind === 'alterne') {
    const a = r.int(1, 10), p = r.int(2, 6), m = r.int(1, 4);
    terms = [a];
    for (let i = 1; i < n; i++) terms.push(i % 2 ? (terms[i - 1] as number) + p : (terms[i - 1] as number) - m);
    rule = `on ajoute ${p} puis on retire ${m}, en alternance`;
  } else if (kind === 'ecarts') {
    const a = r.int(1, 20), d = r.int(1, 3);
    terms = [a];
    for (let i = 1; i < n; i++) terms.push((terms[i - 1] as number) + d + i - 1);
    rule = `les écarts augmentent de 1 : +${d}, +${d + 1}, +${d + 2}…`;
  } else if (kind === 'carres') {
    const s = r.int(1, 5);
    terms = Array.from({ length: n }, (_, i) => (s + i) ** 2);
    rule = `ce sont les carrés des nombres ${s}, ${s + 1}, ${s + 2}… (${s}×${s}, ${s + 1}×${s + 1}…)`;
  } else if (kind === 'fibo') {
    const a = r.int(1, 4), b = r.int(2, 6);
    terms = [a, b];
    for (let i = 2; i < n; i++) terms.push((terms[i - 1] as number) + (terms[i - 2] as number));
    rule = 'chaque nombre est la somme des deux précédents';
  } else if (kind === 'entrelacee') {
    const a = r.int(2, 9), k = r.int(2, 5), b = r.int(20, 40), j = r.int(2, 4);
    terms = Array.from({ length: n + 1 }, (_, i) => (i % 2 === 0 ? a + k * (i / 2) : b - j * ((i - 1) / 2)));
    rule = `deux suites mêlées : rangs impairs +${k}, rangs pairs −${j}`;
  } else if (kind === 'ecarts2') {
    const a = r.int(1, 6);
    terms = [a];
    for (let i = 1; i < n; i++) terms.push((terms[i - 1] as number) + 2 ** (i - 1));
    rule = 'les écarts doublent : +1, +2, +4, +8…';
  } else if (kind === 'mult-add') {
    const a = r.int(1, 4), k = 2, p = r.int(1, 3);
    terms = [a];
    for (let i = 1; i < n; i++) terms.push((terms[i - 1] as number) * k + p);
    rule = `on multiplie par ${k} puis on ajoute ${p}`;
  } else if (kind === 'lettres') {
    const s = r.int(0, 8), k = r.pick([2, 3]);
    terms = Array.from({ length: n }, (_, i) => ALPHA[(s + k * i) % 26]);
    rule = `on avance de ${k} lettres dans l'alphabet`;
  } else {
    const s = r.int(0, 6), p = r.pick([3, 4]), m = 1;
    const out: number[] = [s];
    for (let i = 1; i < n; i++) out.push(i % 2 ? out[i - 1] + p : out[i - 1] - m);
    terms = out.map((x) => ALPHA[((x % 26) + 26) % 26]);
    rule = `on avance de ${p} lettres puis on recule de ${m}, en alternance`;
  }
  const answer = terms[terms.length - 1];
  const shown = terms.slice(0, -1);
  const distract =
    typeof answer === 'number'
      ? [answer + 1, answer - 1, answer + 2, answer - 2, answer + 3, answer * 2 - (shown[shown.length - 1] as number)].filter((x) => x !== answer)
      : [1, -1, 2, -2].map((d) => ALPHA[(ALPHA.indexOf(answer) + d + 26) % 26]);
  const { options, correct } = buildOptions(r, answer, r.shuffle<number | string>(distract as (number | string)[]), optionCount(level));
  return {
    id: `suite-${level}-${seed}`,
    category: 'suites',
    time_limit: level === 'facile' ? 40 : level === 'moyen' ? 50 : 60,
    difficulty: level,
    prompt: typeof answer === 'number' ? 'Quel nombre continue la suite ?' : 'Quelle lettre continue la suite ?',
    question_data: { kind, terms: shown },
    options,
    correct_option_id: correct,
    explanation: `Règle : ${rule}. Le terme suivant est donc ${answer}.`,
  };
}

export const GENERATORS: Record<PsyCategory, (seed: number | string, level: PsyLevel) => PsyQuestion> = {
  matrices: genMatrix,
  dominos: genDomino,
  cubes: genCube,
  mecanique: genMeca,
  attention: genAttention,
  suites: genSuite,
};
export const generate = (cat: PsyCategory, seed: number | string, level: PsyLevel) => GENERATORS[cat](seed, level);

// Test mixte : les 6 familles à tour de rôle.
export function generateMixed(seed: number | string, level: PsyLevel, n = 12): PsyQuestion[] {
  const cats = Object.keys(GENERATORS) as PsyCategory[];
  return Array.from({ length: n }, (_, i) => generate(cats[i % cats.length], `${seed}-${i}`, level));
}
export type { Rng };
