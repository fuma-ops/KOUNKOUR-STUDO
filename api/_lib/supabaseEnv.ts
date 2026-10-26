// Projet Supabase du site. L'ancien projet (zcxkxqsqzwtdnrupxlah) est hors service depuis
// le 22/10/2026 (disque plein) : une variable d'environnement qui pointe encore dessus est
// ignorée, pour que le site fonctionne même si la config Vercel n'a pas été mise à jour.
const DEAD_PROJECT = 'zcxkxqsqzwtdnrupxlah';
const DEFAULT_URL = 'https://aqnxeiylhgxfvhbkftbx.supabase.co';
const DEFAULT_KEY = 'sb_publishable_4tlFDcDCPj4lfV92NARBLg_VdBLPInr';

const envUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const envKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const useEnv = Boolean(envUrl && envKey && !envUrl.includes(DEAD_PROJECT));

export const SUPABASE_URL = useEnv ? envUrl : DEFAULT_URL;
export const SUPABASE_ANON_KEY = useEnv ? envKey : DEFAULT_KEY;
