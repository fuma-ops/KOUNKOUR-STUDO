// URLs publiques (cahier des charges §5 et §15) : chaque page a une adresse
// stable, partageable et indexable. Le même découpage sert au client (barre
// d'adresse, bouton retour) et au rendu serveur (api/seo.ts).

export type Route =
  | { name: 'home' }
  | { name: 'contests' }
  | { name: 'contest'; slug: string }
  | { name: 'prep' }
  | { name: 'folder'; slug: string }
  | { name: 'qcm'; slug: string }
  | { name: 'community' }
  | { name: 'profile' }
  | { name: 'admin' }
  | { name: 'notfound' };

const seg = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

export function parsePath(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean).map(seg);
  const [a, b, c] = parts;
  if (parts.length === 0) return { name: 'home' };
  if (a === 'concours' && parts.length === 1) return { name: 'contests' };
  if (a === 'concours' && parts.length === 2) return { name: 'contest', slug: b };
  if (a === 'preparation' && parts.length === 1) return { name: 'prep' };
  if (a === 'preparation' && b === 'qcm' && parts.length === 2) return { name: 'prep' };
  if (a === 'preparation' && b === 'qcm' && parts.length === 3) return { name: 'qcm', slug: c };
  if (a === 'preparation' && parts.length === 2) return { name: 'folder', slug: b };
  if (a === 'communaute' && parts.length === 1) return { name: 'community' };
  if (a === 'profil') return { name: 'profile' };
  if (a === 'admin') return { name: 'admin' };
  return { name: 'notfound' };
}

export function routePath(r: Route): string {
  const e = encodeURIComponent;
  switch (r.name) {
    case 'home':
    case 'notfound':
      return '/';
    case 'contests':
      return '/concours';
    case 'contest':
      return `/concours/${e(r.slug)}`;
    case 'prep':
      return '/preparation';
    case 'folder':
      return `/preparation/${e(r.slug)}`;
    case 'qcm':
      return `/preparation/qcm/${e(r.slug)}`;
    case 'community':
      return '/communaute';
    case 'profile':
      return '/profil';
    case 'admin':
      return '/admin';
  }
}

// Onglet de l'application correspondant à une route.
export function tabOf(r: Route): string {
  switch (r.name) {
    case 'contests':
    case 'contest':
      return 'contests';
    case 'prep':
    case 'folder':
    case 'qcm':
      return 'preparation';
    case 'community':
      return 'community';
    case 'profile':
      return 'profile';
    case 'admin':
      return 'admin';
    default:
      return 'home';
  }
}

// Version arabe d'une page : même adresse avec ?lang=ar (hreflang).
export function withLang(path: string, lang: 'fr' | 'ar'): string {
  return lang === 'ar' ? `${path}?lang=ar` : path;
}
