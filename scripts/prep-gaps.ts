// Concours ouverts sans préparation (aucun dossier avec du contenu ne leur est relié),
// regroupés par famille de métier. Utilisé par la routine du matin pour choisir les
// QCM d'entraînement ou les annales à ajouter en priorité.
//
//   npx tsx scripts/prep-gaps.ts            → JSON trié (le plus de postes d'abord)
//
// Lecture publique uniquement (clé « publishable ») : aucune écriture ici.
import { prepFolderSlugsFor } from '../src/utils/prepMatch.ts';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../api/_lib/supabaseEnv.ts';

async function get(path: string): Promise<any[]> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SUPABASE_ANON_KEY } });
  if (!r.ok) throw new Error(`${path} : ${r.status} ${await r.text()}`);
  return r.json();
}

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Casablanca' });
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const [contests, folders, sets] = await Promise.all([
  get(`contests?select=slug,title_fr,grade_fr,source_org,deadline_date,positions,administrations(name_fr),contest_positions(specialty,category)&status=in.(publie,mis_a_jour)&deadline_date=gte.${today}&limit=1000`),
  get('qcm_folders?select=slug,title_fr,match_terms&status=eq.published'),
  get('qcm_sets?select=folder_slug&status=eq.published'),
]);
const withContent = new Set(sets.map((s) => s.folder_slug));
const terms = folders.map((f) => ({ slug: f.slug, matchTerms: f.match_terms }));

const families = new Map<string, { famille: string; postes: number; concours: { slug: string; titre: string; date_limite: string }[] }>();
for (const c of contests) {
  const specs = (c.contest_positions || []).map((p: any) => p.specialty).filter(Boolean);
  const matched = prepFolderSlugsFor(
    { title: c.title_fr, grade: c.grade_fr, admin: `${c.administrations?.name_fr || ''} ${c.source_org || ''}`, specialty: specs.join(' ') },
    terms
  ).filter((s) => withContent.has(s));
  if (matched.length) continue;
  const grade = (c.grade_fr || c.contest_positions?.[0]?.category || c.title_fr || '').replace(/\s*[-–]\s*[ée]chelle\s*\d+/i, '').trim();
  const key = norm(`${grade} | ${specs[0] || ''}`).replace(/\s+/g, ' ').trim();
  const f = families.get(key) || { famille: `${grade}${specs[0] ? ` — ${specs[0]}` : ''}`, postes: 0, concours: [] };
  f.postes += c.positions || 1;
  f.concours.push({ slug: c.slug, titre: c.title_fr, date_limite: c.deadline_date });
  families.set(key, f);
}
const out = [...families.values()].sort((a, b) => b.postes - a.postes);
console.log(JSON.stringify({ date: today, concours_ouverts: contests.length, sans_preparation: out.reduce((n, f) => n + f.concours.length, 0), familles: out }, null, 2));
