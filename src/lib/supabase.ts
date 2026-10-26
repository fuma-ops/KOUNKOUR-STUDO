import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// URL du projet + clé « publishable » (anon) : PUBLIQUES par conception (la
// sécurité repose sur les RLS côté base, pas sur le secret de cette clé).
// Repli en dur pour que le site fonctionne sans config Vercel ; surchargeable
// par variables d'environnement VITE_ si besoin.
// L'ancien projet (zcxkxqsqzwtdnrupxlah) est hors service depuis le 22/10/2026 : une
// variable VITE_ qui pointe encore dessus est ignorée.
const ENV_URL: string = import.meta.env.VITE_SUPABASE_URL || '';
const USE_ENV = Boolean(ENV_URL && import.meta.env.VITE_SUPABASE_ANON_KEY && !ENV_URL.includes('zcxkxqsqzwtdnrupxlah'));
const SUPABASE_URL = USE_ENV ? ENV_URL : 'https://aqnxeiylhgxfvhbkftbx.supabase.co';
const SUPABASE_ANON_KEY: string = USE_ENV ? import.meta.env.VITE_SUPABASE_ANON_KEY : 'sb_publishable_4tlFDcDCPj4lfV92NARBLg_VdBLPInr';

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

/** Connexion Google activée côté Supabase ? (lecture publique des réglages Auth, mise en cache). */
let googleAuthCheck: Promise<boolean> | null = null;
export function isGoogleAuthEnabled(): Promise<boolean> {
  if (!googleAuthCheck) {
    googleAuthCheck = fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => !!j?.external?.google)
      .catch(() => false);
  }
  return googleAuthCheck;
}

export const SITE_ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : '';
