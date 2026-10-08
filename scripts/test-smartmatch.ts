/**
 * Smart Match V2 — régression sur les concours ouverts réels (instantané Supabase
 * du 08/10/2026, scripts/smartmatch-fixture.json). Lancer : npx tsx scripts/test-smartmatch.ts
 * Affiche, pour des profils types, les concours « correspondent » et « à vérifier ».
 */
import fs from 'fs';
import { checkEligibility, compareSpecialty, degreeYearsIn, parseAgeRule } from '../src/utils/smartMatch';
import type { Contest, CandidateProfile } from '../src/types';

type Row = { id: string; t: string; d: string | null; dl: string; r: string | null; g: string | null; s: string[] | null; a: string | null; p: [string | null, string | null, string | null, string | null, number | null][] | null };
const rows: Row[] = JSON.parse(fs.readFileSync(new URL('./smartmatch-fixture.json', import.meta.url), 'utf8'));

const contests: Contest[] = rows.map((x) => ({
  id: x.id, slug: x.id, referenceCode: '', title: { fr: x.t, ar: x.t },
  administration: { id: 'a', name: { fr: '', ar: '' }, shortName: { fr: '', ar: '' }, logo: '', category: 'administration', officialWebsite: '' },
  type: { fr: '', ar: '' }, status: 'open', postsCount: 1, degreeLevel: x.d || '',
  posts: (x.p || []).map(([province, category, diploma, specialty, count]) => ({ province, category, diploma, specialty, count, note: null })),
  specialtiesList: x.s || [], specialty: { fr: (x.s || []).join(', '), ar: '' }, region: { fr: x.r || '', ar: '' }, location: { fr: '', ar: '' },
  publicationDate: '', deadlineDate: x.dl, daysRemaining: 10, isVerifiedSource: true, officialSourceUrl: '',
  overviewSummary: { fr: '', ar: '' },
  criteria: { nationality: { fr: '', ar: '' }, ageLimit: { fr: x.a || '', ar: '' }, diplomas: [], experience: { fr: '', ar: '' }, specialties: [] },
  exams: { written: [], oral: [] }, documents: [], isDemo: false,
}) as Contest);

let failures = 0;
const expect = (label: string, ok: boolean, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} | ${label}${ok || !detail ? '' : '  → ' + detail}`);
};

// --- Règles unitaires -------------------------------------------------------
const sp = (req: string, mine: string[]) => compareSpecialty(req, mine).level;
expect('Informatique (annonce) accepte Développement informatique', sp('Informatique', ['Développement informatique']) === 'match');
expect('Cybersécurité (annonce) ≠ Informatique générale → à vérifier', sp('Cybersécurité', ['Informatique']) === 'close');
expect('Génie civil ou hydraulique → Génie civil correspond', sp('Génie civil ou hydraulique', ['Génie civil']) === 'match');
expect("Systèmes d'information n'est pas confondu avec … « information » en communication", sp("Sciences de l'information et de la communication", ['Informatique']) !== 'match');
expect('Droit privé en arabe ≠ Langues', sp('Droit privé en arabe', ['Anglais']) === 'none');
expect('Droit privé en arabe ↔ Droit privé', sp('Droit privé en arabe', ['Droit privé']) === 'match');
expect('Urologie ≠ Médecine générale', sp('Urologie', ['Médecine générale']) === 'none');
expect('Urologie ↔ Urologie', sp('Urologie', ['Urologie']) === 'match');
expect('Gestion des entreprises ↔ Comptabilité → à vérifier', sp('Gestion des entreprises', ['Comptabilité']) === 'close');
expect('Audit et contrôle de gestion ↔ Audit', sp('Audit et contrôle de gestion', ['Audit et contrôle de gestion']) === 'match');
expect('Toutes spécialités → correspond', sp('Toutes spécialités', ['Chimie']) === 'match');
expect('Infirmier polyvalent ↔ Anesthésie (posts infirmiers) → à vérifier', sp('Anesthésie et réanimation', ['Infirmier polyvalent']) === 'close');
expect('Génie électrique ≠ Génie civil', sp('Génie électrique', ['Génie civil']) === 'none');
expect('Électromécanique ↔ Génie mécanique → à vérifier', sp('Électromécanique', ['Génie mécanique']) === 'close');
expect('DESA, DESS, master… → Bac+5', JSON.stringify(degreeYearsIn('DESA, DESS, master ou master spécialisé')) === '[5]');
expect('Baccalauréat et TS (Bac+2) → Bac+2', JSON.stringify(degreeYearsIn('Baccalauréat et diplôme de technicien spécialisé (Bac+2)')) === '[2]');
expect("Ingénieur d'application → Bac+3", degreeYearsIn("licence, MST, ingénieur d'application").includes(3));
const ar = parseAgeRule('Moins de 45 ans à la date de prise de service (moins de 40 ans avec le diplôme de technicien spécialisé)');
expect('Âge : « moins de 45 ans (moins de 40…) » → max 45 strict', !!ar && ar.max === 45 && ar.strictMax);
const ar2 = parseAgeRule('18 ans au moins et 40 ans au plus, limite prolongeable de la durée des services validables pour la retraite sans dépasser 45 ans (sans limite pour les fonctionnaires)');
expect('Âge : prolongeable jusqu’à 45 + fonctionnaires', !!ar2 && ar2.max === 40 && ar2.extendedMax === 45 && ar2.civilServantNoLimit);

// Diplôme (règle KounKour : même nombre d'années après le bac, sauf « au moins »)
const mk = (degreeLevel: string, spec: string, age = ''): Contest => ({ ...contests[0], id: 'x', posts: [], degreeLevel, specialtiesList: [spec], specialty: { fr: spec, ar: '' }, criteria: { ...contests[0].criteria, ageLimit: { fr: age, ar: '' } } });
const P = (degreeLevel: string, specialty: string, extra: Partial<CandidateProfile> = {}) => ({ fullName: '', email: '', phone: '', age: 27, degreeLevel, specialty, region: '', currentSituation: 'job_seeker', notificationsEnabled: false, alertDaysBefore: 7, ...extra }) as CandidateProfile;
const v = (c: Contest, p: CandidateProfile) => checkEligibility(c, p).verdict;
expect('Master pour un concours Licence → hors profil', v(mk('Licence (Bac+3) ou équivalent', 'Informatique'), P('Master', 'Informatique')) === 'not_eligible');
expect('Licence pour « Bac+3 minimum » → correspond', v(mk('Bac+3 minimum', 'Informatique'), P('Licence', 'Informatique')) === 'eligible');
expect('Master pour « licence au minimum » → correspond', v(mk('Technicien spécialisé ou licence au minimum', 'Informatique'), P('Master', 'Informatique')) === 'eligible');
expect('Bac+2 pour « Bac+3 minimum » → hors profil', v(mk('Bac+3 minimum', 'Informatique'), P('Bac+2', 'Informatique')) === 'not_eligible');
expect('Diplôme absent de l’annonce → à vérifier', v(mk('', 'Informatique'), P('Master', 'Informatique')) === 'verify');
expect('Âge 41, limite 40 prolongeable à 45 → à vérifier', v(mk('Master', 'Informatique', '18 ans au moins et 40 ans au plus, limite prolongeable … sans dépasser 45 ans'), P('Master', 'Informatique', { age: 41 })) === 'verify');
expect('Âge 47, limite 45 → hors profil', v(mk('Master', 'Informatique', '45 ans au plus'), P('Master', 'Informatique', { age: 47 })) === 'not_eligible');
expect('Âge 50 fonctionnaire, « sans limite pour les fonctionnaires » → correspond', v(mk('Master', 'Informatique', '45 ans au plus (sans limite pour les fonctionnaires)'), P('Master', 'Informatique', { age: 50, currentSituation: 'civil_servant' })) === 'eligible');
expect('Concours clôturé → hors profil', checkEligibility({ ...mk('Master', 'Informatique'), status: 'closed' }, P('Master', 'Informatique')).verdict === 'not_eligible');

// --- Profils types sur les 216 concours ---------------------------------------
const base: CandidateProfile = { fullName: '', email: '', phone: '', age: 27, degreeLevel: 'Master', specialty: '', region: '', currentSituation: 'job_seeker', notificationsEnabled: false, alertDaysBefore: 7 };
const profiles: [string, Partial<CandidateProfile>, number][] = [
  // [libellé, profil, minimum de concours « correspondent » attendus]
  ['Master Informatique', { specialty: 'Informatique' }, 3],
  ['Bac+2 Développement digital', { degreeLevel: 'Bac+2', specialty: 'Développement digital' }, 3],
  ['Ingénieur Génie civil', { specialty: 'Génie civil' }, 3],
  ['Bac+2 Génie civil', { degreeLevel: 'Bac+2', specialty: 'Génie civil' }, 1],
  ['Master Audit et contrôle de gestion', { specialty: 'Audit et contrôle de gestion' }, 3],
  ['Licence Sciences économiques', { degreeLevel: 'Licence', specialty: 'Sciences économiques' }, 1],
  ['Licence Infirmier polyvalent', { degreeLevel: 'Licence', specialty: 'Infirmier polyvalent' }, 1],
  ['Master Droit privé', { specialty: 'Droit privé' }, 1],
  ['Bac+2 Électricité, 42 ans', { degreeLevel: 'Bac+2', specialty: 'Électricité', age: 42 }, 0],
  ['Doctorat Urologie', { degreeLevel: 'Doctorat', specialty: 'Urologie' }, 1],
  ['Master Informatique + Data (2 spécialités)', { specialties: ['Informatique', 'Big data'] }, 6],
  ['Profil vide', {}, 0],
];
for (const [label, partial, min] of profiles) {
  const prof = { ...base, ...partial } as CandidateProfile;
  const res = contests.map((c) => ({ c, r: checkEligibility(c, prof) }));
  const ok = res.filter((x) => x.r.verdict === 'eligible');
  const ver = res.filter((x) => x.r.verdict === 'verify');
  expect(`${label} → ${ok.length} correspondent, ${ver.length} à vérifier`, ok.length >= min);
  for (const x of ok.slice(0, 6)) console.log('       ✔', x.c.title.fr.slice(0, 95), x.r.matchedPostsCount ? `(${x.r.matchedPostsCount} poste(s) pour vous)` : '');
  for (const x of ver.slice(0, 4)) console.log('       ?', x.c.title.fr.slice(0, 80), '—', x.r.reasons[0]?.fr.slice(0, 110));
}
if (process.argv.includes('--profile-vide-check')) {
  const res = contests.map((c) => checkEligibility(c, base));
  console.log(res.filter((r) => r.verdict === 'eligible').length);
}
console.log(failures ? `\n${failures} cas en échec` : '\nTous les cas passent.');
process.exit(failures ? 1 : 0);
