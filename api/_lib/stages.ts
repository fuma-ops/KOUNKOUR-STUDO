/**
 * Suivi d'un concours après la clôture (emploi-public.ma).
 *
 * Chaque fiche emploi-public garde le même identifiant de l'annonce aux résultats ; les
 * listes officielles y sont ajoutées au fil du concours :
 *   /fr/concours/download/list_convoques/<id>        convoqués à l'écrit
 *   /fr/concours/download/list_convoques_oral/<id>   convoqués à l'oral
 *   /fr/concours/download/list_resultats/<id>        résultats
 * L'étape n'est retenue que si la liste officielle correspondante est présente (jamais devinée).
 */

export type Stage = 'ecrit' | 'oral' | 'resultat';
export type StageDocType = 'convoques_ecrit' | 'convoques_oral' | 'resultats';

export interface StageDoc {
  doc_type: StageDocType;
  url: string;
  title_fr: string;
  title_ar: string;
}

const KINDS: Record<string, { doc_type: StageDocType; stage: Stage; title_fr: string; title_ar: string }> = {
  list_convoques: {
    doc_type: 'convoques_ecrit',
    stage: 'ecrit',
    title_fr: 'Liste des candidats convoqués à l’examen écrit',
    title_ar: 'لائحة المترشحين المدعوين لاجتياز الاختبار الكتابي',
  },
  list_convoques_oral: {
    doc_type: 'convoques_oral',
    stage: 'oral',
    title_fr: 'Liste des candidats convoqués à l’entretien oral',
    title_ar: 'لائحة المترشحين المدعوين لاجتياز الاختبار الشفوي',
  },
  list_resultats: {
    doc_type: 'resultats',
    stage: 'resultat',
    title_fr: 'Résultats du concours',
    title_ar: 'نتائج المباراة',
  },
};
const RANK: Record<Stage, number> = { ecrit: 1, oral: 2, resultat: 3 };

export const EP_ORIGIN = 'https://www.emploi-public.ma';

/** Identifiant emploi-public d'une fiche (…/fr/concours/details/<uuid>). */
export function epContestId(sourceUrl: string): string | null {
  const m = sourceUrl.match(/\/fr\/concours\/details\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return m ? m[1].toLowerCase() : null;
}

/** Listes officielles publiées sur la fiche du concours `id` (les « concours similaires » sont ignorés). */
export function parseEpStages(html: string, id: string): { stage: Stage | null; docs: StageDoc[] } {
  const docs: StageDoc[] = [];
  const seen = new Set<string>();
  let stage: Stage | null = null;
  const re = /\/fr\/concours\/download\/([a-z_]+)\/([0-9a-f-]{36})/gi;
  for (const m of html.matchAll(re)) {
    const kind = KINDS[m[1].toLowerCase()];
    if (!kind || m[2].toLowerCase() !== id.toLowerCase()) continue;
    const url = `${EP_ORIGIN}/fr/concours/download/${m[1].toLowerCase()}/${id.toLowerCase()}`;
    if (seen.has(url)) continue;
    seen.add(url);
    docs.push({ doc_type: kind.doc_type, url, title_fr: kind.title_fr, title_ar: kind.title_ar });
    if (!stage || RANK[kind.stage] > RANK[stage]) stage = kind.stage;
  }
  docs.sort((a, b) => a.doc_type.localeCompare(b.doc_type));
  return { stage, docs };
}

// ---------------------------------------------------------------------------
// Notification aux candidats qui suivent le concours (favori)
// ---------------------------------------------------------------------------
export interface StageEvent {
  contest_id: string;
  slug: string;
  title_fr: string;
  title_ar: string | null;
  doc_type: StageDocType;
}

const cut = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

export function renderStagePush(e: StageEvent, lang: 'fr' | 'ar', siteUrl: string) {
  const ar = lang === 'ar';
  const title =
    e.doc_type === 'resultats'
      ? ar ? '🏁 نتائج المباراة منشورة' : '🏁 Résultats publiés'
      : e.doc_type === 'convoques_oral'
        ? ar ? '📋 لائحة المدعوين للشفوي منشورة' : '📋 Liste des convoqués à l’oral publiée'
        : ar ? '📋 لائحة المدعوين للكتابي منشورة' : '📋 Liste des convoqués à l’écrit publiée';
  const name = cut((ar ? e.title_ar : null) || e.title_fr, 110);
  return {
    title,
    body: ar ? `${name}\nافتح اللائحة الرسمية على KounKour` : `${name}\nConsultez la liste officielle sur KounKour`,
    url: `${siteUrl}/concours/${e.slug}?${ar ? 'lang=ar&' : ''}utm_source=suivi&utm_medium=push`,
    tag: `kounkour-suivi-${e.contest_id}`,
    lang,
  };
}
