import fs from 'node:fs';
import path from 'node:path';
import { parseEmploiPublicDetail } from '../api/radar/enrich.ts';

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${name}${
      ok ? '' : `\n      attendu ${JSON.stringify(expected)}\n      obtenu  ${JSON.stringify(actual)}`
    }`
  );
}

const fixturePath = path.resolve(process.cwd(), 'scripts/fixtures/ep-detail-78699344.html');
if (!fs.existsSync(fixturePath)) {
  console.error(`Fixture manquante : ${fixturePath}`);
  process.exit(1);
}

const html = fs.readFileSync(fixturePath, 'utf-8');
const detail = parseEmploiPublicDetail(html);

// Critères d'acceptation stricts :
// Spécialité ["genreraliste"] · Grade "Médecins premier grade - echelle 11"
// · Postes 10 · Type de recrutement "Recrutement régulier"
// · Région "MARRAKECH-SAFI" · Type de dépôt "dépôt en ligne sur le site de l'administration"
// · Site de dépôt "https://drh.sante.gov.ma" · Code "C42821/26" · Délai "23 Juillet 2026"
// · Date du concours "26 Juillet 2026" · Date de publication "9 Juillet 2026"
// · Administration "Ministère de la Santé et de la Protection sociale".

check('Spécialité : ["genreraliste"]', detail.specialty, ['genreraliste']);
check('Grade : "Médecins premier grade - echelle 11"', detail.grade, 'Médecins premier grade - echelle 11');
check('Postes : 10', detail.postsCount, 10);
check('Type de recrutement : "Recrutement régulier"', detail.recruitmentType, 'Recrutement régulier');
check('Région : "MARRAKECH-SAFI"', detail.region, 'MARRAKECH-SAFI');
check(
  'Type de dépôt : "dépôt en ligne sur le site de l\'administration"',
  detail.depositType,
  "dépôt en ligne sur le site de l'administration"
);
check('Site de dépôt : "https://drh.sante.gov.ma"', detail.depositSite, 'https://drh.sante.gov.ma');
check('Code : "C42821/26"', detail.reference, 'C42821/26');
check('Délai : "23 Juillet 2026"', detail.deadlineDate, '23 Juillet 2026');
check('Date du concours : "26 Juillet 2026"', detail.examDate, '26 Juillet 2026');
check('Date de publication : "9 Juillet 2026"', detail.publicationDate, '9 Juillet 2026');
check(
  'Administration : "Ministère de la Santé et de la Protection sociale"',
  detail.administration,
  'Ministère de la Santé et de la Protection sociale'
);

if (failures > 0) {
  console.error(`\n❌ ${failures} test(s) ont échoué.`);
  process.exit(1);
} else {
  console.log('\n✔ Tous les champs de la fiche détail emploi-public sont strictement conformes.');
  process.exit(0);
}
