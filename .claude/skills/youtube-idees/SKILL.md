---
name: youtube-idees
description: Propose et planifie des idées de vidéos YouTube pour KounKour (concours publics au Maroc) à partir des données réelles du site. À utiliser quand le propriétaire demande « des idées de vidéos », un calendrier éditorial YouTube ou « quoi filmer cette semaine ».
---

# Idées et calendrier de vidéos YouTube — KounKour

Public : candidats marocains aux concours publics (mobile, Android, arabe darija / français).

## Règles (CLAUDE.md)
- **Aucune donnée inventée** : concours, dates limites, postes, diplômes, chiffres
  viennent de Supabase (projet `zcxkxqsqzwtdnrupxlah`, à interroger soi-même)
  ou de l'annonce officielle. Champ inconnu → « à vérifier ».
- Dates en heure locale du Maroc, pas en UTC. Réponse en français.

## Méthode
1. Relire `docs/cahier-des-charges.md` (positionnement) et `docs/suivi-concours.md`.
2. Interroger Supabase (`execute_sql`, lecture seule) : concours ouverts avec
   date limite proche, résultats récemment publiés, convocations, concours
   sans couverture vidéo évidente.
3. Proposer 5 à 10 idées, chacune avec : titre de travail, format (court
   < 60 s / vidéo 5–10 min / explicatif long), angle, concours concernés
   (lien de la fiche + source officielle), urgence (date limite), besoin
   de visuels.
4. Formats récurrents utiles : « Concours qui ferment cette semaine »,
   « Comment lire une annonce officielle », « Dossier de candidature : les
   pièces à préparer », « Résultats publiés : et maintenant ? »,
   « Présentation de l'appli KounKour », « Comment utiliser les QCM / annales ».
5. Classer par urgence (date limite) puis par potentiel d'utilité. Ne jamais
   promettre de résultat ni garantir l'éligibilité (cf. cahier §1).

## Sortie
Tableau Markdown : semaine locale, idée, format, source des données, statut.
