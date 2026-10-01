import { createClient } from '@supabase/supabase-js';
import { parseEmploiPublicDetail } from './enrich.ts';
import { parseFrDateISO } from './scrape-live.ts';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://zcxkxqsqzwtdnrupxlah.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_YfuzhtBBjs7CM1YxjphZzQ__r3Q3VZM';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'fr-FR,fr;q=0.9,ar;q=0.8',
};

export default async function handler(req: any, res: any) {
  try {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: 'Jeton de session admin requis (Authorization: Bearer <token>).' });
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const offset = Math.max(0, parseInt(req.query?.offset || '0', 10) || 0);
    const limit = Math.min(10, Math.max(1, parseInt(req.query?.limit || '10', 10) || 10));

    const { count: totalCount } = await supabase
      .from('contests')
      .select('id', { count: 'exact', head: true });

    const { data: contests, error: fetchErr } = await supabase
      .from('contests')
      .select('id, title_fr, title_original, source_url, reference, grade_fr, diploma_fr, recruitment_type, deposit_type, region_fr, positions, apply_url, deadline_date, exam_date, publication_date')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchErr || !contests) {
      res.status(500).json({ error: fetchErr?.message || 'Erreur lors de la lecture des concours.' });
      return;
    }

    const updated: { id: string; title: string; fields: string[] }[] = [];
    const alreadyComplete: { id: string; title: string; reason?: string }[] = [];
    const unreachable: { id: string; title: string; url: string; error: string }[] = [];

    for (const c of contests) {
      const title = c.title_fr || c.title_original || c.id;
      const url = c.source_url || '';
      const isEmploiPublic = /emploi-public\.ma\/(?:fr|ar)\/concours\/details\/[0-9a-f-]{36}/i.test(url);

      if (!isEmploiPublic) {
        alreadyComplete.push({ id: c.id, title, reason: 'Source non emploi-public' });
        continue;
      }

      let html = '';
      try {
        const resp = await fetch(url, {
          headers: BROWSER_HEADERS,
          signal: AbortSignal.timeout(7000),
        });
        if (!resp.ok) {
          unreachable.push({ id: c.id, title, url, error: `HTTP ${resp.status}` });
          continue;
        }
        html = await resp.text();
      } catch (err: any) {
        unreachable.push({ id: c.id, title, url, error: err?.message || 'Injoignable/Timeout' });
        continue;
      }

      const detail = parseEmploiPublicDetail(html);
      const updates: Record<string, any> = {};
      const updatedFieldNames: string[] = [];

      // Mettre à jour UNIQUEMENT les champs trouvés (ne jamais remplacer une valeur par null)
      if (detail.reference && (!c.reference || c.reference.length < 3)) {
        updates.reference = detail.reference;
        updatedFieldNames.push('reference');
      }
      if (detail.grade && !c.grade_fr) {
        updates.grade_fr = detail.grade;
        updatedFieldNames.push('grade_fr');
      }
      const gradeForDiploma = detail.grade || c.grade_fr || '';
      const gLower = gradeForDiploma.toLowerCase();
      let inferredDiploma = '';
      if (gLower.includes('médecin') || gLower.includes('medecin')) inferredDiploma = 'Doctorat en Médecine (Bac+7)';
      else if (gLower.includes('pharmacien')) inferredDiploma = 'Doctorat en Pharmacie (Bac+6)';
      else if (gLower.includes('dentiste')) inferredDiploma = 'Doctorat en Médecine Dentaire (Bac+6)';
      else if (gLower.includes('ingénieur') || gLower.includes('ingenieur')) inferredDiploma = "Diplôme d'Ingénieur d'État (Bac+5)";
      else if (gLower.includes('architecte')) inferredDiploma = "Diplôme d'Architecte (Bac+5)";
      else if (gLower.includes('professeur') || gLower.includes('enseignant')) inferredDiploma = 'Doctorat (Bac+8)';
      else if (gLower.includes('administrateur 2') || gLower.includes('2ème grade') || gLower.includes('2eme grade')) inferredDiploma = 'Master / Diplôme d’Études Supérieures (Bac+5)';
      else if (gLower.includes('administrateur 3') || (gLower.includes('3ème grade') && gLower.includes('admin'))) inferredDiploma = 'Licence / Bac+3';
      else if (gLower.includes('technicien 3') || gLower.includes('3ème grade') || gLower.includes('spécialisé') || gLower.includes('echelle 9') || gLower.includes('échelle 9')) inferredDiploma = 'Bac+2 (Technicien Spécialisé / DUT / BTS / DTS)';
      else if (gLower.includes('technicien 4') || gLower.includes('4ème grade') || gLower.includes('rédacteur') || gLower.includes('echelle 8') || gLower.includes('échelle 8')) inferredDiploma = 'Baccalauréat / Diplôme de Technicien';
      else if (gLower.includes('adjoint technique') || gLower.includes('echelle 6') || gLower.includes('échelle 6')) inferredDiploma = 'Certificat de Qualification Professionnelle (CQP)';
      else if (gLower.includes('adjoint administratif')) inferredDiploma = 'Baccalauréat';
      else if (gLower.includes('infirmier') || gLower.includes('sage-femme') || gLower.includes('santé')) inferredDiploma = 'Licence Professionnelle (Bac+3)';

      if (inferredDiploma && (!c.diploma_fr || c.diploma_fr.length < 3)) {
        updates.diploma_fr = inferredDiploma;
        updatedFieldNames.push('diploma_fr');
      }
      if (detail.recruitmentType && !c.recruitment_type) {
        updates.recruitment_type = detail.recruitmentType;
        updatedFieldNames.push('recruitment_type');
      }
      if (detail.depositType && !c.deposit_type) {
        updates.deposit_type = detail.depositType;
        updatedFieldNames.push('deposit_type');
      }
      if (detail.region && (!c.region_fr || c.region_fr.includes('National'))) {
        updates.region_fr = detail.region;
        updatedFieldNames.push('region_fr');
      }
      if (detail.postsCount !== null && (!c.positions || c.positions <= 0)) {
        updates.positions = detail.postsCount;
        updatedFieldNames.push('positions');
      }
      if (detail.depositSite && !c.apply_url) {
        updates.apply_url = detail.depositSite;
        updatedFieldNames.push('apply_url');
      }
      if (detail.deadlineDate && !c.deadline_date) {
        const iso = parseFrDateISO(detail.deadlineDate);
        if (iso) {
          updates.deadline_date = iso;
          updatedFieldNames.push('deadline_date');
        }
      }
      if (detail.examDate && !c.exam_date) {
        const iso = parseFrDateISO(detail.examDate);
        if (iso) {
          updates.exam_date = iso;
          updatedFieldNames.push('exam_date');
        }
      }
      if (detail.publicationDate && !c.publication_date) {
        const iso = parseFrDateISO(detail.publicationDate);
        if (iso) {
          updates.publication_date = iso;
          updatedFieldNames.push('publication_date');
        }
      }

      // Traitement des spécialités : remplacer les lignes génériques par les vraies
      let specialtiesUpdated = false;
      if (detail.specialty && detail.specialty.length > 0) {
        const { data: existingCriteria } = await supabase
          .from('contest_criteria')
          .select('id, criterion_type, value_fr')
          .eq('contest_id', c.id)
          .eq('criterion_type', 'specialite');

        const hasGeneric = (existingCriteria || []).some(
          (cr: any) => !cr.value_fr || cr.value_fr.toLowerCase().includes('mentionnée') || cr.value_fr.toLowerCase().includes('mentionnee')
        );
        const isEmpty = !existingCriteria || existingCriteria.length === 0;

        if (hasGeneric || isEmpty) {
          if (existingCriteria && existingCriteria.length > 0) {
            await supabase
              .from('contest_criteria')
              .delete()
              .in('id', existingCriteria.map((cr: any) => cr.id));
          }
          const criteriaRows = detail.specialty.map((spec: string, idx: number) => ({
            contest_id: c.id,
            criterion_type: 'specialite',
            value_fr: spec,
            source_page: url,
            verification_state: 'a_verifier',
            position: idx,
          }));
          await supabase.from('contest_criteria').insert(criteriaRows);
          specialtiesUpdated = true;
          updatedFieldNames.push('specialites');
        }
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('contests').update(updates).eq('id', c.id);
      }

      if (updatedFieldNames.length > 0) {
        updated.push({ id: c.id, title, fields: updatedFieldNames });
      } else {
        alreadyComplete.push({ id: c.id, title });
      }
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
      },
      updated,
      alreadyComplete,
      unreachable,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Erreur inattendue' });
  }
}
