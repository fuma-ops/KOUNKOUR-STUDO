---
name: youtube-script
description: Rédige le script complet d'une vidéo YouTube KounKour (accroche, plan, texte parlé, indications visuelles, appel à l'action) en français ou arabe/darija. À utiliser quand le propriétaire demande un script, un texte de voix off ou un plan de vidéo.
---

# Script de vidéo YouTube — KounKour

## Avant d'écrire
- Récupérer les faits dans Supabase ou l'annonce officielle (projet
  `zcxkxqsqzwtdnrupxlah`) ; ne jamais inventer date, nombre de postes, condition
  ou lien. Inconnu → « à vérifier » dans le script, signalé en tête.
- Demander la langue seulement si elle n'est pas claire (français, arabe
  standard ou darija) ; sinon français. Pour l'arabe, texte RTL propre.
- Dates au format local lisible (ex. « 25 octobre 2026 »), heure du Maroc.

## Structure
1. **Accroche (0–15 s)** : le bénéfice ou l'urgence, sans clickbait trompeur.
2. **Promesse + plan** en une phrase.
3. **Corps** en 3 à 5 parties courtes ; pour chaque partie : texte parlé,
   indication visuelle (capture de la fiche, annonce officielle, écran de
   l'appli), durée estimée.
4. **Rappel de la source officielle** : toujours citer l'annonce originale et
   rappeler de vérifier sur le site officiel avant de postuler.
5. **Appel à l'action** : ouvrir la fiche sur KounKour, activer les alertes,
   s'abonner. Un seul CTA principal.

## Format de sortie
Fichier `videos/<AAAA-MM-JJ>-<slug>/script.md` avec : titre de travail,
durée cible, public, sources (liens + date de vérification), tableau
`Temps | Voix | Visuel`, liste des éléments à vérifier.

## À éviter
Promesses de réussite, garantie d'éligibilité, statistiques non sourcées,
traduction non étiquetée d'une annonce officielle, logos/marques d'institutions
utilisés comme s'ils cautionnaient KounKour.
