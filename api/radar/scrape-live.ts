/**
 * Fonction serverless Vercel — scraper Radar opérationnel côté serveur.
 *
 * Rôle : va chercher les concours sur emploi-public.ma (comme le faisait le
 * serveur AI Studio), NETTOIE les données (aucune invention — cf. cahier §0/§7),
 * et dépose les nouveautés dans la file de validation Supabase `radar_candidates`
 * (statut pending_review). Rien n'est publié automatiquement (§13.2) : un admin
 * valide ensuite depuis le back-office.
 *
 * Écriture en base réservée au STAFF : la requête doit porter le jeton de session
 * de l'admin (Authorization: Bearer <access_token>) ; les RLS re-vérifient le rôle.
 * Sans jeton, le scrape s'exécute quand même mais renvoie seulement les items
 * (affichage), sans écrire en base.
 */
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://zcxkxqsqzwtdnrupxlsu.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_YfuzhtBBjs7CM1YxjphZzQ__r3Q3VZM';

// Identifiant de la source « emploi-public.ma » déjà présente en base.
const SOURCE_ID = '11111111-1111-4111-8111-111111111111';

const FR_MONTHS: Record<string, number> = {
  janvier: 0, février: 1, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, août: 7, aout: 7, septembre: 8, octobre: 9, novembre: 10,
  décembre: 11, decembre: 11,
};

function parseFrDateISO(text: string): string | null {
  if (!text) return null;
  const m = text.match(/(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})/);
  if (!m) return null;
  const month = FR_MONTHS[m[2].toLowerCase()];
  if (month === undefined) return null;
  const y = parseInt(m[3], 10);
  const d = parseInt(m[1], 10);
  if (d < 1 || d > 31) return null;
  return `${y}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Spécialité extraite STRICTEMENT du texte scrapé — jamais devinée.
function extractSpecialty(text: string): string | null {
  const specMatch =
    text.match(/sp[ée]cialit[ée]\s*[:\-–]?\s*([^\n\r]+)/i) ||
    text.match(/تخصص\s*[:\-–]?\s*([^\n\r]+)/i);
  if (specMatch && specMatch[1]) {
    const val = specMatch[1].trim().replace(/^[\-–\s]+/, '');
    if (val && val.length > 1 && !val.toLowerCase().includes('mentionnée')) return val;
  }
  return null;
}

function detectCategory(admin: string, isDouanes: boolean): string {
  const l = admin.toLowerCase();
  if (isDouanes || l.includes('finances') || l.includes('économie')) return 'finances';
  if (l.includes('santé')) return 'sante';
  if (l.includes('sûreté') || l.includes('police') || l.includes('sécurité')) return 'securite';
  if (l.includes('éducation') || l.includes('enseignement')) return 'education';
  return 'administration';
}

export default async function handler(req: any, res: any) {
  const startTime = Date.now();
  const logs: { id: string; timestamp: string; level: string; message: string }[] = [];
  const addLog = (level: string, message: string) =>
    logs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toTimeString().split(' ')[0],
      level,
      message,
    });

  try {
    addLog('info', 'Démarrage du crawler KounKour sur emploi-public.ma ...');
    const maxPages = 6;
    const pagePromises = [];
    for (let p = 1; p <= maxPages; p++) {
      const pageUrl = `https://www.emploi-public.ma/fr/concours-liste?page=${p}`;
      pagePromises.push(
        fetch(pageUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': 'fr-FR,fr;q=0.9,ar;q=0.8',
          },
          signal: AbortSignal.timeout(7000),
        })
          .then(async (r) => ({ page: p, html: r.ok ? await r.text() : '', ok: r.ok }))
          .catch(() => ({ page: p, html: '', ok: false }))
      );
    }
    const pageResults = await Promise.all(pagePromises);

    const items: any[] = [];
    const seen = new Set<string>();

    for (const pr of pageResults) {
      if (!pr.ok || !pr.html) {
        addLog('warn', `Page ${pr.page} : non reçue.`);
        continue;
      }
      const $ = cheerio.load(pr.html);
      const cards = $('a.card.card-scale, a[href*="/fr/concours/details/"]');
      addLog('parser', `[PAGE ${pr.page}] ${cards.length} annonces détectées.`);

      for (let i = 0; i < cards.length; i++) {
        const el = cards[i];
        const href = $(el).attr('href') || '';
        const uuidMatch = href.match(/([a-f0-9-]{36})/i);
        if (!uuidMatch) continue;
        const uuid = uuidMatch[1];
        if (seen.has(uuid)) continue;
        seen.add(uuid);

        const textBlock = $(el).text().replace(/\s+/g, ' ').trim();
        const lower = textBlock.toLowerCase();

        // Exclut résultats définitifs et annulations.
        if (
          lower.includes('résultats pour le concours') ||
          lower.includes('résultats définitifs') ||
          lower.includes('liste des admis') ||
          lower.includes('annulation')
        )
          continue;

        const isConvocation =
          lower.includes('convoqués pour') || lower.includes('convoqués à l') || lower.includes('convocation');

        let title = $(el).find('.card-title, h5, h4').text().trim();
        if (!title || title.includes('Publication de la liste')) {
          const tm =
            textBlock.match(/concours de recrutement d['’]un ([^M\n]+) Ministère/i) ||
            textBlock.match(/concours de recrutement de ([^M\n]+) Ministère/i) ||
            textBlock.match(/concours de recrutement d['’]un ([^\n]+)/i);
          title = tm ? tm[1].replace(/Convocation.*/, '').trim() : textBlock.slice(0, 60);
        }
        if (!title) continue;

        let admin = $(el).find('.card-text, .administration').text().trim();
        if (!admin || admin.length < 5) {
          const am = textBlock.match(/Ministère[^\n]+/i);
          admin = am ? am[0].replace('Convocation', '').replace('Annonce', '').trim() : '';
        }
        const isDouanes = lower.includes('douan');
        if (isDouanes) admin = "Ministère de l'Économie et des Finances - Administration des Douanes et Impôts Indirects (ADII)";

        const postsMatch = textBlock.match(/(\d+)\s*postes?/i);
        const postsCount = postsMatch ? parseInt(postsMatch[1], 10) : null;

        const deadlineMatch = textBlock.match(/Limite de d[ée]p[ôo]t\s*:\s*([^\n\r-]+)/i);
        const deadlineText = deadlineMatch ? deadlineMatch[1].trim() : '';
        const deadlineISO = parseFrDateISO(deadlineText);

        let degreeLevel: string | null = null;
        const tl = title.toLowerCase();
        if (tl.includes('ingénieur') || tl.includes('master') || tl.includes('conférences')) degreeLevel = 'Master / Ingénieur';
        else if (tl.includes('technicien') || tl.includes('3ème grade')) degreeLevel = 'Bac+2';
        else if (tl.includes('adjoint') || tl.includes('agent')) degreeLevel = 'Niveau Bac';
        else if (tl.includes('médecin') || tl.includes('pharmacien') || tl.includes('docteur')) degreeLevel = 'Doctorat';

        const specialty = extractSpecialty(textBlock);

        // Statut d'affichage dérivé de la vraie date.
        let scrapedStatus = 'open';
        if (isConvocation) scrapedStatus = 'in_progress';
        else if (deadlineISO) {
          const days = Math.ceil((new Date(`${deadlineISO}T23:59:59`).getTime() - Date.now()) / 86_400_000);
          scrapedStatus = days < 0 ? 'closed' : days <= 7 ? 'closing_soon' : 'open';
        }

        const sourceUrl = `https://www.emploi-public.ma/fr/concours/details/${uuid}`;
        items.push({
          external_id: uuid,
          // Forme attendue par l'UI (normalizeScrapedItem) — référence JAMAIS inventée.
          id: `scrape-${uuid}`,
          officialSourceUrl: sourceUrl,
          sourceUrl,
          title: { fr: title, ar: `مباراة توظيف ${title}` },
          administration: { name: { fr: admin || 'Administration publique', ar: admin || '' }, category: detectCategory(admin, isDouanes) },
          postsCount: postsCount ?? 1,
          degreeLevel: degreeLevel || '',
          specialty: { fr: specialty || 'Spécialité mentionnée dans l’annonce officielle', ar: '' },
          region: { fr: 'National (Royaume du Maroc)', ar: 'المملكة المغربية' },
          publicationDate: '',
          deadlineDate: deadlineText,
          status: 'pending_review',
          // Champs pour l'insertion en base :
          _db: {
            source_id: SOURCE_ID,
            external_id: uuid,
            source_url: sourceUrl,
            title_original: title,
            title_ar: null,
            administration_name: admin || null,
            administration_category: detectCategory(admin, isDouanes),
            degree_level: degreeLevel,
            specialty,
            region: null,
            positions: postsCount,
            deadline_text: deadlineText || null,
            deadline_date: deadlineISO,
            publication_text: null,
            raw: { scraped_status: scrapedStatus, is_verified_source: true, source: 'vercel-serverless' },
            status: 'pending_review',
          },
        });
      }
    }

    addLog('success', `${items.length} annonces valides extraites.`);

    // Écriture en base — seulement si un admin connecté a fourni son jeton.
    let inserted = 0;
    let persisted = false;
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token && items.length > 0) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const rows = items.map((it) => it._db);
      // ignoreDuplicates : les concours déjà en file/importés/ignorés ne sont pas
      // réinsérés — seuls les NOUVEAUX entrent dans la file de validation.
      const { data, error } = await supabase
        .from('radar_candidates')
        .upsert(rows, { onConflict: 'source_id,external_id', ignoreDuplicates: true })
        .select('id');
      if (error) {
        addLog('warn', `Écriture base refusée (${error.message}). Résultats affichés sans sauvegarde.`);
      } else {
        inserted = data?.length ?? 0;
        persisted = true;
        addLog('success', `${inserted} nouveau(x) concours ajouté(s) à la file de validation.`);
      }
    } else if (!token) {
      addLog('info', 'Non connecté : résultats affichés sans écriture en base.');
    }

    // Nettoie le champ interne _db avant de renvoyer au client.
    const clientItems = items.map(({ _db, ...rest }) => rest);

    res.status(200).json({
      source: 'emploi-public.ma',
      items: clientItems,
      logs,
      count: clientItems.length,
      inserted,
      persisted,
      executionTimeMs: Date.now() - startTime,
    });
  } catch (err: any) {
    addLog('warn', `Erreur crawler : ${err?.message || 'inconnue'}`);
    res.status(200).json({ source: 'emploi-public.ma', items: [], logs, count: 0, inserted: 0, persisted: false, executionTimeMs: Date.now() - startTime });
  }
}
