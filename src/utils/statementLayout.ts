// Mise en forme des sujets écrits et des corrigés (texte brut en base) pour la lecture
// sur téléphone. Aucune modification du contenu : on ne fait que découper et typer les lignes.
//
//   ## / ###          → titres
//   « 3. Titre : … »  → question numérotée (titre en gras, suite en dessous)
//   « Jour : … »      → libellé en gras
//   ligne avec = ou ≈ → calcul (police à chiffres nets, résultat final mis en valeur)
//   Remarque / Attention / Non tranché / Méthode → encadré
//   « - … »           → puce
//   « A. … » / « b) … » → choix de QCM (lettre en pastille)
//   « 1. Réponse : B. … » → réponse de corrigé (lettre mise en valeur)
//   « a | b | c »     → tableau
//   « SELECT … »      → requête SQL (bloc de code)
//   1er bloc d'un sujet (organisme, intitulé) → en-tête

export type Seg =
  | { kind: 'h2' | 'h3'; text: string }
  | { kind: 'question'; num: string; title: string }
  | { kind: 'calc'; label?: string; before: string; result: string }
  | { kind: 'text'; label?: string; text: string }
  | { kind: 'note'; label: string; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'answer'; num: string; letters: string; text: string; src?: string }
  | { kind: 'option'; letter: string; text: string }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'code'; text: string }
  | { kind: 'header'; lines: string[] };

const ARABIC = /[\u0600-\u06FF]/;
export const isArabic = (t: string) => ARABIC.test(t);
const NOTE = /^(remarque|attention|non tranché|méthode|methode|contrôle|controle|vérification|verification|rappel|astuce)\b/i;

// Découpe une ligne trop dense : phrases (« . » suivi d'une majuscule) puis suites de calculs « a = … ; b = … ».
export function splitDense(line: string): string[] {
  if (ARABIC.test(line)) return [line];
  const sentences = line.split(/(?<=\.)\s+(?=(?:[A-ZÉÈÀÂÎÔÛÇΔλφ√(]|[A-Z]\w*\s*=))/u).flatMap((s) => {
    const parts = s.split(/\s;\s/);
    // On ne coupe les « ; » que si chaque morceau est un calcul (sinon c'est une énumération).
    return parts.length > 1 && parts.every((p) => /[=≈]/.test(p)) ? parts : [s];
  });
  return sentences.map((s) => s.trim()).filter(Boolean);
}

function labelOf(s: string): { label?: string; rest: string } {
  const m = /^([A-ZÉÈÀÂÎÔÛÇa-zé][^:=;]{0,42}?)\s?:\s+(.+)$/u.exec(s);
  if (!m || /\d\s*$/.test(m[1]) || m[1].split(' ').length > 6) return { rest: s };
  return { label: m[1], rest: m[2] };
}

function calcOrText(s: string, statement = false): Seg {
  const { label, rest } = labelOf(s);
  // Dans un énoncé, une donnée (« Z2 = 1270 mNGM ») n'est pas un résultat : seule une formule courte
  // passe en bloc de calcul, sans valeur mise en avant.
  if (statement) {
    const words = rest.replace(/[^A-Za-zÀ-ÿ\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2).length;
    // Formule à symbole court (« Cp = (USL − LSL) / (6σ) », « Q* = √(…) ») : encadrée, même si elle contient des mots.
    // Le membre de gauche peut être un nom court (« Demande en chlore = dose − résiduel »), sans ponctuation de phrase.
    const formula = /^[^=.:;,]{1,40}\s=\s/.test(rest) && rest.length <= 140;
    return /[=≈]/.test(rest) && !ARABIC.test(rest) && ((rest.length <= 90 && words <= 2) || formula)
      ? { kind: 'calc', label, before: rest, result: '' }
      : { kind: 'text', label, text: rest };
  }
  // Une phrase d'introduction (« Données … : ») reste du texte, même si elle contient « = ».
  // Une longue phrase explicative qui contient une formule reste du texte : seuls les calculs courts passent en mode calcul.
  if (!ARABIC.test(rest) && /[=≈]/.test(rest) && !/:\s*$/.test(rest) && rest.length <= 140) {
    const idx = Math.max(rest.lastIndexOf('= '), rest.lastIndexOf('≈ '));
    if (idx > 0) {
      const result = rest.slice(idx + 2).replace(/[.;]\s*$/, '');
      // Le « résultat » doit rester court (une valeur et son unité), sinon tout est texte de calcul.
      if (result.length <= 40) return { kind: 'calc', label, before: rest.slice(0, idx + 2), result };
    }
    return { kind: 'calc', label, before: rest, result: '' };
  }
  return { kind: 'text', label, text: rest };
}

// Ligne de tableau : au moins deux « | » (ou « libellé : a | b »).
const tableCells = (line: string): string[] | null => {
  if ((line.match(/\|/g) || []).length < 2) return null;
  const cells = line.split('|').map((c) => c.trim());
  const m = /^(.{2,40}?)\s:\s(.+)$/.exec(cells[0]);
  return m ? [m[1], m[2], ...cells.slice(1)] : cells;
};
const OPTION = /^(?:\(([a-eA-E])\)|([a-eA-E])\s?[.)])\s+(.+)$/;
// « 1. Réponse : B. Explication (source) » / « 3. Réponses : A et C — … »
const REPLY = /^(\d{1,3})\s?[.)-]\s+R[ée]ponses?\s*:\s*([A-Ea-e](?:\s*(?:,|et)\s*[A-Ea-e])*)\b\s*[.,:;—–-]?\s*(.*)$/;

// header : texte d'un énoncé (en-tête du sujet, données sans résultat mis en valeur) ; sinon corrigé.
export function layoutStatement(text: string, opts: { header?: boolean } = {}): Seg[][] {
  return text
    .split(/\n\s*\n/)
    .map((block, bi) => {
      const out: Seg[] = [];
      const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
      // En-tête du sujet : premier bloc court, sans titre ni question (organisme, intitulé, session).
      if (opts.header && bi === 0 && lines.length <= 5 && lines.every((l) => !/^(#|[-•]\s|\d{1,2}\s?[.)-]\s)/.test(l) && !OPTION.test(l) && !tableCells(l))) {
        return [{ kind: 'header', lines } as Seg];
      }
      for (const line of lines) {
        const h = /^(#{2,3})\s+(.*)$/.exec(line);
        if (h) {
          out.push({ kind: h[1] === '##' ? 'h2' : 'h3', text: h[2] });
          continue;
        }
        const cells = tableCells(line);
        if (cells) {
          const last = out[out.length - 1];
          if (last?.kind === 'table') last.rows.push(cells);
          else out.push({ kind: 'table', rows: [cells] });
          continue;
        }
        if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|WITH)\s/.test(line)) {
          out.push({ kind: 'code', text: line });
          continue;
        }
        if (ARABIC.test(line)) {
          // Arabe : « س3: الجواب 2) … » (corrigé), « 12) … » / « س1 : … » (question), « 1. … » / « 1- … » (choix).
          const ar = /^س\s?(\d{1,3})\s*:\s*الجواب\s*(\d(?:\s*(?:و|،|,)\s*\d)*)\)?\s*(.*)$/.exec(line);
          if (ar) {
            let t = ar[3].trim();
            const src = /\s*\(([^()]{2,60})\)\.?$/.exec(t);
            if (src) t = t.slice(0, src.index).trim();
            out.push({ kind: 'answer', num: ar[1], letters: ar[2].replace(/\s+/g, ' '), text: t, src: src?.[1] });
            continue;
          }
          const aq = /^(?:س\s?(\d{1,3})\s*:|(\d{1,3})\s?\)\s*-?)\s*(.+)$/.exec(line);
          if (aq) {
            out.push({ kind: 'question', num: aq[1] || aq[2], title: aq[3] });
            continue;
          }
          const ao = /^(\d{1,2})\s?[.-]\s*(.+)$/.exec(line);
          if (ao) {
            const prev = out[out.length - 1];
            if (prev && (prev.kind === 'question' || prev.kind === 'option')) out.push({ kind: 'option', letter: ao[1], text: ao[2] });
            else out.push({ kind: 'question', num: ao[1], title: ao[2] });
            continue;
          }
        }
        const reply = ARABIC.test(line) ? null : REPLY.exec(line);
        if (reply) {
          let t = reply[3].trim();
          const src = /\s*\(([^()]{2,60}(?:\([^()]*\))?[^()]{0,30})\)\.?$/.exec(t);
          if (src) t = t.slice(0, src.index).trim();
          out.push({ kind: 'answer', num: reply[1], letters: reply[2].toUpperCase().replace(/\s+/g, ' ').replace('ET', 'et'), text: t, src: src?.[1] });
          continue;
        }
        const opt = ARABIC.test(line) ? null : OPTION.exec(line);
        if (opt) {
          out.push({ kind: 'option', letter: (opt[1] || opt[2]).toUpperCase(), text: opt[3] });
          continue;
        }
        if (/^[-•]\s+/.test(line)) {
          out.push({ kind: 'bullet', text: line.replace(/^[-•]\s+/, '') });
          continue;
        }
        // Réponse de QCM : « 1.12 c (définir la composition du béton), pour … »
        const ans = /^(\d{1,2}\.\d{1,2})\s+([a-eA-E](?:\s*(?:,|et)\s*[a-eA-E])*)\s*(?:\(|:|—|-|$)(.*)$/.exec(line);
        if (ans && !ARABIC.test(line)) {
          const body = ans[3].trim();
          let t = body ? line.slice(line.indexOf(ans[2]) + ans[2].length).trim() : '';
          // « (justification). suite » → « justification. suite » (parenthèses superflues à l'écran)
          const par = /^\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*(.*)$/.exec(t);
          if (par) t = `${par[1]}${par[2] && !/^[.,;]/.test(par[2]) ? ' ' : ''}${par[2]}`.trim();
          out.push({ kind: 'answer', num: ans[1], letters: ans[2].replace(/\s+/g, ' '), text: t });
          continue;
        }
        let rest = line;
        // Question numérotée : « 3. Titre court : suite » / « 2. Facteur de puissance. »
        const q = ARABIC.test(line) ? null : /^(\d{1,2})\s?[.)-]\s+(.+)$/.exec(line);
        if (q) {
          const body = q[2];
          const cut = /^(.{3,90}?)(?:\s:\s|\.\s|\.$|\s?:$)/.exec(body);
          // Titre = intitulé court (≤ 9 mots) ; sinon la première phrase reste dans le corps.
          // « Calculer … (notation CIDR). (1,5 pt) » : le barème seul ne forme pas une suite, on garde tout l'intitulé.
          const onlyPts = cut && /^\(\d+(?:[,.]\d+)?\s*pts?\)$/.test(body.slice(cut[0].length).trim());
          if (cut && !onlyPts && !/[=≈]/.test(cut[1]) && cut[1].trim().split(/\s+/).length <= 9) {
            out.push({ kind: 'question', num: q[1], title: cut[1].trim() });
            rest = body.slice(cut[0].length).trim();
          } else if (!/[=≈]/.test(body) && body.length <= 240) {
            // Énoncé de question sans calcul : tout l'intitulé est le titre de la carte.
            out.push({ kind: 'question', num: q[1], title: body });
            rest = '';
          } else {
            out.push({ kind: 'question', num: q[1], title: '' });
            rest = body;
          }
          if (!rest) continue;
        }
        for (const s of splitDense(rest)) {
          const n = NOTE.exec(s);
          if (n) {
            const { label, rest: r } = labelOf(s);
            out.push({ kind: 'note', label: label || n[1], text: label ? r : s.slice(n[0].length).replace(/^\s*:?\s*/, '') });
          } else out.push(calcOrText(s, opts.header));
        }
      }
      return out;
    })
    .filter((b) => b.length);
}
