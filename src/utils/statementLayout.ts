// Mise en forme des sujets écrits et des corrigés (texte brut en base) pour la lecture
// sur téléphone. Aucune modification du contenu : on ne fait que découper et typer les lignes.
//
//   ## / ###          → titres
//   « 3. Titre : … »  → question numérotée (titre en gras, suite en dessous)
//   « Jour : … »      → libellé en gras
//   ligne avec = ou ≈ → calcul (police à chiffres nets, résultat final mis en valeur)
//   Remarque / Attention / Non tranché / Méthode → encadré
//   « - … »           → puce

export type Seg =
  | { kind: 'h2' | 'h3'; text: string }
  | { kind: 'question'; num: string; title: string }
  | { kind: 'calc'; label?: string; before: string; result: string }
  | { kind: 'text'; label?: string; text: string }
  | { kind: 'note'; label: string; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'answer'; num: string; letters: string; text: string };

const ARABIC = /[\u0600-\u06FF]/;
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

function calcOrText(s: string): Seg {
  const { label, rest } = labelOf(s);
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

export function layoutStatement(text: string): Seg[][] {
  return text
    .split(/\n\s*\n/)
    .map((block) => {
      const out: Seg[] = [];
      for (const raw of block.trim().split('\n')) {
        const line = raw.trim();
        if (!line) continue;
        const h = /^(#{2,3})\s+(.*)$/.exec(line);
        if (h) {
          out.push({ kind: h[1] === '##' ? 'h2' : 'h3', text: h[2] });
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
          if (cut && !/[=≈]/.test(cut[1]) && cut[1].trim().split(/\s+/).length <= 9) {
            out.push({ kind: 'question', num: q[1], title: cut[1].trim() });
            rest = body.slice(cut[0].length).trim();
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
          } else out.push(calcOrText(s));
        }
      }
      return out;
    })
    .filter((b) => b.length);
}
