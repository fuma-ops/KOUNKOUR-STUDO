// Guides de préparation (contenu éditorial propre à KounKour), utilisés par l'application
// (GuidePage) et par le rendu serveur (api/_lib/seo.ts). Rédigés à partir des textes
// officiels cités et des arrêtés de concours lus chaque jour ; aucune règle n'est inventée :
// quand une règle varie d'un concours à l'autre, le guide le dit et renvoie à l'avis.
// Français seulement pour l'instant (page frOnly côté serveur).

export interface GuideSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}
export interface Guide {
  slug: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: GuideSection[];
  links: { href: string; text: string }[];
}

export const GUIDES_PATH = '/guides';
export const guidePath = (slug: string) => `${GUIDES_PATH}/${slug}`;

export const GUIDES: Guide[] = [
  {
    slug: 'deroulement-concours-fonction-publique-maroc',
    title: 'Comment se déroule un concours de la fonction publique au Maroc',
    description:
      "Textes officiels, conditions habituelles, grades et échelles, étapes du concours de la publication de l'avis jusqu'aux résultats : le guide pour comprendre un avis de concours avant de candidater.",
    updatedAt: '2026-11-17',
    sections: [
      {
        title: 'Les textes qui encadrent les concours',
        paragraphs: [
          "Le recrutement dans la fonction publique se fait par concours. Les règles générales viennent du statut général de la fonction publique (dahir n° 1-58-008 du 24 février 1958) et du décret n° 2-11-621 du 25 novembre 2011 qui fixe les conditions et les modalités d'organisation des concours de recrutement dans les emplois publics. La circulaire du Chef du gouvernement n° 14/2012 du 19 juin 2012 précise la conduite des concours.",
          "Chaque administration publie ensuite un arrêté, une décision ou un avis propre à son concours. C'est ce texte qui fait foi : nombre de postes, spécialités, diplôme exigé, âge, épreuves, pièces du dossier, mode de dépôt et dates. Pour les communes, provinces et régions, les conditions et programmes des concours sont aussi fixés par l'arrêté du ministre de l'Intérieur n° 1168.24 du 6 mai 2024 ; ces arrêtés le citent dans leur préambule.",
        ],
      },
      {
        title: 'Où trouver les concours',
        paragraphs: [
          "Le portail de l'emploi public (www.emploi-public.ma) publie les avis de concours des administrations, des établissements publics et des collectivités territoriales, avec l'arrêté en pièce jointe. Les listes des candidats convoqués et les résultats y sont aussi publiés : dans la plupart des arrêtés, cette publication vaut convocation. Il faut donc consulter le portail régulièrement après avoir déposé son dossier.",
          "Sur KounKour, chaque concours a sa fiche établie à partir de l'arrêté : vous y retrouvez l'essentiel, le lien vers le texte officiel et le site où candidater.",
        ],
      },
      {
        title: 'Les conditions habituelles',
        bullets: [
          'Nationalité marocaine, jouissance des droits civiques et aptitude physique à exercer la fonction.',
          "Le diplôme exigé pour le grade (décret n° 2-12-90 du 30 avril 2012 relatif aux diplômes exigés pour l'accès aux grades), dans la spécialité demandée par l'avis : une autre spécialité est en général refusée.",
          "Un âge minimum de 18 ans et un âge maximum fixé par l'avis : le plus souvent 40 ans, parfois 45 ans pour certains grades. Les avis prévoient en général un recul de la limite pour les services civils ou militaires validables pour la retraite, dans la limite de 45 ans.",
          "Des postes réservés : la plupart des avis réservent 25 % des postes aux pupilles de la Nation, anciens militaires, anciens combattants et anciens résistants, et 7 % aux personnes en situation de handicap.",
          "Pour les fonctionnaires, l'autorisation de l'administration d'origine pour passer le concours.",
        ],
      },
      {
        title: 'Grade, échelle et diplôme : les correspondances les plus fréquentes',
        paragraphs: ["Ces correspondances reviennent dans la plupart des arrêtés lus par KounKour. Vérifiez toujours le diplôme exact demandé dans l'avis : certains admettent aussi un BTS ou un DUT, d'autres non."],
        bullets: [
          'Technicien 4e grade (échelle 8) : diplôme de technicien de la formation professionnelle ou équivalent.',
          'Technicien 3e grade (échelle 9) : diplôme de technicien spécialisé de la formation professionnelle ou équivalent.',
          'Administrateur 3e grade (échelle 10) : licence (études fondamentales ou professionnelle) ou équivalent.',
          'Administrateur 2e grade (échelle 11) : master, master spécialisé, DESA, DESS ou équivalent.',
          "Ingénieur d'État et architecte 1er grade (échelle 11) : diplôme d'ingénieur d'État ou diplôme d'architecte.",
        ],
      },
      {
        title: 'Les étapes, de l’avis aux résultats',
        bullets: [
          "1. Publication de l'avis et de l'arrêté, avec la date limite de dépôt (souvent 16h30 le dernier jour).",
          '2. Dépôt du dossier : en ligne sur le site indiqué, ou sur place / par courrier selon l’avis.',
          '3. Étude des dossiers et, parfois, présélection (par exemple sur les notes du diplôme ou le profil).',
          '4. Publication de la liste des candidats admis à passer l’écrit : elle vaut convocation dans la plupart des cas.',
          '5. Épreuve écrite, puis publication de la liste des admis à l’oral.',
          '6. Épreuve orale et/ou pratique devant le jury.',
          "7. Résultats définitifs et liste d'attente, puis constitution du dossier administratif de recrutement.",
        ],
      },
      {
        title: 'À quoi ressemblent les épreuves',
        paragraphs: [
          "L'écrit porte le plus souvent sur un sujet général ou des questions à choix multiples (QCM) liés aux missions du poste, à la spécialité ou, pour les collectivités, aux attributions des collectivités territoriales. Exemples relevés dans des arrêtés récents : 3 heures, coefficient 4, pour un technicien de commune ; 1 h 30, coefficient 5, pour un rédacteur judiciaire du ministère de la Justice.",
          "L'oral (ou l'épreuve pratique) est une discussion avec le jury sur des sujets variés et sur la spécialité, pour évaluer l'aptitude à exercer les missions : en général entre 15 et 30 minutes (jusqu'à 45 minutes dans certaines communes), coefficient 3.",
          "Beaucoup d'arrêtés fixent une note éliminatoire (par exemple moins de 5/20) et une note minimale à l'écrit pour passer l'oral (10/20 ou 12/20 selon les avis). Lisez la grille de votre concours dans l'arrêté.",
        ],
      },
      {
        title: 'Les réflexes à prendre',
        bullets: [
          "Lire l'arrêté complet, pas seulement l'annonce : les détails (spécialité exacte, âge, pièces) y sont.",
          "Noter la date ET l'heure limite, et déposer quelques jours avant pour éviter les problèmes de dernière minute.",
          "Ne choisir qu'un seul centre d'examen quand l'avis le demande, et garder une preuve du dépôt (récépissé, capture d'écran, accusé de réception).",
          "Suivre les listes sur www.emploi-public.ma et sur le site de l'administration après le dépôt.",
          "Ne jamais payer pour candidater ni acheter de prétendus « sujets » : la candidature à un concours public est gratuite.",
        ],
      },
    ],
    links: [
      { href: '/concours', text: 'Voir les concours ouverts' },
      { href: '/guides/dossier-candidature-concours-maroc', text: 'Guide : constituer son dossier de candidature' },
      { href: '/guides/reussir-ecrit-oral-concours-maroc', text: "Guide : réussir l'écrit et l'oral" },
    ],
  },
  {
    slug: 'dossier-candidature-concours-maroc',
    title: 'Constituer son dossier de candidature à un concours public',
    description:
      "Les pièces demandées le plus souvent, le dépôt en ligne et le dépôt papier, l'attestation de réussite, et les erreurs qui font rejeter un dossier : la liste à vérifier avant d'envoyer.",
    updatedAt: '2026-11-17',
    sections: [
      {
        title: 'La règle d’or : la liste de l’arrêté',
        paragraphs: [
          "Chaque arrêté de concours donne sa propre liste de pièces. C'est elle qu'il faut suivre, pièce par pièce. Presque tous les arrêtés précisent qu'un dossier incomplet ou arrivé après la date limite n'est pas pris en compte.",
        ],
      },
      {
        title: 'Les pièces demandées le plus souvent',
        bullets: [
          "Une demande de candidature signée, adressée au responsable indiqué (ministre, directeur, président de la commune…), avec nom, adresse, téléphone et e-mail, et souvent le grade et la spécialité visés.",
          'Un CV à jour, parfois avec photo.',
          "Une copie de la carte nationale d'identité électronique (CNIE), souvent recto-verso.",
          "Une copie du diplôme exigé, parfois certifiée conforme, et la copie du baccalauréat quand l'avis la demande.",
          "Pour un diplôme étranger ou privé : l'arrêté d'équivalence (et sa publication au Bulletin officiel quand l'avis le précise).",
          "Pour les fonctionnaires : l'autorisation de passer le concours délivrée par l'administration d'origine.",
          "Le cas échéant : la carte ou l'attestation de pupille de la Nation, d'ancien militaire, d'ancien combattant ou d'ancien résistant, ou la carte de personne en situation de handicap, pour les postes réservés.",
          "Pour les concours des communes : souvent deux ou trois enveloppes timbrées à l'adresse du candidat.",
          'Pour certains postes : attestations de travail (expérience exigée), permis de conduire (conducteurs, mécaniciens), extrait du casier judiciaire.',
        ],
      },
      {
        title: 'L’attestation de réussite : acceptée ou non ?',
        paragraphs: [
          "Cela dépend de l'arrêté. Certains refusent expressément l'attestation de réussite et exigent le diplôme ; d'autres l'acceptent au dépôt mais demandent l'original du diplôme le jour de l'oral. Si l'avis ne dit rien, le plus prudent est de joindre le diplôme ou de vérifier auprès de l'administration.",
        ],
      },
      {
        title: 'Dépôt en ligne',
        bullets: [
          "Candidater uniquement sur le site indiqué par l'avis (portail de l'emploi public, site de l'administration ou plateforme désignée) : un dossier envoyé par un autre canal est en général refusé.",
          'Scanner chaque pièce lisiblement, en PDF (ou dans le format demandé), en respectant la taille maximale annoncée.',
          'Nommer clairement les fichiers (cnie.pdf, diplome.pdf…) et vérifier chaque fichier avant de valider.',
          "Garder la confirmation d'inscription ou une capture d'écran de la candidature enregistrée.",
        ],
      },
      {
        title: 'Dépôt sur place ou par courrier',
        bullets: [
          "Déposer au bureau d'ordre contre récépissé, ou envoyer en recommandé avec accusé de réception à l'adresse exacte de l'avis.",
          "Attention : en général, c'est la date de réception qui compte, pas la date d'envoi. Anticipez les délais de la poste.",
          "Indiquer sur l'enveloppe le grade et la spécialité visés quand l'avis le demande.",
        ],
      },
      {
        title: 'Les erreurs qui font rejeter un dossier',
        bullets: [
          'Un diplôme ou une spécialité qui ne correspond pas à ceux demandés.',
          "Une pièce manquante (souvent l'autorisation pour les fonctionnaires ou l'équivalence du diplôme).",
          'Une demande non signée ou un fichier illisible.',
          "Un dépôt après l'heure limite ou par un canal non prévu.",
          "Plusieurs candidatures quand l'avis n'en autorise qu'une (un seul centre, une seule spécialité).",
        ],
      },
    ],
    links: [
      { href: '/concours', text: 'Voir les concours ouverts' },
      { href: '/guides/deroulement-concours-fonction-publique-maroc', text: 'Guide : comment se déroule un concours' },
      { href: '/guides/reussir-ecrit-oral-concours-maroc', text: "Guide : réussir l'écrit et l'oral" },
    ],
  },
  {
    slug: 'reussir-ecrit-oral-concours-maroc',
    title: "Réussir l'écrit (QCM, sujet général) et l'oral d'un concours public",
    description:
      "Comment préparer l'épreuve écrite et l'entretien oral d'un concours de la fonction publique marocaine : programme, textes de base, méthode pour les QCM, préparation de l'oral et jour de l'épreuve.",
    updatedAt: '2026-11-17',
    sections: [
      {
        title: 'Partir du programme de votre concours',
        paragraphs: [
          "L'arrêté décrit la nature de chaque épreuve : sujet général, questions à choix multiples, épreuve de spécialité, épreuve pratique. Notez la durée et le coefficient : une épreuve à coefficient élevé mérite plus de temps de préparation. Quand l'arrêté renvoie à un programme (ministère de l'Intérieur pour les collectivités, programme publié par l'administration), procurez-vous-le.",
        ],
      },
      {
        title: 'Les connaissances de base à maîtriser',
        bullets: [
          "Les institutions : la Constitution de 2011 (pouvoirs, droits et libertés, régionalisation avancée).",
          "La fonction publique : le statut général (dahir du 24 février 1958), les droits et obligations du fonctionnaire, les grades et échelles.",
          'L’organisme qui recrute : ses missions, son organisation, ses grands projets (site officiel, rapports d’activité).',
          "Pour les collectivités : la loi organique n° 113-14 relative aux communes et les attributions des collectivités territoriales.",
          'Votre spécialité : les notions de base du diplôme demandé (informatique, génie civil, comptabilité, droit…).',
          "L'actualité économique et sociale du Maroc, souvent présente dans les sujets généraux.",
        ],
      },
      {
        title: 'Méthode pour les QCM',
        bullets: [
          "S'entraîner en conditions réelles : chronomètre, sans aide, puis corriger chaque erreur en lisant l'explication.",
          "Lire toute la question et toutes les propositions avant de répondre : les mauvaises réponses sont souvent proches de la bonne.",
          'Répondre d’abord aux questions sûres, marquer les autres et y revenir.',
          'Revoir régulièrement les erreurs : ce sont elles qui font progresser.',
          "Vérifier dans les consignes du jour si une mauvaise réponse retire des points avant de répondre au hasard.",
        ],
      },
      {
        title: 'Méthode pour le sujet général',
        bullets: [
          'Lire le sujet deux fois et souligner les mots clés.',
          "Faire un plan simple (introduction, deux ou trois parties, conclusion) avant d'écrire.",
          'Illustrer avec des exemples marocains précis et récents.',
          "Garder du temps pour relire l'orthographe et la présentation.",
        ],
      },
      {
        title: "Préparer l'oral",
        paragraphs: [
          "L'oral est un échange avec le jury sur des sujets variés et sur la spécialité, pour juger de votre aptitude à exercer les missions du poste. Il dure le plus souvent entre 15 et 30 minutes.",
        ],
        bullets: [
          'Préparer une présentation de 2 minutes : parcours, diplôme, expériences, motivation pour ce poste précis.',
          "Connaître l'organisme : missions, organisation, actualité.",
          'Réviser les bases de la spécialité et les missions concrètes du poste.',
          'Préparer des réponses aux questions fréquentes : pourquoi ce poste, vos qualités et points à améliorer, une situation difficile gérée.',
          "S'entraîner à voix haute, avec un proche, en respectant le temps.",
        ],
      },
      {
        title: "Le jour de l'épreuve",
        bullets: [
          'Avoir la CNIE et la convocation (ou la liste publiée qui vaut convocation) : sans pièce d’identité, l’accès peut être refusé.',
          'Repérer le centre à l’avance et arriver en avance.',
          'Apporter le matériel autorisé (stylos), et rien de ce qui est interdit par le règlement.',
          'Lire toutes les consignes avant de commencer.',
        ],
      },
    ],
    links: [
      { href: '/preparation', text: 'Les dossiers de préparation et QCM KounKour' },
      { href: '/tests-psychotechniques/en-ligne', text: "S'entraîner aux tests psychotechniques" },
      { href: '/guides/deroulement-concours-fonction-publique-maroc', text: 'Guide : comment se déroule un concours' },
    ],
  },
];

export const findGuide = (slug: string | null) => (slug ? GUIDES.find((g) => g.slug === slug) || null : null);
