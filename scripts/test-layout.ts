// Tests de la mise en forme des sujets / corrigés (src/utils/statementLayout.ts) : npm run -s test:layout
import { layoutStatement, type Seg } from '../src/utils/statementLayout.ts';

let failed = 0;
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? '✅' : '❌'} ${name}`);
  if (!ok) failed++;
};
const segs = (t: string): Seg[] => layoutStatement(t).flat();

const a = segs('1. Redevance de consommation active.\nÉnergie par jour : HN = 9 × 370 + 2 × 90 = 3 510 kWh ; HP = 5 × 90 = 450 kWh.\nRedevance mensuelle (30 jours) = 110 700 DH HT.');
check('question numérotée + titre', a[0].kind === 'question' && a[0].num === '1' && a[0].title === 'Redevance de consommation active');
check('calcul avec libellé', a[1].kind === 'calc' && a[1].label === 'Énergie par jour' && a[1].result === '3 510 kWh');
check('suite de calculs « ; » coupée', a[2].kind === 'calc' && a[2].result === '450 kWh');
check('résultat final sans point', a[3].kind === 'calc' && a[3].result === '110 700 DH HT');

const b = segs('1.1 d (côtes altimétriques).\n1.7 a et b (dimensionner les semelles).');
check('réponse QCM : numéro, lettre, justification', b[0].kind === 'answer' && b[0].num === '1.1' && b[0].letters === 'd' && b[0].text === 'côtes altimétriques.');
check('réponse QCM à deux lettres', b[1].kind === 'answer' && b[1].letters === 'a et b');

const c = segs('Remarque : sans les harmoniques, le cos φ1 serait de 0,65.\n- point un');
check('remarque encadrée', c[0].kind === 'note' && c[0].label === 'Remarque');
check('puce', c[1].kind === 'bullet' && c[1].text === 'point un');

const d = segs('Données (U = 400 V, THDi = 55 %) :\n1. Les lignes de courant sont parallèles à la pente et au substratum imperméable du versant.');
check('phrase d’introduction avec « = » reste du texte', d[0].kind === 'text');
check('longue phrase numérotée : pas de faux titre', d[1].kind === 'question' && d[1].title === '' && d[2].kind === 'text');

const e = segs('2. التعليق (عناصر):\n- قيمة النص: تفاؤل علمي');
check('arabe : ligne non découpée', e.every((s) => s.kind === 'text' || s.kind === 'bullet'));

const f = segs('## B. Traitement\n\n### 1- Connaissances');
check('titres ## / ###', f[0].kind === 'h2' && f[1].kind === 'h3');

if (failed) {
  console.log(`\n${failed} test(s) en échec.`);
  process.exit(1);
}
console.log('\nTous les tests de mise en forme passent.');
