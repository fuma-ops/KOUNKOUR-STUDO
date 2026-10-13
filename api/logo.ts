// Logo officiel d'un organisme : /api/logo?a=<slug de l'administration>.
// Les octets sont stockés dans administration_logos (récupérés sur la page
// emploi-public de l'organisme). Le paramètre v= de logo_url change à chaque
// remplacement : on peut donc mettre le fichier en cache longtemps.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zcxkxqsqzwtdnrupxlah.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_YfuzhtBBjs7CM1YxjphZzQ__r3Q3VZM';

const MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export default async function handler(req: any, res: any) {
  const url = new URL(req.url || '/', 'http://x');
  const slug = String(req.query?.a || url.searchParams.get('a') || '').trim();
  if (!slug || slug.length > 200) {
    res.status(400).send('missing a');
    return;
  }
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb
    .from('administrations')
    .select('administration_logos(mime,content_b64)')
    .eq('slug', slug)
    .maybeSingle();
  const raw = (data as any)?.administration_logos;
  const logo = Array.isArray(raw) ? raw[0] : raw;
  if (error || !logo?.content_b64) {
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    res.status(404).send('no logo');
    return;
  }
  // Jamais de SVG servi tel quel (script embarqué possible).
  const mime = MIMES.has(logo.mime) ? logo.mime : 'image/png';
  res.setHeader('Content-Type', mime);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
  res.status(200).send(Buffer.from(logo.content_b64, 'base64'));
}
