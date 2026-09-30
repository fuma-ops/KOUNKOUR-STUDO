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
import * as cheerio from 'cheerio';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'fr-FR,fr;q=0.9,ar;q=0.8',
};

const EP_DETAIL = /^https:\/\/(?:www\.)?emploi-public\.ma\/(?:fr|ar)\/concours\/details\/[0-9a-f-]{36}/i;
const DREAMJOB = /^https:\/\/(?:www\.)?dreamjob\.ma\//i;
const OFFICIAL_HOST = /(?:^|\.)(?:gov\.ma|ac\.ma|emploi-public\.ma)$/i;

// Valeur d'un champ étiqueté : "Label : valeur" dans le texte normalisé.
function afterLabel(text: string, labels: string[]): string | null {
  for (const lab of labels) {
    const re = new RegExp(lab + '\\s*:?\\s*([^\\n]{1,160})', 'i');
    const m = text.match(re);
    if (m && m[1]) {
      const v = m[1].trim().replace(/\s{2,}/g, ' ');
      if (v) return v;
    }
  }
  return null;
}

function firstDate(text: string, labels: string[]): string | null {
  for (const lab of labels) {
    const re = new RegExp(lab + '[^0-9]{0,40}(\\d{1,2}(?:er)?\\s+[A-Za-zÀ-ÿ]+\\s+\\d{4}|\\d{1,2}/\\d{1,2}/\\d{4})', 'i');
    const m = text.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

async function getHtml(url: string): Promise<{ ok: boolean; status: number; html: string }> {
  const r = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(8000) });
  return { ok: r.ok, status: r.status, html: r.ok ? await r.text() : '' };
}

// Pure : champs d'une fiche détail emploi-public.
export function parseEmploiPublicDetail(html: string) {
  const $ = cheerio.load(html);
  const text = $('body').text().replace(/\s+/g, ' ').trim();

  // Code du concours : ex "C43571/26" (jamais inventé — null si absent).
  let reference: string | null = null;
  const refM = text.match(/Code du concours\s*:?\s*([A-Z]?\d{3,6}\s*\/\s*\d{2,4})/i);
  if (refM) reference = refM[1].replace(/\s+/g, '');

  // Site de dépôt : lien officiel (hors emploi-public).
  let applyUrl: string | null = null;
  $('a[href]').each((_i, el) => {
    if (applyUrl) return;
    const href = $(el).attr('href') || '';
    if (/^https?:\/\//.test(href) && /gov\.ma/i.test(href) && !/emploi-public\.ma/i.test(href)) {
      applyUrl = href;
    }
  });

  return {
    reference,
    examDate: firstDate(text, ['Date du concours']),
    publicationDate: firstDate(text, ['Date de publication']),
    deadlineDate: firstDate(text, ['D[ée]lai de d[ée]p[ôo]t', 'Limite de d[ée]p[ôo]t']),
    applyUrl,
    recruitmentType: afterLabel(text, ['Type de recrutement']),
    depositType: afterLabel(text, ['Type de d[ée]p[ôo]t']),
  };
}

// Pure : lien vers la source officielle cité dans une annonce dreamjob.
// Priorité : fiche emploi-public > PDF sur un domaine officiel > page .gov.ma/.ac.ma.
export function findOfficialLink(html: string, pageUrl: string): { officialUrl: string | null; via: string | null; deadlineDate: string | null } {
  const $ = cheerio.load(html);
  const scope = $('.entry-content, .post-content, article').first();
  const root = scope.length ? scope : $('body');

  const links: URL[] = [];
  root.find('a[href]').each((_i, el) => {
    try {
      links.push(new URL($(el).attr('href') || '', pageUrl));
    } catch {
      /* lien invalide ignoré */
    }
  });

  const ep = links.find((u) => EP_DETAIL.test(u.href));
  const pdf = links.find((u) => OFFICIAL_HOST.test(u.hostname) && /\.pdf$/i.test(u.pathname));
  const gov = links.find((u) => OFFICIAL_HOST.test(u.hostname) && u.pathname.length > 1);
  const pick = ep ? { u: ep, via: 'emploi-public' } : pdf ? { u: pdf, via: 'pdf-officiel' } : gov ? { u: gov, via: 'site-officiel' } : null;

  const text = root.text().replace(/\s+/g, ' ');
  return {
    officialUrl: pick ? pick.u.href : null,
    via: pick ? pick.via : null,
    deadlineDate: firstDate(text, ['Dernier d[ée]lai', 'Date limite', 'Limite de d[ée]p[ôo]t']),
  };
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
