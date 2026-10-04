// Rendu serveur des pages publiques + robots.txt + sitemap.xml (cahier §15).
// vercel.json réécrit toutes les adresses de pages vers cette fonction ; elle
// lit les données publiques dans Supabase (clé publique, RLS) et injecte titre,
// description, canonical, hreflang, JSON-LD et contenu dans le HTML de l'app.
import { createClient } from '@supabase/supabase-js';
import { parsePath } from '../src/lib/routes.ts';
import {
  ContestRow,
  FolderRow,
  Lang,
  Page,
  QcmSetRow,
  fallbackTemplate,
  prepFoldersFor,
  renderCommunity,
  renderContest,
  renderContests,
  renderDocument,
  renderFolder,
  renderHome,
  renderNotFound,
  renderPrep,
  renderPrivate,
  renderQcm,
  renderRobots,
  renderSitemap,
  todayMorocco,
} from './_lib/seo.ts';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zcxkxqsqzwtdnrupxlah.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_YfuzhtBBjs7CM1YxjphZzQ__r3Q3VZM';

const CONTEST_COLS =
  'id,slug,title_fr,title_ar,title_original,status,summary_fr,summary_ar,diploma_fr,positions,region_fr,deadline_date,exam_date,apply_url,source_url,source_org,publication_date,published_at,verified_at,updated_at,grade_fr,reference,administration_id,administrations(name_fr,name_ar)';
const SET_COLS =
  'id,slug,folder_slug,title_fr,title_ar,description_fr,description_ar,language,kind,concours_label,exam_year,source_note,position,qcm_questions(id,position,source_number,question,options)';

const sb = () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function contests(): Promise<ContestRow[]> {
  const { data, error } = await sb().from('contests').select(CONTEST_COLS).order('deadline_date', { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data || []) as unknown as ContestRow[];
}
async function folders(): Promise<FolderRow[]> {
  const { data, error } = await sb().from('qcm_folders').select('slug,title_fr,title_ar,organization,description_fr,description_ar').eq('status', 'published').order('position');
  if (error) throw new Error(error.message);
  return (data || []) as FolderRow[];
}
async function sets(): Promise<QcmSetRow[]> {
  const { data, error } = await sb().from('qcm_sets').select(SET_COLS).eq('status', 'published').order('position');
  if (error) throw new Error(error.message);
  return (data || []) as unknown as QcmSetRow[];
}

// Gabarit = app.html produit par le build (scripts et styles de l'application).
let templateCache: string | null = null;
async function template(origin: string): Promise<string | null> {
  if (templateCache) return templateCache;
  try {
    const r = await fetch(`${origin}/app.html`, { headers: { 'user-agent': 'kounkour-ssr' } });
    if (!r.ok) return null;
    const html = await r.text();
    if (!html.includes('id="root"')) return null;
    templateCache = html;
    return html;
  } catch {
    return null;
  }
}

function header(req: any, name: string): string {
  const v = req.headers?.[name];
  return Array.isArray(v) ? v[0] : v || '';
}

export async function buildPage(pathname: string, lang: Lang, base: string): Promise<Page> {
  const r = parsePath(pathname);
  const today = todayMorocco();
  switch (r.name) {
    case 'home': {
      const [c, f, s] = await Promise.all([contests(), folders(), sets()]);
      return renderHome(lang, c, f, s, today);
    }
    case 'contests':
      return renderContests(lang, await contests(), today);
    case 'contest': {
      const [all, f, s] = await Promise.all([contests(), folders(), sets()]);
      const c = all.find((x) => x.slug === r.slug);
      if (!c) return renderNotFound(lang, pathname);
      const related = c.administration_id ? all.filter((x) => x.administration_id === c.administration_id && x.id !== c.id).slice(0, 6) : [];
      return renderContest(lang, c, related, base, today, prepFoldersFor(c, f, s));
    }
    case 'prep': {
      const [f, s] = await Promise.all([folders(), sets()]);
      return renderPrep(lang, f, s);
    }
    case 'folder': {
      const [f, s] = await Promise.all([folders(), sets()]);
      const folder = f.find((x) => x.slug === r.slug);
      if (!folder) return renderNotFound(lang, pathname);
      return renderFolder(lang, folder, s.filter((x) => x.folder_slug === folder.slug), base);
    }
    case 'qcm': {
      const [f, s] = await Promise.all([folders(), sets()]);
      const set = s.find((x) => x.slug === r.slug);
      if (!set) return renderNotFound(lang, pathname);
      return renderQcm(lang, set, f.find((x) => x.slug === set.folder_slug) || null, base);
    }
    case 'community':
      return renderCommunity(lang);
    case 'profile':
    case 'admin':
      return renderPrivate(lang, pathname);
    default:
      return renderNotFound(lang, pathname);
  }
}

export default async function handler(req: any, res: any) {
  const host = header(req, 'x-forwarded-host') || header(req, 'host');
  const proto = header(req, 'x-forwarded-proto') || 'https';
  const origin = `${proto}://${host}`;
  // SITE_URL (domaine définitif) fixe les liens canoniques ; sinon le domaine appelé.
  const base = (process.env.SITE_URL || origin).replace(/\/+$/, '');

  const url = new URL(req.url || '/', 'http://x');
  let pathname = url.pathname;
  if (pathname.startsWith('/api/')) pathname = String(req.query?.path || url.searchParams.get('path') || '/');
  const lang: Lang = (req.query?.lang || url.searchParams.get('lang')) === 'ar' ? 'ar' : 'fr';

  try {
    if (pathname === '/robots.txt') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=86400');
      res.status(200).send(renderRobots(base));
      return;
    }
    if (pathname === '/sitemap.xml') {
      const [c, f, s] = await Promise.all([contests(), folders(), sets()]);
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.status(200).send(renderSitemap(base, c, f, s));
      return;
    }

    const [page, tpl] = await Promise.all([buildPage(pathname, lang, base), template(origin)]);
    const html = renderDocument(tpl || fallbackTemplate(), page, base);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', tpl ? 'public, s-maxage=600, stale-while-revalidate=86400' : 'public, s-maxage=60');
    if (!page.indexable) res.setHeader('X-Robots-Tag', 'noindex');
    res.status(page.status).send(html);
  } catch (err: any) {
    // Base indisponible : l'application s'affiche quand même, sans être indexée en l'état.
    const tpl = await template(origin);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.status(503).send(tpl || fallbackTemplate());
    console.error('[seo] rendu impossible', pathname, err?.message);
  }
}
