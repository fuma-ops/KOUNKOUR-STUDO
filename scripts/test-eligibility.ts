/**
 * Test de régression du matching profil ↔ concours sur les 48 concours réels
 * (instantané de la base au 30/09/2026). Lancer : npx tsx scripts/test-eligibility.ts
 */
import fs from 'fs';
import { checkEligibility } from '../src/utils/candidateStorage';
import type { Contest, CandidateProfile } from '../src/types';

const NOW = new Date('2026-09-30T15:53:00Z').getTime();
const rows: [string, string, string, string][] = JSON.parse(
  fs.readFileSync(new URL('./eligibility-fixture.json', import.meta.url), 'utf8')
);

function statusOf(deadline: string): Contest['status'] {
  const days = Math.ceil((new Date(`${deadline}T23:59:59Z`).getTime() - NOW) / 86_400_000);
  if (days <= 0) return 'closed';
  if (days <= 7) return 'closing_soon';
  return 'open';
}

const contests: Contest[] = rows.map(([t, d, dl, sp], i) => ({
  id: `c${i}`, slug: `c${i}`, referenceCode: '', title: { fr: t, ar: t },
  administration: { id: 'a', name: { fr: 'x', ar: 'x' }, shortName: { fr: 'x', ar: 'x' }, logo: '', category: 'administration', officialWebsite: '' },
  type: { fr: '', ar: '' }, status: statusOf(dl), postsCount: 1, degreeLevel: d,
  specialty: { fr: sp, ar: sp }, region: { fr: 'National (Royaume du Maroc)', ar: '' }, location: { fr: '', ar: '' },
  publicationDate: '', deadlineDate: dl, daysRemaining: 0, isVerifiedSource: true, officialSourceUrl: '',
  overviewSummary: { fr: '', ar: '' },
  criteria: { nationality: { fr: '', ar: '' }, ageLimit: { fr: '', ar: '' }, diplomas: [], experience: { fr: '', ar: '' }, specialties: [] },
  exams: { written: [], oral: [] }, documents: [], isDemo: false,
}) as Contest);

const base: CandidateProfile = {
  fullName: '', email: '', phone: '', age: 28, degreeLevel: 'Master', specialty: '', region: 'Rabat-Salé-Kénitra',
  currentSituation: 'job_seeker', notificationsEnabled: false, alertDaysBefore: 7,
};

type Case = { label: string; profile: Partial<CandidateProfile>; expectEligible: string[]; expectVerify?: string[] };
// Règle : même spécialité ET même nombre d'années après le bac. Annonce ambiguë
// (« Master / Doctorat ») → « à vérifier » si le diplôme du profil y figure.
const cases: Case[] = [
  { label: 'Génie industriel et logistique (Master)', profile: { specialty: 'Génie industriel et logistique' }, expectEligible: [], expectVerify: [] },
  { label: 'genie industrie et logistic (fautes)', profile: { specialty: 'genie industrie et logistic' }, expectEligible: [], expectVerify: [] },
  { label: 'Génie civil (Master) — annonce « Master / Doctorat » → à vérifier', profile: { specialty: 'Génie civil' }, expectEligible: [], expectVerify: ["Ingénieur d'État (Éducation) génie civil"] },
  { label: 'Génie civil (Bac+2) — absent de « Master / Doctorat » → non', profile: { specialty: 'Génie civil', degreeLevel: 'Bac+2' }, expectEligible: [], expectVerify: [] },
  { label: 'Informatique (Master)', profile: { specialty: 'Informatique' }, expectEligible: [], expectVerify: ["Ingénieur d'État (HCP)", 'MC ENTA Informatique - Cybersécurité'] },
  { label: 'Génie électrique (Doctorat)', profile: { specialty: 'Génie électrique', degreeLevel: 'Doctorat' }, expectEligible: [], expectVerify: ['MC ENTA Génie Électrique - Systèmes Embarqués'] },
  { label: 'Droit privé (Licence) — seul concours Licence en droit déjà clos → 0', profile: { specialty: 'Droit privé', degreeLevel: 'Licence' }, expectEligible: [], expectVerify: [] },
  { label: 'Kinésithérapie (Licence) — Licence exigée, même spécialité → éligible', profile: { specialty: 'Kinésithérapie', degreeLevel: 'Licence' }, expectEligible: ['Administrateur 3e grade (Éducation)'], expectVerify: [] },
  { label: 'Kinésithérapie (Master) — Licence exigée → non (années différentes)', profile: { specialty: 'Kinésithérapie', degreeLevel: 'Master' }, expectEligible: [], expectVerify: [] },
  { label: 'Kinésithérapie (Bac+2) — Licence exigée → non', profile: { specialty: 'Kinésithérapie', degreeLevel: 'Bac+2' }, expectEligible: [], expectVerify: [] },
  { label: 'Droit privé (Master) — Administrateur 2e grade « Master / Doctorat » → à vérifier', profile: { specialty: 'Droit privé' }, expectEligible: [], expectVerify: ['Administrateur 2e grade (Éducation)'] },
  { label: 'Agronomie (Master) — Technicien Bac+2 → non ; Ingénieur « Master / Doctorat » → à vérifier', profile: { specialty: 'Agronomie' }, expectEligible: [], expectVerify: ["Ingénieur d'État (Protection civile) agronome"] },
  { label: 'Agronomie (Bac+2) — Technicien Bac+2 agricole → éligible', profile: { specialty: 'Agronomie', degreeLevel: 'Bac+2' }, expectEligible: ['Technicien 3e grade (Protection civile) agricole'], expectVerify: [] },
  { label: 'Gestion (Bac+2) — un seul mot commun n’est pas une correspondance', profile: { specialty: 'Gestion', degreeLevel: 'Bac+2' }, expectEligible: [] },
  { label: 'Pharmacie (Doctorat)', profile: { specialty: 'Pharmacie', degreeLevel: 'Doctorat' }, expectEligible: [], expectVerify: ['Pharmacien 1er grade'] },
  { label: 'Profil vide (aucune spécialité)', profile: { specialty: '' }, expectEligible: [] },
  { label: 'Spécialité en arabe', profile: { specialty: 'الهندسة المدنية' }, expectEligible: [] },
  { label: 'Génie civil, 50 ans', profile: { specialty: 'Génie civil', age: 50 }, expectEligible: [] },
];

let failures = 0;
for (const c of cases) {
  const profile = { ...base, ...c.profile } as CandidateProfile;
  const results = contests.map((ct) => ({ t: ct.title.fr, r: checkEligibility(ct, profile) }));
  const eligible = results.filter((x) => x.r.verdict === 'eligible').map((x) => x.t).sort();
  const verify = results.filter((x) => x.r.verdict === 'verify').length;
  const expected = [...c.expectEligible].sort();
  const verifyTitles = results.filter((x) => x.r.verdict === 'verify').map((x) => x.t).sort();
  const okVerify = !c.expectVerify || JSON.stringify(verifyTitles) === JSON.stringify([...c.expectVerify].sort());
  const ok = JSON.stringify(eligible) === JSON.stringify(expected) && okVerify;
  if (!ok) failures++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} | ${c.label} → ${eligible.length} éligible(s), ${verify} à vérifier, ${48 - eligible.length - verify} non éligibles`);
  if (!ok) console.log('       éligibles attendus :', expected, ' obtenus :', eligible, '\n       à vérifier attendus :', c.expectVerify, ' obtenus :', verifyTitles);
  else if (eligible.length) console.log('       ✔', eligible.join(' | '));
}
console.log(failures ? `\n${failures} cas en échec` : '\nTous les cas passent.');
process.exit(failures ? 1 : 0);
