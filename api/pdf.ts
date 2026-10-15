/**
 * Relais PDF des documents officiels (arrêtés, listes de convoqués, résultats).
 *
 * GET /api/pdf?u=<url officielle>&meta=1        → { length } (taille du fichier)
 * GET /api/pdf?u=<url officielle>&r=<début>-<fin> → octets demandés (≤ 1 Mo)
 *
 * Les sites officiels interdisent l'affichage dans une autre page (X-Frame-Options: DENY)
 * et n'autorisent pas la lecture depuis le navigateur (pas de CORS). Le lecteur du site
 * (pdf.js) lit donc le fichier par morceaux via ce relais : la première page s'affiche
 * sans attendre tout le document. La plage est dans l'adresse (et non dans l'en-tête Range)
 * pour que le cache Vercel garde chaque morceau séparément. Seuls les domaines officiels
 * marocains sont relayés.
 */
const ALLOWED = /(^|\.)(emploi-public\.ma|gov\.ma|ac\.ma|ma\.gov|men\.gov\.ma)$/i;
const MAX_CHUNK = 1024 * 1024;
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'application/pdf,*/*',
};
const CACHE = 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800';

function target(u: unknown): URL | null {
  if (typeof u !== 'string' || u.length > 500) return null;
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && ALLOWED.test(url.hostname) ? url : null;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  const url = target(req.query?.u);
  if (!url) {
    res.status(400).json({ error: 'Adresse non autorisée.' });
    return;
  }
  try {
    if (req.query?.meta) {
      // Taille totale lue sur un premier octet (Content-Range), sans télécharger le fichier.
      const r = await fetch(url, { headers: { ...HEADERS, Range: 'bytes=0-0' }, signal: AbortSignal.timeout(15000) });
      const total = Number((r.headers.get('content-range') || '').split('/')[1]) || Number(r.headers.get('content-length')) || 0;
      const type = r.headers.get('content-type') || '';
      await r.body?.cancel().catch(() => undefined);
      if (!r.ok || !total || !/pdf|octet-stream/i.test(type)) {
        res.status(502).json({ error: 'Document indisponible.', status: r.status });
        return;
      }
      res.setHeader('Cache-Control', CACHE);
      res.status(200).json({ length: total, ranges: r.status === 206 });
      return;
    }
    const m = /^(\d+)-(\d+)$/.exec(String(req.query?.r || ''));
    if (!m || Number(m[2]) < Number(m[1]) || Number(m[2]) - Number(m[1]) + 1 > MAX_CHUNK) {
      res.status(400).json({ error: 'Plage invalide.' });
      return;
    }
    const r = await fetch(url, { headers: { ...HEADERS, Range: `bytes=${m[1]}-${m[2]}` }, signal: AbortSignal.timeout(20000) });
    if (r.status !== 206 && r.status !== 200) {
      res.status(502).json({ error: 'Document indisponible.', status: r.status });
      return;
    }
    let buf = Buffer.from(await r.arrayBuffer());
    // Serveur sans prise en charge des plages : on découpe nous-mêmes (fichier petit, sinon refus).
    if (r.status === 200) {
      if (buf.length > 4 * MAX_CHUNK) {
        res.status(502).json({ error: 'Document trop volumineux pour le relais.' });
        return;
      }
      buf = buf.subarray(Number(m[1]), Number(m[2]) + 1);
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Cache-Control', CACHE);
    res.status(200).send(buf);
  } catch {
    res.status(504).json({ error: 'Le site officiel ne répond pas.' });
  }
}
