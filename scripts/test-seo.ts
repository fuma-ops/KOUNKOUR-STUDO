// Tests du rendu serveur SEO (cahier §15) : npm run test:seo
import { parsePath, routePath } from '../src/lib/routes.ts';
import { prepFolderSlugsFor } from '../src/utils/prepMatch.ts';
import {
  ContestRow,
  contestState,
  fallbackTemplate,
  prepFoldersFor,
  renderContest,
  renderDocument,
  renderFolder,
  renderNotFound,
  renderPsycho,
  renderPsyTrain,
  renderQcm,
  renderRobots,
  renderSitemap,
  shortContestTitle,
  todayMorocco,
} from '../api/_lib/seo.ts';

let failed = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ` — ${detail}`}`);
  if (!ok) failed++;
};

const BASE = 'https://kounkour.example';
const TODAY = '2026-10-04';
const contest = (over: Partial<ContestRow>): ContestRow => ({
  id: 'c1', slug: 'ingenieur-etat-abc', title_fr: "Avis de concours de recrutement de Ingénieur d'Etat 1er grade - Echelle 11", title_ar: 'مباراة توظيف مهندس دولة',
  title_original: null, status: 'publie', summary_fr: null, summary_ar: null, diploma_fr: "Diplôme d'ingénieur d'État", positions: 3, region_fr: null,
  deadline_date: '2026-10-20', exam_date: null, apply_url: 'https://www.emploi-public.ma/fr/concours/1', source_url: 'https://www.emploi-public.ma/fr/concours/1',
  source_org: 'emploi-public.ma', publication_date: '2026-09-28', published_at: null, verified_at: null, updated_at: '2026-10-01T10:00:00Z', grade_fr: null,
  reference: null, administration_id: 'a1', administrations: { name_fr: "Ministère de l'Équipement", name_ar: 'وزارة التجهيز' }, ...over,
});

// Routes
check('route /concours/<slug>', JSON.stringify(parsePath('/concours/abc')) === JSON.stringify({ name: 'contest', slug: 'abc' }));
check('route /preparation/qcm/<slug>', parsePath('/preparation/qcm/x').name === 'qcm');
check('route /preparation/<dossier>', parsePath('/preparation/concours-dgsn-gardien-de-la-paix').name === 'folder');
check('route inconnue', parsePath('/nimporte/quoi/ici').name === 'notfound');
check('aller-retour slug encodé', routePath(parsePath('/concours/%C3%A9t%C3%A9')) === '/concours/%C3%A9t%C3%A9');

// Titres et statuts
check('titre court', shortContestTitle(contest({}), 'fr') === "Concours Ingénieur d'Etat 1er grade - Echelle 11", shortContestTitle(contest({}), 'fr'));
check('date limite passée = clôturé', contestState(contest({ deadline_date: '2026-10-03' }), TODAY) === 'closed');
check('annulé', contestState(contest({ status: 'annule' }), TODAY) === 'cancelled');
check('date du jour au Maroc', /^\d{4}-\d{2}-\d{2}$/.test(todayMorocco()));

// Fiche concours
const p = renderContest('fr', contest({}), [], BASE, TODAY);
const doc = renderDocument('<!doctype html><html lang="fr" dir="ltr"><head><title>Vieux</title><meta name="description" content="vieux" /></head><body><div id="root"></div><script src="/assets/app.js"></script></body></html>', p, BASE);
check('un seul <title>', (doc.match(/<title>/g) || []).length === 1);
check('ancienne description retirée', !doc.includes('content="vieux"'));
check('titre unique', p.title.startsWith("Concours Ingénieur d'Etat") && p.title.endsWith('| KounKour'), p.title);
check('canonical', doc.includes(`<link rel="canonical" href="${BASE}/concours/ingenieur-etat-abc" />`));
check('hreflang ar', doc.includes(`hreflang="ar" href="${BASE}/concours/ingenieur-etat-abc?lang=ar"`));
check('contenu dans le HTML initial', doc.includes('<div id="root"><div class="kk-ssr"') && doc.includes('Date limite de dépôt') && doc.includes('20 octobre 2026'));
check('script de l’application conservé', doc.includes('/assets/app.js'));
check('pas de JobPosting si résumé/région manquants', !doc.includes('JobPosting'));
check('fil d’Ariane JSON-LD', doc.includes('BreadcrumbList'));
check('champ absent non affiché', !doc.includes('Région / lieu'));
const full = renderContest('fr', contest({ summary_fr: 'Recrutement de 3 ingénieurs.', region_fr: 'Rabat-Salé-Kénitra' }), [], BASE, TODAY);
check('JobPosting si annonce complète', JSON.stringify(full.jsonLd).includes('"JobPosting"'));
check('pas de JobPosting si annulé', !JSON.stringify(renderContest('fr', contest({ status: 'annule', summary_fr: 'x', region_fr: 'y' }), [], BASE, TODAY).jsonLd).includes('JobPosting'));
const EPU = 'https://www.emploi-public.ma/fr/concours/download/list_resultats/163393e4-8773-494e-ba2d-ad108262c366';
const done = renderContest('fr', contest({ summary_fr: 'x', region_fr: 'y', stage: 'resultat', contest_documents: [
  { doc_type: 'resultats', title_fr: 'Résultats du concours', title_ar: null, url: EPU, position: 30 },
  { doc_type: 'resultats', title_fr: 'Lien étranger', title_ar: null, url: 'https://exemple.org/x.pdf', position: 31 },
] }), [], BASE, TODAY);
check('suivi : titre « Résultats : … »', done.title.startsWith('Résultats : '));
check('suivi : lien officiel des résultats dans la page', done.body.includes(EPU) && done.body.includes('Suivi du concours'));
check('suivi : lien hors emploi-public.ma ignoré', !done.body.includes('exemple.org'));
check('suivi : plus de JobPosting une fois les résultats publiés', !JSON.stringify(done.jsonLd).includes('JobPosting'));
check('suivi : statut « Résultats publiés »', done.body.includes('Résultats publiés') && done.description.startsWith('Résultats publiés : PDF officiel'));
const oralP = renderContest('fr', contest({ stage: 'oral' }), [], BASE, TODAY);
check('suivi : titre convoqués à l’oral', oralP.title.startsWith('Liste des convoqués à l’oral : ') && oralP.description.startsWith('Liste des convoqués à l’oral publiée'));
const ar = renderContest('ar', contest({ summary_fr: 'Résumé FR' }), [], BASE, TODAY);
check('version arabe : titre arabe + résumé FR étiqueté', ar.body.includes('مباراة توظيف مهندس دولة') && ar.body.includes('lang="fr" dir="ltr"'));
const xss = renderContest('fr', contest({ title_fr: '<script>alert(1)</script>' }), [], BASE, TODAY);
check('échappement HTML', !xss.body.includes('<script>alert') && xss.body.includes('&lt;script&gt;'));

// QCM : questions visibles, aucune réponse
const set = {
  id: 's1', slug: 'annales-x-2022', folder_slug: 'f1', title_fr: 'Annales X 2022', title_ar: null, description_fr: 'Sujet réel.', description_ar: null,
  language: 'ar', kind: 'annales', concours_label: 'Gardiens de la paix', exam_year: 2022, source_note: null,
  qcm_questions: [{ id: 'q1', position: 1, source_number: 3, question: 'سؤال؟', options: ['أ', 'ب'] }],
};
const q = renderQcm('fr', set, { slug: 'f1', title_fr: 'Gardiens de la paix', title_ar: null, organization: null, description_fr: null, description_ar: null }, BASE);
check('QCM : questions dans le HTML', q.body.includes('سؤال؟') && q.body.includes('<li value="3">'));
check('QCM : contenu arabe en RTL', q.body.includes('<ol lang="ar" dir="rtl">'));
check('QCM : réponses non exposées (mention)', q.body.includes('après avoir répondu'));
const sib = { ...set, id: 's2', slug: 'blanc-x', title_fr: 'Concours blanc X', theme: 'Électricité' };
const other = { ...set, id: 's3', slug: 'qcm-y', title_fr: 'QCM Y', theme: 'Génie civil' };
const qn = renderQcm('fr', { ...set, theme: 'Électricité' }, { slug: 'f1', title_fr: 'Gardiens de la paix', title_ar: null, organization: null, description_fr: null, description_ar: null }, BASE, [other, sib], [contest({})], TODAY);
check('QCM : suite de visite (même spécialité d’abord, concours ouverts, dossier)',
  qn.body.indexOf('Concours blanc X') < qn.body.indexOf('QCM Y') && qn.body.includes('Dans la même spécialité : Électricité') && qn.body.includes('Concours ouverts') && qn.body.includes('Tous les supports du dossier'));
const psyFolder = { slug: 'tests-psychotechniques', title_fr: 'Tests psychotechniques', title_ar: null, organization: null, description_fr: null, description_ar: null };
const psyEn = renderQcm('fr', { ...set, slug: 'test-psychotechnique-codage-en', folder_slug: 'psychometric-tests', kind: 'entrainement', language: 'en', title_fr: 'Coding and decoding: practice set' }, psyFolder, BASE);
check('psycho : série anglaise en LTR, titre sans « Concours »', psyEn.body.includes('<ol lang="en" dir="ltr">') && psyEn.title.startsWith('Coding and decoding'));
const psyF = renderFolder('fr', psyFolder, [{ ...set, folder_slug: 'tests-psychotechniques', kind: 'entrainement' }], BASE);
const psyFEn = renderFolder('fr', { ...psyFolder, slug: 'psychometric-tests', title_fr: 'Psychometric tests' }, [{ ...set, folder_slug: 'psychometric-tests', kind: 'entrainement', language: 'en' }], BASE);
check('psycho : dossier anglais titré en anglais', psyFEn.title.startsWith('Psychometric tests: free practice tests'));
check('psycho : titre du dossier sans « Concours » ni « annales »', psyF.title.startsWith('Tests psychotechniques : QCM corrigés') && !/annales/.test(psyF.title));
const emptyFolder = renderFolder('fr', { slug: 'vide', title_fr: 'Vide', title_ar: null, organization: null, description_fr: null, description_ar: null }, [], BASE);
check('dossier sans annale = non indexé', emptyFolder.indexable === false);
const nf = renderNotFound('fr', '/concours/absent');
check('404 non indexée', nf.status === 404 && !nf.indexable && renderDocument('<html><head></head><body><div id="root"></div></body></html>', nf, BASE).includes('noindex'));

const dgsnFolder = { slug: 'f1', title_fr: 'Gardiens de la paix', title_ar: null, organization: 'DGSN — Sûreté nationale', description_fr: null, description_ar: null };
const dgsn = contest({ administrations: { name_fr: 'Ministère de l’intérieur -Direction Générale de la Sûreté Nationale-', name_ar: null } });
check('lien vers le dossier de préparation de la même administration', prepFoldersFor(dgsn, [dgsnFolder], [set]).length === 1);
check('pas de lien vers un dossier d’une autre administration', prepFoldersFor(contest({}), [dgsnFolder], [set]).length === 0);
const longAdmin = renderContest('fr', dgsn, [], BASE, TODAY);
check('titre : année gardée, administration omise si trop longue', longAdmin.title === "Concours Ingénieur d'Etat 1er grade - Echelle 11 2026 | KounKour", longAdmin.title);

// Pages « tests psychotechniques » par recruteur
check('route /tests-psychotechniques', JSON.stringify(parsePath('/tests-psychotechniques')) === JSON.stringify({ name: 'psycho', slug: null }));
check('route /tests-psychotechniques/oncf', routePath(parsePath('/tests-psychotechniques/oncf')) === '/tests-psychotechniques/oncf');
const oncfC = contest({ slug: 'oncf-100-cadres', title_fr: '100 postes – Cadres Ingénieurs (Bac+5) – ONCF', administrations: { name_fr: 'Office National des chemins de fer', name_ar: null } });
const oncfClosed = contest({ slug: 'oncf-vieux', title_fr: 'Techniciens – ONCF', deadline_date: '2026-09-01', administrations: { name_fr: 'ONCF', name_ar: null } });
const po = renderPsycho('fr', 'oncf', BASE, [oncfC, oncfClosed, contest({})], TODAY)!;
check('psycho ONCF : titre, h1, source citée', po.title.startsWith('Tests psychotechniques ONCF') && po.body.includes('<h1>Tests psychotechniques ONCF</h1>') && po.body.includes('alwadifa-maroc.com/offre/show/id/23197'));
check('psycho ONCF : concours ouverts du recruteur seulement', po.body.includes('/concours/oncf-100-cadres') && !po.body.includes('/concours/oncf-vieux') && !po.body.includes('/concours/ingenieur-etat-abc'));
check('psycho ONCF : FAQPage + fil d’Ariane', JSON.stringify(po.jsonLd).includes('"FAQPage"') && JSON.stringify(po.jsonLd).includes('"BreadcrumbList"'));
check('psycho ONCF : liens entraînement FR + EN, mention non officiel', po.body.includes('/preparation/qcm/test-psychotechnique-blanc-1-fr') && po.body.includes('/preparation/psychometric-tests') && po.body.includes('ne sont pas les sujets officiels'));
const pi = renderPsycho('ar', null, BASE, [], TODAY)!;
check('psycho : page d’ensemble AR liste les recruteurs', pi.lang === 'ar' && pi.body.includes('/tests-psychotechniques/royal-air-maroc?lang=ar') && pi.indexable);
check('psycho : recruteur inconnu = 404', renderPsycho('fr', 'douane', BASE, [], TODAY) === null);
check('psycho : dossier relié aux pages recruteurs', psyF.body.includes('/tests-psychotechniques/oncf'));
check('prepMatch : concours ONCF → dossier psycho', prepFolderSlugsFor({ title: 'Techniciens spécialisés', admin: 'Office National des Chemins de Fer' }).includes('tests-psychotechniques'));
check('prepMatch : Atlas Multiservices (RAM) n’est pas une SRM', !prepFolderSlugsFor({ title: 'Responsable de recrutement – Atlas Multiservices (groupe RAM)', admin: 'Atlas Multiservices' }).some((x) => x.startsWith('concours-srm')));
check('prepMatch : DGSN sans dossier psycho (non confirmé)', !prepFolderSlugsFor({ title: 'Gardiens de la paix', admin: 'Direction Générale de la Sûreté Nationale' }).includes('tests-psychotechniques'));

// Tests psychotechniques interactifs (générateurs, rendu, pages SEO)
{
  const { GENERATORS } = await import('../src/psy/generators.ts');
  const { LEVELS } = await import('../src/psy/core.ts');
  const { questionHtml, optionHtml } = await import('../src/psy/render.ts');
  let bad = 0;
  let total = 0;
  for (const [cat, g] of Object.entries(GENERATORS))
    for (const l of LEVELS)
      for (let k = 0; k < 150; k++) {
        const q = g(k, l);
        total++;
        const vals = new Set(q.options.map((o) => JSON.stringify(o.value)));
        const ok =
          q.category === cat &&
          q.options.length === (l === 'difficile' ? 5 : 4) &&
          vals.size === q.options.length &&
          q.options.some((o) => o.id === q.correct_option_id) &&
          q.time_limit > 0 &&
          q.explanation.length > 20 &&
          JSON.stringify(g(k, l)) === JSON.stringify(q) && // même graine = même question (serveur et client)
          !/undefined|NaN/.test(questionHtml(q, 'u') + q.options.map((o) => optionHtml(q, o.value, 'u' + o.id)).join(''));
        if (!ok) bad++;
      }
  check(`psy : ${total} questions générées valides (4 à 5 réponses distinctes, bonne réponse présente, rendu sans NaN)`, bad === 0, `${bad} invalides`);
  // Mécanique : sens et vitesse recalculés indépendamment.
  let mecaBad = 0;
  for (let k = 0; k < 200; k++) {
    const q = GENERATORS.mecanique(k, 'difficile');
    const { wheels, links, start } = q.question_data;
    const inv = links.filter((x: string) => x !== 'courroie').length % 2 === 1;
    const want = { dir: inv ? 'antihoraire' : 'horaire', rpm: (start.rpm * wheels[0].teeth) / wheels[wheels.length - 1].teeth };
    if (JSON.stringify(q.options.find((o) => o.id === q.correct_option_id)!.value) !== JSON.stringify(want)) mecaBad++;
  }
  check('psy : engrenages, bonne réponse recalculée', mecaBad === 0, `${mecaBad} erreurs`);
  // Barrage : le nombre annoncé est bien le nombre de figures identiques aux modèles.
  let attBad = 0;
  for (let k = 0; k < 200; k++) {
    const q = GENERATORS.attention(k, 'moyen');
    const n = q.question_data.grid.filter((x: string) => q.question_data.targets.includes(x)).length;
    if (q.options.find((o) => o.id === q.correct_option_id)!.value !== n) attBad++;
  }
  check('psy : barrage, comptage exact', attBad === 0, `${attBad} erreurs`);
}
check('route /tests-psychotechniques/en-ligne', JSON.stringify(parsePath('/tests-psychotechniques/en-ligne')) === JSON.stringify({ name: 'psytrain', slug: null }));
check('route /tests-psychotechniques/en-ligne/dominos', routePath(parsePath('/tests-psychotechniques/en-ligne/dominos')) === '/tests-psychotechniques/en-ligne/dominos');
const pt = renderPsyTrain('matrices-de-raven', BASE)!;
check('psy : page famille indexable, FR seule (pas de hreflang ar)', pt.indexable && pt.frOnly === true && !renderDocument(fallbackTemplate(), pt, BASE).includes('hreflang="ar"'));
check('psy : 3 exemples dessinés + réponse repliée', (pt.body.match(/class="psy-ex"/g) || []).length === 3 && pt.body.includes('<details><summary>Voir la réponse'));
check('psy : JSON-LD fil d’Ariane + FAQ + Quiz', ['BreadcrumbList', 'FAQPage', 'Quiz'].every((t) => JSON.stringify(pt.jsonLd).includes(`"${t}"`)));
check('psy : mention « pas les tests officiels »', pt.body.includes('ce ne sont pas les tests officiels'));
check('psy : aucune image externe', !/<img\b/.test(pt.body) && !/<img\b/.test(renderPsyTrain(null, BASE)!.body));
check('psy : famille inconnue → 404', renderPsyTrain('inconnu', BASE) === null);
check('psy : page d’accueil des tests liée aux 6 familles', ['matrices-de-raven', 'dominos', 'cubes-aptitude-spatiale', 'logique-mecanique', 'test-de-barrage', 'suites-numeriques'].every((x) => renderPsyTrain(null, BASE)!.body.includes(`/tests-psychotechniques/en-ligne/${x}"`)));

// Sitemap et robots
const sm = renderSitemap(BASE, [contest({})], [{ slug: 'f1', title_fr: 'F', title_ar: null, organization: null, description_fr: null, description_ar: null }], [set]);
check('sitemap : fiche + lastmod honnête', sm.includes(`<loc>${BASE}/concours/ingenieur-etat-abc</loc><lastmod>2026-10-01</lastmod>`));
check('sitemap : QCM sans lastmod inventé', sm.includes(`<loc>${BASE}/preparation/qcm/annales-x-2022</loc></url>`));
check('sitemap : pages psycho', sm.includes(`${BASE}/tests-psychotechniques</loc>`) && sm.includes(`${BASE}/tests-psychotechniques/protection-civile</loc>`));
check('sitemap : tests psychotechniques en ligne', sm.includes(`${BASE}/tests-psychotechniques/en-ligne</loc>`) && sm.includes(`${BASE}/tests-psychotechniques/en-ligne/test-de-barrage</loc>`));
check('sitemap : dossier avec annales', sm.includes(`${BASE}/preparation/f1</loc>`));
const rb = renderRobots(BASE);
check('robots : sitemap absolu + zones privées exclues', rb.includes(`Sitemap: ${BASE}/sitemap.xml`) && rb.includes('Disallow: /admin') && rb.includes('Disallow: /profil'));

const fb = renderDocument(fallbackTemplate(), p, BASE);
check('repli : charge l’application et garde le contenu', fb.includes('/assets/app.js') && fb.includes('/assets/app.css') && fb.includes('Date limite de dépôt'));

console.log(failed ? `\n${failed} échec(s)` : '\nTous les tests SEO passent.');
process.exit(failed ? 1 : 0);
