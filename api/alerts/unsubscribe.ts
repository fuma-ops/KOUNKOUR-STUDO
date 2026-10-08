/**
 * Désabonnement des alertes e-mail en un clic (lien en bas de chaque e-mail,
 * et en-tête List-Unsubscribe). GET ou POST /api/alerts/unsubscribe?t=<jeton>
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zcxkxqsqzwtdnrupxlah.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_YfuzhtBBjs7CM1YxjphZzQ__r3Q3VZM';

const page = (title: string, body: string) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} – KounKour</title></head>
<body style="margin:0;background:#FAF7F9;font-family:Arial,Helvetica,sans-serif;color:#242126">
<div style="max-width:480px;margin:48px auto;background:#fff;border:1px solid #F1E5EC;border-radius:16px;padding:28px">
<h1 style="font-size:20px;color:#8D174B;margin:0 0 12px">${title}</h1><p style="font-size:14px;line-height:1.5;color:#4A4250">${body}</p>
<p style="margin-top:20px"><a href="/profil" style="color:#8D174B;font-weight:700">Gérer mes alertes dans mon profil</a></p></div></body></html>`;

export default async function handler(req: any, res: any) {
  const t = typeof req.query?.t === 'string' && /^[0-9a-f-]{36}$/i.test(req.query.t) ? req.query.t : null;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (!t) {
    res.status(400).send(page('Lien invalide', 'Ce lien de désabonnement est incomplet. Vous pouvez désactiver les alertes depuis votre profil.'));
    return;
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.rpc('alerts_unsubscribe', { p_token: t });
  if (error) {
    res.status(500).send(page('Erreur', 'Le désabonnement n’a pas pu être enregistré. Réessayez plus tard ou désactivez les alertes depuis votre profil.'));
    return;
  }
  res
    .status(200)
    .send(data ? page('Vous êtes désabonné(e)', 'Vous ne recevrez plus d’alertes e-mail de KounKour. Vous pouvez les réactiver à tout moment depuis votre profil.') : page('Déjà désabonné(e)', 'Ce lien n’est plus actif : aucune alerte e-mail n’est envoyée à cette adresse.'));
}
