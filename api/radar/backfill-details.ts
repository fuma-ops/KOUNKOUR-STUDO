/**
 * Fonction serverless Vercel — mise à jour des fiches déjà publiées.
 *
 * GET /api/radar/backfill-details?offset=0&limit=6   (jeton admin obligatoire)
 *
 * Pour chaque concours, deux sources, dans cet ordre :
 *   1. emploi-public.ma (OFFICIEL) : la fiche détail du concours (source_url).
 *   2. dreamjob.ma (agrégateur) : UNIQUEMENT pour compléter ce qui manque encore,
 *      et UNIQUEMENT si l'annonce est reliée de façon sûre au concours :
 *        - soit l'annonce a été publiée par le Radar vers ce concours
 *          (radar_candidates.imported_contest_id) ;
 *        - soit l'annonce cite elle-même la fiche emploi-public de ce concours.
 *      Un simple titre ressemblant n'autorise AUCUNE écriture : il est signalé.
 *
 * Règles : on ne remplace jamais une valeur existante, on n'écrit jamais null,
 * on ne déduit rien (pas de diplôme « deviné » depuis le grade). Les spécialités
 * sont marquées « a_verifier » avec la page d'où elles viennent.
 */
import { createClient } from '@supabase/supabase-js';
import {
  BROWSER_HEADERS,
  canonicalEmploiPublicUrl,
  normTokens,
  overlap,
  parseDreamjobPost,
  parseEmploiPublicDetail,
  parseFrDateISO,
} from '../_lib/parsers.ts';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://zcxkxqsqzwtdnrupxlah.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_YfuzhtBBjs7CM1YxjphZzQ__r3Q3VZM';

const DREAMJOB_SOURCE_ID = '33333333-3333-4333-8333-333333333333';
const PARALLEL = 3;
const MAX_LIMIT = 6;

const isGenericSpecialty = (v: string | null | undefined) =>
  !v || /mentionn|non pr[ée]cis|non sp[ée]cifi/i.test(v);

async function getHtml(url: string): Promise<{ ok: true; html: string } | { ok: false; error: string }> {
  try {
    const r = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(7000) });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    return { ok: true, html: await r.text() };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'injoignable' };
  }
}

interface Fill {
  updates: Record<string, any>;
  fields: string[];
}

// Ajoute un champ seulement s'il manque encore et que la valeur existe.
export function fillIfMissing(fill: Fill, current: Record<string, any>, column: string, value: any, label: string) {
  if (value === null || value === undefined || value === '') return;
  if (column in fill.updates) return;
  const cur = current[column];
  const missing =
    cur === null || cur === undefined || cur === '' ||
    (column === 'positions' && !(cur > 0)) ||
    (column === 'reference' && String(cur).length < 3) ||
    (column === 'region_fr' && /^(national|r[ée]gions du royaume)/i.test(String(cur)));
  if (!missing) return;
  fill.updates[column] = value;
  fill.fields.push(label);
}

export default async function handler(req: any, res: any) {
  try {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      res.status(401).json({ ok: false, error: 'Jeton de session admin requis (Authorization: Bearer <token>).' });
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const offset = Math.max(0, parseInt(req.query?.offset || '0', 10) || 0);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query?.limit || String(MAX_LIMIT), 10) || MAX_LIMIT));

    // Concours visibles sur le site uniquement (pas les archivés/brouillons).
    const PUBLIC_STATUSES = ['publie', 'mis_a_jour', 'cloture', 'annule', 'resultats_publies'];
    const { count: totalCount } = await supabase
      .from('contests')
      .select('id', { count: 'exact', head: true })
      .in('status', PUBLIC_STATUSES);

    const { data: contests, error: fetchErr } = await supabase
      .from('contests')
      .select('id, title_fr, title_original, source_org, source_url, reference, grade_fr, recruitment_type, deposit_type, region_fr, positions, apply_url, deadline_date, exam_date, publication_date')
      .in('status', PUBLIC_STATUSES)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (fetchErr || !contests) {
      res.status(500).json({ ok: false, error: fetchErr?.message || 'Erreur lors de la lecture des concours.' });
      return;
    }

    // Annonces dreamjob déjà découvertes par le Radar (lecture staff).
    const { data: djCands } = await supabase
      .from('radar_candidates')
      .select('source_url, imported_contest_id, title_original, administration_name, deadline_date')
      .eq('source_id', DREAMJOB_SOURCE_ID);
    const dreamjob = djCands || [];

    const updated: { id: string; title: string; fields: string[] }[] = [];
    const alreadyComplete: { id: string; title: string; reason?: string }[] = [];
    const unreachable: { id: string; title: string; url: string; error: string }[] = [];
    const possibleDreamjob: { id: string; title: string; url: string }[] = [];

    async function processContest(c: any) {
      const title = c.title_fr || c.title_original || c.id;
      const fill: Fill = { updates: {}, fields: [] };
      let specialties: { values: string[]; page: string; from: 'emploi-public' | 'dreamjob' } | null = null;

      const { data: crit } = await supabase
        .from('contest_criteria')
        .select('id, value_fr')
        .eq('contest_id', c.id)
        .eq('criterion_type', 'specialite');
      const existingSpecs = crit || [];
      const needSpecialty = existingSpecs.length === 0 || existingSpecs.some((x: any) => isGenericSpecialty(x.value_fr));

      // 1. emploi-public (officiel)
      const epUrl = canonicalEmploiPublicUrl(c.source_url);
      if (epUrl) {
        const page = await getHtml(epUrl);
        if (!page.ok) {
          unreachable.push({ id: c.id, title, url: epUrl, error: page.error });
        } else {
          const d = parseEmploiPublicDetail(page.html);
          fillIfMissing(fill, c, 'reference', d.reference, 'code');
          fillIfMissing(fill, c, 'grade_fr', d.grade, 'grade');
          fillIfMissing(fill, c, 'recruitment_type', d.recruitmentType, 'type de recrutement');
          fillIfMissing(fill, c, 'deposit_type', d.depositType, 'type de dépôt');
          fillIfMissing(fill, c, 'region_fr', d.region, 'région');
          fillIfMissing(fill, c, 'positions', d.postsCount, 'postes');
          fillIfMissing(fill, c, 'apply_url', d.depositSite, 'site de dépôt');
          fillIfMissing(fill, c, 'deadline_date', d.deadlineDate ? parseFrDateISO(d.deadlineDate) : null, 'date limite');
          fillIfMissing(fill, c, 'exam_date', d.examDate ? parseFrDateISO(d.examDate) : null, 'date du concours');
          fillIfMissing(fill, c, 'publication_date', d.publicationDate ? parseFrDateISO(d.publicationDate) : null, 'date de publication');
          if (needSpecialty && d.specialty && d.specialty.length > 0) {
            specialties = { values: d.specialty, page: epUrl, from: 'emploi-public' };
          }
        }
      }

      // 2. dreamjob (complément) — seulement si quelque chose manque encore.
      const merged = { ...c, ...fill.updates };
      const stillMissing =
        (needSpecialty && !specialties) ||
        !merged.exam_date || !merged.publication_date || !merged.deadline_date ||
        !(merged.reference && String(merged.reference).length >= 3) || !(merged.positions > 0);
      if (stillMissing && dreamjob.length > 0) {
        const linked = dreamjob.filter((d: any) => d.imported_contest_id === c.id);
        const mine = normTokens(`${title} ${c.source_org || ''}`);
        const similar = dreamjob
          .filter((d: any) => d.imported_contest_id !== c.id)
          .map((d: any) => {
            const score = overlap(mine, normTokens(`${d.title_original || ''} ${d.administration_name || ''}`));
            const sameDeadline = !!c.deadline_date && d.deadline_date === c.deadline_date;
            return { d, score, ok: (sameDeadline && score >= 0.3) || score >= 0.6 };
          })
          .filter((x: any) => x.ok)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 2)
          .map((x: any) => x.d);

        for (const cand of [...linked, ...similar]) {
          const page = await getHtml(cand.source_url);
          if (!page.ok) continue;
          const p = parseDreamjobPost(page.html, cand.source_url);
          // Lien sûr : publié vers ce concours, ou l'annonce cite SA fiche officielle.
          const confirmed =
            cand.imported_contest_id === c.id ||
            (!!epUrl && canonicalEmploiPublicUrl(p.officialUrl) === epUrl);
          if (!confirmed) {
            possibleDreamjob.push({ id: c.id, title, url: cand.source_url });
            continue;
          }
          const before = fill.fields.length;
          fillIfMissing(fill, c, 'reference', p.reference, 'code (dreamjob)');
          fillIfMissing(fill, c, 'positions', p.postsCount, 'postes (dreamjob)');
          fillIfMissing(fill, c, 'deadline_date', p.deadlineDate ? parseFrDateISO(p.deadlineDate) : null, 'date limite (dreamjob)');
          fillIfMissing(fill, c, 'exam_date', p.examDate ? parseFrDateISO(p.examDate) : null, 'date du concours (dreamjob)');
          if (needSpecialty && !specialties && p.specialties && p.specialties.length > 0) {
            specialties = { values: p.specialties, page: cand.source_url, from: 'dreamjob' };
          }
          if (fill.fields.length > before || specialties) break;
        }
      }

      // Écritures
      if (specialties) {
        const s = specialties as { values: string[]; page: string; from: string };
        if (existingSpecs.length > 0) {
          await supabase.from('contest_criteria').delete().in('id', existingSpecs.map((x: any) => x.id));
        }
        await supabase.from('contest_criteria').insert(
          s.values.map((v, i) => ({
            contest_id: c.id,
            criterion_type: 'specialite',
            value_fr: v,
            source_page: s.page,
            verification_state: 'a_verifier',
            position: i,
          }))
        );
        fill.fields.push(s.from === 'dreamjob' ? 'spécialités (dreamjob)' : 'spécialités');
      }
      if (Object.keys(fill.updates).length > 0) {
        const { error } = await supabase.from('contests').update(fill.updates).eq('id', c.id);
        if (error) {
          unreachable.push({ id: c.id, title, url: c.source_url || '', error: `écriture refusée : ${error.message}` });
          return;
        }
      }

      if (fill.fields.length > 0) updated.push({ id: c.id, title, fields: fill.fields });
      else if (!epUrl) alreadyComplete.push({ id: c.id, title, reason: 'pas de fiche emploi-public reliée' });
      else if (!unreachable.some((u) => u.id === c.id)) alreadyComplete.push({ id: c.id, title });
    }

    for (let i = 0; i < contests.length; i += PARALLEL) {
      await Promise.all(contests.slice(i, i + PARALLEL).map(processContest));
    }

    res.status(200).json({
      ok: true,
      offset,
      limit,
      totalCount: totalCount ?? 0,
      processedCount: contests.length,
      hasMore: offset + limit < (totalCount ?? 0),
      summary: {
        updatedCount: updated.length,
        alreadyCompleteCount: alreadyComplete.length,
        unreachableCount: unreachable.length,
        dreamjobCandidates: dreamjob.length,
      },
      updated,
      alreadyComplete,
      unreachable,
      possibleDreamjob,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Erreur inattendue' });
  }
}
