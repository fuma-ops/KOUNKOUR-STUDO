/**
 * Fonction serverless Vercel — scraper Radar opérationnel côté serveur.
 *
 * GET /api/radar/scrape-live?source=emploi-public   (défaut)
 * GET /api/radar/scrape-live?source=dreamjob
 *
 * C'est l'admin qui choisit la source et déclenche le scan depuis le Radar :
 * rien ne tourne automatiquement. Chaque scan :
 *   1. vérifie robots.txt de la source (cahier : respecter robots/CGU) ;
 *   2. lit les pages liste et NETTOIE les données (aucune invention — §0/§7) ;
 *   3. dépose les nouveautés dans `radar_candidates` (pending_review). Rien n'est
 *      publié automatiquement (§13.2) : un admin valide ensuite.
 *
 * dreamjob.ma est un AGRÉGATEUR, pas une source officielle : il sert à DÉCOUVRIR
 * des concours absents d'emploi-public.ma. À la publication, la source officielle
 * (emploi-public / site .gov.ma / PDF de l'arrêté) est obligatoire.
 *
 * Écriture en base réservée au STAFF : la requête doit porter le jeton de session
 * de l'admin (Authorization: Bearer <access_token>) ; les RLS re-vérifient le rôle.
 * Sans jeton, le scrape s'exécute quand même mais renvoie seulement les items.
 */
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { findPossibleDuplicate, parseEmploiPublicDetail, parseFrDateISO, toCandidateRow } from '../_lib/parsers.ts';
import type { DuplicateRef } from '../_lib/parsers.ts';

// Ré-export pour les tests (scripts/).
export { findPossibleDuplicate, parseFrDateISO };
export type { DuplicateRef };

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://zcxkxqsqzwtdnrupxlah.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_YfuzhtBBjs7CM1YxjphZzQ__r3Q3VZM';

// Identifiants des sources dans la table radar_sources.
const EMPLOI_PUBLIC_SOURCE_ID = '11111111-1111-4111-8111-111111111111';
const DREAMJOB_SOURCE_ID = '33333333-3333-4333-8333-333333333333';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'fr-FR,fr;q=0.9,ar;q=0.8',
};

type AddLog = (level: string, message: string) => void;

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

// Niveau déduit du GRADE cité dans le titre (null si rien de sûr).
export function degreeFromTitle(title: string): string | null {
  // Uniquement les grades dont le diplôme d'accès est sans ambiguïté ; sinon null
  // (le matching affichera « à vérifier » au lieu de deviner).
  const t = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/conference/.test(t)) return 'Doctorat'; // maître de conférences
  if (/medecin|pharmacien|chirurgien.dentiste/.test(t)) return 'Doctorat';
  if (/ingenieur/.test(t)) return 'Master / Ingénieur';
  if (/administrateur\s+(?:de\s+)?2/.test(t)) return 'Master';
  if (/administrateur\s+(?:de\s+)?3/.test(t)) return 'Licence';
  if (/technicien\s+(?:de\s+)?3/.test(t)) return 'Bac+2';
  return null;
}

function statusFromDeadline(deadlineISO: string | null): string {
  if (!deadlineISO) return 'open';
  const days = Math.ceil((new Date(`${deadlineISO}T23:59:59`).getTime() - Date.now()) / 86_400_000);
  return days < 0 ? 'closed' : days <= 7 ? 'closing_soon' : 'open';
}

// ─── robots.txt (RFC 9309) ────────────────────────────────────────────────────

function ruleMatches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const re = new RegExp(
    '^' + body.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + (anchored ? '$' : '')
  );
  return re.test(path);
}

// true si `path` est autorisé pour les robots génériques (groupe "User-agent: *").
// Règle la plus longue gagnante ; à égalité, Allow l'emporte.
export function robotsAllows(robotsTxt: string, path: string): boolean {
  const rules: { allow: boolean; pattern: string }[] = [];
  let groupAgents: string[] = [];
  let inRules = false;
  for (const rawLine of robotsTxt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === 'user-agent') {
      if (inRules) {
        groupAgents = [];
        inRules = false;
      }
      groupAgents.push(value.toLowerCase());
    } else if (key === 'allow' || key === 'disallow') {
      inRules = true;
      if (!groupAgents.includes('*')) continue;
      if (key === 'disallow' && value === '') continue; // "Disallow:" vide = tout autorisé
      rules.push({ allow: key === 'allow', pattern: value });
    }
  }
  let best: { allow: boolean; len: number } | null = null;
  for (const r of rules) {
    if (!ruleMatches(r.pattern, path)) continue;
    const len = r.pattern.length;
    if (!best || len > best.len || (len === best.len && r.allow)) best = { allow: r.allow, len };
  }
  return best ? best.allow : true;
}

// 2xx → règles du fichier ; 4xx → pas de robots.txt = autorisé ;
// 5xx / injoignable → interdit (RFC 9309 §2.3.1.4).
async function checkRobots(origin: string, path: string, addLog: AddLog): Promise<boolean> {
  try {
    const r = await fetch(`${origin}/robots.txt`, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(6000) });
    if (r.status >= 200 && r.status < 300) {
      const allowed = robotsAllows(await r.text(), path);
      addLog(allowed ? 'info' : 'warn', `robots.txt ${origin} : ${path} ${allowed ? 'autorisé' : 'INTERDIT'}.`);
      return allowed;
    }
    if (r.status >= 400 && r.status < 500) {
      addLog('info', `robots.txt ${origin} absent (HTTP ${r.status}) : exploration autorisée.`);
      return true;
    }
    addLog('warn', `robots.txt ${origin} en erreur (HTTP ${r.status}) : scan suspendu par prudence.`);
    return false;
  } catch (e: any) {
    addLog('warn', `robots.txt ${origin} injoignable (${e?.message || 'erreur'}) : scan suspendu par prudence.`);
    return false;
  }
}

async function fetchPages(urls: string[]): Promise<{ page: number; url: string; html: string; ok: boolean; status: number }[]> {
  return Promise.all(
    urls.map((url, i) =>
      fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(7000) })
        .then(async (r) => ({ page: i + 1, url, html: r.ok ? await r.text() : '', ok: r.ok, status: r.status }))
        .catch(() => ({ page: i + 1, url, html: '', ok: false, status: 0 }))
    )
  );
}

// ─── emploi-public.ma ─────────────────────────────────────────────────────────

function parseEmploiPublicPage(html: string, pageNo: number, seen: Set<string>, addLog: AddLog): any[] {
  const items: any[] = [];
  const $ = cheerio.load(html);
  const cards = $('a.card.card-scale, a[href*="/fr/concours/details/"]');
  addLog('parser', `[PAGE ${pageNo}] ${cards.length} annonces détectées.`);

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

    const degreeLevel = degreeFromTitle(title);
    const specialty = extractSpecialty(textBlock);
    const scrapedStatus = isConvocation ? 'in_progress' : statusFromDeadline(deadlineISO);
    const category = detectCategory(admin, isDouanes);

    const imgEl = $(el).find('img').first();
    let imgUrl = imgEl.attr('src') || imgEl.attr('data-src') || '';
    if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
      imgUrl = `https://www.emploi-public.ma${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
    }

    const sourceUrl = `https://www.emploi-public.ma/fr/concours/details/${uuid}`;
    items.push({
      external_id: uuid,
      // Forme attendue par l'UI (normalizeScrapedItem) — référence JAMAIS inventée.
      id: `scrape-${uuid}`,
      sourceId: 'src-emploi-public',
      sourceName: 'emploi-public.ma',
      officialSourceUrl: sourceUrl,
      sourceUrl,
      image: imgUrl || undefined,
      title: { fr: title, ar: `مباراة توظيف ${title}` },
      administration: { 
        name: { fr: admin || 'Administration publique', ar: admin || '' }, 
        category,
        logo: imgUrl || undefined,
      },
      postsCount: postsCount ?? 1,
      degreeLevel: degreeLevel || '',
      specialty: specialty ? { fr: specialty, ar: '' } : null,
      region: null,
      publicationDate: '',
      deadlineDate: deadlineText,
      status: 'pending_review',
      _db: {
        source_id: EMPLOI_PUBLIC_SOURCE_ID,
        external_id: uuid,
        source_url: sourceUrl,
        title_original: title,
        title_ar: null,
        administration_name: admin || null,
        administration_category: category,
        degree_level: degreeLevel,
        specialty: specialty || null,
        region: null,
        positions: postsCount,
        deadline_text: deadlineText || null,
        deadline_date: deadlineISO,
        publication_text: null,
        raw: { 
          scraped_status: scrapedStatus, 
          is_verified_source: true, 
          source: 'vercel-serverless',
          image: imgUrl || null,
        },
        status: 'pending_review',
      },
    });
  }
  return items;
}

// ─── dreamjob.ma (agrégateur — découverte uniquement) ─────────────────────────

export const DREAMJOB_LIST_URLS = [
  'https://www.dreamjob.ma/emploi-public/',
  'https://www.dreamjob.ma/emploi-public/page/2/',
  'https://www.dreamjob.ma/emploi-public/page/3/',
  'https://www.dreamjob.ma/emploi-public/feed/',
  'https://www.dreamjob.ma/emploi-public/feed/?paged=2',
  'https://www.dreamjob.ma/emploi-public/feed/?paged=3',
];

export interface DreamjobEntry {
  title: string;
  url: string;
  slug: string;
  excerpt: string;
  imageUrl?: string;
}

// Chemins qui ne sont PAS des annonces (navigation WordPress, pages fixes…).
const DJ_NON_POST =
  /^\/(?:category|categorie|tag|page|author|auteur|wp-[a-z-]+|feed|search|contact|a-propos|about|mentions-legales|politique[a-z-]*|cgu|login|register)(?:\/|$)/i;

function dreamjobPostUrl(href: string, base: string): { url: string; slug: string } | null {
  let u: URL;
  try {
    u = new URL(href, base);
  } catch {
    return null;
  }
  if (!/(^|\.)dreamjob\.ma$/i.test(u.hostname)) return null;
  const path = u.pathname;
  // La page liste elle-même (/emploi-public/) n'est pas une annonce ; ses articles
  // (/emploi-public/<slug>/) en sont.
  if (path === '/' || /^\/emploi-public\/?$/i.test(path) || DJ_NON_POST.test(path)) return null;
  if (/\/(?:page|feed|amp)\/?$/i.test(path) || /\.(?:jpe?g|png|gif|webp|pdf|xml)$/i.test(path)) return null;
  const segs = path.split('/').filter(Boolean);
  const slug = segs[segs.length - 1];
  if (!slug || slug.length < 8 || !slug.includes('-')) return null;
  return { url: `https://www.dreamjob.ma${path.endsWith('/') ? path : path + '/'}`, slug: slug.toLowerCase() };
}

// Pure et testable : extrait les annonces d'une page liste dreamjob.
// Stratégie 1 : blocs <article> WordPress (titre dans h1/h2/h3/.entry-title).
// Stratégie 2 : éléments <item> de flux RSS/XML (insensible aux challenges Cloudflare).
// Stratégie 3 (repli) : tout lien d'article dont le texte parle de concours/recrutement.
export function parseDreamjobList(html: string, baseUrl = 'https://www.dreamjob.ma/emploi-public/'): {
  entries: DreamjobEntry[];
  strategy: 'article' | 'links' | 'none';
} {
  const $ = cheerio.load(html, { xmlMode: html.includes('<?xml') || html.includes('<rss') });
  const seen = new Set<string>();
  const entries: DreamjobEntry[] = [];

  $('article').each((_i, art) => {
    const a = $(art).find('h1 a, h2 a, h3 a, .entry-title a, .post-title a').first();
    const href = a.attr('href');
    if (!href) return;
    const post = dreamjobPostUrl(href, baseUrl);
    if (!post || seen.has(post.slug)) return;
    const title = a.text().replace(/\s+/g, ' ').trim();
    if (title.length < 10) return;
    seen.add(post.slug);
    const excerpt = $(art).find('.entry-summary, .entry-content, .excerpt, p').text().replace(/\s+/g, ' ').trim();
    
    // Extraction exacte de l'image de l'article WordPress
    const imgEl = $(art).find('.post-thumbnail img, .entry-thumbnail img, img.wp-post-image, .featured-image img, a img, img').first();
    const rawImg = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || imgEl.attr('data-orig-file') || '';
    const imageUrl = rawImg && (rawImg.startsWith('http') || rawImg.startsWith('//')) ? (rawImg.startsWith('//') ? `https:${rawImg}` : rawImg) : '';

    entries.push({ title, url: post.url, slug: post.slug, excerpt: excerpt.slice(0, 600), imageUrl: imageUrl || undefined });
  });
  if (entries.length > 0) return { entries, strategy: 'article' };

  // Support direct des flux RSS/XML (<item>)
  $('item').each((_i, it) => {
    const title = $(it).find('title').first().text().replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/\s+/g, ' ').trim();
    const link = $(it).find('link').first().text().trim();
    if (!link) return;
    const post = dreamjobPostUrl(link, baseUrl);
    if (!post || seen.has(post.slug)) return;
    if (title.length < 10) return;
    seen.add(post.slug);
    const excerpt = $(it).find('description, content\\:encoded').first().text().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    let imageUrl = $(it).find('enclosure[type^="image"]').attr('url') || $(it).find('media\\:content[url]').attr('url') || $(it).find('media\\:thumbnail').attr('url') || '';
    if (!imageUrl) {
      const desc = $(it).find('description, content\\:encoded').text();
      const m = desc.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp|svg))["']/i) || desc.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (m) imageUrl = m[1];
    }

    entries.push({ title, url: post.url, slug: post.slug, excerpt: excerpt.slice(0, 600), imageUrl: imageUrl || undefined });
  });
  if (entries.length > 0) return { entries, strategy: 'article' };

  $('a[href]').each((_i, el) => {
    const post = dreamjobPostUrl($(el).attr('href') || '', baseUrl);
    if (!post || seen.has(post.slug)) return;
    const title = $(el).text().replace(/\s+/g, ' ').trim();
    if (title.length < 15 || !/concours|recrut|poste/i.test(title)) return;
    seen.add(post.slug);
    
    const imgEl = $(el).find('img').first();
    const rawImg = imgEl.attr('src') || imgEl.attr('data-src') || '';
    const imageUrl = rawImg && (rawImg.startsWith('http') || rawImg.startsWith('//')) ? (rawImg.startsWith('//') ? `https:${rawImg}` : rawImg) : '';

    entries.push({ title, url: post.url, slug: post.slug, excerpt: '', imageUrl: imageUrl || undefined });
  });
  return { entries, strategy: entries.length > 0 ? 'links' : 'none' };
}

// Annonces qui ne sont pas des ouvertures de concours (résultats, listes…).
export function isDreamjobNonOpening(title: string): boolean {
  return /r[ée]sultats?|liste des (?:candidats|admis|convoqu)|convoqu|admis|annulation|report(?:é|e)? du concours/i.test(title);
}

// Administration citée dans le titre (null si rien de sûr — jamais devinée).
export function extractDreamjobAdmin(title: string): string | null {
  const t = title.replace(/\s+/g, ' ').trim();
  const rec = t.match(/^(.{4,90}?)\s+recrute\b/i);
  if (rec) return rec[1].replace(/^(?:le|la|les|l['’])\s+/i, '').trim();
  const kw = t.match(
    /\b((?:Minist[èe]re|Commune|Conseil|Agence|Office|Universit[ée]|Direction|Caisse|Centre Hospitalier|CHU|Tr[ée]sorerie|Haut[- ]Commissariat|Province|Pr[ée]fecture|R[ée]gion|Fondation|Institut|[ÉE]cole|Cour|Tribunal|Chambre|Acad[ée]mie|Administration|D[ée]l[ée]gation|Inspection|Gendarmerie|Forces Arm[ée]es|S[ûu]ret[ée] Nationale|Bank Al-Maghrib|ONCF|ONEE|ONSSA|ANAPEC|OFPPT|CNSS|CDG|Barid Al-Maghrib|DGSN|DGI|ADII)\b[^()\d,:–|]{0,80})/i
  );
  if (!kw) return null;
  return kw[1].replace(/\s+(?:recrute|concours|pour|au titre).*$/i, '').replace(/[\s\-–]+$/, '').trim() || null;
}

export function extractDreamjobPosts(text: string): number | null {
  const m = text.match(/\b(\d{1,4})\s*postes?\b/i) || text.match(/\brecrute\s+(\d{1,3})\b/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n > 0 && n < 5000 ? n : null;
}

export function extractDreamjobDeadline(text: string): string | null {
  const m = text.match(
    /(?:dernier d[ée]lai|date limite|limite de d[ée]p[ôo]t|avant le|jusqu['’]au)[^0-9]{0,25}(\d{1,2}(?:er)?\s+[A-Za-zÀ-ÿ]+\s+\d{4}|\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4})/i
  );
  return m ? m[1].trim() : null;
}

function buildDreamjobItem(e: DreamjobEntry, dup: DuplicateRef | null): any {
  const text = `${e.title} ${e.excerpt}`;
  const admin = extractDreamjobAdmin(e.title);
  const postsCount = extractDreamjobPosts(text);
  const deadlineText = extractDreamjobDeadline(text) || '';
  const deadlineISO = parseFrDateISO(deadlineText);
  const degreeLevel = degreeFromTitle(e.title);
  const specialty = extractSpecialty(e.excerpt);
  const category = detectCategory(admin || '', /douan/i.test(text));
  const externalId = `dj-${e.slug}`.slice(0, 180);

  return {
    external_id: externalId,
    id: `scrape-${externalId}`,
    sourceId: 'src-dreamjob',
    sourceName: 'dreamjob.ma',
    sourceUrl: e.url,
    image: e.imageUrl || undefined,
    title: { fr: e.title, ar: e.title },
    administration: { 
      name: { fr: admin || 'Administration publique', ar: admin || '' }, 
      category,
      logo: e.imageUrl || undefined,
    },
    postsCount: postsCount ?? 1,
    degreeLevel: degreeLevel || '',
    // Absent de l'annonce → vide (jamais de texte générique).
    specialty: { fr: specialty || '', ar: '' },
    region: { fr: '', ar: '' },
    publicationDate: '',
    deadlineDate: deadlineText,
    status: 'pending_review',
    rawSnippet: {
      fr: `Découvert via dreamjob.ma (agrégateur) — source officielle à confirmer avant publication.${e.excerpt ? ' ' + e.excerpt.slice(0, 220) : ''}`,
      ar: 'مصدر ثانوي (dreamjob.ma) — يجب تأكيد المصدر الرسمي قبل النشر.',
    },
    matchedRules: dup ? ['aggregator:dreamjob', `duplicate:${dup.kind}`] : ['aggregator:dreamjob'],
    possibleDuplicate: dup,
    _db: {
      source_id: DREAMJOB_SOURCE_ID,
      external_id: externalId,
      source_url: e.url,
      title_original: e.title,
      title_ar: null,
      administration_name: admin,
      administration_category: category,
      degree_level: degreeLevel,
      specialty,
      region: null,
      positions: postsCount,
      deadline_text: deadlineText || null,
      deadline_date: deadlineISO,
      publication_text: null,
      raw: {
        scraped_status: statusFromDeadline(deadlineISO),
        is_verified_source: false,
        discovered_via: 'dreamjob',
        official_source_required: true,
        possible_duplicate_of: dup,
        source: 'vercel-serverless',
        image: e.imageUrl || null,
      },
      status: 'pending_review',
    },
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

const SOURCES = {
  'emploi-public': { label: 'emploi-public.ma', origin: 'https://www.emploi-public.ma', robotsPath: '/fr/concours-liste' },
  dreamjob: { label: 'dreamjob.ma', origin: 'https://www.dreamjob.ma', robotsPath: '/emploi-public/' },
} as const;
type SourceKey = keyof typeof SOURCES;

export default async function handler(req: any, res: any) {
  const startTime = Date.now();
  const logs: { id: string; timestamp: string; level: string; message: string }[] = [];
  const addLog: AddLog = (level, message) =>
    logs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toTimeString().split(' ')[0],
      level,
      message,
    });

  const requested = typeof req.query?.source === 'string' ? req.query.source : 'emploi-public';
  if (!(requested in SOURCES)) {
    res.status(400).json({ error: `Source inconnue : ${requested}. Valeurs : ${Object.keys(SOURCES).join(', ')}.` });
    return;
  }
  const sourceKey = requested as SourceKey;
  const src = SOURCES[sourceKey];
  const reply = (extra: Record<string, unknown>) =>
    res.status(200).json({
      source: src.label,
      sourceKey,
      items: [],
      count: 0,
      inserted: 0,
      persisted: false,
      robotsAllowed: true,
      ...extra,
      logs,
      executionTimeMs: Date.now() - startTime,
    });

  try {
    addLog('info', `Démarrage du crawler KounKour sur ${src.label} ...`);

    if (!(await checkRobots(src.origin, src.robotsPath, addLog))) {
      reply({ robotsAllowed: false });
      return;
    }

    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let items: any[] = [];

    if (sourceKey === 'emploi-public') {
      const urls = Array.from({ length: 6 }, (_v, i) => `https://www.emploi-public.ma/fr/concours-liste?page=${i + 1}`);
      const pages = await fetchPages(urls);
      const seen = new Set<string>();
      for (const pr of pages) {
        if (!pr.ok || !pr.html) {
          addLog('warn', `Page ${pr.page} : non reçue${pr.status ? ` (HTTP ${pr.status})` : ''}.`);
          continue;
        }
        items.push(...parseEmploiPublicPage(pr.html, pr.page, seen, addLog));
      }

      // Lecture des fiches détail officielles (4 en parallèle maximum, délai 7s, même User-Agent)
      if (items.length > 0) {
        addLog('info', `Enrichissement des ${items.length} annonces depuis leur fiche détail officielle (4 en parallèle)...`);
        const BATCH_SIZE = 4;
        for (let i = 0; i < items.length; i += BATCH_SIZE) {
          const batch = items.slice(i, i + BATCH_SIZE);
          // eslint-disable-next-line no-await-in-loop
          await Promise.all(
            batch.map(async (item) => {
              try {
                const targetUrl = item.officialSourceUrl || item.sourceUrl;
                const resp = await fetch(targetUrl, {
                  headers: BROWSER_HEADERS,
                  signal: AbortSignal.timeout(7000),
                });
                if (!resp.ok) return;
                const detailHtml = await resp.text();
                const d = parseEmploiPublicDetail(detailHtml);

                if (d.reference) {
                  item.referenceCode = d.reference;
                  item._db.reference = d.reference;
                }
                if (d.grade) {
                  item.grade = d.grade;
                  item._db.grade_fr = d.grade;
                  // Diplôme : jamais déduit du grade (il doit venir de l'annonce).
                }
                if (d.specialty && d.specialty.length > 0) {
                  item.specialtiesList = d.specialty;
                  item.specialty = { fr: d.specialty.join(', '), ar: '' };
                  item._db.specialty = d.specialty.join(', ');
                } else {
                  item.specialtiesList = [];
                  item.specialty = null;
                  item._db.specialty = null;
                }
                if (d.postsCount !== null) {
                  item.postsCount = d.postsCount;
                  item._db.positions = d.postsCount;
                }
                if (d.recruitmentType) {
                  item.recruitmentType = d.recruitmentType;
                  item._db.recruitment_type = d.recruitmentType;
                }
                if (d.region) {
                  item.region = { fr: d.region, ar: d.region };
                  item._db.region = d.region;
                  item._db.region_fr = d.region;
                }
                if (d.depositType) {
                  item.depositType = d.depositType;
                  item._db.deposit_type = d.depositType;
                }
                if (d.depositSite) {
                  item.depositSite = d.depositSite;
                  item.applyUrl = d.depositSite;
                  item._db.apply_url = d.depositSite;
                }
                if (d.deadlineDate) {
                  item.deadlineDate = d.deadlineDate;
                  item._db.deadline_text = d.deadlineDate;
                  const iso = parseFrDateISO(d.deadlineDate);
                  if (iso) item._db.deadline_date = iso;
                }
                if (d.examDate) {
                  item.contestDate = d.examDate;
                  item._db.exam_date = d.examDate;
                }
                if (d.publicationDate) {
                  item.publicationDate = d.publicationDate;
                  item._db.publication_text = d.publicationDate;
                }
                if (d.administration) {
                  item.administration.name = { fr: d.administration, ar: d.administration };
                  item._db.administration_name = d.administration;
                }
                if (d.arreteUrl) {
                  item.arreteUrl = d.arreteUrl;
                  if (item._db.raw) item._db.raw.arrete_url = d.arreteUrl;
                }
              } catch {
                /* Fiche injoignable ou timeout : conserve les données de base de la liste */
              }
            })
          );
        }
        addLog('info', `Enrichissement des fiches détail terminé.`);
      }
    } else {
      const pages = await fetchPages(DREAMJOB_LIST_URLS);
      const seen = new Set<string>();
      const entries: DreamjobEntry[] = [];
      let skipped = 0;
      for (const pr of pages) {
        if (!pr.ok || !pr.html) {
          addLog('warn', `Page ${pr.page} : non reçue${pr.status ? ` (HTTP ${pr.status})` : ''}.`);
          continue;
        }
        const { entries: found, strategy } = parseDreamjobList(pr.html, pr.url);
        addLog(
          found.length > 0 ? 'parser' : 'warn',
          `[PAGE ${pr.page}] ${found.length} annonces détectées (stratégie : ${strategy}).` +
            (found.length === 0 ? ' Structure de page non reconnue — à signaler.' : '')
        );
        for (const e of found) {
          if (seen.has(e.slug)) continue;
          seen.add(e.slug);
          if (isDreamjobNonOpening(e.title)) {
            skipped++;
            continue;
          }
          entries.push(e);
        }
      }
      if (skipped > 0) addLog('info', `${skipped} annonce(s) de résultats/convocations ignorée(s).`);

      // Références pour signaler les doublons possibles : concours déjà publiés
      // (lecture publique) + file emploi-public (staff seulement).
      const refs: DuplicateRef[] = [];
      const { data: published } = await supabase
        .from('contests')
        .select('title_fr, title_original, source_org, deadline_date, source_url')
        .in('status', ['publie', 'mis_a_jour']);
      for (const c of published || []) {
        refs.push({ kind: 'publie', title: c.title_fr || c.title_original || '', admin: c.source_org, deadline: c.deadline_date, url: c.source_url });
      }
      if (token) {
        const { data: epCands } = await supabase
          .from('radar_candidates')
          .select('title_original, administration_name, deadline_date, source_url')
          .eq('source_id', EMPLOI_PUBLIC_SOURCE_ID);
        for (const c of epCands || []) {
          refs.push({ kind: 'emploi-public', title: c.title_original || '', admin: c.administration_name, deadline: c.deadline_date, url: c.source_url });
        }
      }

      items = entries.map((e) => buildDreamjobItem(e, findPossibleDuplicate(e.title, extractDreamjobAdmin(e.title), parseFrDateISO(extractDreamjobDeadline(`${e.title} ${e.excerpt}`) || ''), refs)));
      const dups = items.filter((it) => it.possibleDuplicate).length;
      if (dups > 0) addLog('info', `${dups} annonce(s) signalée(s) comme doublon possible (déjà sur le site ou sur emploi-public).`);
    }

    addLog('success', `${items.length} annonces valides extraites.`);

    // Écriture en base — seulement si un admin connecté a fourni son jeton.
    let inserted = 0;
    let persisted = false;
    if (token && items.length > 0) {
      // ignoreDuplicates : les concours déjà en file/importés/ignorés ne sont pas
      // réinsérés — seuls les NOUVEAUX entrent dans la file de validation.
      const { data, error } = await supabase
        .from('radar_candidates')
        .upsert(items.map((it) => toCandidateRow(it._db)), { onConflict: 'source_id,external_id', ignoreDuplicates: true })
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

    // Retire le champ interne _db avant de renvoyer au client.
    const clientItems = items.map(({ _db, ...rest }) => rest);
    reply({ items: clientItems, count: clientItems.length, inserted, persisted });
  } catch (err: any) {
    addLog('warn', `Erreur crawler : ${err?.message || 'inconnue'}`);
    reply({});
  }
}
