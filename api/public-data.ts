// Copie publique, mise en cache par le CDN de Vercel, des listes que le site affiche à
// tous les visiteurs (concours, séries de QCM, dossiers). Supabase n'est relu qu'à
// l'expiration du cache (30 min) au lieu d'une fois par visiteur : c'est ce trafic qui a
// dépassé le quota gratuit de Supabase le 24/11/2026.
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './_lib/supabaseEnv.ts';
import {
  PUBLIC_CONTEST_STATUSES,
  PUBLIC_CONTESTS_SELECT,
  PUBLIC_FOLDERS_SELECT,
  PUBLIC_QCM_SELECT,
} from '../src/data/publicSelects.ts';

const sb = () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const loaders: Record<string, () => Promise<unknown[]>> = {
  contests: async () => {
    const { data, error } = await sb()
      .from('contests')
      .select(PUBLIC_CONTESTS_SELECT)
      .in('status', PUBLIC_CONTEST_STATUSES)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },
  qcm: async () => {
    const { data, error } = await sb().from('qcm_sets').select(PUBLIC_QCM_SELECT).eq('status', 'published').order('position', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },
  folders: async () => {
    const { data, error } = await sb().from('qcm_folders').select(PUBLIC_FOLDERS_SELECT).eq('status', 'published').order('position');
    if (error) throw new Error(error.message);
    return data || [];
  },
};

// Cache en mémoire de l'instance, en plus du CDN : une rafale de requêtes ne relance pas la lecture.
const TTL = 30 * 60 * 1000;
const memo = new Map<string, { at: number; value: unknown[] }>();

export default async function handler(req: any, res: any) {
  const kind = String(req.query?.kind || '');
  const load = loaders[kind];
  if (!load) {
    res.status(400).json({ error: 'kind inconnu' });
    return;
  }
  const hit = memo.get(kind);
  try {
    const value = hit && Date.now() - hit.at < TTL ? hit.value : await load();
    if (!hit || hit.value !== value) memo.set(kind, { at: Date.now(), value });
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400');
    res.status(200).json(value);
  } catch (e: any) {
    if (hit) {
      // Supabase indisponible : on sert la dernière version connue plutôt qu'une liste vide.
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
      res.status(200).json(hit.value);
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).json({ error: String(e?.message || e) });
  }
}
