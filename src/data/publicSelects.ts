// Colonnes lues pour les listes publiques. Partagées entre le site (repli direct sur
// Supabase) et la fonction /api/public-data (copie mise en cache par Vercel), pour que
// les deux renvoient exactement les mêmes données.
export const PUBLIC_CONTEST_STATUSES = ['publie', 'mis_a_jour', 'cloture', 'annule', 'resultats_publies'];
export const PUBLIC_CONTESTS_SELECT =
  '*, administrations ( name_fr, name_ar, category, official_site, logo_url ), contest_criteria ( criterion_type, value_fr, value_ar ), contest_positions ( position, province, category, diploma, specialty, count, note ), contest_documents ( doc_type, title_fr, title_ar, url, position, created_at )';
export const PUBLIC_QCM_SELECT =
  'id, slug, folder_slug, title_fr, title_ar, description_fr, description_ar, language, kind, category, concours_label, exam_year, source_note, source_images, source_url, statement, corrige, old_slugs, duration_minutes, difficulty, position, multi_answer, theme, administrations(name_fr, logo_url), qcm_questions(id, position, source_number, question, options)';
export const PUBLIC_FOLDERS_SELECT = '*';

export type PublicKind = 'contests' | 'qcm' | 'folders';

// Lit une liste publique via la copie mise en cache par Vercel (/api/public-data).
// Avant, chaque visiteur relisait toutes les données dans Supabase : le quota de trafic
// gratuit (5 Go/mois) a été dépassé le 24/11/2026 et le projet a été bloqué.
// null = copie indisponible (dev local, panne) : l'appelant lit alors Supabase directement.
export async function fetchPublicCache<T = any>(kind: PublicKind): Promise<T[] | null> {
  try {
    const r = await fetch(`/api/public-data?kind=${kind}`);
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j) && j.length > 0 ? (j as T[]) : null;
  } catch {
    return null;
  }
}
