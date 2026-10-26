// Dossiers de « Préparation » utiles pour un concours, d'après son intitulé, son grade,
// son organisme et ses spécialités. Partagé par l'application (fiche concours) et le
// rendu serveur (liens internes pour les moteurs de recherche). Règles prudentes : on ne
// propose un dossier que si le métier ou le grade correspond clairement.

export interface PrepMatchInput {
  title?: string | null;
  grade?: string | null;
  admin?: string | null;
  specialty?: string | null;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`]/g, "'");

// Ordre = du plus spécifique au plus général ; au plus 3 dossiers proposés.
// Slugs = qcm_folders.slug actuels (à mettre à jour si un dossier est renommé).
const RULES: { slug: string; test: (t: string, admin: string) => boolean }[] = [
  { slug: 'concours-dgsn-gardien-de-la-paix', test: (t, a) => /surete nationale|dgsn|\bpolice\b/.test(a + ' ' + t) && /gardien/.test(t) },
  { slug: 'concours-dgsn-inspecteur-de-police', test: (t, a) => /surete nationale|dgsn|\bpolice\b/.test(a + ' ' + t) && /inspecteur/.test(t) },
  { slug: 'concours-dgsn-officier-de-police', test: (t, a) => /surete nationale|dgsn|\bpolice\b/.test(a + ' ' + t) && /officier/.test(t) },
  { slug: 'concours-dgsn-commissaire-de-police', test: (t, a) => /surete nationale|dgsn|\bpolice\b/.test(a + ' ' + t) && /commissaire/.test(t) },
  { slug: 'concours-srm-onee-ingenieur-technicien-cadre', test: (t, a) => /multiservices|\bsrm\b|\bonee\b|\bradee|\bregie autonome/.test(a + ' ' + t) },
  { slug: 'concours-infirmier-technicien-sante', test: (t) => /infirmi|sage-femme|sages-femmes|technicien(s)? de sante|\bide\b|kinesitherap|aide-soignant/.test(t) },
  { slug: 'concours-chu-sante-technicien', test: (t, a) => /technicien/.test(t) && /\bchu\b|hospitalier|sante|biomedic/.test(a + ' ' + t) },
  { slug: 'concours-technicien-ingenieur-informatique', test: (t) => /(technicien|ingenieur)/.test(t) && /informatique|reseaux|developpement (des systemes|informatique)|systemes d'information|\bdigital|numerique/.test(t) },
  { slug: 'concours-technicien-genie-civil-batiment', test: (t) => /technicien/.test(t) && /genie civil|batiment|\bbtp\b|travaux publics|topograph|urbanisme|genie rural/.test(t) },
  { slug: 'concours-technicien-4e-grade', test: (t) => /technicien/.test(t) && /4e(me)? grade|4 ?eme grade|quatrieme grade|echelle 8\b/.test(t) },
  { slug: 'concours-technicien-3e-grade', test: (t) => /technicien/.test(t) && /3e(me)? grade|3 ?eme grade|troisieme grade|echelle 9\b/.test(t) },
  { slug: 'concours-administrateur-2e-3e-grade', test: (t) => /administrateur/.test(t) },
  { slug: 'concours-ingenieur-etat-1er-grade', test: (t) => /ingenieur d'etat|ingenieur(s)? (de )?(1er|premier) grade|ingenieurs? d'etat/.test(t) },
];

// Dossiers créés par la routine du matin (qcm_folders.match_terms) : un mot-clé présent
// dans l'intitulé, le grade, la spécialité ou l'organisme suffit à relier le concours.
export interface PrepFolderTerms {
  slug: string;
  matchTerms?: string[] | null;
}

export function prepFolderSlugsFor(c: PrepMatchInput, folders: PrepFolderTerms[] = []): string[] {
  const t = norm([c.title, c.grade, c.specialty].filter(Boolean).join(' '));
  const a = norm(c.admin || '');
  const out: string[] = [];
  // Enseignants-chercheurs : pas de dossier par métier (seulement un dossier dédié, s'il existe).
  if (!/maitres? de conferences|professeur|enseignant-chercheur|enseignants-chercheurs/.test(t))
    for (const r of RULES) if (r.test(t, a) && !out.includes(r.slug)) out.push(r.slug);
  const hay = ` ${t} ${a} `.replace(/[^a-z0-9']+/g, ' ');
  for (const f of folders) {
    const terms = (f.matchTerms || []).map((x) => norm(x).replace(/[^a-z0-9']+/g, ' ').trim()).filter((x) => x.length >= 4);
    if (terms.some((x) => hay.includes(` ${x} `)) && !out.includes(f.slug)) out.push(f.slug);
  }
  return out.slice(0, 3);
}
