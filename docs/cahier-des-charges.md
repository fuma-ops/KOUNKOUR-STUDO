# KounKour — Cahier des charges complet V2.0

_Concours & Communauté Maroc — Fonctionnel • UX/UI • Technique • Données • SEO • Sécurité • Automatisation_

Document de référence maître destiné au propriétaire du projet et à l'IA de programmation (Cloud Code / coding agent).

Version 2.0 — consolidée à partir des besoins discutés — Septembre 2026

> **Règle fondamentale** : analyser tout le document, proposer l'architecture et le plan par phases, puis attendre l'accord explicite avant de coder.

Transcrit tel quel depuis `KounKour_Cahier_des_charges_Complet_V2.pdf` (fourni par le propriétaire) pour servir de source de vérité versionnée dans ce dépôt. En cas de doute sur une formulation, le PDF original fait foi.

## 0. Instructions impératives à l'IA de programmation

- Lire intégralement ce cahier des charges avant toute modification du dépôt. Il constitue la source de vérité produit, sous réserve des décisions ultérieures explicites du propriétaire.
- Ne pas générer l'application entière en une seule fois. Commencer par audit du dépôt, architecture proposée, modèle de données, risques, dépendances, coûts récurrents et plan découpé en phases. Attendre validation avant de commencer la phase 1.
- Ne jamais supprimer ou remplacer une fonctionnalité spécifiée sans signaler le conflit et demander une décision.
- Ne jamais présenter des données fictives comme des concours officiels. Tout jeu de démonstration doit porter clairement la mention DEMO / DONNÉES FICTIVES.
- Ne jamais inventer dates, conditions, diplômes, nombre de postes, liens officiels, documents ou résultats. Conserver la source et la date de vérification de chaque information.
- Après chaque phase : fournir fichiers modifiés, migrations, commandes d'installation, variables d'environnement nécessaires (noms uniquement, jamais de secrets), tests exécutés, résultat des tests, limites connues et procédure de rollback.
- Ne pas affirmer qu'une fonction est terminée tant qu'elle n'a pas été testée de bout en bout. Pas de faux boutons, fausses notifications, faux scraping ou fausses intégrations.
- Privilégier des solutions simples, maintenables et peu coûteuses. Ne pas ajouter de service payant/API payante sans expliquer l'utilité, le coût, l'alternative gratuite et obtenir l'accord du propriétaire.
- Avant tout déploiement public : vérifier sécurité, RLS, mobile, accessibilité de base, SEO, droits des documents, politique de confidentialité, sauvegardes et modération.

## 1. Vision, mission et proposition de valeur

KounKour est une plateforme marocaine mobile-first qui centralise les concours de recrutement du secteur public et des établissements publics, les informations officielles, les ressources de préparation et une communauté d'entraide. Elle doit être consultable sans compte pour les informations publiques et installable comme PWA.

### Objectifs

- Permettre de découvrir rapidement les concours ouverts, à venir, clôturés ou dont les résultats sont publiés.
- Présenter les conditions et échéances de façon structurée, tout en donnant accès à l'annonce officielle originale.
- Aider à préparer les épreuves via QCM, examens antérieurs, fiches et ressources autorisées.
- Créer une communauté de candidats : questions, réponses, discussions par concours et entraide.
- À terme, détecter les nouvelles annonces officielles et proposer des concours correspondant au profil renseigné, sans garantir l'éligibilité.

### Publics

- Candidats marocains et résidents préparant les concours publics.
- Diplômés et étudiants : techniciens, licences, masters, ingénieurs et spécialités diverses.
- Candidats aux épreuves écrites, orales, psychotechniques, linguistiques et professionnelles.
- Équipe éditoriale, administrateurs et modérateurs.

## 2. Périmètre et priorités

| Version | Fonctionnalités |
| --- | --- |
| MVP / V1 | Site bilingue AR/FR; pages concours indexables; recherche/filtres; détails et documents; auth; favoris; QCM de base; communauté; admin manuel; SEO; PWA. |
| V1.1 | Notifications et rappels; historique des QCM; signalements; modération avancée; analytics éditoriales. |
| V2 | Concours Radar assisté; Smart Match explicable; import en masse; alertes personnalisées; OCR de documents si nécessaire. |
| V3 / optionnel | Application Android native si justifiée; partenariats sponsorisés clairement identifiés; options premium non essentielles; recommandations enrichies. |

> La publication manuelle des concours doit fonctionner même si Radar, Smart Match ou une API externe est désactivée.

## 3. Langues, direction et accessibilité

- Langues obligatoires dès la V1 : arabe (RTL) et français (LTR).
- Sélecteur de langue dans l'en-tête et les paramètres. Conserver le choix durant la navigation et les visites suivantes.
- Interface arabe correctement alignée : menus, formulaires, icônes directionnelles, tableaux, pagination et notifications.
- Ne pas traduire automatiquement une annonce officielle sans étiqueter la traduction. Conserver le PDF ou texte original et afficher clairement toute traduction non officielle.
- Prévoir des champs de contenu AR/FR indépendants; afficher un fallback explicite si une traduction manque.
- Design responsive, priorité téléphone Android; tailles tactiles confortables, contrastes lisibles, focus clavier, labels accessibles et messages d'erreur compréhensibles.

## 4. Identité visuelle et navigation

Nom de travail : KounKour (كونكور). Descripteur : Concours & Communauté Maroc. Vérifier disponibilité du nom, domaine, réseaux sociaux et marque avant engagement définitif.

- Direction visuelle : moderne, rassurante, marocaine, claire et orientée utilité. Palette envisagée : bordeaux/magenta, blanc/rose très pâle, accents vert marocain avec modération.
- Éviter l'encombrement, les dégradés excessifs et les interfaces ressemblant à un tableau administratif ancien.
- Créer un design system : couleurs, typographie arabe/française, espacements, boutons, champs, badges, cartes, alertes, états vides, chargement et erreurs.
- Navigation mobile principale : Accueil, Concours, Préparation, Communauté, Profil. Sur desktop, adapter en barre supérieure/latérale sans perdre les sections.
- Prévoir états loading, empty, error, offline/connexion lente, succès et confirmation pour chaque parcours important.

## 5. Pages et routes

| Route | Rôle |
| --- | --- |
| `/` | Accueil public : recherche rapide, concours récents, dates limites proches, accès préparation et communauté. |
| `/concours` | Liste, recherche, filtres et tri. |
| `/concours/[slug]` | Page SEO détaillée d'un concours avec critères, dates, source officielle et documents. |
| `/concours/[slug]/documents` | Documents et pièces liées au concours, avec droits et provenance. |
| `/preparation` | Hub des catégories de préparation. |
| `/preparation/qcm` | Catalogue QCM avec filtres. |
| `/preparation/qcm/[slug]` | Passage d'un QCM. |
| `/preparation/qcm/[slug]/resultat` | Résultat, explications et correction. |
| `/preparation/examens` | Examens et sujets antérieurs disponibles légalement. |
| `/preparation/ressources` | Fiches, cours, méthodes et ressources. |
| `/communaute` | Fil communautaire et filtres. |
| `/communaute/publication/[id]` | Publication, réponses, réactions et signalement. |
| `/communaute/poser-question` | Créer une publication/question. |
| `/communaute/concours/[slug]` | Espace de discussion associé à un concours. |
| `/auth/inscription`, `/auth/connexion`, `/auth/mot-de-passe-oublie` | Authentification et récupération. |
| `/profil`, `/profil/mes-concours`, `/profil/mes-resultats`, `/profil/mes-publications`, `/profil/parametres` | Espace personnel et préférences. |
| `/notifications` | Centre de notifications. |
| `/admin/*` | Back-office sécurisé selon rôle. |
| `/legal/*` | Mentions légales, confidentialité, cookies, conditions et règles communautaires. |

## 6. Accueil et recherche de concours

- Accueil : barre de recherche principale, concours récemment publiés, dates limites proches, administrations populaires, raccourcis QCM/préparation, questions récentes et contenu éditorial utile.
- Carte concours : intitulé, administration, diplôme/spécialité, ville/région si connue, nombre de postes si confirmé, date limite, statut, date de publication et badge source vérifiée lorsque contrôlée.
- Recherche plein texte sur titre, administration, spécialité, diplôme et mots-clés. Support des accents et variantes usuelles si possible.
- Filtres : statut (ouvert, bientôt clôturé, clôturé, résultats publiés), administration, domaine, diplôme, région/ville, type d'épreuve, période/date limite.
- Tri : plus récent, date limite la plus proche, pertinence. La pertinence doit être déterministe et testable.
- Pagination ou chargement progressif accessible, avec URLs partageables pour les filtres importants.
- Ne pas afficher un champ inconnu comme zéro; afficher "Non précisé dans l'annonce" ou équivalent.

## 7. Fiche détaillée d'un concours

- Titre officiel original, administration, référence/numéro d'annonce, date de publication, statut, date/heure limite et fuseau local si applicable.
- Nombre de postes, grade/cadre, spécialités, diplômes acceptés, expérience, limite d'âge, nationalité, conditions particulières et pièces demandées uniquement si la source les confirme.
- Dates d'épreuves, lieu, modalités de candidature, plateforme officielle, adresse ou lien de dépôt si annoncé.
- Résumé simplifié distinct du texte officiel. Mentionner que l'annonce officielle prévaut en cas de différence.
- Bloc "Source officielle" : organisme, URL exacte, document source, date de consultation/vérification et, si possible, page/section source.
- Documents associés : annonce originale, formulaire, liste de candidats, convocation, résultats, sujets/corrections autorisés. Afficher taille, format, date, provenance et action ouvrir/télécharger.
- Favori, partage, rappel de date limite, signalement d'une erreur et accès à la discussion de la communauté.
- Historique éditorial interne : qui a créé/modifié/vérifié, quand et quelles données ont changé.
- Statuts contrôlés : brouillon, à vérifier, publié, mis à jour, clôturé, annulé, résultats publiés, archivé. Les changements de statut doivent être auditables.

## 8. Préparation, QCM et examens

### Catalogue

- Catégories extensibles : psychotechnique, culture générale, français, arabe, anglais, informatique, spécialités techniques/professionnelles, oral et méthodologie.
- Chaque QCM : titre, langue, catégorie, niveau, durée éventuelle, nombre de questions, auteur/source, statut de publication et règles de correction.
- Filtrer par catégorie, niveau, langue, durée, concours lié et difficulté si elle est définie de façon cohérente.

### Passage et correction

- Afficher une question à la fois ou une liste paginée selon le mode défini; barre de progression et navigation précédent/suivant.
- Types V1 : choix unique; architecture extensible aux choix multiples et vrai/faux.
- Gérer minuterie côté client pour l'expérience, mais calculer et valider le score côté serveur lorsque sauvegardé.
- Ne pas exposer les bonnes réponses dans le payload initial avant soumission; protéger les solutions dans les endpoints et politiques d'accès.
- Résultat : score, réponses choisies, bonnes réponses, explications pédagogiques, durée, date et possibilité de recommencer.
- Connecté : enregistrer tentatives et progrès. Invité : permettre une pratique temporaire sans sauvegarde permanente.
- Prévoir QCM de démonstration explicitement fictifs pendant le développement. Aucune correction inventée ne doit être présentée comme officielle.

### Examens et ressources

- Catalogue de sujets antérieurs, annales, fiches et méthodes avec catégorie, langue, niveau, source, auteur et date.
- Respecter les droits d'auteur et conditions de redistribution. Si les droits de republication sont incertains, afficher la référence et un lien vers la source au lieu d'héberger le fichier.
- Corrections officielles, contributions communautaires et corrections éditoriales doivent être étiquetées séparément.
- Permettre signalement d'un document erroné, incomplet ou retiré.

## 9. Communauté – fonctionnalité centrale

- Fil avec publications, questions, réponses, commentaires imbriqués à profondeur limitée, réactions (utile/like), partage et sauvegarde.
- Catégories : question générale, concours spécifique, préparation/QCM, retour d'expérience, demande de conseil et annonce de ressource.
- Créer une discussion depuis une fiche concours et lier automatiquement la publication au concours.
- Composer une publication : texte, catégorie, concours lié facultatif, pièces jointes autorisées et aperçu avant publication.
- Réponses triables : plus utiles, récentes; auteur peut modifier/supprimer selon règles; modération peut masquer ou retirer avec motif.
- Profil public minimal : pseudonyme/nom d'affichage, avatar facultatif, date d'inscription et contributions publiques. Ne jamais exposer email, date de naissance exacte ou données privées.
- Outils : signaler publication/commentaire/utilisateur, bloquer/muter à envisager, règles communautaires, limitation anti-spam, limites de taille/type des fichiers.
- Badges "expert vérifié", "ancien candidat vérifié" uniquement après procédure réelle et traçable; sinon ne pas afficher de statut de vérification.
- Pas de messagerie privée dans MVP sauf décision ultérieure; éviter d'augmenter les risques de harcèlement et de modération.

### Modération

- Rôles : utilisateur, modérateur, éditeur, administrateur; privilèges minimaux et contrôlés côté serveur.
- File de signalements avec contenu, motif, date, nombre de signalements, état, décision et historique.
- Actions : masquer temporairement, supprimer selon politique, avertir, suspendre ou bannir, rétablir, marquer comme traité.
- Journal d'audit obligatoire pour actions administratives sensibles.
- Protéger contre spam, liens malveillants, injures, données personnelles publiées, usurpation et désinformation sur les concours.
- Publier règles communautaires et procédure de contestation/contact.

## 10. Comptes, profils et préférences

- Consultation publique des concours, documents autorisés et une partie des QCM sans compte.
- Inscription/connexion email et mot de passe; prévoir confirmation email, reset mot de passe et gestion de session sécurisée. Auth sociale facultative et non bloquante.
- Profil : nom d'affichage, avatar facultatif, langue, domaines/diplômes/intérêts facultatifs, région facultative et préférences d'alerte.
- Mes concours : favoris, concours suivis, rappels et statut personnel facultatif (à suivre, candidature envoyée, épreuve passée).
- Mes résultats : historique QCM, score, évolution et reprise si disponible.
- Paramètres : langue, notifications, confidentialité, suppression/désactivation du compte et export des données selon obligations applicables.
- Collecter le minimum de données. Smart Match ne doit pas rendre obligatoire la saisie de données personnelles sensibles.

## 11. Notifications et rappels

- Notifications in-app pour réponses, réactions pertinentes, annonces suivies et rappels d'échéance.
- Rappels paramétrables (ex. J-7, J-3, J-1) seulement si date fiable et consentement utilisateur.
- Email transactionnel facultatif pour vérification, reset et alertes explicitement demandées; utiliser un fournisseur configurable.
- Push web/PWA uniquement après consentement, compatibilité vérifiée et fonctionnement réel. Ne pas afficher un bouton de notification qui ne fait rien.
- Préférences par catégorie et fréquence; désabonnement simple des alertes non essentielles.
- Éviter les doublons; conserver statut lu/non lu et journal d'envoi minimal.

## 12. Back-office administrateur

- Dashboard : concours actifs, échéances prochaines, brouillons à vérifier, documents, signalements, utilisateurs et indicateurs d'usage non intrusifs.
- CRUD concours avec validation des champs, slug unique, sources, dates, critères structurés, traductions, documents et statut.
- Import manuel et CSV contrôlé avec prévisualisation, validation des colonnes, rapport des erreurs et détection de doublons.
- Gestion des administrations, catégories, QCM, questions/options/explications, examens et ressources.
- Gestion communauté : signalements, contenus masqués, suspensions et historique d'actions.
- Rôles et permissions séparés; aucune autorisation admin uniquement basée sur un contrôle frontend.
- Journal d'audit : action, acteur, horodatage, cible et résumé; ne pas enregistrer mots de passe, tokens ou secrets.
- Prévisualisation publique avant publication, confirmation pour suppression et possibilité d'archiver plutôt que supprimer définitivement.

## 13. Concours Radar – spécification technique détaillée (V2)

Radar est un processus de collecte assistée des annonces officielles. Il doit produire des brouillons à valider par un humain au début. Il ne doit jamais publier automatiquement une annonce incertaine sans règle explicite et validation.

### 13.1 Sources et collecte

- Sources prioritaires : emploi-public.ma, sites officiels des ministères, établissements et organismes publics, pages officielles de recrutement.
- Au lancement, créer une liste de sources administrable : nom, URL de départ, domaine autorisé, type de source, fréquence, statut actif/inactif, dernière collecte et notes.
- Chercher une API officielle, flux RSS ou export public lorsqu'ils existent. Sinon, utiliser uniquement l'accès aux pages publiques autorisé par les conditions du site et ses règles robots.
- Respecter les conditions d'utilisation, robots.txt, limitations de fréquence et droits applicables. Ne pas contourner authentification, CAPTCHA, paywall ou mesure anti-bot. Ne pas tenter d'accès non autorisé.
- Utiliser une liste blanche de domaines et limiter les requêtes; User-Agent identifiable si approprié, délai entre requêtes, cache et backoff en cas d'erreur.
- Ne pas collecter de données personnelles de candidats à partir de listes de résultats, sauf besoin légalement validé; la collecte radar porte d'abord sur les annonces et documents officiels.

### 13.2 Planification et exécution

- Créer un job backend planifié (cron/scheduler) qui lance la collecte selon une fréquence configurable par source, avec valeur initiale prudente, par exemple quotidienne.
- Ne pas exécuter le scraping dans le navigateur du visiteur. Utiliser une fonction serveur/worker ou tâche planifiée adaptée à l'hébergement choisi.
- La fréquence, durée maximale, nombre de pages et limites par domaine doivent être configurables; prévoir bouton admin "Lancer une collecte maintenant".
- Le job doit fonctionner même si aucun administrateur n'est connecté; documenter précisément la plateforme scheduler et ses limites gratuites/payantes.
- Prévoir verrouillage/lease pour éviter deux exécutions simultanées, timeout, retries limités, backoff exponentiel, logs structurés et alerte d'échec.
- Un scheduler gratuit ou inclus peut être utilisé si les quotas le permettent; signaler les éventuels coûts d'hébergement/exécution. Ne pas supposer un service illimité gratuit.

### 13.3 Extraction HTML/PDF/OCR

- HTML : extraire liens, titres, dates et contenu avec parseurs robustes; ne pas dépendre d'un sélecteur CSS unique sans détection de changement de structure.
- PDF texte : télécharger le fichier dans un espace temporaire sécurisé, calculer son empreinte (hash), extraire le texte via une bibliothèque open-source maintenue (ex. PyMuPDF ou pdfplumber selon runtime).
- PDF scanné/image : détecter l'absence de texte exploitable et utiliser OCR open-source (ex. Tesseract) si l'environnement peut le supporter; documenter langues de reconnaissance (arabe/français), qualité et limites.
- Nettoyer et normaliser texte, dates, chiffres arabes/occidentaux, espaces et caractères; conserver le document original et l'empreinte lorsque les droits et le stockage le permettent.
- Si extraction échoue ou qualité OCR est faible, créer une tâche "revue manuelle" avec lien source et motif; ne pas inventer les champs manquants.
- Sécuriser les fichiers entrants : limite de taille, type MIME réel, antivirus ou contrôle approprié, noms de fichiers neutralisés, stockage hors exécution et protection contre fichiers malveillants.

### 13.4 Détection, extraction structurée et doublons

- Extraire vers un schéma strict : titre, organisme, référence, date publication, date limite, postes, grade, diplômes, spécialités, région/lieu, URL candidature, source, document, langue et niveau de confiance.
- Chaque valeur doit avoir une provenance : URL/document, extrait de texte ou page, horodatage de collecte et méthode d'extraction.
- Ne jamais remplacer une donnée confirmée par une donnée moins fiable sans alerte. Les champs absents restent null/inconnus, jamais inventés.
- Détection doublon par URL canonique, identifiant officiel, hash de document et comparaison de titre/organisme/date; présenter les rapprochements à l'admin plutôt que fusionner silencieusement.
- Conserver versions/snapshots ou diff des champs essentiels afin de détecter changements de date limite, annulation ou correction officielle.
- Afficher un score de confiance comme indicateur technique interne seulement; définir seuils de revue, sans le présenter comme une certitude officielle.

### 13.5 File de validation humaine

- Chaque annonce détectée arrive en statut "À vérifier" et n'est pas visible publiquement.
- Écran de validation : source originale, PDF/HTML, données extraites côte à côte, champs modifiables, champs manquants, doublons possibles, différences par rapport à une version précédente.
- L'éditeur confirme ou corrige les informations, choisit le statut, valide les droits de document et publie explicitement.
- Journaliser qui a validé et à quelle date. Une modification officielle postérieure doit créer une alerte de mise à jour pour revue.
- Prévoir états : détecté, extraction en cours, à vérifier, doublon possible, approuvé, publié, rejeté, erreur, retiré.

### 13.6 API IA et coûts

- Le Radar doit fonctionner en mode de base sans API IA payante, si extraction texte/règles/OCR suffisent.
- L'utilisation d'un LLM/API IA est optionnelle, désactivable par configuration, et réservée aux cas difficiles (structuration d'un texte ambigu, classification ou résumé proposé).
- Aucune clé API dans le frontend ou le dépôt. Stocker les secrets dans les variables d'environnement du serveur/gestionnaire de secrets.
- Mettre des plafonds de coût, quotas par exécution, limites de tokens/taille, journal de consommation et arrêt automatique au seuil configuré.
- Toute sortie IA est non fiable jusqu'à vérification humaine; elle ne doit pas créer une condition, date ou diplôme absent de la source.
- Documenter alternatives open-source, coûts estimatifs selon volume et procédure de désactivation totale de l'IA.

## 14. Smart Match – spécification détaillée (V2)

Smart Match compare les préférences et critères déclarés par un utilisateur avec les critères structurés des concours. Il fournit une indication explicable, jamais une décision juridique ou garantie d'admissibilité.

- V1 du matching : moteur de règles déterministe, sans API IA payante obligatoire.
- Profil facultatif : niveau/diplôme, spécialité, année d'obtention si utile, tranche d'âge ou âge seulement si nécessaire et volontaire, région préférée, type d'administration/domaine, disponibilité et préférences d'alerte.
- Éviter de demander des données sensibles. Expliquer pourquoi chaque donnée est demandée et permettre de la modifier/supprimer.
- Critères de concours structurés et sourcés : diplômes acceptés, spécialités, âge/limites si annoncées, expérience, nationalité/conditions réglementaires, région et autres conditions explicites.
- Résultat en trois groupes : correspondance apparente, critères à vérifier, critères apparemment non correspondants. Afficher pour chaque critère la règle appliquée et le passage/source officiel.
- Si critère utilisateur ou concours manquant, ambigu, contradictoire ou extrait OCR avec faible confiance : classer "à vérifier", pas "non éligible".
- Ne jamais conclure "vous êtes définitivement admissible" ou "vous êtes exclu" lorsque l'annonce ou la règle est ambiguë. Texte obligatoire : "Cette estimation ne remplace pas la lecture de l'annonce officielle; l'organisme recruteur décide de l'admissibilité."
- Permettre de voir tous les concours, pas uniquement ceux recommandés, et désactiver Smart Match/alertes.
- Alertes opt-in lorsqu'un concours nouvellement publié correspond aux critères; fournir motif du match et lien source.
- Tester les règles sur cas limites : diplôme équivalent, spécialité mal normalisée, âge à une date de référence, date limite passée, critères absents, utilisateur sans profil complet.
- Une IA peut plus tard aider à normaliser des spécialités ou interpréter des formulations, mais toute suggestion doit être traçable et confirmée; le moteur de règles reste la source de décision d'affichage.

## 15. SEO, indexation et acquisition organique

- Chaque concours publié possède une URL publique unique, stable et indexable, avec rendu HTML côté serveur (SSR/SSG/ISR selon contenu). Le contenu essentiel doit être dans le HTML initial, pas uniquement chargé après clic.
- Titre et meta description uniques par page, canonical, Open Graph, langue/hreflang AR/FR si les versions existent, titres H1/H2 cohérents.
- Générer sitemap.xml dynamique incluant uniquement pages publiques canoniques et publiées; actualiser lastmod de manière honnête. Sitemap ne garantit pas l'indexation.
- robots.txt doit autoriser pages publiques utiles et exclure zones privées/admin; ne pas compter sur robots.txt pour protéger des données confidentielles.
- Ajouter liens internes entre concours, administrations, spécialités, préparation et discussions pertinentes.
- Structured data JSON-LD seulement quand exacte et conforme. JobPosting ne doit être utilisé que si la page et l'annonce satisfont réellement les exigences Google applicables; pas sur pages de liste ni pour transformer une annonce inadmissible en offre d'emploi.
- Créer pages catégories utiles avec contenu éditorial réel; éviter pages SEO générées en masse sans valeur, duplications, mots-clés artificiels et contenu copié intégralement.
- Optimiser Core Web Vitals, images, polices, cache, pagination, mobile et erreurs 404/redirect.
- Configurer Google Search Console, soumission sitemap, suivi indexation et erreurs. Ne jamais promettre position ou indexation garantie.
- Exemples de recherches : concours Maroc 2026, concours ministère finances 2026, QCM psychotechnique corrigé, anciens concours PDF corrigé.

## 16. PWA et expérience mobile

- Manifest avec nom, icônes, couleurs, display standalone et orientation adaptée; installation PWA Android testée.
- Service worker pour cache des assets statiques et pages publiques appropriées; ne jamais mettre en cache des données privées ou réponses d'API sensibles sans stratégie sûre.
- Afficher état hors ligne et date de dernière mise à jour; ne pas présenter des annonces expirées en cache comme fraîches.
- Notifications push facultatives, consentement explicite et test sur appareils/navigateurs ciblés.
- Vérifier parcours sur Android petit écran, Chrome mobile, clavier virtuel, réseau lent et orientation portrait.

## 17. Architecture technique recommandée

| Couche | Recommandation de départ |
| --- | --- |
| Frontend / full stack | Next.js App Router + TypeScript; rendu serveur pour SEO; composants réutilisables. |
| UI | Tailwind CSS + composants accessibles (ex. shadcn/ui) adaptés AR/FR et RTL. |
| Backend / DB | Supabase PostgreSQL, Auth et Storage ou équivalent validé; migrations versionnées. |
| API | Server Actions et Route Handlers Next.js avec validation serveur; séparation logique métier et UI. |
| Hébergement | Plateforme compatible Next.js et jobs planifiés; vérifier quotas, régions, coûts et limites avant choix. |
| Radar worker | Tâche backend isolée/cron ou worker; ne pas dépendre d'un onglet utilisateur. |
| Tests | Unitaires, intégration, tests E2E des parcours critiques, tests RLS et accessibilité de base. |
| Déploiement | Git, environnements dev/staging/production, variables séparées, migrations et procédure rollback. |

> Cette stack est une proposition de départ, pas une permission d'ajouter immédiatement des services. Le coding agent doit confirmer la compatibilité, coûts, quotas et alternatives avant installation.

### Organisation modulaire

- `modules/auth`; `contests`; `administrations`; `documents`; `preparation`; `qcm`; `community`; `profiles`; `notifications`; `moderation`; `admin`; `seo`; `pwa`.
- Modules V2 isolés : `radar/sources/collectors/parsers/ocr/deduplication/review-queue`; `smart-match/rules/explanations/alerts`.
- Séparer composants UI, validation de schémas, accès aux données, règles métier et tâches planifiées.
- TypeScript strict, lint/format, conventions de nommage, erreurs centralisées et logs sans secrets.

## 18. Modèle de données initial

| Table | Contenu principal |
| --- | --- |
| `profiles` | user_id, display_name, avatar, language, region (facultatif), préférences, consentements et timestamps. |
| `user_roles` | user_id, role; rôle vérifié exclusivement côté serveur. |
| `administrations` | nom AR/FR, slug, site officiel, catégorie. |
| `contests` | titre AR/FR/original, slug, administration_id, référence, statut, dates, résumé, source_url, publication/verif timestamps. |
| `contest_criteria` | contest_id, type critère, valeur structurée, texte source, page/extrait, confiance, état de vérification. |
| `contest_documents` | contest_id, type, URL/chemin, format, taille, langue, provenance, droits/statut, hash. |
| `contest_versions` | snapshot/diff des champs officiels, source, date, auteur/collecteur. |
| `contest_bookmarks` | user_id, contest_id, created_at; contrainte d'unicité. |
| `qcm_categories` / `qcm_sets` | catégories, langue, niveau, durée, concours lié, statut, source/auteur. |
| `qcm_questions` / `qcm_options` | énoncé, options, bonne réponse protégée, explication, ordre, source. |
| `qcm_attempts` / `qcm_attempt_answers` | user/session, set, score, durée, réponses et dates. |
| `posts` / `comments` | auteur, texte, catégorie, concours lié, statut modération, parent_id limité. |
| `reactions` | user_id, target_type/id, type; unicité pour éviter réactions répétées. |
| `notifications` | user_id, type, payload minimal, read_at, created_at. |
| `reports` / `moderation_actions` | signalements, motifs, statut, décision, acteur, audit trail. |
| `radar_sources` / `radar_runs` | sources autorisées, fréquence, état, dernier résultat, logs et compteurs. |
| `radar_candidates` / `extraction_fields` | annonces détectées, données brutes/structurées, provenance, hash, confidence, review status. |
| `smart_match_preferences` / `match_results` | préférences minimales, critères appliqués, explications, version des règles et consentement. |

> Les noms peuvent évoluer après revue d'architecture, mais toutes les relations, contraintes, index, suppressions et politiques RLS doivent être documentés par migrations versionnées.

## 19. Sécurité, confidentialité et conformité

- Activer RLS sur les tables exposées; écrire et tester les policies pour lecture publique, propriétaire et rôles staff.
- Vérifier les permissions côté serveur sur chaque action sensible. Masquer un bouton côté client ne constitue pas une sécurité.
- Secrets uniquement côté serveur et dans le gestionnaire d'environnement; jamais dans Git, logs, HTML ou bundles client.
- Valider et normaliser toutes les entrées; limiter taille/fréquence des requêtes, prévenir XSS, injection, CSRF selon contexte, abus d'upload et accès IDOR.
- Limiter types/taille des pièces jointes; contrôler MIME réel, noms et accès. Utiliser liens signés pour fichiers privés.
- Politique de confidentialité claire : données collectées, finalités, durée, droits, contact et prestataires. Valider les obligations marocaines applicables, notamment CNDP/Loi 09-08 et transferts éventuels, avec conseil compétent avant lancement.
- Prévoir consentement cookies/analytics et notifications lorsque requis; ne pas charger trackers non essentiels avant consentement si applicable.
- Procédure suppression/export compte et conservation minimale des journaux; protéger les sauvegardes et restreindre les accès.
- Publier mentions légales, conditions, règles communautaires, politique de propriété intellectuelle et procédure de retrait de contenu.

## 20. Monétisation et coûts

- Lancement : accès gratuit aux annonces et fonctions essentielles; revenus publicitaires possibles uniquement après conformité et volume adéquat.
- Toute publicité/sponsor doit être identifiable comme sponsorisé, distinct du contenu officiel et ne pas modifier le classement organique des concours sans transparence.
- Partenariats centres de formation possibles avec étiquetage et règles éditoriales; ne pas vendre les données personnelles des candidats.
- Premium éventuel plus tard pour fonctions non essentielles; ne pas bloquer les annonces officielles derrière un paywall.
- Coding agent doit proposer une estimation de coûts mensuels selon trafic, stockage PDF, emails, scheduler, OCR, logs et sauvegardes; présenter scénarios bas/moyen/haut et seuils d'alerte.
- Avant d'ajouter API IA payante, service SMS, push provider ou scraping commercial, fournir coût, quota, bénéfice, alternative et demander validation.

## 21. Analytics et indicateurs

- Mesurer de façon respectueuse de la vie privée : visites pages concours, recherches sans résultat, clics source officielle, téléchargements autorisés, favoris, démarrages/complétions QCM, publications/réponses, signalements et erreurs techniques.
- Dashboard éditorial : concours publiés par période, concours expirant, annonces à vérifier, sources en erreur, QCM complétés, activité communauté et contenu signalé.
- Éviter collecte excessive, fingerprinting et données sensibles. Documenter l'outil analytics, consentement et durée de conservation.

## 22. Tests et critères d'acceptation

| Domaine | Critères de validation minimum |
| --- | --- |
| Bilingue | Chaque page majeure fonctionne en AR/RTL et FR/LTR; langue conservée; aucun débordement majeur mobile. |
| Concours | Recherche/filtres/tri fonctionnent; page détail affiche source/date; statuts et dates sont exacts; liens et documents testés. |
| SEO | HTML contient titre et contenu principal; canonical, sitemap, robots, metadata et pages privées vérifiés. |
| Auth / RLS | Utilisateur A ne peut lire/modifier données privées de B; rôle utilisateur ne peut appeler fonctions admin. |
| QCM | Score serveur correct; bonnes réponses non exposées avant soumission; résultats enregistrés et accessibles au propriétaire. |
| Communauté | Publication/commentaire/réaction/signalement fonctionnent; règles anti-abus et modération testées. |
| Radar | Collecte planifiée indépendante d'un navigateur; domaines allowlist; rate limit; retries; déduplication; candidat reste non public jusqu'à validation. |
| Smart Match | Règles explicables; inconnus classés à vérifier; aucun verdict garanti; profil effaçable; alertes opt-in. |
| PWA | Installation sur appareil Android de test; cache ne fuit pas de données privées; états réseau gérés. |
| Admin | Permissions serveur, audit logs, prévisualisation et confirmation suppression testés. |

## 23. Plan de réalisation – une phase à la fois

| Phase | Livrable et validation |
| --- | --- |
| 0 – Audit et cadrage | Audit dépôt/outils; architecture; schéma données; choix hébergement et coûts; risques; plan détaillé. Attendre validation. |
| 1 – Fondations UI | Design system, responsive shell, navigation, RTL/LTR, pages statiques validées visuellement. |
| 2 – Base/Auth | Supabase, migrations, RLS, inscription/connexion/reset, profils et tests d'accès. |
| 3 – Concours | Admin manuel, CRUD, recherche/filtres, détail public, documents, sources et SEO. |
| 4 – Préparation | Catégories, QCM, corrections, résultats, annales et ressources. |
| 5 – Communauté | Fil, publications, commentaires, réactions, signalements, modération et règles. |
| 6 – Profil/notifications | Favoris, suivi, rappels, préférences, notifications in-app/email si validées. |
| 7 – Qualité/lancement | Tests E2E, sécurité, performance, accessibilité, conformité, backups, staging et production. |
| 8 – Radar V2 | Sources, scheduler, fetcher, parsers PDF/OCR, dedupe, queue de validation, logs et coûts. |
| 9 – Smart Match V2 | Profil minimal, règles déterministes, explications, cas limites, opt-in alerts. |
| 10 – Croissance | SEO monitoring, analytics, contenu éditorial, partenariats et décision éventuelle Android natif. |

## 24. Gestion des risques et décisions à confirmer

- Droits d'hébergement/redistribution des PDF et sujets; politique de retrait.
- Fiabilité des sources officielles, changements de structure, annonces corrigées ou retirées.
- Coûts et limites d'hébergement, cron, stockage, OCR, emails et trafic.
- Modération et responsabilité sur contenus utilisateurs.
- Conformité données personnelles et transferts internationaux éventuels.
- Disponibilité du nom KounKour, domaine et marque.
- Décider ultérieurement : fournisseur email, analytics, règles d'âge pour Smart Match, fréquence Radar, sources initiales, hébergement et politique de conservation.

## 25. Livrables exigés du coding agent

- Architecture documentée et diagramme des composants/flux.
- Schéma DB et migrations versionnées; policies RLS documentées.
- Code complet, lisible, modulaire, sans secrets ni données officielles inventées.
- Fichier `.env.example` contenant uniquement noms et descriptions des variables.
- README : prérequis, installation locale, lancement, tests, migrations, seed fictif, déploiement et rollback.
- Tests unitaires, intégration et E2E pertinents avec commandes et résultats.
- Guide admin/éditeur, guide de validation des concours et guide de modération.
- Documentation Radar : sources, limites, scheduler, parseurs/OCR, erreurs, coûts, désactivation et validation humaine.
- Documentation Smart Match : critères, règles, explications, limites, suppression de profil et opt-in.
- Rapport final de phase : livré/non livré, tests, risques, décisions nécessaires et prochaine étape proposée.

> **FIN DU CAHIER DES CHARGES** — Toute décision nouvelle du propriétaire doit être ajoutée à un journal de décisions et répercutée dans ce document ou une annexe versionnée.
