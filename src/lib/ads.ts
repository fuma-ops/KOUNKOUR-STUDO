// Chargement de Google AdSense côté application : voir la règle dans src/lib/adsPolicy.ts.
// Le script est ajouté une seule fois, et seulement quand la page affichée est une page de
// contenu complète (données chargées, assez de texte). Sur les écrans sans contenu
// (profil, admin, liste vide, chargement…), <html data-ads="off"> masque les annonces
// automatiques déjà placées (src/index.css).
import { ADSENSE_CLIENT, adsAllowed, isContestPath } from './adsPolicy';

const SCRIPT = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

function load(): void {
  if (document.querySelector('script[src*="adsbygoogle.js"]')) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = SCRIPT;
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
}

// Retourne true si les annonces sont autorisées sur l'écran actuel.
export function updateAds(path: string): boolean {
  try {
    if (!/(^|\.)kounkour\.com$/.test(window.location.hostname)) return false;
    if (localStorage.getItem('kk:nocount')) return false; // appareil de l'équipe
    // Fiche concours : le texte de la fiche ouverte, pas celui de la liste en dessous.
    const root = isContestPath(path) ? document.querySelector<HTMLElement>('[data-ads-content]') : document.querySelector('main');
    const ok = !!root && !document.querySelector('[data-no-ads]') && adsAllowed(path, root.innerText || '');
    document.documentElement.dataset.ads = ok ? 'on' : 'off';
    if (ok) load();
    return ok;
  } catch {
    return false;
  }
}

// À chaque changement d'adresse : annonces coupées tout de suite, puis autorisées seulement
// quand le contenu est là (vérifié après le chargement des données).
export function watchAds(path: string): () => void {
  try {
    document.documentElement.dataset.ads = 'off';
  } catch {
    /* rien */
  }
  const timers = [1500, 4000, 9000].map((ms) => window.setTimeout(() => updateAds(path), ms));
  return () => timers.forEach((t) => window.clearTimeout(t));
}
