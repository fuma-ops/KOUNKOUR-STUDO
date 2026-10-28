// Dessin des questions en HTML / SVG / CSS (aucune image). Fonctions pures qui renvoient
// du texte : le lecteur React les injecte, le rendu serveur les place tel quel dans la page.
import type { PsyQuestion } from './core.ts';
import { NOTCHES, type CubeView, type DominoV, type Fill, type Link, type MatrixCell, type MecaAnswer, type Notch, type Shape, type Sym, type Wheel } from './generators.ts';

const INK = '#242126';
const BRAND = '#8D174B';
const n2 = (x: number) => Math.round(x * 10) / 10;

// ─── Matrices ───────────────────────────────────────────────────────────────
const SPOTS: Record<number, [number, number][]> = { 1: [[50, 50]], 2: [[29, 50], [71, 50]], 3: [[50, 28], [28, 71], [72, 71]] };
const SIZE: Record<number, number> = { 1: 25, 2: 17, 3: 15 };

function shapeSvg(shape: Shape, cx: number, cy: number, s: number, fill: Fill, hatch: string): string {
  const f = fill === 'solid' ? INK : fill === 'hatched' ? `url(#${hatch})` : '#fff';
  const a = `fill="${f}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"`;
  if (shape === 'circle') return `<circle cx="${cx}" cy="${cy}" r="${s}" ${a}/>`;
  if (shape === 'square') return `<rect x="${n2(cx - s * 0.88)}" y="${n2(cy - s * 0.88)}" width="${n2(s * 1.76)}" height="${n2(s * 1.76)}" ${a}/>`;
  if (shape === 'triangle') return `<polygon points="${cx},${n2(cy - s)} ${n2(cx + s * 0.98)},${n2(cy + s * 0.8)} ${n2(cx - s * 0.98)},${n2(cy + s * 0.8)}" ${a}/>`;
  return `<polygon points="${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}" ${a}/>`;
}
const hatchDef = (id: string) =>
  `<defs><pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff"/><line x1="0" y1="0" x2="0" y2="6" stroke="${INK}" stroke-width="2.4"/></pattern></defs>`;
const cellInner = (c: MatrixCell, hatch: string, dx = 0, dy = 0) => SPOTS[c.count].map(([x, y]) => shapeSvg(c.shape, x + dx, y + dy, SIZE[c.count], c.fill, hatch)).join('');

export function matrixSvg(grid: (MatrixCell | null)[][], uid: string, answer?: MatrixCell): string {
  const h = `h${uid}`;
  let out = `<svg class="psy-svg psy-matrix" viewBox="0 0 306 306" role="img" aria-label="Matrice de 3 sur 3 avec une case manquante">${hatchDef(h)}`;
  grid.forEach((row, r) =>
    row.forEach((c, k) => {
      const x = 3 + k * 100, y = 3 + r * 100;
      out += `<rect x="${x}" y="${y}" width="100" height="100" fill="${c || answer ? '#fff' : '#FBF2F6'}" stroke="#d9d3dc" stroke-width="2"/>`;
      if (c) out += cellInner(c, h, x, y);
      else if (answer) out += `<rect x="${x + 2}" y="${y + 2}" width="96" height="96" fill="#EAF7EF" stroke="#1F8A4C" stroke-width="3" rx="6"/>${cellInner(answer, h, x, y)}`;
      else out += `<text x="${x + 50}" y="${y + 64}" text-anchor="middle" font-size="46" font-weight="800" fill="${BRAND}" font-family="system-ui,sans-serif">?</text>`;
    }),
  );
  return out + '</svg>';
}
export const matrixOptionSvg = (c: MatrixCell, uid: string) =>
  `<svg class="psy-svg" viewBox="0 0 100 100" role="img" aria-label="${c.count} ${c.shape} ${c.fill}">${hatchDef(`h${uid}`)}${cellInner(c, `h${uid}`)}</svg>`;

// ─── Dominos (CSS Grid) ─────────────────────────────────────────────────────
const PIPS: Record<number, number[]> = { 0: [], 1: [5], 2: [3, 7], 3: [3, 5, 7], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
const half = (n: number) =>
  `<span class="psy-half">${PIPS[n].map((p) => `<i style="grid-area:${Math.ceil(p / 3)}/${((p - 1) % 3) + 1}"></i>`).join('')}</span>`;
export const dominoHtml = (v: DominoV | null, extra = '') =>
  v
    ? `<span class="psy-dom${extra}" role="img" aria-label="domino ${v[0]} et ${v[1]}">${half(v[0])}<b></b>${half(v[1])}</span>`
    : `<span class="psy-dom psy-dom-q" role="img" aria-label="domino manquant"><em>?</em></span>`;
export const dominoRow = (seq: (DominoV | null)[], answer?: DominoV) =>
  `<div class="psy-dom-row">${seq.map((v) => (v ? dominoHtml(v) : answer ? dominoHtml(answer, ' psy-dom-ok') : dominoHtml(null))).join('')}</div>`;

// ─── Cubes : patron en croix + cube monté en CSS 3D ─────────────────────────
export function symSvg(s: Sym): string {
  const c = BRAND;
  const body: Record<Sym, string> = {
    disc: `<circle cx="20" cy="20" r="10" fill="${c}"/>`,
    ring: `<circle cx="20" cy="20" r="10" fill="none" stroke="${c}" stroke-width="4.5"/>`,
    plus: `<path d="M20 8v24M8 20h24" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
    cross: `<path d="M11 11l18 18M29 11L11 29" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
    square: `<rect x="12" y="12" width="16" height="16" fill="${c}"/>`,
    dots: `<g fill="${c}"><circle cx="12" cy="12" r="4"/><circle cx="28" cy="12" r="4"/><circle cx="12" cy="28" r="4"/><circle cx="28" cy="28" r="4"/></g>`,
    target: `<circle cx="20" cy="20" r="12" fill="none" stroke="${c}" stroke-width="3.5"/><circle cx="20" cy="20" r="4.5" fill="${c}"/>`,
    diamond: `<polygon points="20,7 33,20 20,33 7,20" fill="${c}"/>`,
  };
  return `<svg viewBox="0 0 40 40" aria-hidden="true">${body[s]}</svg>`;
}
export function cubeNetHtml(faces: Record<string, Sym>): string {
  const pos: [string, number, number][] = [['U', 1, 2], ['L', 2, 1], ['F', 2, 2], ['R', 2, 3], ['B', 2, 4], ['D', 3, 2]];
  return `<div class="psy-net" role="img" aria-label="Patron de cube en croix">${pos
    .map(([f, r, c]) => `<span class="psy-face" style="grid-area:${r}/${c}">${symSvg(faces[f])}</span>`)
    .join('')}</div>`;
}
export const cube3d = (v: CubeView) =>
  `<span class="psy-cube-wrap" role="img" aria-label="cube"><span class="psy-cube"><span class="psy-cf psy-front">${symSvg(v.front)}</span><span class="psy-cf psy-right">${symSvg(
    v.right,
  )}</span><span class="psy-cf psy-top">${symSvg(v.top)}</span></span></span>`;

// ─── Engrenages et poulies (SVG trigonométrique) ────────────────────────────
const RADIUS = (t: number) => 10 + t * 1.25;
const LETTERS = 'ABCDEFGH';

function gearPath(cx: number, cy: number, r: number, teeth: number): string {
  const step = (Math.PI * 2) / teeth;
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    for (const [k, rr] of [[0, r - 4], [0.18, r + 4], [0.5, r + 4], [0.68, r - 4]] as [number, number][])
      pts.push(`${n2(cx + rr * Math.cos(a + k * step))},${n2(cy + rr * Math.sin(a + k * step))}`);
  }
  return `M${pts.join('L')}Z`;
}
function tangents(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number, crossed: boolean): string {
  const d = Math.hypot(x2 - x1, y2 - y1);
  const th = Math.atan2(y2 - y1, x2 - x1);
  const phi = Math.acos((crossed ? r1 + r2 : r1 - r2) / d);
  return [1, -1]
    .map((s) => {
      const a = th + s * phi;
      const b = crossed ? a + Math.PI : a;
      return `<line x1="${n2(x1 + r1 * Math.cos(a))}" y1="${n2(y1 + r1 * Math.sin(a))}" x2="${n2(x2 + r2 * Math.cos(b))}" y2="${n2(y2 + r2 * Math.sin(b))}"/>`;
    })
    .join('');
}
// Flèche de rotation au-dessus d'une roue (repère écran : y vers le bas, « horaire » = angle croissant).
function arrow(cx: number, cy: number, r: number, cw: boolean, color: string): string {
  const R = r + 9;
  const a0 = (-140 * Math.PI) / 180, a1 = (-40 * Math.PI) / 180;
  const [s, e] = cw ? [a0, a1] : [a1, a0];
  const p = (a: number) => `${n2(cx + R * Math.cos(a))},${n2(cy + R * Math.sin(a))}`;
  const tip = e;
  const dir = cw ? 1 : -1;
  const tx = cx + R * Math.cos(tip), ty = cy + R * Math.sin(tip);
  // Tangente au point d'arrivée, dans le sens du mouvement.
  const ux = -Math.sin(tip) * dir, uy = Math.cos(tip) * dir;
  const nx = Math.cos(tip), ny = Math.sin(tip);
  const head = `${n2(tx + ux * 7)},${n2(ty + uy * 7)} ${n2(tx - ux * 2 + nx * 5)},${n2(ty - uy * 2 + ny * 5)} ${n2(tx - ux * 2 - nx * 5)},${n2(ty - uy * 2 - ny * 5)}`;
  return `<path d="M${p(s)}A${R},${R} 0 0 ${cw ? 1 : 0} ${p(e)}" fill="none" stroke="${color}" stroke-width="3"/><polygon points="${head}" fill="${color}"/>`;
}

export function mecaSvg(wheels: Wheel[], links: Link[], start: MecaAnswer, reveal?: { dirs: boolean[] }): string {
  const rs = wheels.map((w) => RADIUS(w.teeth));
  const pos: [number, number][] = [];
  let x = rs[0] + 14, y = 0;
  pos.push([x, y]);
  for (let i = 1; i < wheels.length; i++) {
    const l = links[i - 1];
    const d = l === 'engrenage' ? rs[i - 1] + rs[i] + 1 : rs[i - 1] + rs[i] + 34;
    const ang = l === 'engrenage' ? ((i % 2 ? 1 : -1) * 28 * Math.PI) / 180 : 0;
    x += d * Math.cos(ang);
    y += d * Math.sin(ang);
    pos.push([x, y]);
  }
  const minY = Math.min(...pos.map((p, i) => p[1] - rs[i])) - 46;
  const maxY = Math.max(...pos.map((p, i) => p[1] + rs[i])) + 30;
  const W = Math.max(...pos.map((p, i) => p[0] + rs[i])) + 14;
  const isGear = (i: number) => links[i - 1] === 'engrenage' || links[i] === 'engrenage';
  let belts = '';
  links.forEach((l, i) => {
    if (l === 'engrenage') return;
    const [a, b] = [pos[i], pos[i + 1]];
    belts += `<g stroke="#5b5560" stroke-width="3" stroke-linecap="round">${tangents(a[0], a[1], rs[i], b[0], b[1], rs[i + 1], l === 'courroie-croisee')}</g>`;
  });
  let body = '';
  wheels.forEach((w, i) => {
    const [cx, cy] = pos[i];
    const r = rs[i];
    const fill = i === 0 ? '#F6E3EC' : '#EEF0F4';
    body += isGear(i)
      ? `<path d="${gearPath(cx, cy, r, w.teeth)}" fill="${fill}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`
      : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${r - 5}" fill="none" stroke="#9a94a0" stroke-width="1.2"/>`;
    body += `<circle cx="${cx}" cy="${cy}" r="${Math.min(13, r * 0.42)}" fill="#fff" stroke="${INK}" stroke-width="1.5"/><text x="${cx}" y="${n2(cy + 5)}" text-anchor="middle" font-size="14" font-weight="800" fill="${INK}">${LETTERS[i]}</text>`;
    // Étiquette du côté libre : au-dessus si la roue est plus haute que ses voisines.
    const ny = [pos[i - 1]?.[1], pos[i + 1]?.[1]].filter((v): v is number => v !== undefined);
    const up = ny.some((v) => v > cy + 1);
    const ly = up ? cy - r - (i === 0 || reveal || i === wheels.length - 1 ? 30 : 10) : cy + r + 19;
    body += `<text x="${cx}" y="${n2(ly)}" text-anchor="middle" font-size="12.5" fill="#5b5560">${isGear(i) ? `${w.teeth} dents` : `Ø ${w.teeth}`}</text>`;
    if (i === 0) body += arrow(cx, cy, r, start.dir === 'horaire', BRAND);
    else if (reveal) body += arrow(cx, cy, r, reveal.dirs[i], '#1F8A4C');
    else if (i === wheels.length - 1) body += `<text x="${cx}" y="${n2(cy - r - 10)}" text-anchor="middle" font-size="20" font-weight="800" fill="${BRAND}">?</text>`;
  });
  return `<svg class="psy-svg psy-meca" viewBox="0 ${n2(minY)} ${n2(W)} ${n2(maxY - minY)}" font-family="system-ui,sans-serif" role="img" aria-label="Système de ${wheels.length} roues reliées">${belts}${body}</svg>`;
}
export const mecaDirs = (links: Link[], first: MecaAnswer['dir']) => {
  const dirs = [first === 'horaire'];
  links.forEach((l, i) => dirs.push(l === 'courroie' ? dirs[i] : !dirs[i]));
  return dirs;
};
export const mecaOptionHtml = (v: MecaAnswer) =>
  `<span class="psy-meca-opt"><span class="psy-rot">${v.dir === 'horaire' ? '↻' : '↺'}</span><span><b>${v.rpm} tr/min</b><small>${v.dir === 'horaire' ? 'sens horaire' : 'sens antihoraire'}</small></span></span>`;

// ─── Barrage (Toulouse-Piéron) : carré + petit trait sur l'un des 8 côtés ou coins ───
const DIRV: Record<Notch, [number, number]> = { N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1], S: [0, 1], SO: [-1, 1], O: [-1, 0], NO: [-1, -1] };
function tpSign(x: number, y: number, n: Notch, color: string, s = 11): string {
  const [dx, dy] = DIRV[n];
  const h = s / 2;
  const ex = x + dx * h, ey = y + dy * h;
  const L = dx && dy ? 5 : 6;
  const k = dx && dy ? Math.SQRT1_2 : 1;
  return `<rect x="${n2(x - h)}" y="${n2(y - h)}" width="${s}" height="${s}" fill="${color}"/><line x1="${n2(ex)}" y1="${n2(ey)}" x2="${n2(ex + dx * L * k * (dx && dy ? 1.4 : 1))}" y2="${n2(ey + dy * L * k * (dx && dy ? 1.4 : 1))}" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>`;
}
export const tpModel = (n: Notch) => `<svg class="psy-tp-model" viewBox="0 0 32 32" role="img" aria-label="modèle">${tpSign(16, 16, n, INK, 13)}</svg>`;
export function tpGrid(rows: number, cols: number, grid: Notch[], targets: Notch[], opts: { reveal?: boolean; marked?: Set<number> } = {}): string {
  const c = 30;
  let out = `<svg class="psy-svg psy-tp" viewBox="0 0 ${cols * c} ${rows * c}" role="img" aria-label="Grille de ${rows * cols} figures">`;
  grid.forEach((n, i) => {
    const x = (i % cols) * c + c / 2, y = Math.floor(i / cols) * c + c / 2;
    const hit = targets.includes(n);
    const mark = opts.marked?.has(i);
    if (opts.reveal && hit) out += `<circle cx="${x}" cy="${y}" r="13.5" fill="#E1F4E8" stroke="#1F8A4C" stroke-width="1.6"/>`;
    else if (mark) out += `<circle cx="${x}" cy="${y}" r="13.5" fill="#FBE7F0"/>`;
    out += `<g data-i="${i}">${tpSign(x, y, n, opts.reveal && mark && !hit ? '#C0392B' : INK)}<rect x="${x - c / 2}" y="${y - c / 2}" width="${c}" height="${c}" fill="transparent"/></g>`;
    if (mark) out += `<line x1="${x - 9}" y1="${y + 9}" x2="${x + 9}" y2="${y - 9}" stroke="${BRAND}" stroke-width="2.4" stroke-linecap="round" pointer-events="none"/>`;
  });
  return out + '</svg>';
}
export { NOTCHES };

// ─── Suites ─────────────────────────────────────────────────────────────────
export const suiteHtml = (terms: (number | string)[], answer?: number | string) =>
  `<div class="psy-suite">${terms.map((t) => `<span>${t}</span>`).join('')}<span class="${answer !== undefined ? 'psy-ok' : 'psy-q'}">${answer !== undefined ? answer : '?'}</span></div>`;

// ─── Assemblage d'une question ──────────────────────────────────────────────
export function questionHtml(q: PsyQuestion, uid: string, reveal = false, marked?: Set<number>): string {
  const d = q.question_data;
  const right = q.options.find((o) => o.id === q.correct_option_id)?.value;
  switch (q.category) {
    case 'matrices':
      return matrixSvg(d.grid, uid, reveal ? right : undefined);
    case 'dominos':
      return dominoRow(d.sequence, reveal ? right : undefined);
    case 'cubes':
      return cubeNetHtml(d.faces);
    case 'mecanique':
      return mecaSvg(d.wheels, d.links, d.start, reveal ? { dirs: mecaDirs(d.links, d.start.dir) } : undefined);
    case 'attention':
      return `<div class="psy-tp-head"><span>Modèle${d.targets.length > 1 ? 's' : ''} :</span>${d.targets.map(tpModel).join('')}</div>${tpGrid(d.rows, d.cols, d.grid, d.targets, { reveal, marked })}`;
    case 'suites':
      return suiteHtml(d.terms, reveal ? right : undefined);
  }
}
export function optionHtml(q: PsyQuestion, value: any, uid: string): string {
  switch (q.category) {
    case 'matrices':
      return matrixOptionSvg(value, uid);
    case 'dominos':
      return dominoHtml(value);
    case 'cubes':
      return cube3d(value);
    case 'mecanique':
      return mecaOptionHtml(value);
    case 'attention':
    case 'suites':
      return `<span class="psy-big">${value}</span>`;
  }
}
// Texte simple d'une réponse (lecteurs d'écran, page serveur).
export function optionText(q: PsyQuestion, value: any): string {
  switch (q.category) {
    case 'matrices':
      return `${value.count} × ${value.shape}`;
    case 'dominos':
      return `${value[0]} / ${value[1]}`;
    case 'cubes':
      return `dessus ${value.top}, face ${value.front}, droite ${value.right}`;
    case 'mecanique':
      return `${value.dir}, ${value.rpm} tr/min`;
    default:
      return String(value);
  }
}

// Styles communs (application et pages serveur). Mobile d'abord : tailles en vw bornées.
export const PSY_CSS = `
.psy-svg{display:block;width:100%;height:auto}
.psy-matrix{max-width:min(86vw,340px);margin:0 auto}
.psy-meca{max-width:640px;margin:0 auto;max-height:46vh}
.psy-dom-row{display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(6px,2vw,12px);--w:clamp(40px,11.5vw,58px)}
.psy-dom{--w:clamp(40px,11.5vw,58px);width:var(--w);aspect-ratio:1/2;display:inline-grid;grid-template-rows:1fr 2px 1fr;background:#fff;border:2px solid ${INK};border-radius:10px;box-shadow:0 2px 0 #d9d3dc;flex:none}
.psy-dom>b{background:${INK};margin:0 14%}
.psy-half{display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);padding:16%;gap:6%}
.psy-half i{display:block;border-radius:50%;background:${INK};aspect-ratio:1}
.psy-dom-q{border-style:dashed;border-color:${BRAND};background:#FBF2F6;display:inline-flex;align-items:center;justify-content:center;box-shadow:none}
.psy-dom-q em{font-style:normal;font-weight:800;font-size:calc(var(--w)*.5);color:${BRAND}}
.psy-dom-ok{border-color:#1F8A4C;background:#EAF7EF}
.psy-net{display:grid;grid-template:repeat(3,var(--f))/repeat(4,var(--f));--f:clamp(48px,17vw,76px);justify-content:center;margin:0 auto;width:max-content}
.psy-face{border:2px solid ${INK};background:#fff;margin:-1px;display:flex;align-items:center;justify-content:center}
.psy-face svg,.psy-cf svg{width:72%;height:72%}
.psy-cube-wrap{--c:clamp(42px,13vw,60px);display:inline-block;width:calc(var(--c)*1.75);height:calc(var(--c)*1.75);perspective:600px;padding-top:calc(var(--c)*.32);padding-left:calc(var(--c)*.36);box-sizing:border-box}
.psy-cube{position:relative;display:block;width:var(--c);height:var(--c);transform-style:preserve-3d;transform:rotateX(-24deg) rotateY(-36deg)}
.psy-cf{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border:2px solid ${INK};background:#fff;backface-visibility:hidden}
.psy-front{transform:translateZ(calc(var(--c)/2))}
.psy-right{transform:rotateY(90deg) translateZ(calc(var(--c)/2));background:#ECE8EF}
.psy-top{transform:rotateX(90deg) translateZ(calc(var(--c)/2));background:#F8F6FA}
.psy-meca-opt{display:flex;align-items:center;gap:10px;text-align:left}
.psy-meca-opt b{display:block;font-size:16px}.psy-meca-opt small{display:block;font-size:12px;color:#6E6773}
.psy-rot{font-size:30px;line-height:1;color:${BRAND}}
.psy-tp-head{display:flex;align-items:center;justify-content:center;gap:10px;font-weight:700;font-size:14px;margin-bottom:10px}
.psy-tp-model{width:38px;height:38px;border:2px solid ${BRAND};border-radius:10px;background:#FBF2F6}
.psy-tp{max-width:560px;margin:0 auto;touch-action:manipulation;cursor:pointer}
.psy-suite{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
.psy-suite span{min-width:clamp(42px,12vw,56px);height:clamp(46px,13vw,58px);padding:0 8px;display:inline-flex;align-items:center;justify-content:center;border-radius:12px;background:#fff;border:2px solid #e5e0e8;font-weight:800;font-size:clamp(18px,5.4vw,24px);color:${INK}}
.psy-suite .psy-q{border:2px dashed ${BRAND};color:${BRAND};background:#FBF2F6}
.psy-suite .psy-ok{border-color:#1F8A4C;background:#EAF7EF;color:#1F8A4C}
.psy-big{font-size:22px;font-weight:800}
`;
