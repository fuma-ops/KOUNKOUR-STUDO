/**
 * Tests du scraper multi-source (npm run test:scrapers).
 *
 * Les pages HTML ci-dessous sont des FIXTURES SYNTHÉTIQUES reproduisant les
 * structures courantes (WordPress, liens simples) : elles vérifient la logique
 * d'extraction et de filtrage, pas la structure exacte actuelle de dreamjob.ma.
 * Le premier scan réel le confirme via le journal (« stratégie : article/links »).
 */
import {
  robotsAllows,
  parseDreamjobList,
  isDreamjobNonOpening,
  extractDreamjobAdmin,
  extractDreamjobPosts,
  extractDreamjobDeadline,
  findPossibleDuplicate,
  parseFrDateISO,
} from '../api/radar/scrape-live.ts';
import { findOfficialLink } from '../api/radar/enrich.ts';
import { parseFrenchDate } from '../src/utils/radarStorage.ts';

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      attendu ${JSON.stringify(expected)}\n      obtenu  ${JSON.stringify(actual)}`}`);
}

// ─── robots.txt ───────────────────────────────────────────────────────────────
const wpRobots = `User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php

Sitemap: https://www.dreamjob.ma/sitemap.xml`;
check('robots WordPress : /emploi-public/ autorisé', robotsAllows(wpRobots, '/emploi-public/'), true);
check('robots WordPress : /wp-admin/ interdit', robotsAllows(wpRobots, '/wp-admin/x'), false);
check('robots WordPress : Allow plus long gagne', robotsAllows(wpRobots, '/wp-admin/admin-ajax.php'), true);
check('robots Disallow: / interdit tout', robotsAllows('User-agent: *\nDisallow: /', '/emploi-public/'), false);
check('robots Disallow vide autorise tout', robotsAllows('User-agent: *\nDisallow:', '/emploi-public/'), true);
check(
  'robots groupe d’un autre robot ignoré',
  robotsAllows('User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nDisallow: /wp-admin/', '/emploi-public/'),
  true
);
check(
  'robots groupe partagé (plusieurs User-agent)',
  robotsAllows('User-agent: Googlebot\nUser-agent: *\nDisallow: /emploi-public/', '/emploi-public/'),
  false
);
check('robots joker *', robotsAllows('User-agent: *\nDisallow: /*?s=', '/?s=concours'), false);
check('robots ancre $', robotsAllows('User-agent: *\nDisallow: /*.pdf$', '/emploi-public/'), true);
check('robots vide', robotsAllows('', '/emploi-public/'), true);

// ─── Liste dreamjob : structure WordPress <article> ───────────────────────────
const wpList = `<html><body>
<header><nav>
  <a href="https://www.dreamjob.ma/">Accueil</a>
  <a href="https://www.dreamjob.ma/emploi-public/">Emploi Public</a>
  <a href="https://www.dreamjob.ma/category/concours-2026/">Concours 2026 recrutement</a>
</nav></header>
<main>
<article class="post">
  <h2 class="entry-title"><a href="https://www.dreamjob.ma/emploi-public/concours-ministere-de-la-sante-2026-500-postes/">Concours Ministère de la Santé 2026 (500 Postes)</a></h2>
  <div class="entry-summary"><p>Le Ministère de la Santé organise un concours. Dernier délai : 15 octobre 2026.</p></div>
</article>
<article class="post">
  <h2 class="entry-title"><a href="/emploi-public/commune-de-tanger-recrute-12-techniciens/">Commune de Tanger recrute 12 Techniciens</a></h2>
  <div class="entry-summary"><p>Date limite de dépôt 20/10/2026. Spécialité : Génie civil</p></div>
</article>
<article class="post">
  <h3><a href="https://www.dreamjob.ma/emploi-public/resultats-concours-onssa-2026/">Résultats Concours ONSSA 2026</a></h3>
</article>
<article class="post">
  <h2 class="entry-title"><a href="https://www.dreamjob.ma/emploi-public/concours-ministere-de-la-sante-2026-500-postes/">Concours Ministère de la Santé 2026 (500 Postes)</a></h2>
</article>
</main>
<nav class="pagination"><a href="https://www.dreamjob.ma/emploi-public/page/2/">2</a></nav>
</body></html>`;
const wp = parseDreamjobList(wpList);
check('WP : stratégie article', wp.strategy, 'article');
check('WP : 3 annonces uniques (doublon et navigation exclus)', wp.entries.length, 3);
check(
  'WP : URLs absolues avec slash final',
  wp.entries.map((e) => e.url),
  [
    'https://www.dreamjob.ma/emploi-public/concours-ministere-de-la-sante-2026-500-postes/',
    'https://www.dreamjob.ma/emploi-public/commune-de-tanger-recrute-12-techniciens/',
    'https://www.dreamjob.ma/emploi-public/resultats-concours-onssa-2026/',
  ]
);
check('WP : extrait lu', wp.entries[0].excerpt.includes('15 octobre 2026'), true);

// ─── Liste dreamjob : repli sur les liens ─────────────────────────────────────
const plainList = `<div class="list">
  <a href="https://www.dreamjob.ma/concours-ministere-de-l-interieur-2026/">Concours Ministère de l'Intérieur 2026 – 300 postes</a>
  <a href="https://www.dreamjob.ma/tag/concours/">Tag concours recrutement</a>
  <a href="https://www.dreamjob.ma/page/2/">Page suivante concours</a>
  <a href="https://www.facebook.com/concours-recrutement-maroc">Concours recrutement Facebook</a>
  <a href="https://www.dreamjob.ma/offre-commercial-casablanca/">Commercial H/F Casablanca</a>
  <a href="https://www.dreamjob.ma/wp-content/uploads/concours-recrutement.pdf">Concours recrutement PDF</a>
</div>`;
const plain = parseDreamjobList(plainList);
check('Repli : stratégie links', plain.strategy, 'links');
check(
  'Repli : seul le vrai concours est gardé',
  plain.entries.map((e) => e.slug),
  ['concours-ministere-de-l-interieur-2026']
);
check('Page vide : stratégie none', parseDreamjobList('<html><body><p>Rien</p></body></html>').strategy, 'none');

// ─── Filtrage & extraction ────────────────────────────────────────────────────
check('Résultats exclus', isDreamjobNonOpening('Résultats Concours ONSSA 2026'), true);
check('Liste des convoqués exclue', isDreamjobNonOpening('Liste des candidats convoqués DGSN 2026'), true);
check('Ouverture gardée', isDreamjobNonOpening('Concours Ministère de la Santé 2026 (500 Postes)'), false);

check('Admin : « X recrute »', extractDreamjobAdmin('Commune de Tanger recrute 12 Techniciens'), 'Commune de Tanger');
check('Admin : Ministère dans le titre', extractDreamjobAdmin('Concours Ministère de la Santé 2026 (500 Postes)'), 'Ministère de la Santé');
check('Admin : rien de sûr → null', extractDreamjobAdmin('Concours 2026 : 40 postes de secrétaires'), null);

check('Postes : « 500 Postes »', extractDreamjobPosts('Concours Ministère de la Santé 2026 (500 Postes)'), 500);
check('Postes : « recrute 12 »', extractDreamjobPosts('Commune de Tanger recrute 12 Techniciens'), 12);
check('Postes : l’année n’est pas un nombre de postes', extractDreamjobPosts('Concours ONSSA 2026'), null);

check('Délai : texte', extractDreamjobDeadline('Dernier délai : 15 octobre 2026.'), '15 octobre 2026');
check('Délai : numérique', extractDreamjobDeadline('Date limite de dépôt 20/10/2026.'), '20/10/2026');
check('Délai : 1er', extractDreamjobDeadline('avant le 1er novembre 2026'), '1er novembre 2026');
check('Délai absent → null', extractDreamjobDeadline('Concours ONSSA 2026'), null);

check('Date ISO : texte', parseFrDateISO('15 octobre 2026'), '2026-10-15');
check('Date ISO : 1er', parseFrDateISO('1er novembre 2026'), '2026-11-01');
check('Date ISO : numérique', parseFrDateISO('20/10/2026'), '2026-10-20');
check('Date ISO : invalide', parseFrDateISO('32/13/2026'), null);

const pf = parseFrenchDate('20/10/2026');
check('Date client : numérique', pf ? [pf.getFullYear(), pf.getMonth(), pf.getDate()] : null, [2026, 9, 20]);
const pf2 = parseFrenchDate('1er novembre 2026');
check('Date client : 1er', pf2 ? [pf2.getFullYear(), pf2.getMonth(), pf2.getDate()] : null, [2026, 10, 1]);

// ─── Doublons possibles ───────────────────────────────────────────────────────
const refs = [
  {
    kind: 'publie' as const,
    title: 'Concours de recrutement de 500 infirmiers',
    admin: 'Ministère de la Santé et de la Protection Sociale',
    deadline: '2026-10-15',
    url: 'https://www.emploi-public.ma/fr/concours/details/aaaa',
  },
  {
    kind: 'emploi-public' as const,
    title: 'Technicien 3ème grade',
    admin: 'Commune de Fès',
    deadline: '2026-11-02',
    url: 'https://www.emploi-public.ma/fr/concours/details/bbbb',
  },
];
check(
  'Doublon : même délai + même ministère',
  findPossibleDuplicate('Concours Ministère de la Santé 2026 (500 Postes)', 'Ministère de la Santé', '2026-10-15', refs)?.url,
  'https://www.emploi-public.ma/fr/concours/details/aaaa'
);
check(
  'Pas de doublon : autre commune, autre délai',
  findPossibleDuplicate('Commune de Tanger recrute 12 Techniciens', 'Commune de Tanger', '2026-10-20', refs),
  null
);

// ─── Lien officiel dans une annonce dreamjob ──────────────────────────────────
const postWithEp = `<article><div class="entry-content">
  <p>Voir l'annonce : <a href="https://www.facebook.com/sharer">Partager</a></p>
  <a href="https://www.dreamjob.ma/emploi-public/autre/">Autre annonce</a>
  <a href="https://www.emploi-public.ma/fr/concours/details/0f8c2a1e-1111-4222-8333-444455556666">Annonce officielle</a>
  <p>Dernier délai : 15 octobre 2026</p>
</div></article>`;
check(
  'Officiel : fiche emploi-public prioritaire',
  findOfficialLink(postWithEp, 'https://www.dreamjob.ma/emploi-public/x/'),
  {
    officialUrl: 'https://www.emploi-public.ma/fr/concours/details/0f8c2a1e-1111-4222-8333-444455556666',
    via: 'emploi-public',
    deadlineDate: '15 octobre 2026',
  }
);
const postWithPdf = `<div class="entry-content">
  <a href="https://www.dreamjob.ma/wp-content/uploads/avis.pdf">Avis (copie)</a>
  <a href="https://www.sante.gov.ma/">Site du ministère</a>
  <a href="https://www.sante.gov.ma/Documents/2026/avis-concours.pdf">Avis officiel</a>
</div>`;
check(
  'Officiel : PDF .gov.ma préféré à la copie dreamjob',
  findOfficialLink(postWithPdf, 'https://www.dreamjob.ma/emploi-public/y/').officialUrl,
  'https://www.sante.gov.ma/Documents/2026/avis-concours.pdf'
);
check(
  'Officiel : aucun lien officiel → null (l’admin le fournira)',
  findOfficialLink('<div class="entry-content"><a href="https://www.dreamjob.ma/a/">x</a></div>', 'https://www.dreamjob.ma/emploi-public/z/').officialUrl,
  null
);

console.log(failures === 0 ? '\nTous les tests passent.' : `\n${failures} test(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
