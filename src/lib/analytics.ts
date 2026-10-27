// Google Analytics 4, en complément du compteur interne (visits.ts).
// Chargé seulement sur kounkour.com, jamais pour les robots ni pour un appareil de
// l'équipe (espace admin) ; aucun cookie publicitaire (signaux Google désactivés).
// Identifiant de mesure GA4 (public, de la forme G-XXXXXXXXXX) : vide = GA désactivé.
export const GA_ID: string = 'G-YK6392SLTQ';

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp\/|bingpreview/i;
type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

function allowed(path: string): boolean {
  try {
    if (!GA_ID) return false;
    if (!/(^|\.)kounkour\.com$/.test(window.location.hostname)) return false;
    if (BOT.test(navigator.userAgent) || (navigator as Navigator & { webdriver?: boolean }).webdriver) return false;
    if (path.startsWith('/admin') || localStorage.getItem('kk:nocount')) return false;
    return true;
  } catch {
    return false;
  }
}

let loaded = false;
function gtag(): Gtag {
  // La balise Google est déjà dans le <head> (index.html) : on la réutilise telle quelle.
  if (!loaded && typeof window.gtag === 'function') loaded = true;
  if (!loaded) {
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    // eslint-disable-next-line prefer-rest-params
    window.gtag = function () { window.dataLayer!.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
  }
  return window.gtag!;
}

// Page vue (application à une seule page : envoyée à chaque changement d'adresse).
export function gaPageView(fullPath: string) {
  const path = fullPath.split('?')[0] || '/';
  if (!allowed(path)) return;
  gtag()('event', 'page_view', {
    page_location: window.location.origin + fullPath,
    page_path: path,
    page_title: document.title,
    language: new URLSearchParams(fullPath.split('?')[1] || '').get('lang') === 'ar' ? 'ar' : 'fr',
  });
}

// Événement (QCM terminé, clic sur une suggestion « Et maintenant ? »…).
export function gaEvent(name: string, params: Record<string, string | number> = {}) {
  if (!allowed(window.location.pathname)) return;
  gtag()('event', name, params);
}
