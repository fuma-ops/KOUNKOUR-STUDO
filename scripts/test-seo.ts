// Tests du rendu serveur SEO (cahier §15) : npm run test:seo
import { parsePath, routePath } from '../src/lib/routes.ts';
import {
  ContestRow,
  contestState,
  fallbackTemplate,
  prepFoldersFor,
  renderContest,
  renderDocument,
  renderFolder,
  renderNotFound,
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
check('route /preparation/<dossier>', parsePath('/preparation/dgsn-gardiens-de-la-paix').name === 'folder');
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

// Sitemap et robots
const sm = renderSitemap(BASE, [contest({})], [{ slug: 'f1', title_fr: 'F', title_ar: null, organization: null, description_fr: null, description_ar: null }], [set]);
check('sitemap : fiche + lastmod honnête', sm.includes(`<loc>${BASE}/concours/ingenieur-etat-abc</loc><lastmod>2026-10-01</lastmod>`));
check('sitemap : QCM sans lastmod inventé', sm.includes(`<loc>${BASE}/preparation/qcm/annales-x-2022</loc></url>`));
check('sitemap : dossier avec annales', sm.includes(`${BASE}/preparation/f1</loc>`));
const rb = renderRobots(BASE);
check('robots : sitemap absolu + zones privées exclues', rb.includes(`Sitemap: ${BASE}/sitemap.xml`) && rb.includes('Disallow: /admin') && rb.includes('Disallow: /profil'));

const fb = renderDocument(fallbackTemplate(), p, BASE);
check('repli : charge l’application et garde le contenu', fb.includes('/assets/app.js') && fb.includes('/assets/app.css') && fb.includes('Date limite de dépôt'));

console.log(failed ? `\n${failed} échec(s)` : '\nTous les tests SEO passent.');
process.exit(failed ? 1 : 0);
