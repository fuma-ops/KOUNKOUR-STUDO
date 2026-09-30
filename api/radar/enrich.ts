/**
 * Fonction serverless Vercel — enrichissement d'un concours depuis sa PAGE DÉTAIL.
 *
 * La page liste ne contient pas tout (code du concours, date du concours, date de
 * publication, site de dépôt). Cette fonction va chercher la page détail officielle
 * et extrait ces champs, STRICTEMENT depuis le texte (jamais inventés). Appelée au
 * moment de la validation d'un candidat, une seule requête → rapide et poli.
 *
 * GET /api/radar/enrich?id=<uuid>  ou  ?url=<url complète de la page détail>
 */
import * as cheerio from 'cheerio';

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
    const re = new RegExp(lab + '[^0-9]{0,40}(\\d{1,2}\\s+[A-Za-zÀ-ÿ]+\\s+\\d{4})', 'i');
    const m = text.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

export default async function handler(req: any, res: any) {
  try {
    const q = req.query || {};
    let url: string | null = typeof q.url === 'string' ? q.url : null;
    if (!url && typeof q.id === 'string' && /^[a-f0-9-]{8,}$/i.test(q.id)) {
      url = `https://www.emploi-public.ma/fr/concours/details/${q.id}`;
    }
    if (!url || !/^https:\/\/www\.emploi-public\.ma\//.test(url)) {
      res.status(400).json({ error: 'Paramètre id ou url manquant/invalide.' });
      return;
    }

    const r = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,ar;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      res.status(200).json({ ok: false, status: r.status });
      return;
    }
    const html = await r.text();
    const $ = cheerio.load(html);
    const text = $('body').text().replace(/\s+/g, ' ').trim();

    // Code du concours : ex "C43571/26" (jamais inventé — null si absent).
    let reference: string | null = null;
    const refM = text.match(/Code du concours\s*:?\s*([A-Z]?\d{3,6}\s*\/\s*\d{2,4})/i);
    if (refM) reference = refM[1].replace(/\s+/g, '');

    const examDate = firstDate(text, ['Date du concours']);
    const publicationDate = firstDate(text, ['Date de publication']);
    const deadlineDate = firstDate(text, ['D[ée]lai de d[ée]p[ôo]t', 'Limite de d[ée]p[ôo]t']);

    // Site de dépôt : lien officiel (hors emploi-public).
    let applyUrl: string | null = null;
    $('a[href]').each((_i, el) => {
      if (applyUrl) return;
      const href = $(el).attr('href') || '';
      if (/^https?:\/\//.test(href) && /gov\.ma/i.test(href) && !/emploi-public\.ma/i.test(href)) {
        applyUrl = href;
      }
    });

    const recruitmentType = afterLabel(text, ['Type de recrutement']);
    const depositType = afterLabel(text, ['Type de d[ée]p[ôo]t']);

    res.status(200).json({
      ok: true,
      url,
      reference,
      examDate,
      publicationDate,
      deadlineDate,
      applyUrl,
      recruitmentType,
      depositType,
    });
  } catch (err: any) {
    res.status(200).json({ ok: false, error: err?.message || 'inconnue' });
  }
}
