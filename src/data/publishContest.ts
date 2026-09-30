import { getSupabase } from '../lib/supabase';
import { ScrapedContestItem } from '../types/radar';
import { parseFrenchDate } from '../utils/radarStorage';

// Publie un candidat scrapé vers Supabase (table contests, statut publié) afin
// qu'il apparaisse sur le site public, et marque le candidat comme importé dans
// radar_candidates. Réservé au staff (RLS re-vérifie le rôle). Renvoie true si OK.

function slugify(input: string): string {
  return (
    input
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60) || 'concours'
  );
}

function toISODate(frText: string | undefined): string | null {
  const d = parseFrenchDate(frText);
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function publishScrapedToSupabase(item: ScrapedContestItem): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const uuid = item.id.replace(/^scrape-/, '');

  // Enrichissement depuis la page détail officielle (code du concours, date du
  // concours, date de publication, site de dépôt) — jamais inventé, null si absent.
  let enriched: any = {};
  try {
    const er = await fetch(`/api/radar/enrich?id=${encodeURIComponent(uuid)}`);
    if (er.ok) enriched = await er.json();
  } catch {
    /* la page détail peut être injoignable : on publie avec ce qu'on a */
  }

  const adminName = item.administration?.name?.fr || null;

  // Administration : retrouver ou créer.
  let adminId: string | null = null;
  if (adminName) {
    const { data: existing } = await supabase
      .from('administrations')
      .select('id')
      .eq('name_fr', adminName)
      .maybeSingle();
    if (existing) {
      adminId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from('administrations')
        .insert({
          slug: `${slugify(adminName)}-${Math.random().toString(36).slice(2, 8)}`,
          name_fr: adminName,
          category: item.administration?.category || null,
        })
        .select('id')
        .single();
      if (!error && created) adminId = created.id;
    }
  }

  const specialtyFr =
    item.specialty?.fr && !item.specialty.fr.toLowerCase().includes('mentionnée')
      ? item.specialty.fr
      : null;

  const { data: contest, error: insertError } = await supabase
    .from('contests')
    .insert({
      slug: `${slugify(item.title?.fr || 'concours')}-${uuid.slice(0, 6)}`,
      administration_id: adminId,
      title_original: item.title?.fr || 'Concours',
      title_fr: item.title?.fr || null,
      title_ar: item.title?.ar || null,
      reference: enriched.reference || item.referenceCode || null, // vrai code de la page détail, jamais inventé
      status: 'publie',
      diploma_fr: item.degreeLevel || null,
      positions: typeof item.postsCount === 'number' ? item.postsCount : null,
      region_fr: item.region?.fr || null,
      deadline_date: toISODate(enriched.deadlineDate || item.deadlineDate),
      exam_date: toISODate(enriched.examDate || (item as any).contestDate),
      publication_date: toISODate(enriched.publicationDate || item.publicationDate),
      apply_url: enriched.applyUrl || null,
      source_url: item.sourceUrl || 'https://www.emploi-public.ma',
      source_org: adminName,
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (insertError || !contest) return false;

  if (specialtyFr) {
    await supabase.from('contest_criteria').insert({
      contest_id: contest.id,
      criterion_type: 'specialite',
      value_fr: specialtyFr,
      source_page: item.sourceUrl || null,
      verification_state: 'a_verifier',
      position: 0,
    });
  }

  // Marque le candidat comme importé (s'il existe en base).
  await supabase
    .from('radar_candidates')
    .update({
      status: 'imported',
      imported_contest_id: contest.id,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('external_id', uuid);

  return true;
}

export async function publishManyScrapedToSupabase(items: ScrapedContestItem[]): Promise<number> {
  let ok = 0;
  for (const it of items) {
    // eslint-disable-next-line no-await-in-loop
    if (await publishScrapedToSupabase(it)) ok++;
  }
  return ok;
}
