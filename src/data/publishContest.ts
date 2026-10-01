import { getSupabase } from '../lib/supabase';
import { ScrapedContestItem } from '../types/radar';
import { parseFrenchDate } from '../utils/radarStorage';

// Publie un candidat scrapé vers Supabase (table contests, statut publié) afin
// qu'il apparaisse sur le site public, et marque le candidat comme importé dans
// radar_candidates. Réservé au staff (RLS re-vérifie le rôle).

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

export type PublishResult = { ok: true } | { ok: false; reason: string };

const OFFICIAL_URL = /^https:\/\/([a-z0-9-]+\.)*(gov\.ma|ac\.ma|emploi-public\.ma)(\/|$)/i;

// Suffixe de slug court et stable, dérivé de l'identifiant externe.
function shortHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h.toString(36).padStart(6, '0').slice(-6);
}

// Forme canonique d'une fiche emploi-public (celle stockée en base).
function canonicalOfficialUrl(url: string): string {
  const m = url.match(/emploi-public\.ma\/(?:fr|ar)\/concours\/details\/([0-9a-f-]{36})/i);
  return m ? `https://www.emploi-public.ma/fr/concours/details/${m[1].toLowerCase()}` : url;
}

function isAggregatorItem(item: ScrapedContestItem): boolean {
  return item.sourceId === 'src-dreamjob' || /dreamjob\.ma/i.test(item.sourceUrl || '');
}

async function enrich(query: string): Promise<any> {
  try {
    const er = await fetch(`/api/radar/enrich?${query}`);
    if (er.ok) return await er.json();
  } catch {
    /* la page détail peut être injoignable : on publie avec ce qu'on a */
  }
  return {};
}

// interactive=false (publication groupée) : pas de fenêtre de saisie ; un concours
// dreamjob sans source officielle trouvée est alors laissé en file.
export async function publishScrapedToSupabase(
  item: ScrapedContestItem,
  { interactive = true }: { interactive?: boolean } = {}
): Promise<PublishResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, reason: 'Supabase indisponible' };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'connexion admin requise' };

  const externalId = item.id.replace(/^scrape-/, '');

  // Enrichissement depuis la page détail officielle (code du concours, date du
  // concours, date de publication, site de dépôt) — jamais inventé, null si absent.
  let enriched: any;
  let sourceUrl: string;
  if (isAggregatorItem(item)) {
    // dreamjob n'est PAS une source officielle : on cherche le lien officiel cité
    // dans l'annonce, sinon l'admin le fournit. Jamais publié avec dreamjob comme source.
    enriched = await enrich(`url=${encodeURIComponent(item.sourceUrl)}`);
    let official: string | null = enriched.officialUrl || null;
    if (!official) {
      if (!interactive) return { ok: false, reason: 'source officielle introuvable dans l’annonce dreamjob' };
      const typed = window.prompt(
        `Source officielle introuvable automatiquement pour :\n« ${item.title?.fr} »\n\n` +
          'Collez l’URL officielle (fiche emploi-public.ma, site .gov.ma / .ac.ma ou PDF de l’avis) :'
      );
      if (!typed) return { ok: false, reason: 'publication annulée : source officielle manquante' };
      official = typed.trim();
      if (!OFFICIAL_URL.test(official)) {
        return { ok: false, reason: 'URL refusée : elle doit venir de emploi-public.ma, d’un site .gov.ma ou .ac.ma' };
      }
      if (/emploi-public\.ma\/(fr|ar)\/concours\/details\//i.test(official)) {
        enriched = { ...(await enrich(`url=${encodeURIComponent(official)}`)), officialUrl: official };
      }
    }
    sourceUrl = canonicalOfficialUrl(official);
  } else {
    enriched = await enrich(`id=${encodeURIComponent(externalId)}`);
    sourceUrl = item.sourceUrl || 'https://www.emploi-public.ma';
  }

  // Déjà en ligne (même source officielle) → on ne crée pas de doublon.
  const { data: already } = await supabase.from('contests').select('id').eq('source_url', sourceUrl).limit(1);
  if (already && already.length > 0) {
    await supabase
      .from('radar_candidates')
      .update({ status: 'imported', imported_contest_id: already[0].id, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('external_id', externalId);
    return { ok: false, reason: 'déjà publié sur le site (même source officielle)' };
  }

  const rawAdmin = item.administration?.name?.fr?.trim() || '';
  // Libellé générique = administration non identifiée : on ne crée pas de fiche.
  const adminName = rawAdmin && !/^administration publique( marocaine)?$/i.test(rawAdmin) ? rawAdmin : null;

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

  const rawSpecs: string[] = [];
  if (Array.isArray(enriched?.specialty)) {
    rawSpecs.push(...enriched.specialty);
  } else if (Array.isArray(enriched?.specialties)) {
    rawSpecs.push(...enriched.specialties);
  }
  if (rawSpecs.length === 0 && Array.isArray((item as any).specialtiesList)) {
    rawSpecs.push(...(item as any).specialtiesList);
  }
  if (rawSpecs.length === 0 && item.specialty?.fr) {
    rawSpecs.push(item.specialty.fr);
  }

  const validSpecialties = rawSpecs
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s && !s.toLowerCase().includes('mentionnée') && !s.toLowerCase().includes('mentionnee')));

  const rawRegion = enriched?.region || (item.region?.fr && !item.region.fr.includes('National') ? item.region.fr : null) || null;

  const { data: contest, error: insertError } = await supabase
    .from('contests')
    .insert({
      slug: `${slugify(item.title?.fr || 'concours')}-${shortHash(externalId)}`,
      administration_id: adminId,
      title_original: item.title?.fr || 'Concours',
      title_fr: item.title?.fr || null,
      title_ar: item.title?.ar || null,
      reference: enriched?.reference || item.referenceCode || null, // vrai code de la page détail, jamais inventé
      status: 'publie',
      grade_fr: enriched?.grade || (item as any).grade || null,
      recruitment_type: enriched?.recruitmentType || (item as any).recruitmentType || null,
      deposit_type: enriched?.depositType || (item as any).depositType || null,
      diploma_fr: item.degreeLevel || null,
      positions: enriched?.postsCount ?? (typeof item.postsCount === 'number' ? item.postsCount : null),
      region_fr: rawRegion,
      deadline_date: toISODate(enriched?.deadlineDate || item.deadlineDate),
      exam_date: toISODate(enriched?.examDate || (item as any).contestDate),
      publication_date: toISODate(enriched?.publicationDate || item.publicationDate),
      apply_url: enriched?.depositSite || enriched?.applyUrl || (item as any).depositSite || (item as any).applyUrl || null,
      source_url: sourceUrl,
      source_org: adminName,
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (insertError || !contest) return { ok: false, reason: insertError?.message || 'insertion refusée' };

  if (validSpecialties.length > 0) {
    const criteriaRows = validSpecialties.map((spec, idx) => ({
      contest_id: contest.id,
      criterion_type: 'specialite',
      value_fr: spec,
      source_page: sourceUrl,
      verification_state: 'a_verifier',
      position: idx,
    }));
    await supabase.from('contest_criteria').insert(criteriaRows);
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
    .eq('external_id', externalId);

  return { ok: true };
}

export async function publishManyScrapedToSupabase(
  items: ScrapedContestItem[]
): Promise<{ published: number; failures: { id: string; title: string; reason: string }[] }> {
  let published = 0;
  const failures: { id: string; title: string; reason: string }[] = [];
  for (const it of items) {
    // eslint-disable-next-line no-await-in-loop
    const r = await publishScrapedToSupabase(it, { interactive: false });
    if (r.ok) published++;
    else failures.push({ id: it.id, title: it.title?.fr || it.id, reason: r.reason });
  }
  return { published, failures };
}
