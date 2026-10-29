# Routine du matin (Claude, 6h00 heure du Maroc) — sans intervention du propriétaire

Depuis le 26/10/2026 (base `kounkour-v2`, projet `aqnxeiylhgxfvhbkftbx`), la routine passe
d'abord par la **clé robot** via `scripts/robot.mjs` (variable `RADAR_KEY`). Depuis le 28/10/2026,
le connecteur Supabase (`execute_sql`) est autorisé sans confirmation (`.claude/settings.json`)
pour ce que la clé robot ne couvre pas (rouvrir une fiche prolongée, compléter un critère, etc.).

## Ce qui tourne déjà seul dans Supabase (pg_cron, rien à faire)

| Tâche | Quand | Fonction |
|---|---|---|
| Scan emploi-public + préparation des arrêtés | toutes les 2 min (cycle quotidien) | `radar_daily_tick` |
| Clôtures, annonces expirées, « À traiter » > 7 j, purge des fichiers, visites > 400 j | 00h10 | `radar_housekeeping` |
| Convocations / résultats (listes officielles) | 6h–9h toutes les 10 min | `track_stages_call` → `/api/radar/track-stages` |
| Alertes e-mail / push | 12h30 | `alerts_daily_call` |

Les copies d'arrêtés ne sont plus stockées en base (lien + sha256 seulement) : la saturation
du disque du 22/10/2026 ne peut plus se reproduire.

## Étapes de la routine

1. `node scripts/robot.mjs preparer` (au cas où le cycle de la nuit n'a pas fini).
2. `node scripts/robot.mjs a-analyser` :
   - **a_analyser** : télécharger l'arrêté (liens via `docs <id>`, ou
     `https://www.emploi-public.ma/fr/concours/download/arrete/<id emploi-public>`), le lire,
     publier avec `publier <fichier>` (format de `radar_publish_arrete`, `sha` = 12 premiers
     caractères du sha256 du PDF). Jamais inventer : champ absent → `champs_non_lus`.
   - **page_seule_a_completer** (fiches établies depuis la page emploi-public) : lire l'arrêté et
     republier avec le vrai `sha` → la fiche est remplacée en gardant son adresse (mode « enrichi »).
   - Au plus ~25 arrêtés par matin, les dates limites les plus proches d'abord. Ceux qui restent
     sont publiés « page seule » (règle du propriétaire du 07/10) et complétés les jours suivants.
3. Consignes du propriétaire (`analysis.consigne_admin`) : les appliquer sans inventer.
4. `dreamjob` : rejeter doublons et articles sans annonce (`annonce <id> {"analysis_status":"rejete",…}`) ;
   garder en `a_verifier` les vrais concours hors emploi-public avec `analysis.a_traiter`
   (rejet automatique après 7 jours sans source).
5. `sans-specialite` : tout concours ouvert doit avoir une spécialité (ordre : spécialité de l'avis →
   domaine du diplôme → « Toutes spécialités (aucune spécialité exigée par l'avis) » → métier du poste).
6. **Préparation** : `npx tsx scripts/prep-gaps.ts` liste les familles de métiers sans préparation.
   Chaque matin, traiter les **2 familles avec le plus de postes** :
   - chercher de **vraies annales** publiées (sujets de concours précédents du même métier/grade) ;
     si trouvées et lisibles : transcrire mot pour mot, source citée, corrigé KounKour rédigé ;
   - sinon : **QCM d'entraînement KounKour** (20 à 25 questions, programme du métier, corrigé expliqué),
     `kind = entrainement`, `source_note` disant clairement qu'il ne s'agit pas d'un sujet réel ;
   - dossier : réutiliser un dossier existant si le métier correspond, sinon `dossier <fichier>`
     avec `match_terms` (mots de l'intitulé du métier, ex. `["juriste","assistant juriste"]`) ;
   - import : `annales <fichier>` (format `annales_import`), corrigés de sujets : `corrige <fichier>`.
   - **sujet écrit d'entraînement** (exercices rédigés par KounKour) : `kind = entrainement`, énoncé dans
     `statement`, aucune question ; le site l'affiche « Sujet d'entraînement KounKour (pas un sujet réel) ».
     Corrigé via `corrige` (migration `20261026_sujets_entrainement.sql`, appliquée le 26/10).
7. `logos` : logo officiel des nouveaux organismes, uniquement par **nom exact** sur les cartes
   emploi-public (`<img … alt="Nom de l'organisme">`). Ne jamais prendre une image de la fiche
   (ce sont les concours similaires) ; sans correspondance exacte, pas de logo.
8. `bilan` puis court rapport en français : publiés (dont page seule), complétés, rejetés,
   consignes traitées, sans spécialité, préparations ajoutées, liste « À traiter ».

## Publications Facebook du jour (tâche planifiée, 11h37 heure du Maroc)

`node scripts/social/post.mjs publier 30` (clé robot en variable d'environnement, jeton de page lu
en base via `social_secret`, jamais affiché). Une seule commande, rien n'est publié deux fois
(`social_posts`) :

- **derniers jours** : concours qui ferment dans 0 à 2 jours (2 au plus) ;
- **nouveau concours** : un post par concours publié depuis moins de 72 h (un organisme qui en
  publie 3 ou plus : un post récapitulatif avec chaque lien) ;
- **listes** : un post par nouvelle liste de convoqués (écrit, oral) ou de résultats
  (`contest_documents`, récapitulatif par organisme dès 3 listes du même type) ;
- **préparation** : 3 concours ouverts par jour avec une vraie question QCM du dossier relié
  (mêmes règles que la fiche, `prepFolderSlugsFor`) ; la réponse est sur le site ; une question
  d'entraînement est toujours présentée comme « pas un sujet officiel » ;
- **reel** « Les concours du jour » (vidéo 1080 × 1920, ~20 s), programmé à 19 h.

Le premier post part tout de suite, les suivants sont programmés sur Facebook et répartis jusqu'à
22 h. Ce qui ne trouve pas de place passe le lendemain. Aperçu sans publier :
`node scripts/social/post.mjs apercu 30 <dossier>`.

**Préparation pour chaque concours** : un concours ouvert sans dossier relié contenant des QCM
n'aura pas de post « préparation ». L'étape 6 doit donc d'abord combler ces trous (y compris les
dossiers qui n'ont que des sujets écrits et aucun QCM).
