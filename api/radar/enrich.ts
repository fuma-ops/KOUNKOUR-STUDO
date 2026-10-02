/**
 * Fonction serverless Vercel — enrichissement d'un concours depuis sa PAGE DÉTAIL.
 *
 * La page liste ne contient pas tout (code du concours, date du concours, date de
 * publication, site de dépôt). Cette fonction va chercher la page détail officielle
 * et extrait ces champs, STRICTEMENT depuis le texte (jamais inventés). Appelée au
 * moment de la validation d'un candidat, une seule requête → rapide et poli.
 *
 * GET /api/radar/enrich?id=<uuid>  ou  ?url=<page détail emploi-public>
 * GET /api/radar/enrich?url=<annonce dreamjob.ma>
 *   → cherche dans l'annonce le lien vers la SOURCE OFFICIELLE (fiche
 *     emploi-public, PDF de l'avis/arrêté ou site .gov.ma / .ac.ma). Si c'est une
 *     fiche emploi-public, elle est enrichie à son tour. `officialUrl` est null si
 *     aucune source officielle n'est trouvée : l'admin doit alors la fournir.
 */
import {
  BROWSER_HEADERS,
  DREAMJOB,
  EP_DETAIL,
  findOfficialLink,
  parseEmploiPublicDetail,
} from '../_lib/parsers.ts';

// Ré-export pour les tests (scripts/).
export { findOfficialLink, parseEmploiPublicDetail };
export type { EmploiPublicDetailResult } from '../_lib/parsers.ts';

async function getHtml(url: string): Promise<{ ok: boolean; status: number; html: string }> {
  const r = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(8000) });
  return { ok: r.ok, status: r.status, html: r.ok ? await r.text() : '' };
}

export default async function handler(req: any, res: any) {
  try {
    const q = req.query || {};
    let url: string | null = typeof q.url === 'string' ? q.url : null;
    if (!url && typeof q.id === 'string' && /^[a-f0-9-]{8,}$/i.test(q.id)) {
      url = `https://www.emploi-public.ma/fr/concours/details/${q.id}`;
    }
    if (!url || !(/^https:\/\/www\.emploi-public\.ma\//.test(url) || DREAMJOB.test(url))) {
      res.status(400).json({ error: 'Paramètre id ou url manquant/invalide.' });
      return;
    }

    if (DREAMJOB.test(url)) {
      const page = await getHtml(url);
      if (!page.ok) {
        res.status(200).json({ ok: false, status: page.status, officialUrl: null });
        return;
      }
      const found = findOfficialLink(page.html, url);
      if (found.officialUrl && EP_DETAIL.test(found.officialUrl)) {
        const detail = await getHtml(found.officialUrl);
        if (detail.ok) {
          const d = parseEmploiPublicDetail(detail.html);
          res.status(200).json({ ok: true, url, ...found, ...d, deadlineDate: d.deadlineDate || found.deadlineDate });
          return;
        }
      }
      res.status(200).json({ ok: true, url, ...found });
      return;
    }

    const page = await getHtml(url);
    if (!page.ok) {
      res.status(200).json({ ok: false, status: page.status });
      return;
    }
    res.status(200).json({ ok: true, url, officialUrl: url, via: 'emploi-public', ...parseEmploiPublicDetail(page.html) });
  } catch (err: any) {
    res.status(200).json({ ok: false, error: err?.message || 'inconnue' });
  }
}
