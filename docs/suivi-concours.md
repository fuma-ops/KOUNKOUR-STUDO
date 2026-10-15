# Suivi des concours après la clôture

Sur emploi-public.ma, chaque concours garde la même fiche (même identifiant) de l'annonce
aux résultats. Les listes officielles y sont ajoutées au fil du concours :

| Lien sur la fiche emploi-public                     | Document KounKour (`contest_documents.doc_type`) | Étape (`contests.stage`) |
|-----------------------------------------------------|--------------------------------------------------|--------------------------|
| `/fr/concours/download/list_convoques/<id>`         | `convoques_ecrit`                                | `ecrit`                  |
| `/fr/concours/download/list_convoques_oral/<id>`    | `convoques_oral`                                 | `oral`                   |
| `/fr/concours/download/list_resultats/<id>`         | `resultats`                                      | `resultat`               |

Le rattachement est exact (identifiant de la fiche source) : aucun rapprochement par titre.
L'étape n'est retenue que si la liste officielle est présente. Aux résultats, le statut passe
à `resultats_publies`.

## Chaîne automatique (chaque matin)

1. `radar_daily_tick` (pg_cron, toutes les 2 min) : scan → documents → reprise → **stages** → terminé.
2. Phase *stages* : `GET /api/radar/track-stages?limit=25&key=…` jusqu'à `remaining = 0`.
   - `contest_stage_targets` : concours emploi-public clos (ou à 3 jours de la clôture) depuis
     moins d'un an, sans résultats, non vérifiés depuis 20 h.
   - lecture des fiches (5 en parallèle), `parseEpStages` (`api/_lib/stages.ts`).
   - `contest_stage_record` : ajoute les listes, fait avancer l'étape, renvoie les nouveautés.
   - notifications push aux candidats qui ont le concours en favori (`contest_stage_subscribers`),
     une seule fois par liste (`alert_log.kind` = `convoques_ecrit` / `convoques_oral` / `resultats`).

Aperçu sans rien enregistrer : `GET /api/radar/track-stages?key=…&dry=1`.

## Affichage

- Fiche concours (app) : bloc « Suivi du concours » (`ContestStageTracker`) avec les PDF officiels.
- Cartes : badge « Convoqués Écrit / Oral » ou « Résultats publiés ».
- Rendu serveur (Google) : titre « Résultats : … » / « Liste des convoqués à l'oral : … »,
  liens officiels dans la page ; plus de JobPosting une fois une liste publiée.

Tests : `npm run -s test:stages` (et `EP_SAMPLES=<dossier>` pour des fiches réelles enregistrées),
`npm run -s test:seo`.
