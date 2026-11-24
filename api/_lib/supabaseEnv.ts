// Projet Supabase du site. L'ancien projet (zcxkxqsqzwtdnrupxlah) est hors service depuis
// le 22/10/2026 (disque plein) : une variable d'environnement qui pointe encore dessus est
// ignorée, pour que le site fonctionne même si la config Vercel n'a pas été mise à jour.
// kounkour-v2 (aqnxeiylhgxfvhbkftbx) bloqué le 24/11/2026 (quota de trafic) : base copiée dans
// kounkour-v3 (twevhkhtpfbytrecfbse), organisation « kounkour ».
const DEAD_PROJECTS = ['zcxkxqsqzwtdnrupxlah', 'aqnxeiylhgxfvhbkftbx'];
const DEFAULT_URL = 'https://twevhkhtpfbytrecfbse.supabase.co';
const DEFAULT_KEY = 'sb_publishable_NDfSoclOWPEYipwD4JNVKw_L3lZwqJp';

const envUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const envKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const useEnv = Boolean(envUrl && envKey && !DEAD_PROJECTS.some((p) => envUrl.includes(p)));

export const SUPABASE_URL = useEnv ? envUrl : DEFAULT_URL;
export const SUPABASE_ANON_KEY = useEnv ? envKey : DEFAULT_KEY;
