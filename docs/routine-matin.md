# Routine du matin (Claude, 8h45 heure du Maroc) — sans intervention du propriétaire

Depuis le 26/10/2026 (base `kounkour-v2`, projet `aqnxeiylhgxfvhbkftbx`), la routine n'utilise
**que la clé robot** via `scripts/robot.mjs` (variable `RADAR_KEY`). Jamais le connecteur
Supabase : il affiche des demandes d'autorisation au propriétaire et bloque la routine.

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
7. `logos` : logo officiel des nouveaux organismes, uniquement par **nom exact** sur les cartes
   emploi-public (`<img … alt="Nom de l'organisme">`). Ne jamais prendre une image de la fiche
   (ce sont les concours similaires) ; sans correspondance exacte, pas de logo.
8. `bilan` puis court rapport en français : publiés (dont page seule), complétés, rejetés,
   consignes traitées, sans spécialité, préparations ajoutées, liste « À traiter ».
