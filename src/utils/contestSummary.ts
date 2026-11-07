// Découpage du résumé d'un concours lu dans l'arrêté (texte en base : « Postes : … Diplôme : …
// Conditions : … »). Partagé par l'application (ContestSummary, fiche concours) et le rendu serveur
// (api/_lib/seo.ts). Le texte n'est jamais modifié, seulement découpé.

export const SUMMARY_KEYS = ['Postes', 'Diplôme', 'Conditions', 'Âge', 'Épreuves', 'Candidature', 'Pièces', 'Date du concours'] as const;
export type SummaryKey = (typeof SUMMARY_KEYS)[number];
const RE = new RegExp(`(?:^|\\.\\s+)(${SUMMARY_KEYS.join('|')}) : `, 'g');

export function splitSummary(text: string): { intro: string; parts: { key: SummaryKey; body: string }[]; note: string } {
  const hits = [...text.matchAll(RE)];
  if (!hits.length) return { intro: text, parts: [], note: '' };
  const intro = text.slice(0, hits[0].index).trim();
  const parts = hits.map((m, i) => {
    const start = (m.index || 0) + m[0].length;
    const end = i + 1 < hits.length ? hits[i + 1].index || text.length : text.length;
    return { key: m[1] as SummaryKey, body: text.slice(start, end).trim().replace(/\.$/, '') };
  });
  // La dernière rubrique peut être suivie d'une note libre (« Date et lieu communiqués… ») : on la sépare
  // à la première fin de phrase suivie d'une majuscule.
  let note = '';
  const last = parts[parts.length - 1];
  const cut = /^(.+?)\.\s+(?=[A-ZÉÈÀÂÎÔ])([\s\S]+)$/.exec(last.body);
  if (cut) {
    last.body = cut[1];
    note = cut[2];
  }
  return { intro, parts, note };
}

// Une rubrique devient une liste quand elle énumère (« ; », ou beaucoup de virgules pour les pièces).
export function summaryItems(key: string, body: string): string[] {
  let list = body.split(/\s*;\s*/).filter(Boolean);
  if (list.length < 2 && key === 'Pièces' && (body.match(/,/g) || []).length >= 3) list = body.split(/,\s+(?![^()]*\))/);
  return list.map((x) => x.trim().replace(/\.$/, ''));
}

// Rubrique d'un résumé (texte brut), ou '' si absente.
export function summaryPart(text: string, key: SummaryKey): string {
  return splitSummary(text).parts.find((p) => p.key === key)?.body || '';
}
