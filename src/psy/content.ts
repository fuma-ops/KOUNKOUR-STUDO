// Textes des pages « tests psychotechniques en ligne » (français). Méthodes et conseils
// rédigés par KounKour : exercices d'entraînement, pas des sujets officiels.
import type { PsyCategory } from './core.ts';

export const PSY_TRAIN_PATH = '/tests-psychotechniques/en-ligne';

export interface PsyCatDoc {
  cat: PsyCategory;
  slug: string;
  name: string; // nom court (cartes, fil d'Ariane)
  title: string; // <title>
  h1: string;
  description: string; // meta description
  tagline: string; // une ligne sur la carte
  intro: string;
  method: { title: string; steps: string[] };
  tips: string[];
  faq: { q: string; a: string }[];
}

export const PSY_CATS: PsyCatDoc[] = [
  {
    cat: 'matrices',
    slug: 'matrices-de-raven',
    name: 'Matrices de Raven',
    title: 'Test des matrices de Raven en ligne gratuit, corrigé',
    h1: 'Matrices de Raven : test en ligne gratuit avec corrections',
    description:
      "Entraînez-vous aux matrices de Raven (raisonnement logique 3×3) : questions illimitées, chronomètre, 3 niveaux et correction expliquée. Gratuit, sur téléphone.",
    tagline: 'Trouver la figure qui complète une grille 3 × 3',
    intro:
      "Les matrices de type Raven mesurent le raisonnement logique non verbal : une grille de 3 × 3 figures suit des règles, la dernière case est vide et il faut choisir la figure qui la complète. Ce format est très utilisé dans les concours de la sécurité, de la santé, des grandes entreprises et des écoles militaires, car il ne dépend ni de la langue ni du diplôme.",
    method: {
      title: 'Méthode en 4 étapes',
      steps: [
        'Regardez une seule propriété à la fois : la forme, puis le nombre de figures, puis le remplissage (vide, hachuré, plein).',
        'Pour chaque propriété, comparez les cases de la première ligne, puis de la première colonne : est-elle identique, ou chaque valeur apparaît-elle une seule fois ?',
        "Vérifiez la règle sur la deuxième ligne avant de l'appliquer à la troisième.",
        'Déduisez la case manquante, puis éliminez les réponses qui se trompent sur une seule propriété : ce sont les pièges classiques.',
      ],
    },
    tips: [
      "Ne cherchez pas une règle compliquée : dans la grande majorité des grilles, chaque propriété suit une règle simple (ligne, colonne ou « une fois chaque valeur »).",
      "Si vous bloquez plus de 60 secondes, passez : au concours, toutes les questions valent souvent le même nombre de points.",
      "Le niveau difficile combine trois règles différentes : c'est le niveau des concours d'officiers et des grandes écoles.",
    ],
    faq: [
      {
        q: "Qu'est-ce qu'un test des matrices de Raven ?",
        a: "C'est un test de raisonnement logique non verbal créé par le psychologue John C. Raven : une grille de figures suit des règles, et il faut trouver la figure qui complète la case vide. Il évalue la capacité à repérer des règles abstraites.",
      },
      {
        q: 'Ces matrices sont-elles les vraies questions des concours ?',
        a: "Non. Ce sont des exercices d'entraînement générés par KounKour sur le même principe. Les tests officiels des recruteurs ne sont pas publiés ; s'entraîner sur le format reste la meilleure préparation.",
      },
      {
        q: 'Combien de temps faut-il par matrice ?',
        a: "Comptez entre 45 et 90 secondes selon la difficulté. Le chronomètre de chaque question vous habitue au rythme d'un vrai test.",
      },
      {
        q: 'Comment progresser rapidement ?',
        a: "Faites une série de 10 questions par jour, en lisant chaque correction : en une à deux semaines, la lecture « une propriété à la fois » devient automatique.",
      },
    ],
  },
  {
    cat: 'dominos',
    slug: 'dominos',
    name: 'Test des dominos',
    title: 'Test des dominos en ligne gratuit : exercices corrigés',
    h1: 'Test des dominos (D48 / D70) : exercices en ligne corrigés',
    description:
      "Exercices de dominos type D48 / D70 : trouvez le domino manquant, chronomètre, 3 niveaux, correction expliquée. Gratuit, illimité, adapté au téléphone.",
    tagline: 'Trouver le domino qui continue la suite',
    intro:
      "Le test des dominos (connu sous les noms D48 et D70) présente une suite de dominos dont l'un est remplacé par un point d'interrogation. Chaque moitié suit sa propre règle. Il est courant dans les tests psychotechniques de la police, de la gendarmerie, de l'armée et des grandes entreprises.",
    method: {
      title: 'Méthode',
      steps: [
        'Séparez le haut et le bas : chaque moitié suit généralement sa propre règle.',
        "Écrivez mentalement la suite des valeurs du haut (par exemple 2, 4, 6…), puis celle du bas.",
        'Un domino va de 0 à 6 : après 6 on revient à 0. Une suite 5, 6, 0, 1 avance donc de +1.',
        'Au niveau difficile, la règle peut alterner (+2 puis +1) : comparez les écarts deux à deux.',
      ],
    },
    tips: [
      'Le piège le plus fréquent est le domino retourné (haut et bas inversés) : vérifiez toujours le sens.',
      "Une moitié vide (blanc) vaut 0, elle fait partie de la suite.",
      'Comptez les points par motif (le 5 a un point au centre, le 6 deux colonnes de trois) plutôt qu’un par un.',
    ],
    faq: [
      {
        q: "Qu'est-ce que le test D48 ou D70 ?",
        a: "Ce sont des tests de raisonnement logique avec des dominos : une suite de dominos suit une règle et il faut trouver le domino manquant. D48 et D70 désignent deux versions historiques de ce test.",
      },
      {
        q: 'Ce test est-il utilisé dans les concours au Maroc ?',
        a: "Les dominos font partie des épreuves psychotechniques classiques des recrutements de la sécurité, de l'armée et des entreprises. Chaque recruteur choisit ses propres tests : consultez nos pages par recruteur pour ce qui est annoncé.",
      },
      {
        q: 'Que vaut un côté blanc ?',
        a: 'Un côté sans point vaut 0. Après 6 on revient à 0 : la suite est circulaire.',
      },
    ],
  },
  {
    cat: 'cubes',
    slug: 'cubes-aptitude-spatiale',
    name: 'Cubes et patrons',
    title: 'Test d’aptitude spatiale : cubes et patrons en ligne',
    h1: 'Aptitude spatiale : plier un patron de cube (exercices en 3D)',
    description:
      "Exercices d'aptitude spatiale : quel cube obtient-on en pliant ce patron ? Cubes en 3D, 3 niveaux, chronomètre et corrigé détaillé. Gratuit, sur téléphone.",
    tagline: 'Plier un patron et reconnaître le bon cube',
    intro:
      "L'aptitude spatiale est la capacité à faire tourner un objet dans sa tête. L'exercice le plus courant présente le patron d'un cube (ses six faces dépliées) et plusieurs cubes montés : un seul peut être obtenu en pliant ce patron. C'est une épreuve fréquente pour les métiers techniques, l'aviation, l'armée et les écoles d'ingénieurs.",
    method: {
      title: 'Méthode',
      steps: [
        "Repérez les faces opposées : sur un patron en croix, deux faces séparées par une seule face sont opposées. Elles ne peuvent jamais être visibles ensemble.",
        'Éliminez tous les cubes qui montrent deux faces opposées.',
        "Pour les cubes restants, prenez la face du dessus et tournez dans le sens des aiguilles d'une montre : l'ordre des deux autres faces doit être le même que sur le patron.",
        'Un cube « en miroir » montre les bonnes faces dans le mauvais ordre : c’est le piège principal.',
      ],
    },
    tips: [
      "Commencez toujours par l'élimination des faces opposées : elle suffit souvent à trouver la réponse.",
      'Imaginez que vous pliez les faces autour de la face centrale du patron, une à une.',
      "Les symboles utilisés ici sont symétriques : seule la position des faces compte, pas leur rotation.",
    ],
    faq: [
      {
        q: "Qu'est-ce qu'un test d'aptitude spatiale ?",
        a: "Un test qui mesure la capacité à se représenter et à faire tourner des objets en trois dimensions : patrons de cubes, rotations de figures, assemblages.",
      },
      {
        q: 'Comment savoir quelles faces sont opposées sur un patron ?',
        a: "Sur une rangée de quatre faces, la première et la troisième sont opposées, comme la deuxième et la quatrième. Les deux faces collées au-dessus et en dessous de la rangée sont opposées entre elles.",
      },
      {
        q: 'Peut-on progresser en aptitude spatiale ?',
        a: "Oui, nettement : la méthode d'élimination des faces opposées et un entraînement régulier font gagner beaucoup de temps et de précision.",
      },
    ],
  },
  {
    cat: 'mecanique',
    slug: 'logique-mecanique',
    name: 'Logique mécanique',
    title: 'Test de logique mécanique : engrenages et poulies en ligne',
    h1: 'Logique mécanique : engrenages, poulies et courroies',
    description:
      'Exercices de raisonnement mécanique : sens de rotation et vitesse des engrenages, poulies, courroies droites et croisées. 3 niveaux, corrigés. Gratuit.',
    tagline: 'Sens et vitesse des engrenages et poulies',
    intro:
      "Les tests de compréhension mécanique vérifient que vous savez prévoir le comportement d'un système simple : dans quel sens tourne une roue, à quelle vitesse, ce que change une courroie croisée. On les retrouve dans les recrutements techniques, ferroviaires, aéronautiques, militaires et industriels.",
    method: {
      title: 'Les 4 règles à connaître',
      steps: [
        'Deux roues dentées en contact tournent en sens inverse.',
        'Une courroie droite garde le même sens ; une courroie croisée inverse le sens.',
        "La vitesse est inversement proportionnelle à la taille : une roue deux fois plus petite tourne deux fois plus vite (tours = tours de A × dents de A ÷ dents de la roue).",
        "Dans une chaîne, les roues intermédiaires ne changent pas le rapport final : seul compte le rapport entre la première et la dernière roue.",
      ],
    },
    tips: [
      "Comptez les inversions de sens : nombre pair = même sens que A, nombre impair = sens inverse.",
      "Vérifiez la vitesse par le bon sens : la petite roue doit tourner plus vite que la grande.",
      'Sur les poulies, on compare les diamètres (Ø) de la même façon que les dents.',
    ],
    faq: [
      {
        q: "Qu'est-ce qu'un test de raisonnement mécanique ?",
        a: "Un test qui mesure la compréhension intuitive des principes mécaniques : engrenages, poulies, leviers, courroies. Il ne demande pas de connaissances en physique avancée.",
      },
      {
        q: 'Pourquoi les roues intermédiaires ne changent-elles pas la vitesse finale ?',
        a: "Parce que chaque roue transmet le même nombre de dents par seconde à la suivante : le produit des rapports se simplifie et seul reste le rapport entre la première et la dernière roue (quand chaque roue est seule sur son axe).",
      },
      {
        q: 'Quelle différence entre courroie droite et croisée ?',
        a: "Avec une courroie droite, les deux poulies tournent dans le même sens. Avec une courroie croisée en forme de X, elles tournent en sens inverse.",
      },
    ],
  },
  {
    cat: 'attention',
    slug: 'test-de-barrage',
    name: 'Attention et barrage',
    title: 'Test de barrage en ligne (type Toulouse-Piéron), attention',
    h1: 'Test de barrage et d’attention (type Toulouse-Piéron)',
    description:
      "Test d'attention de type Toulouse-Piéron : repérez les figures identiques aux modèles, chronomètre, 3 niveaux, réponses surlignées. Gratuit, sur téléphone.",
    tagline: 'Repérer vite les figures identiques au modèle',
    intro:
      "Les tests de barrage mesurent l'attention, la concentration et la rapidité. Le plus connu, le Toulouse-Piéron, présente une grille de petits carrés avec un trait dans une direction : il faut repérer tous ceux qui sont identiques aux modèles. Ce test est très présent dans les recrutements de la sécurité, du transport et de la conduite.",
    method: {
      title: 'Méthode',
      steps: [
        'Mémorisez la position du trait sur chaque modèle (en haut, à droite, en diagonale…).',
        'Balayez ligne par ligne, de gauche à droite, sans revenir en arrière.',
        "Touchez chaque figure trouvée pour la barrer : le compteur se fait tout seul dans votre tête et vous n'en oubliez pas.",
        'Gardez un rythme régulier : la précision compte autant que la vitesse.',
      ],
    },
    tips: [
      'Les distracteurs du niveau difficile ont un trait juste à côté de celui du modèle : regardez la direction exacte.',
      "Ne recomptez pas toute la grille : un seul passage attentif vaut mieux que deux passages rapides.",
      "Au vrai test, les erreurs (figures barrées à tort) sont souvent pénalisées : ne barrez qu'en cas de certitude.",
    ],
    faq: [
      {
        q: "Qu'est-ce que le test de Toulouse-Piéron ?",
        a: "Un test d'attention créé par Édouard Toulouse et Henri Piéron : une grille de carrés munis d'un petit trait, dont il faut barrer ceux qui sont identiques aux modèles, le plus vite et le plus juste possible.",
      },
      {
        q: 'Comment est calculé le résultat ?',
        a: "Dans le test officiel, on tient compte du nombre de bonnes figures barrées, des oublis et des erreurs. Ici, vous indiquez le nombre total de figures identiques aux modèles et vous voyez ensuite lesquelles étaient à trouver.",
      },
      {
        q: 'Comment améliorer sa concentration pour ce test ?',
        a: "Entraînez-vous par séries courtes et régulières, toujours avec la même méthode de balayage. Le sommeil et le calme le jour du test comptent aussi.",
      },
    ],
  },
  {
    cat: 'suites',
    slug: 'suites-numeriques',
    name: 'Suites logiques',
    title: 'Suites numériques et logiques en ligne : exercices corrigés',
    h1: 'Suites numériques et de lettres : exercices corrigés en ligne',
    description:
      'Suites logiques de nombres et de lettres : trouvez le terme suivant. Arithmétiques, géométriques, alternées, Fibonacci… 3 niveaux, corrigés, gratuit.',
    tagline: 'Trouver le nombre ou la lettre qui suit',
    intro:
      "Les suites logiques (nombres ou lettres) mesurent le raisonnement numérique : il faut trouver la règle qui relie les termes et en déduire le suivant. Elles figurent dans presque tous les tests psychotechniques, des concours administratifs aux recrutements des banques et des entreprises.",
    method: {
      title: 'Méthode',
      steps: [
        'Calculez les écarts entre les termes successifs : un écart constant indique une suite arithmétique.',
        "Si les écarts grandissent vite, testez une multiplication (×2, ×3).",
        'Si les écarts eux-mêmes forment une suite (+1, +2, +3…), la règle est sur les écarts.',
        "Si rien ne marche, séparez les termes de rang pair et impair : ce sont peut-être deux suites mêlées. Pensez aussi à la somme des deux précédents.",
      ],
    },
    tips: [
      "Pour les lettres, convertissez-les en position dans l'alphabet (A = 1, B = 2…) et appliquez les mêmes méthodes.",
      'Vérifiez toujours votre règle sur tous les termes, pas seulement les deux derniers.',
      'Les pièges sont souvent à ±1 de la bonne réponse : refaites le dernier calcul.',
    ],
    faq: [
      {
        q: 'Quels types de suites tombent aux tests psychotechniques ?',
        a: "Les plus fréquentes sont les suites arithmétiques (+k), géométriques (×k), alternées (+a puis −b), à écarts croissants, les carrés et les suites de type Fibonacci (somme des deux précédents), ainsi que les suites de lettres.",
      },
      {
        q: 'Faut-il une calculatrice ?',
        a: "Non : les calculs restent simples et se font de tête. C'est justement la rapidité de calcul mental qui est évaluée.",
      },
      {
        q: 'Comment aller plus vite ?',
        a: "Apprenez par cœur les carrés jusqu'à 15 × 15 et les puissances de 2 et de 3 : vous les reconnaîtrez immédiatement.",
      },
    ],
  },
];

export const psyCatBySlug = (slug: string) => PSY_CATS.find((c) => c.slug === slug) || null;
export const psyCatDoc = (cat: PsyCategory) => PSY_CATS.find((c) => c.cat === cat)!;
export const psyTrainPath = (slug?: string | null) => (slug ? `${PSY_TRAIN_PATH}/${slug}` : PSY_TRAIN_PATH);

export const PSY_HUB = {
  title: 'Tests psychotechniques en ligne gratuits, corrigés (2026)',
  h1: 'Tests psychotechniques en ligne gratuits avec corrections',
  description:
    "Entraînement gratuit aux tests psychotechniques : matrices de Raven, dominos, cubes, logique mécanique, barrage, suites. Questions illimitées, chronomètre, corrigés. Sur téléphone.",
  intro:
    "Six familles d'exercices, les mêmes que dans les tests psychotechniques des concours (sécurité, santé, armée, transport, grandes entreprises) : chaque question est dessinée et corrigée, avec un chronomètre et trois niveaux. Les questions sont générées à l'infini : vous ne retombez jamais sur la même série.",
  faq: [
    {
      q: 'Les tests psychotechniques en ligne sont-ils vraiment gratuits ?',
      a: "Oui : toutes les séries sont gratuites, sans inscription et sans limite. Un compte permet seulement de recevoir des alertes sur les nouveaux concours.",
    },
    {
      q: 'Ces exercices sont-ils les sujets officiels des concours ?',
      a: "Non. Ce sont des exercices d'entraînement créés par KounKour sur les formats classiques des tests psychotechniques. Les recruteurs ne publient pas leurs tests ; s'entraîner sur ces formats est la meilleure préparation.",
    },
    {
      q: 'Combien de temps faut-il pour se préparer ?',
      a: "Une série de 10 questions par jour pendant deux à trois semaines donne en général une nette amélioration de la vitesse et de la précision. Commencez au niveau facile, puis passez au moyen et au difficile.",
    },
    {
      q: 'Quels concours comportent des tests psychotechniques ?',
      a: "Les recrutements de la sécurité (police, protection civile, forces armées), du transport (ONCF, Royal Air Maroc), certaines grandes entreprises (OCP…) et des écoles. Consultez nos pages par recruteur pour ce que chacun annonce officiellement.",
    },
    {
      q: 'Puis-je m’entraîner sur mon téléphone ?',
      a: "Oui : tous les exercices sont conçus d'abord pour le téléphone, sans téléchargement. Vous pouvez aussi installer l'application KounKour pour y revenir en un geste.",
    },
  ],
};
