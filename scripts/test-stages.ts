// Tests du suivi après clôture (api/_lib/stages.ts) : npm run -s test:stages
import { readFileSync, existsSync } from 'node:fs';
import { epContestId, parseEpStages, renderStagePush } from '../api/_lib/stages.ts';

let failed = 0;
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? '✅' : '❌'} ${name}`);
  if (!ok) failed++;
};
const ID = '163393e4-8773-494e-ba2d-ad108262c366';
const OTHER = '7c571fa5-42a7-46a6-8021-aed9ed9ec5f0';
const page = (types: string[], id = ID) =>
  `<nav>…</nav>${types.map((t) => `<a href="/fr/concours/download/${t}/${id}">x</a>`).join('')}
   <div class="similaires"><a href="/fr/concours/download/list_resultats/${OTHER}">autre concours</a></div>`;

check('identifiant emploi-public lu dans l’adresse', epContestId(`https://www.emploi-public.ma/fr/concours/details/${ID}`) === ID);
check('adresse sans identifiant : null', epContestId('https://www.dreamjob.ma/emploi-public/x/') === null);

const annonce = parseEpStages(page(['arrete']), ID);
check('annonce seule : aucune étape, aucun document', annonce.stage === null && annonce.docs.length === 0);

const ecrit = parseEpStages(page(['arrete', 'list_convoques', 'list_convoques']), ID);
check('convoqués écrit : étape écrit, 1 document (doublon ignoré)', ecrit.stage === 'ecrit' && ecrit.docs.length === 1 && ecrit.docs[0].doc_type === 'convoques_ecrit');

const oral = parseEpStages(page(['arrete', 'list_convoques', 'list_convoques_oral']), ID);
check('convoqués oral : étape oral, 2 documents', oral.stage === 'oral' && oral.docs.length === 2);

const res = parseEpStages(page(['arrete', 'list_convoques', 'list_convoques_oral', 'list_resultats']), ID);
check('résultats : étape résultat, 3 documents', res.stage === 'resultat' && res.docs.length === 3);
check('liens d’un autre concours (« similaires ») ignorés', res.docs.every((d) => d.url.endsWith(ID)));
check('liens absolus vers emploi-public.ma', res.docs.every((d) => d.url.startsWith('https://www.emploi-public.ma/fr/concours/download/')));

const resultsOnly = parseEpStages(page(['list_resultats']), ID);
check('résultats sans listes intermédiaires : étape résultat', resultsOnly.stage === 'resultat' && resultsOnly.docs.length === 1);

const push = renderStagePush({ contest_id: ID, slug: 'technicien-3e-grade', title_fr: 'Technicien de 3ème grade', title_ar: null, doc_type: 'resultats' }, 'fr', 'https://kounkour.com');
check('notification résultats : titre et lien vers la fiche', push.title.includes('Résultats') && push.url.startsWith('https://kounkour.com/concours/technicien-3e-grade?'));
const pushAr = renderStagePush({ contest_id: ID, slug: 's', title_fr: 'T', title_ar: null, doc_type: 'convoques_oral' }, 'ar', 'https://kounkour.com');
check('notification en arabe (titre FR en repli) + lang=ar', pushAr.title.includes('شفوي') && pushAr.body.startsWith('T') && pushAr.url.includes('lang=ar'));

// Pages réelles enregistrées (facultatif, hors dépôt).
const real = process.env.EP_SAMPLES;
if (real && existsSync(`${real}/${ID}.html`)) {
  const r = parseEpStages(readFileSync(`${real}/${ID}.html`, 'utf8'), ID);
  check('page réelle « Résultats » : 3 listes', r.stage === 'resultat' && r.docs.length === 3);
  const o = parseEpStages(readFileSync(`${real}/1ca7c692-2941-4aed-8903-a6d7758252d0.html`, 'utf8'), '1ca7c692-2941-4aed-8903-a6d7758252d0');
  check('page réelle « oral » : 2 listes', o.stage === 'oral' && o.docs.length === 2);
  const e = parseEpStages(readFileSync(`${real}/bd7d21e6-ce27-4590-9ae0-ba4755897c51.html`, 'utf8'), 'bd7d21e6-ce27-4590-9ae0-ba4755897c51');
  check('page réelle « écrit » : 1 liste', e.stage === 'ecrit' && e.docs.length === 1);
}

if (failed) {
  console.log(`\n${failed} test(s) en échec.`);
  process.exit(1);
}
console.log('\nTous les tests du suivi passent.');
