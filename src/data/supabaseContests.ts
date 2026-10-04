import { getSupabase } from '../lib/supabase';
import { Contest, ContestCategory, ContestStatus } from '../types';
import { resolveAdministrationLogo, removeImportedContest } from '../utils/radarStorage';

// Lecture des concours PUBLIÉS depuis Supabase + mapping vers le type Contest de
// studo. Source unique de vérité partagée (fini le localStorage/mockContests).

const CATEGORIES: ContestCategory[] = [
  'administration', 'education', 'sante', 'finances', 'securite', 'collectivites', 'autres',
];
function mapCategory(cat: string | null): ContestCategory {
  return CATEGORIES.includes(cat as ContestCategory) ? (cat as ContestCategory) : 'autres';
}

function daysFromISO(iso: string | null): number {
  if (!iso) return 0;
  const d = new Date(`${iso}T23:59:59`);
  if (Number.isNaN(d.getTime())) return 0;
  const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  return diff > 0 ? diff : 0;
}

function formatFr(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Statut éditorial DB → statut d'affichage studo (dérivé de la date limite).
function mapStatus(dbStatus: string, deadlineISO: string | null): ContestStatus {
  if (dbStatus === 'resultats_publies') return 'results';
  if (dbStatus === 'annule' || dbStatus === 'cloture' || dbStatus === 'archive') return 'closed';
  // publie / mis_a_jour : dépend de la date limite.
  if (!deadlineISO) return 'open';
  const days = daysFromISO(deadlineISO);
  if (days <= 0) return 'closed';
  if (days <= 7) return 'closing_soon';
  return 'open';
}

const BILING_TYPE = { fr: 'Recrutement officiel sur concours', ar: 'مباراة توظيف رسمية' };

function mapRow(row: any): Contest {
  const admin = row.administrations || {};
  const nameFr = admin.name_fr || row.source_org || 'Administration publique';
  const nameAr = admin.name_ar || nameFr;
  const titleFr = row.title_fr || row.title_original || '';
  const titleAr = row.title_ar || titleFr;

  // Lire toutes les lignes de spécialité depuis contest_criteria
  const criteria = Array.isArray(row.contest_criteria) ? row.contest_criteria : [];
  const specCrits = criteria.filter((c: any) => c.criterion_type === 'specialite');
  // Conditions lues dans l'arrêté (vides si l'arrêté n'a pas encore été analysé).
  const crit = (type: string) => {
    const c = criteria.find((x: any) => x.criterion_type === type);
    return { fr: c?.value_fr || '', ar: c?.value_ar || c?.value_fr || '' };
  };
  const specialtiesList: string[] = specCrits
    .map((c: any) => c.value_fr)
    .filter((v: any) => Boolean(v && !/mentionn|voir l.annonce/i.test(v)));

  const specFr = specialtiesList.length > 0 ? specialtiesList.join(', ') : (row.specialty_fr || '');
  const specAr = specCrits[0]?.value_ar || specFr;

  // Supprimer les valeurs par défaut inventées :
  // 'Spécialités mentionnées dans l’arrêté' et 'National (Royaume du Maroc)'
  const rawRegionFr = row.region_fr || '';
  const regionFr = /National/i.test(rawRegionFr) ? '' : rawRegionFr;
  const regionAr = row.region_ar || regionFr;
  const resolvedLogo = resolveAdministrationLogo(nameFr, admin.category, titleFr);

  return {
    id: row.id,
    slug: row.slug,
    referenceCode: row.reference || '',
    image: resolvedLogo,
    title: {
      fr: titleFr,
      ar: titleAr,
    },
    administration: {
      id: row.administration_id || 'adm',
      name: { fr: nameFr, ar: nameAr },
      shortName: { fr: nameFr, ar: nameAr },
      logo: resolvedLogo,
      category: mapCategory(admin.category),
      officialWebsite: admin.official_site || '',
    },
    type: BILING_TYPE,
    status: mapStatus(row.status, row.deadline_date),
    postsCount: typeof row.positions === 'number' ? row.positions : 0,
    posts: [...(row.contest_positions || [])]
      .sort((a: any, b: any) => a.position - b.position)
      .map((p: any) => ({ province: p.province, category: p.category, diploma: p.diploma, specialty: p.specialty, count: p.count, note: p.note })),
    degreeLevel: row.diploma_fr || '',
    grade: row.grade_fr || undefined,
    grade_fr: row.grade_fr || undefined,
    recruitmentType: row.recruitment_type || undefined,
    depositType: row.deposit_type || undefined,
    depositSite: row.apply_url || undefined,
    applyUrl: row.apply_url || undefined,
    specialtiesList,
    specialty: { fr: specFr, ar: specAr },
    region: { fr: regionFr, ar: regionAr },
    location: { fr: regionFr, ar: regionAr },
    publicationDate: formatFr(row.publication_date),
    deadlineDate: formatFr(row.deadline_date),
    daysRemaining: daysFromISO(row.deadline_date),
    contestDate: formatFr(row.exam_date),
    isVerifiedSource: true,
    officialSourceUrl: row.source_url,
    overviewSummary: {
      fr: row.summary_fr || '',
      ar: row.summary_ar || '',
    },
    criteria: {
      nationality: crit('nationalite'),
      ageLimit: crit('age'),
      diplomas: row.diploma_fr ? [{ fr: row.diploma_fr, ar: row.diploma_ar || row.diploma_fr }] : [],
      experience: crit('experience'),
      specialties: specialtiesList.map((s) => ({ fr: s, ar: s })),
    },
    // Épreuves : jamais déduites. Vides tant qu'elles ne sont pas lues dans l'arrêté.
    exams: { written: [], oral: [] },
    documents: [],
    isDemo: false,
  } as Contest;
}

// Renvoie les concours publiés, ou null si Supabase indisponible (→ repli local).
export async function fetchPublishedContests(): Promise<Contest[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('contests')
      .select(
        '*, administrations ( name_fr, name_ar, category, official_site ), contest_criteria ( criterion_type, value_fr, value_ar ), contest_positions ( position, province, category, diploma, specialty, count, note )'
      )
      // Statuts publics uniquement : un admin connecté ne doit pas voir sur le site
      // les brouillons ou concours archivés (lisibles par lui via les RLS staff).
      .in('status', ['publie', 'mis_a_jour', 'cloture', 'annule', 'resultats_publies'])
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (error || !data) return null;
    return data.map(mapRow);
  } catch {
    return null;
  }
}

// Supprime définitivement un concours de Supabase (pour l'admin)
export async function deletePublishedContest(contestId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase indisponible' };
  try {
    await supabase.from('contest_criteria').delete().eq('contest_id', contestId);
    const { error } = await supabase.from('contests').delete().eq('id', contestId);
    if (error) return { ok: false, error: error.message };

    // Dé-lier les candidats dans radar_candidates si présents
    await supabase
      .from('radar_candidates')
      .update({ status: 'pending_review', imported_contest_id: null })
      .eq('imported_contest_id', contestId);

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Erreur lors de la suppression' };
  }
}

// Supprime définitivement un concours de Supabase ET du stockage local
export async function deleteContestEverywhere(contestId: string): Promise<{ ok: boolean; error?: string }> {
  removeImportedContest(contestId);
  return await deletePublishedContest(contestId);
}


