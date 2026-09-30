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

type Case = { label: string; profile: Partial<CandidateProfile>; expectEligible: string[] };
const cases: Case[] = [
  { label: 'Génie industriel et logistique (Master)', profile: { specialty: 'Génie industriel et logistique' }, expectEligible: [] },
  { label: 'genie industrie et logistic (fautes)', profile: { specialty: 'genie industrie et logistic' }, expectEligible: [] },
  { label: 'Génie civil (Master)', profile: { specialty: 'Génie civil' }, expectEligible: ["Ingénieur d'État (Éducation) génie civil"] },
  { label: 'Génie civil (Bac+2) — diplôme trop bas pour ingénieur', profile: { specialty: 'Génie civil', degreeLevel: 'Bac+2' }, expectEligible: [] },
  { label: 'Informatique (Master)', profile: { specialty: 'Informatique' }, expectEligible: ["Ingénieur d'État (HCP)", 'MC ENTA Informatique - Cybersécurité'] },
  { label: 'Génie électrique (Doctorat)', profile: { specialty: 'Génie électrique', degreeLevel: 'Doctorat' }, expectEligible: ['MC ENTA Génie Électrique - Systèmes Embarqués'] },
  { label: 'Droit privé (Licence) — Master requis à l’Éducation', profile: { specialty: 'Droit privé', degreeLevel: 'Licence' }, expectEligible: [] },
  { label: 'Droit privé (Master)', profile: { specialty: 'Droit privé' }, expectEligible: ['Administrateur 2e grade (Éducation)'] },
  { label: 'Agronomie (Master)', profile: { specialty: 'Agronomie' }, expectEligible: ["Ingénieur d'État (Protection civile) agronome", 'Technicien 3e grade (Protection civile) agricole'] },
  { label: 'Pharmacie (Doctorat)', profile: { specialty: 'Pharmacie', degreeLevel: 'Doctorat' }, expectEligible: ['Pharmacien 1er grade'] },
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
  const ok = JSON.stringify(eligible) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} | ${c.label} → ${eligible.length} éligible(s), ${verify} à vérifier, ${48 - eligible.length - verify} non éligibles`);
  if (!ok) console.log('       attendu :', expected, '\n       obtenu  :', eligible);
  else if (eligible.length) console.log('       ✔', eligible.join(' | '));
}
console.log(failures ? `\n${failures} cas en échec` : '\nTous les cas passent.');
process.exit(failures ? 1 : 0);
