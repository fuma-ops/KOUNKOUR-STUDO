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

export interface EmploiPublicDetailResult {
  administration: string | null;
  deadlineDate: string | null;
  examDate: string | null;
  publicationDate: string | null;
  specialty: string[] | null;
  specialties: string[] | null;
  grade: string | null;
  postsCount: number | null;
  positions: number | null;
  recruitmentType: string | null;
  region: string | null;
  depositType: string | null;
  depositSite: string | null;
  applyUrl: string | null;
  reference: string | null;
  code: string | null;
  arreteUrl: string | null;
  pdfUrl: string | null;
}

// Pure : champs d'une fiche détail emploi-public extraits STRICTEMENT par la structure HTML.
export function parseEmploiPublicDetail(html: string): EmploiPublicDetailResult {
  const $ = cheerio.load(html);

  function cleanText(t: string | undefined | null): string | null {
    if (!t) return null;
    const v = t.replace(/\s+/g, ' ').trim();
    return v || null;
  }

  // 1. En-tête : Détail de l'annonce (s-content-box avec h3.h4)
  // Contient : Administration qui recrute, Délai de dépôt des candidatures, Date du concours, Date de publication
  let administration: string | null = null;
  let deadlineDate: string | null = null;
  let examDate: string | null = null;
  let publicationDate: string | null = null;

  $('h3.h4').each((_i, el) => {
    const span = $(el).find('span').first();
    const label = cleanText(span.text());
    const clone = $(el).clone();
    clone.find('span').remove();
    const val = cleanText(clone.text());

    if (label && val) {
      if (/Administration qui recrute/i.test(label)) {
        administration = val;
      } else if (/D[ée]lai de d[ée]p[ôo]t/i.test(label) || /Limite de d[ée]p[ôo]t/i.test(label)) {
        // "23 Juillet 2026 - 16:30" → "23 Juillet 2026"
        const m = val.match(/^(\d{1,2}(?:er)?\s+[A-Za-zÀ-ÿ]+\s+\d{4})/i);
        deadlineDate = m ? m[1].trim() : val;
      } else if (/Date du concours/i.test(label)) {
        const m = val.match(/^(\d{1,2}(?:er)?\s+[A-Za-zÀ-ÿ]+\s+\d{4})/i);
        examDate = m ? m[1].trim() : val;
      } else if (/Date de publication/i.test(label)) {
        const m = val.match(/^(\d{1,2}(?:er)?\s+[A-Za-zÀ-ÿ]+\s+\d{4})/i);
        publicationDate = m ? m[1].trim() : val;
      }
    }
  });

  // Repli pour l'administration organisatrice si non trouvée en haut
  if (!administration) {
    const org = $('.details-contact .form-title strong').first().text();
    if (org) administration = cleanText(org);
  }

  // 2. Liste détaillée Description (ul li)
  // Spécialité, Grade, Nombre de postes, Type de recrutement, Région, Type de dépôt, Site de dépôt, Code du concours
  let specialty: string[] | null = null;
  let grade: string | null = null;
  let postsCount: number | null = null;
  let recruitmentType: string | null = null;
  let region: string | null = null;
  let depositType: string | null = null;
  let depositSite: string | null = null;
  let reference: string | null = null;

  $('ul li').each((_i, el) => {
    const span = $(el).find('span').first();
    const label = cleanText(span.text());
    const strong = $(el).find('strong').first();
    if (!label || !strong.length) return;

    if (/Sp[ée]cialit[ée]/i.test(label)) {
      // Tableau : une entrée par ligne commençant par « - », en retirant le « - » initial.
      // Recopier le texte EXACT, même avec une faute (« genreraliste »).
      const rawText = strong.text();
      const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const specs: string[] = [];
      for (const line of lines) {
        if (line.startsWith('-')) {
          specs.push(line.replace(/^-\s*/, '').trim());
        }
      }
      if (specs.length > 0) {
        specialty = specs;
      } else if (rawText.trim()) {
        specialty = [rawText.replace(/^-\s*/, '').trim()];
      }
    } else if (/Grade/i.test(label)) {
      grade = cleanText(strong.text());
    } else if (/Nombre de postes/i.test(label)) {
      const n = parseInt(cleanText(strong.text()) || '', 10);
      postsCount = Number.isNaN(n) ? null : n;
    } else if (/Type de recrutement/i.test(label)) {
      recruitmentType = cleanText(strong.text());
    } else if (/R[ée]gion/i.test(label)) {
      // Séparer le nom de région du « (10 postes) »
      const clone = strong.clone();
      clone.find('span').remove();
      let r = cleanText(clone.text()) || '';
      r = r.replace(/\s*\(\d+\s*postes?\)/i, '').trim();
      region = r || null;
    } else if (/Type de d[ée]p[ôo]t/i.test(label)) {
      depositType = cleanText(strong.text());
    } else if (/Site de d[ée]p[ôo]t/i.test(label)) {
      const a = strong.find('a');
      depositSite = cleanText(a.length ? a.attr('href') || a.text() : strong.text());
    } else if (/Code du concours/i.test(label)) {
      reference = cleanText(strong.text());
    }
  });

  // 3. Lien « Arrêté d'ouverture du concours » (PDF)
  let arreteUrl: string | null = null;
  $('a[href*="/download/arrete/"], a[href*="/arrete/"], a:contains("Arrêté d\'ouverture")').each((_i, el) => {
    if (arreteUrl) return;
    const href = $(el).attr('href');
    if (href) {
      arreteUrl = href.startsWith('http')
        ? href
        : `https://www.emploi-public.ma${href.startsWith('/') ? '' : '/'}${href}`;
    }
  });

  // Replis textuels sécurisés si une structure non-standard est rencontrée
  if (!reference) {
    const refM = $('body').text().match(/Code du concours\s*:?\s*([A-Z]?\d{3,6}\s*\/\s*\d{2,4})/i);
    if (refM) reference = refM[1].replace(/\s+/g, '');
  }

  return {
    administration,
    deadlineDate,
    examDate,
    publicationDate,
    specialty,
    specialties: specialty,
    grade,
    postsCount,
    positions: postsCount,
    recruitmentType,
    region,
    depositType,
    depositSite,
    applyUrl: depositSite,
    reference,
    code: reference,
    arreteUrl,
    pdfUrl: arreteUrl,
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
