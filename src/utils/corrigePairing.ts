// Regroupement des lignes d'un sujet en cartes de questions, et rattachement du corrigé à
// chaque question (fonctions pures, partagées par l'écran du sujet et les tests).
import { layoutStatement, type Seg } from './statementLayout';

// Une carte = une question et tout ce qui la suit (choix, calculs, tableaux) jusqu'à la suivante.
export type Item = { kind: 'seg'; seg: Seg } | { kind: 'card'; head: Extract<Seg, { kind: 'question' }>; body: Seg[] } | { kind: 'answers'; rows: Extract<Seg, { kind: 'answer' }>[] };

export function group(blocks: Seg[][]): Item[] {
  const items: Item[] = [];
  let card: Extract<Item, { kind: 'card' }> | null = null;
  blocks.forEach((block) => {
    block.forEach((seg, j) => {
      if (seg.kind === 'question') {
        card = { kind: 'card', head: seg, body: [] };
        items.push(card);
      } else if (seg.kind === 'answer') {
        card = null;
        const last = items[items.length - 1];
        if (last?.kind === 'answers') last.rows.push(seg);
        else items.push({ kind: 'answers', rows: [seg] });
      } else if (seg.kind === 'h2' || seg.kind === 'h3' || seg.kind === 'header') {
        card = null;
        items.push({ kind: 'seg', seg });
      } else if (card && (j > 0 || seg.kind === 'option' || seg.kind === 'table' || seg.kind === 'calc' || seg.kind === 'code')) {
        // Un paragraphe isolé après une ligne vide ouvre une nouvelle partie : il sort de la carte.
        card.body.push(seg);
      } else {
        card = null;
        items.push({ kind: 'seg', seg });
      }
    });
  });
  return items;
}


// ─── Corrigé placé sous chaque question ──────────────────────────────────────
// Réponses de QCM (« 1. Réponse : B. … ») rattachées à la question de même numéro qui a des
// choix ; corrigés d'exercices (« ### Exercice 2 : … ») rattachés à l'exercice de même numéro.
// Ce qui ne trouve pas sa question reste dans le corrigé complémentaire, en bas.
export type Answer = Extract<Seg, { kind: 'answer' }>;
const EXO = /^(exercice|probl[eè]me|cas|sujet|question|[ée]tude de cas|dossier)\s*(?:type\s*)?(?:n°\s*)?(\d+)/i;
export const exoKey = (head: string) => {
  const m = EXO.exec(head.replace(/^#+\s*/, '').trim());
  return m ? `${m[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}:${m[2]}` : null;
};
export interface Pairing {
  answers: Map<string, Answer[]>;
  exos: Map<string, string>;
  rest: string;
}
export function pairCorrige(statement: string, corrige: string): Pairing | null {
  // Numéros des questions à choix de l'énoncé, et clés de ses exercices.
  const qNums = new Set<string>();
  const exoKeys = new Set<string>();
  for (const item of group(layoutStatement(statement, { header: true }))) {
    if (item.kind === 'card' && item.body.some((b) => b.kind === 'option')) qNums.add(item.head.num);
    if (item.kind === 'seg' && (item.seg.kind === 'h2' || item.seg.kind === 'h3')) {
      const k = exoKey(item.seg.text);
      if (k) exoKeys.add(k);
    }
  }
  // Sections du corrigé (découpées sur les titres ## / ###).
  const sections: { head: string | null; lines: string[] }[] = [{ head: null, lines: [] }];
  for (const line of corrige.split('\n')) {
    if (/^#{2,3}\s+/.test(line.trim())) sections.push({ head: line.trim(), lines: [] });
    else sections[sections.length - 1].lines.push(line);
  }
  const answers = new Map<string, Answer[]>();
  const exos = new Map<string, string>();
  const rest: string[] = [];
  let introOnly = true;
  let used = 0;
  for (const sec of sections) {
    const k = sec.head ? exoKey(sec.head) : null;
    if (k && exoKeys.has(k) && !exos.has(k) && sec.lines.join('').trim()) {
      exos.set(k, sec.lines.join('\n').trim());
      used++;
      continue;
    }
    const kept: string[] = [];
    // Dans une grille de réponses, une ligne numérotée sans lettre (« 9. Non tranché : … »,
    // « س19: غير محسوم … ») est la correction de cette question ; les lignes qui la suivent aussi.
    const isGrid = sec.lines.some((l) => {
      const seg = l.trim() ? layoutStatement(l)[0]?.[0] : null;
      return seg?.kind === 'answer' && qNums.has(seg.num);
    });
    let last: Answer | null = null;
    for (const line of sec.lines) {
      const t = line.trim();
      if (!t) {
        kept.push(line);
        continue;
      }
      const seg = layoutStatement(t)[0]?.[0];
      if (seg?.kind === 'answer' && qNums.has(seg.num)) {
        answers.set(seg.num, [...(answers.get(seg.num) || []), seg]);
        last = seg;
        used++;
        continue;
      }
      const free = isGrid ? /^(?:س\s?(\d{1,3})\s*:|(\d{1,3})\s?[.)-])\s*(.+)$/.exec(t) : null;
      const num = free ? free[1] || free[2] : '';
      if (free && qNums.has(num) && !answers.has(num)) {
        last = { kind: 'answer', num, letters: '', text: free[3] };
        answers.set(num, [last]);
        used++;
        continue;
      }
      if (isGrid && last && !/^(\d{1,3}\s?[.)-]|س\s?\d|questions?\s+\d)/i.test(t)) {
        last.text = `${last.text}\n${t}`;
        continue;
      }
      last = null;
      kept.push(line);
    }
    if (kept.join('').trim()) {
      rest.push([sec.head, ...kept].filter((x) => x !== null).join('\n').trim());
      // « À propos de ce corrigé » : simple avertissement, comme la phrase d'introduction.
      if (sec.head && !/^#{2,3}\s*(à|a) propos\b/i.test(sec.head)) introOnly = false;
    }
  }
  if (!used) return null;
  // Une seule phrase d'introduction (« Corrigé du concours blanc… ») ne justifie pas un bloc à part.
  const restText = rest.join('\n\n').trim();
  return { answers, exos, rest: introOnly && restText.length < 260 ? '' : restText };
}

