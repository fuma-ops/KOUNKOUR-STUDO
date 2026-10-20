import { getSupabase } from './supabase';

// Mesure d'audience sans cookie : une ligne par page vue (RPC track_visit).
// La session est un identifiant aléatoire gardé dans sessionStorage (oublié à la
// fermeture de l'onglet) : il permet de compter les visites, pas de suivre une personne.
// La provenance (Facebook, Google…) est lue une fois, à l'arrivée sur le site.
// Un appareil qui ouvre l'espace admin n'est plus compté (pas de chiffres gonflés par l'équipe).

const SESSION_KEY = 'kk:visit';
const NO_COUNT_KEY = 'kk:nocount';
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp\/|bingpreview/i;

type Source = 'facebook' | 'instagram' | 'whatsapp' | 'google' | 'autre_moteur' | 'autre_site' | 'direct';

function sourceOf(): Source {
  const utm = new URLSearchParams(window.location.search).get('utm_source')?.toLowerCase() || '';
  const ref = (() => {
    try {
      return document.referrer ? new URL(document.referrer).hostname.toLowerCase() : '';
    } catch {
      return '';
    }
  })();
  const s = `${utm} ${ref}`;
  if (/facebook|fb\b|fb\.|fbclid/.test(s) || new URLSearchParams(window.location.search).has('fbclid')) return 'facebook';
  if (/instagram/.test(s)) return 'instagram';
  if (/whatsapp|wa\.me/.test(s)) return 'whatsapp';
  if (/google/.test(s)) return 'google';
  if (/bing|yahoo|duckduckgo|yandex|ecosia|qwant/.test(s)) return 'autre_moteur';
  if (ref && !ref.endsWith('kounkour.com')) return 'autre_site';
  return 'direct';
}

function session(): { sid: string; source: Source } | null {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) return JSON.parse(saved);
    const s = { sid: crypto.randomUUID(), source: sourceOf() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    return s;
  } catch {
    return null;
  }
}

let last = '';

export function trackPageView(fullPath: string) {
  try {
    if (!/(^|\.)kounkour\.com$/.test(window.location.hostname)) return;
    if (BOT.test(navigator.userAgent) || (navigator as any).webdriver) return;
    const path = fullPath.split('?')[0] || '/';
    if (path.startsWith('/admin')) {
      localStorage.setItem(NO_COUNT_KEY, '1');
      return;
    }
    if (localStorage.getItem(NO_COUNT_KEY)) return;
    const lang = new URLSearchParams(fullPath.split('?')[1] || '').get('lang') === 'ar' ? 'ar' : 'fr';
    if (`${path}|${lang}` === last) return;
    last = `${path}|${lang}`;
    const s = session();
    const sb = getSupabase();
    if (!s || !sb) return;
    // .then() : la requête Supabase ne part qu'une fois consommée.
    sb.rpc('track_visit', {
      p_sid: s.sid,
      p_path: path,
      p_lang: lang,
      p_source: s.source,
      p_device: window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'ordinateur',
    }).then(() => undefined);
  } catch {
    // La mesure ne doit jamais gêner la navigation.
  }
}
