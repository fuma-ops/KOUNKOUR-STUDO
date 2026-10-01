import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://zcxkxqsqzwtdnrupxlah.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_YfuzhtBBjs7CM1YxjphZzQ__r3Q3VZM';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST ou DELETE.' });
    return;
  }

  try {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: 'Jeton admin requis (Authorization: Bearer <token>).' });
      return;
    }

    const id = req.query?.id || req.body?.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Paramètre id du concours manquant.' });
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Supprimer les critères associés
    await supabase.from('contest_criteria').delete().eq('contest_id', id);

    // 2. Supprimer le concours
    const { error } = await supabase.from('contests').delete().eq('id', id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // 3. Mettre à jour les éventuels candidats radar
    await supabase
      .from('radar_candidates')
      .update({ status: 'pending_review', imported_contest_id: null })
      .eq('imported_contest_id', id);

    res.status(200).json({ ok: true, deletedId: id });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Erreur lors de la suppression' });
  }
}
