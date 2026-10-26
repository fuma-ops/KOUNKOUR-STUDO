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
check('question sans calcul : tout l’énoncé en titre de carte', d[1].kind === 'question' && d[1].title.startsWith('Les lignes de courant') && d.length === 2);

const g = segs('1. Un organigramme permet de représenter :\nA. Les flux financiers\nB. La structure hiérarchique et fonctionnelle de l’organisation\nc) Le bilan');
check('choix « A. » sur une seule ligne (pas coupé en « A. » + texte)', g[1].kind === 'option' && g[1].letter === 'A' && g[1].text === 'Les flux financiers');
check('choix « c) » en minuscule', g[3].kind === 'option' && g[3].letter === 'C');

const h = segs('1. Réponse : B. La GRH couvre le recrutement et la formation. (GRH)\n4. Réponses : A et C — deux bonnes réponses.');
check('réponse de corrigé : lettre, texte, source', h[0].kind === 'answer' && h[0].letters === 'B' && h[0].text === 'La GRH couvre le recrutement et la formation.' && h[0].src === 'GRH');
check('réponse de corrigé à deux lettres', h[1].kind === 'answer' && h[1].letters === 'A et C');

const t = segs('Conduite | Longueur [m] | Diamètre [mm]\nC-1 | 850 | 75\nDébit [l/s] : 0 | 2,5 | 5');
check('tableau regroupé', t.length === 1 && t[0].kind === 'table' && t[0].rows.length === 3 && t[0].rows[2][0] === 'Débit [l/s]' && t[0].rows[2][1] === '0');

const hd = layoutStatement('Société Régionale Multiservices\nConcours d’accès — 2026\n\n## Partie I', { header: true });
check('en-tête du sujet', hd[0][0].kind === 'header' && hd[0][0].lines.length === 2 && hd[1][0].kind === 'h2');
const st = layoutStatement('Titre\n\nLa pompe puise d’un réservoir calé à la cote Z2 = 1270 mNGM.\nΔH = λ·L/D', { header: true }).flat();
check('énoncé : donnée avec « = » reste du texte', st[1].kind === 'text');
check('énoncé : formule courte sans résultat mis en valeur', st[2].kind === 'calc' && st[2].result === '');
check('pas d’en-tête sans l’option', layoutStatement('Société\n\n## Partie I')[0][0].kind !== 'header');

const e = segs('2. التعليق (عناصر):\n- قيمة النص: تفاؤل علمي');
check('arabe : rubrique numérotée + puce', e[0].kind === 'question' && e[1].kind === 'bullet');

const ar = segs('50) الدولة الوحيدة في العالم التي تغطيها القارة بأكملها هي :\n1. نيوزيلاندا\n2. أستراليا\nس1: الجواب 2) يصدر بإرادة منفردة عن الإدارة. (القانون الإداري)');
check('arabe : question « 50) » puis choix « 1. »', ar[0].kind === 'question' && ar[0].num === '50' && ar[1].kind === 'option' && ar[1].letter === '1' && ar[2].kind === 'option');
check('arabe : réponse « س1: الجواب 2) »', ar[3].kind === 'answer' && ar[3].num === '1' && ar[3].letters === '2' && ar[3].src === 'القانون الإداري');

const f = segs('## B. Traitement\n\n### 1- Connaissances');
check('titres ## / ###', f[0].kind === 'h2' && f[1].kind === 'h3');

if (failed) {
  console.log(`\n${failed} test(s) en échec.`);
  process.exit(1);
}
console.log('\nTous les tests de mise en forme passent.');
