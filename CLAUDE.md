# KounKour — consignes pour Claude

- Source de vérité produit : `docs/cahier-des-charges.md`. Le relire avant de
  répondre à « qu'est-ce qui reste ? » ou d'ajouter une fonctionnalité.
- **Ne jamais inventer de données** (concours, chiffres, diplômes, comptes,
  statistiques). Un champ inconnu reste vide / « à vérifier ».
- Vérifier soi-même dans Supabase (projet `twevhkhtpfbytrecfbse` « kounkour-v3 », organisation « kounkour », depuis le 24/11/2026 ; avant : `aqnxeiylhgxfvhbkftbx` « kounkour-v2 », bloqué pour quota de trafic ; l’ancien `zcxkxqsqzwtdnrupxlah` est hors service) au lieu de
  demander au propriétaire de copier-coller.
- Quand le propriétaire écrit **« go »** pour les annonces Radar : appliquer
  `docs/radar-analyse-ia.md`.
- Dates locales (Maroc), pas UTC. Réponses au propriétaire en français.

## Trafic Supabase (quota gratuit 5 Go/mois — projet bloqué le 24/11/2026 pour l'avoir dépassé)
- Jamais de lecture d'une table entière par visiteur. Les listes publiques (concours, QCM, dossiers) passent par `/api/public-data` (mis en cache par le CDN Vercel : 1 h concours, 6 h QCM) ; le rendu serveur (`api/seo.ts`) lit cette même copie.
- Toute nouvelle page ou fonctionnalité qui affiche des données à tous les visiteurs doit lire `/api/public-data` (ou un endpoint mis en cache de la même façon), pas Supabase directement.
- Le contrôle du trafic fait partie de la routine du matin (docs/routine-matin.md, « Trafic Supabase »).
