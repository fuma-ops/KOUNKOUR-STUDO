import { getSupabase } from '../lib/supabase';
import { Contest, ContestCategory, ContestStatus } from '../types';

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
  const criteria = Array.isArray(row.contest_criteria) ? row.contest_criteria : [];
  const specCrit = criteria.find((c: any) => c.criterion_type === 'specialite');
  const specFr = specCrit?.value_fr || row.diploma_fr || 'Spécialités mentionnées dans l’arrêté';
  const specAr = specCrit?.value_ar || specFr;
  const regionFr = row.region_fr || 'National (Royaume du Maroc)';
  const regionAr = row.region_ar || regionFr;

  return {
    id: row.id,
    slug: row.slug,
    referenceCode: row.reference || '',
    title: {
      fr: row.title_fr || row.title_original,
      ar: row.title_ar || row.title_fr || row.title_original,
    },
    administration: {
      id: row.administration_id || 'adm',
      name: { fr: nameFr, ar: nameAr },
      shortName: { fr: nameFr, ar: nameAr },
      logo: '',
      category: mapCategory(admin.category),
      officialWebsite: admin.official_site || '',
    },
    type: BILING_TYPE,
    status: mapStatus(row.status, row.deadline_date),
    postsCount: typeof row.positions === 'number' ? row.positions : 0,
    degreeLevel: row.diploma_fr || '',
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
      nationality: { fr: '', ar: '' },
      ageLimit: { fr: '', ar: '' },
      diplomas: row.diploma_fr ? [{ fr: row.diploma_fr, ar: row.diploma_ar || row.diploma_fr }] : [],
      experience: { fr: '', ar: '' },
      specialties: specCrit ? [{ fr: specFr, ar: specAr }] : [],
    },
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
        '*, administrations ( name_fr, name_ar, category, official_site ), contest_criteria ( criterion_type, value_fr, value_ar )'
      )
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (error || !data) return null;
    return data.map(mapRow);
  } catch {
    return null;
  }
}
