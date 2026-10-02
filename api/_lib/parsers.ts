/**
 * Code PARTAGÉ par les fonctions serverless du dossier api/ (le préfixe « _ »
 * empêche Vercel d'en faire une fonction). Analyse PURE du HTML : aucune donnée
 * n'est jamais inventée — un champ absent de la page vaut null.
 *
 * Import avec l'extension « .ts » : forme déjà éprouvée en production sur Vercel
 * (les scans dreamjob du 02/10 tournaient avec un import « ./enrich.ts »).
 */
import * as cheerio from 'cheerio';

export const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'fr-FR,fr;q=0.9,ar;q=0.8',
};

export const EP_DETAIL = /^https:\/\/(?:www\.)?emploi-public\.ma\/(?:fr|ar)\/concours\/details\/[0-9a-f-]{36}/i;
export const DREAMJOB = /^https:\/\/(?:www\.)?dreamjob\.ma\//i;
export const OFFICIAL_HOST = /(?:^|\.)(?:gov\.ma|ac\.ma|emploi-public\.ma)$/i;

const FR_MONTHS: Record<string, number> = {
  janvier: 0, février: 1, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, août: 7, aout: 7, septembre: 8, octobre: 9, novembre: 10,
  décembre: 11, decembre: 11,
};

// "15 octobre 2026", "1er octobre 2026" ou "15/10/2026" → "2026-10-15".
export function parseFrDateISO(text: string): string | null {
  if (!text) return null;
  const m = text.match(/(\d{1,2})(?:er)?\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})/);
  if (m) {
    const month = FR_MONTHS[m[2].toLowerCase()];
    const d = parseInt(m[1], 10);
    if (month !== undefined && d >= 1 && d <= 31) {
      return `${m[3]}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  const n = text.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})\b/);
  if (n) {
    const d = parseInt(n[1], 10);
    const mo = parseInt(n[2], 10);
    if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) {
      return `${n[3]}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return null;
}

// Valeur d'un champ étiqueté : "Label : valeur" dans le texte normalisé.
export function afterLabel(text: string, labels: string[]): string | null {
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

export function firstDate(text: string, labels: string[]): string | null {
  for (const lab of labels) {
    const re = new RegExp(lab + '[^0-9]{0,40}(\\d{1,2}(?:er)?\\s+[A-Za-zÀ-ÿ]+\\s+\\d{4}|\\d{1,2}/\\d{1,2}/\\d{4})', 'i');
    const m = text.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return null;
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

// ─── Rapprochement de titres (doublons possibles) ─────────────────────────────

export function normTokens(s: string): Set<string> {
  return new Set(
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !/^(concours|recrutement|poste|postes|2025|2026|2027|pour|dans|des|avec|grade|echelle)$/.test(w))
  );
}

export function overlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  a.forEach((w) => {
    if (b.has(w)) inter++;
  });
  return inter / Math.min(a.size, b.size);
}

export interface DuplicateRef {
  kind: 'publie' | 'emploi-public';
  title: string;
  admin: string | null;
  deadline: string | null;
  url: string | null;
}

// Doublon POSSIBLE (signalé à l'admin, jamais supprimé automatiquement — cahier l.239).
export function findPossibleDuplicate(
  title: string,
  admin: string | null,
  deadlineISO: string | null,
  refs: DuplicateRef[]
): DuplicateRef | null {
  const mine = normTokens(`${title} ${admin || ''}`);
  let best: { ref: DuplicateRef; score: number } | null = null;
  for (const ref of refs) {
    const score = overlap(mine, normTokens(`${ref.title} ${ref.admin || ''}`));
    const sameDeadline = !!deadlineISO && deadlineISO === ref.deadline;
    if ((sameDeadline && score >= 0.3) || score >= 0.6) {
      if (!best || score > best.score) best = { ref, score };
    }
  }
  return best ? best.ref : null;
}

// Forme canonique d'une fiche emploi-public (comparaison d'URL).
export function canonicalEmploiPublicUrl(url: string | null | undefined): string | null {
  const m = (url || '').match(/emploi-public\.ma\/(?:fr|ar)\/concours\/details\/([0-9a-f-]{36})/i);
  return m ? `https://www.emploi-public.ma/fr/concours/details/${m[1].toLowerCase()}` : null;
}

// ─── Annonce dreamjob.ma (agrégateur — complément, jamais source officielle) ──

export interface DreamjobPostResult {
  officialUrl: string | null;
  via: string | null;
  deadlineDate: string | null;
  examDate: string | null;
  specialties: string[] | null;
  postsCount: number | null;
  reference: string | null;
}

function cleanLine(t: string): string {
  return t.replace(/\s+/g, ' ').replace(/^[\s\-–•*·:]+/, '').replace(/[\s;.,]+$/, '').trim();
}

// Pure : champs lus dans le corps d'une annonce dreamjob. Conservateur : en cas
// de doute, null. La spécialité n'est lue que derrière un libellé « Spécialité ».
export function parseDreamjobPost(html: string, pageUrl: string): DreamjobPostResult {
  const $ = cheerio.load(html);
  const scope = $('.entry-content, .post-content, article').first();
  const root = scope.length ? scope : $('body');
  const text = root.text().replace(/\s+/g, ' ');

  let specialties: string[] | null = null;
  root.find('p, li, h2, h3, h4, h5, strong, b, td').each((_i, el) => {
    if (specialties) return;
    const own = $(el).text().replace(/\s+/g, ' ').trim();
    const m = own.match(/^sp[ée]cialit[ée]s?\s*(?:\(s\))?\s*(?:requises?|demand[ée]es?)?\s*:\s*(.*)$/i);
    if (!m) return;
    const inline = cleanLine(m[1] || '');
    if (inline.length > 1) {
      specialties = inline.split(/\s+-\s+|\s*;\s*/).map(cleanLine).filter((v) => v.length > 1);
      return;
    }
    // Libellé seul → liste qui suit immédiatement.
    const list = $(el).is('li') ? $(el).find('ul, ol').first() : $(el).closest('p, h2, h3, h4, h5, td').next('ul, ol');
    const items = list.find('li').map((_j, li) => cleanLine($(li).text())).get().filter((v: string) => v.length > 1);
    if (items.length > 0) specialties = items;
  });

  const posts = text.match(/\b(\d{1,4})\s*postes?\b/i);
  const postsN = posts ? parseInt(posts[1], 10) : NaN;
  const ref = text.match(/Code du concours\s*:?\s*([A-Z]?\d{3,6}\s*\/\s*\d{2,4})/i);
  const official = findOfficialLink(html, pageUrl);

  return {
    officialUrl: official.officialUrl,
    via: official.via,
    deadlineDate: official.deadlineDate,
    examDate: firstDate(text, ['Date du concours', "Date de l['’]examen", 'Date des [ée]preuves']),
    specialties,
    postsCount: postsN > 0 && postsN < 5000 ? postsN : null,
    reference: ref ? ref[1].replace(/\s+/g, '') : null,
  };
}

// ─── Écriture dans radar_candidates ──────────────────────────────────────────

// Colonnes RÉELLES de la table radar_candidates. Tout autre champ lu sur la fiche
// (code, grade, dates…) est rangé dans `raw` : un champ inconnu ferait refuser
// TOUT l'envoi par Supabase (bug constaté : plus aucune annonce emploi-public
// enregistrée après le 30/09).
export const RADAR_CANDIDATE_COLUMNS = new Set([
  'source_id', 'run_id', 'external_id', 'source_url', 'scraped_at', 'title_original', 'title_ar',
  'administration_name', 'administration_site', 'administration_category', 'degree_level', 'specialty',
  'region', 'positions', 'deadline_text', 'deadline_date', 'publication_text', 'raw', 'status',
]);

export function toCandidateRow(db: Record<string, any>): Record<string, any> {
  const row: Record<string, any> = {};
  const extra: Record<string, any> = {};
  for (const [k, v] of Object.entries(db)) {
    if (RADAR_CANDIDATE_COLUMNS.has(k)) row[k] = v;
    else if (v !== null && v !== undefined && v !== '') extra[k] = v;
  }
  if (Object.keys(extra).length > 0) row.raw = { ...(row.raw || {}), detail: extra };
  return row;
}
