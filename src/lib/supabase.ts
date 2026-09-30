import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// URL du projet + clé « publishable » (anon) : PUBLIQUES par conception (la
// sécurité repose sur les RLS côté base, pas sur le secret de cette clé).
// Repli en dur pour que le site fonctionne sans config Vercel ; surchargeable
// par variables d'environnement VITE_ si besoin.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://zcxkxqsqzwtdnrupxlah.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YfuzhtBBjs7CM1YxjphZzQ__r3Q3VZM';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    return client;
  } catch {
    return null;
  }
}

export const SITE_ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : '';
