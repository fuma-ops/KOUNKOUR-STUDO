// Règle d'affichage Google AdSense (Annonces automatiques), partagée par l'application
// (src/lib/ads.ts) et le rendu serveur (api/_lib/seo.ts).
//
// Refus AdSense du 07/11/2026 : « annonces diffusées par Google sur des écrans sans
// contenu de l'éditeur » et « contenu de faible valeur ». Le script AdSense n'est donc
// chargé QUE sur une page de contenu complète : accueil, liste des concours, fiche concours
// lue dans son arrêté, préparation (dossiers, fiches, QCM). Jamais sur la connexion, le
// profil, l'administration, la communauté, une page introuvable, une liste vide, un écran de
// chargement ou une fiche « page seule » (pas encore complétée avec son arrêté).

export const ADSENSE_CLIENT = 'ca-pub-8156754023993120';

// Chemins de contenu (sans ?lang) : /, /concours, /concours/<fiche>, /preparation,
// /preparation/<dossier>, /preparation/qcm/<série>.
const CONTENT_PATH = /^\/(?:concours(?:\/[^/]+)?|preparation(?:\/qcm)?(?:\/[^/]+)?)?\/?$/;

// Texte visible minimal d'une page « bien faite » (hors menus). Une page de QCM n'affiche
// qu'une question à la fois (énoncé, propositions, corrigé) : seuil propre.
export const ADS_MIN_TEXT = 1200;
export const ADS_MIN_TEXT_QCM = 500;

// Fiche établie depuis la seule page emploi-public, en attente de son arrêté.
const THIN_MARKERS = /fiche établie depuis la page emploi-public|Voir l'arrêté \(fiche établie/i;

// Fiche concours : elle s'ouvre par-dessus la liste ; seul son propre texte compte.
export const isContestPath = (path: string) => /^\/concours\/[^/]+\/?$/.test(path.split('?')[0]);

export function adsContentPath(path: string): boolean {
  return CONTENT_PATH.test(path.split('?')[0]);
}

export function adsAllowed(path: string, visibleText: string): boolean {
  const text = visibleText.replace(/\s+/g, ' ').trim();
  const min = /^\/preparation\/qcm\//.test(path) ? ADS_MIN_TEXT_QCM : ADS_MIN_TEXT;
  return adsContentPath(path) && text.length >= min && !THIN_MARKERS.test(text);
}
