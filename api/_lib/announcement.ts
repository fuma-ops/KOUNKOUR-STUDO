// Extraction pure (testable) du contenu d'une page d'annonce : texte lisible
// et liens vers les fichiers de l'arrêté (images, PDF). Aucune interprétation :
// l'analyse est faite ensuite, à partir des fichiers originaux stockés.
import * as cheerio from 'cheerio';

export interface AnnouncementMedia {
  url: string;
  kind: 'image' | 'pdf';
  // Image telle que publiée, si l'original WordPress déduit n'existe pas.
  fallbackUrl?: string;
}

export interface AnnouncementContent {
  text: string;
  media: AnnouncementMedia[];
}

// Images d'habillage du site, jamais un arrêté.
// (testé sur le nom de fichier seul : « uploads/ » ne doit pas passer pour « ads/ »)
const DECOR = /(logo|icon|favicon|avatar|emoji|gravatar|banner|banniere|(^|[-_.])(ads?|pub)([-_.]|$)|sprite|placeholder|spinner|loader|share|whatsapp|facebook|twitter|telegram|linkedin|instagram|youtube|app-?store|google-?play|qr[-_]?code)/i;
const fileName = (url: string) => {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
  } catch {
    return url;
  }
};
const IMG_EXT = /\.(jpe?g|png|webp)(\?|#|$)/i;
const PDF_EXT = /\.pdf(\?|#|$)/i;
const DOC_LINK_TEXT = /(arr[êe]t[ée]|avis|t[ée]l[ée]charger|annonce|pdf|قرار|إعلان|تحميل)/i;

function abs(href: string | undefined, base: string): string | null {
  if (!href) return null;
  const h = href.trim();
  if (!h || h.startsWith('data:') || h.startsWith('javascript:') || h.startsWith('#')) return null;
  try {
    const u = new URL(h, base);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
}

// Plus grande variante d'un srcset (« url 300w, url2 1024w »).
function largestFromSrcset(srcset: string | undefined): string | undefined {
  if (!srcset) return undefined;
  let best: { url: string; w: number } | null = null;
  for (const part of srcset.split(',')) {
    const [url, size] = part.trim().split(/\s+/);
    const w = parseInt(size || '0', 10) || 0;
    if (url && (!best || w > best.w)) best = { url, w };
  }
  return best?.url;
}

// WordPress ajoute « -300x200 » aux miniatures : on vise l'original.
export function originalWpImage(url: string): string {
  return url.replace(/-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp))(\?|$)/i, '$1$2');
}

export function extractAnnouncement(html: string, pageUrl: string): AnnouncementContent {
  const $ = cheerio.load(html);
  $('script, style, noscript, iframe, svg, form, nav, header, footer, aside').remove();
  $('[class*="related"], [class*="share"], [class*="comment"], [class*="sidebar"], [id*="sidebar"], [class*="widget"], [class*="breadcrumb"]').remove();

  const candidates = ['.entry-content', '.post-content', 'article .content', 'article', 'main', '.content', 'body'];
  let root: ReturnType<typeof $> = $('body');
  for (const sel of candidates) {
    const el = $(sel).first();
    if (el.length && el.text().replace(/\s+/g, ' ').trim().length > 80) {
      root = el;
      break;
    }
  }

  // Texte : un bloc par paragraphe / ligne de tableau, espaces normalisés.
  const lines: string[] = [];
  root.find('h1, h2, h3, h4, p, li, tr, blockquote, pre').each((_, el) => {
    const $el = $(el);
    // Ligne de tableau : cellules séparées, pour garder les colonnes lisibles.
    const t = (el.tagName === 'tr'
      ? $el.find('th, td').map((__, td) => $(td).text().replace(/\s+/g, ' ').trim()).get().join(' | ')
      : $el.text()
    ).replace(/\s+/g, ' ').trim();
    if (t && t !== lines[lines.length - 1]) lines.push(t);
  });
  const text = (lines.length ? lines.join('\n') : root.text().replace(/\s+/g, ' ').trim()).slice(0, 60000);

  const seen = new Set<string>();
  const media: AnnouncementMedia[] = [];
  const push = (url: string | null, kind: 'image' | 'pdf', fallbackUrl?: string) => {
    if (!url || seen.has(url) || DECOR.test(fileName(url))) return;
    seen.add(url);
    media.push(fallbackUrl && fallbackUrl !== url ? { url, kind, fallbackUrl } : { url, kind });
  };

  root.find('img').each((_, el) => {
    const $el = $(el);
    const width = parseInt($el.attr('width') || '0', 10);
    if (width && width < 250) return; // vignettes et icônes
    const raw =
      largestFromSrcset($el.attr('data-srcset') || $el.attr('srcset')) ||
      $el.attr('data-lazy-src') ||
      $el.attr('data-src') ||
      $el.attr('data-orig-file') ||
      $el.attr('src');
    const url = abs(raw, pageUrl);
    if (url && IMG_EXT.test(url)) push(originalWpImage(url), 'image', url);
  });

  root.find('a[href]').each((_, el) => {
    const $el = $(el);
    const url = abs($el.attr('href'), pageUrl);
    if (!url) return;
    if (PDF_EXT.test(url)) push(url, 'pdf');
    else if (IMG_EXT.test(url) && $el.find('img').length) push(originalWpImage(url), 'image', url);
    else if (/download|telecharger|fichier|attachment/i.test(url) && DOC_LINK_TEXT.test($el.text())) push(url, 'pdf');
  });

  return { text, media: media.slice(0, 8) };
}

// Contenu d'un article lu dans un flux RSS WordPress (balise content:encoded),
// remis sous forme de page pour réutiliser extractAnnouncement.
export function extractFromWordpressFeed(xml: string, pageUrl: string): string | null {
  const $ = cheerio.load(xml, { xml: true });
  const norm = (u: string) => u.replace(/\/+$/, '').toLowerCase();
  const items = $('item').toArray();
  const item = items.find((it) => norm($(it).find('link').first().text().trim()) === norm(pageUrl)) || (items.length === 1 ? items[0] : null);
  if (!item) return null;
  const content = $(item).find('content\\:encoded').first().text() || $(item).find('description').first().text();
  if (!content || content.replace(/<[^>]+>/g, '').trim().length < 20) return null;
  const title = $(item).find('title').first().text();
  return `<html><body><article><div class="entry-content"><h1>${title.replace(/</g, '&lt;')}</h1>${content}</div></article></body></html>`;
}
