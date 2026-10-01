import { CommunityPost } from '../types';

export interface ContestCommunityRoom {
  id: string; // 'all' or contestId
  contestId?: string;
  name: {
    fr: string;
    ar: string;
  };
  icon?: string;
  heroImage?: string;
  image?: string;
  type: 'public' | 'private';
  accessRequired?: {
    fr: string;
    ar: string;
  };
  membersCount: string;
  discussionsCount: number;
  badge: string;
  description: {
    fr: string;
    ar: string;
  };
  adminName: string;
  isJoined?: boolean;
  membershipStatus?: 'member' | 'pending' | 'none';
  tags: string[];
}

export const CONTEST_COMMUNITIES: ContestCommunityRoom[] = [
  {
    id: 'all',
    name: {
      fr: 'Communauté Globale des Concours Publics',
      ar: 'المجتمع العام لكافة مباريات التوظيف',
    },
    heroImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
    type: 'public',
    membersCount: '12.4K',
    discussionsCount: 1420,
    badge: 'Général',
    description: {
      fr: 'Espace d’échange officiel ouvert à tous les candidats de la fonction publique marocaine.',
      ar: 'فضاء التبادل العام والمفتوح لكافة المترشحين لمباريات الوظيفة العمومية بالمغرب.',
    },
    adminName: 'Équipe KounKour Admin',
    isJoined: true,
    membershipStatus: 'member',
    tags: ['Tous concours', 'Orientation', 'Actualités'],
  },
  {
    id: 'c-interieur-tech-2026',
    contestId: 'c-interieur-tech-2026',
    name: {
      fr: 'Ministère de l’Intérieur • Techniciens 4ème grade',
      ar: 'وزارة الداخلية • تقنيين من الدرجة الرابعة',
    },
    heroImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
    type: 'public',
    membersCount: '3.8K',
    discussionsCount: 340,
    badge: 'Intérieur',
    description: {
      fr: 'Groupe public dédié au concours des 320 techniciens spécialisés (Génie Civil, Électromécanique, Informatique).',
      ar: 'مجموعة عامة مخصصة لمباراة 320 تقني متخصص (الهندسة المدنية، الإلكتروميكانيك، المعلوميات).',
    },
    adminName: 'Modérateur Intérieur',
    isJoined: true,
    membershipStatus: 'member',
    tags: ['Technicien', 'Génie Civil', 'Électromécanique'],
  },
  {
    id: 'c-finances-admin-2026',
    contestId: 'c-finances-admin-2026',
    name: {
      fr: 'Ministère de l’Économie & Finances • Administrateurs',
      ar: 'وزارة الاقتصاد والمالية • متصرفين من الدرجة الثانية',
    },
    heroImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    type: 'public',
    membersCount: '4.2K',
    discussionsCount: 410,
    badge: 'Finances',
    description: {
      fr: 'Discussions ouvertes pour les concours de la DGI, TGR, Douanes et Administration centrale.',
      ar: 'نقاشات مفتوحة لمباريات الضرائب، الخزينة العامة، الجمارك والإدارة المركزية.',
    },
    adminName: 'Commission Finances',
    isJoined: true,
    membershipStatus: 'member',
    tags: ['Master', 'Économie', 'Droit', 'LOF'],
  },
  {
    id: 'c-education-enseignants-2026',
    contestId: 'c-education-enseignants-2026',
    name: {
      fr: 'Éducation Nationale • Enseignants & Cadres AREF',
      ar: 'التربية الوطنية • أطر الأكاديميات الجهوية',
    },
    heroImage: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=80',
    type: 'public',
    membersCount: '6.4K',
    discussionsCount: 580,
    badge: 'Éducation',
    description: {
      fr: 'Sciences de l’éducation, didactique des matières et préparation des concours régionaux.',
      ar: 'علوم التربية، ديداكتيك المواد والاستعداد لمباريات المراكز الجهوية لمهن التربية والتكوين.',
    },
    adminName: 'Prof. El Alami',
    isJoined: false,
    membershipStatus: 'none',
    tags: ['AREF', 'Primaire', 'Secondaire', 'Didactique'],
  },
  {
    id: 'c-sante-infirmiers-2026',
    contestId: 'c-sante-infirmiers-2026',
    name: {
      fr: 'Ministère de la Santé • Infirmiers & ISPITS',
      ar: 'وزارة الصحة • ممرضين وتقنيي الصحة',
    },
    heroImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80',
    type: 'public',
    membersCount: '5.1K',
    discussionsCount: 290,
    badge: 'Santé',
    description: {
      fr: 'Espace d’échange pour les lauréats ISPITS, CHU et concours des délégations régionales.',
      ar: 'فضاء مخصص لخريجي معاهد ISPITS لمباريات المراكز الاستشفائية الجامعية.',
    },
    adminName: 'Dr. Bennani',
    isJoined: true,
    membershipStatus: 'member',
    tags: ['Santé', 'Infirmiers', 'CHU', 'ISPITS'],
  },
  {
    id: 'c-private-interieur-oral',
    contestId: 'c-interieur-tech-2026',
    name: {
      fr: 'Cercle Privé : Admissibles à l’Oral • Intérieur 2026',
      ar: 'فضاء خاص : المؤهلون للاختبار الشفوي • الداخلية 2026',
    },
    heroImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&auto=format&fit=crop&q=80',
    type: 'private',
    accessRequired: {
      fr: 'Justificatif de convocation à l’oral requis pour validation',
      ar: 'إثبات الاستدعاء للاختبار الشفوي مطلوب للموافقة',
    },
    membersCount: '142',
    discussionsCount: 88,
    badge: 'Privé VIP',
    description: {
      fr: 'Groupe d’entraînement intensif aux simulations d’entretiens oraux et questions pièges du jury.',
      ar: 'مجموعة تدريب مكثف على محاكاة المقابلات الشفوية وأسئلة لجان التحكيم.',
    },
    adminName: 'Admin KounKour Privé',
    isJoined: false,
    membershipStatus: 'none',
    tags: ['Oral', 'Simulations', 'Strict Confidentiel'],
  },
  {
    id: 'c-private-finances-elite',
    contestId: 'c-finances-admin-2026',
    name: {
      fr: 'Groupe d’Élite : Inspecteurs des Finances & Douanes',
      ar: 'نخبة التفتيش : مفتشو المالية وإدارة الجمارك',
    },
    heroImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop&q=80',
    type: 'private',
    accessRequired: {
      fr: 'Validation sur dossier de candidature vérifié',
      ar: 'الموافقة بعد التحقق من ملف الترشيح',
    },
    membersCount: '98',
    discussionsCount: 64,
    badge: 'Privé Fermé',
    description: {
      fr: 'Résolution de cas pratiques complexes de fiscalité, droit douanier et comptabilité publique approfondie.',
      ar: 'حل نازلات ضريبية وجمركية متقدمة وتدقيق المحاسبة العمومية المعمقة.',
    },
    adminName: 'Inspecteur Principal',
    isJoined: false,
    membershipStatus: 'none',
    tags: ['Fiscalité', 'Douanes', 'Cas pratiques'],
  },
  {
    id: 'c-private-justice-magistrature',
    contestId: 'c-justice-greffiers-2026',
    name: {
      fr: 'Atelier Fermé : Rédacteurs Judiciaires & Greffe',
      ar: 'ورشة مغلقة : المحررين القضائيين وكتابة الضبط',
    },
    heroImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&auto=format&fit=crop&q=80',
    type: 'private',
    accessRequired: {
      fr: 'Accès restreint par invitation des membres fondateurs',
      ar: 'ولوج مقيد بدعوة من الأعضاء المؤسسين',
    },
    membersCount: '115',
    discussionsCount: 52,
    badge: 'Privé Restreint',
    description: {
      fr: 'Partage de jurisprudence récente, rédaction de jugements et procédures judiciaires marocaines.',
      ar: 'مشاركة الاجتهادات القضائية الحديثة وتحرير الإجراءات المدنية والجنائية.',
    },
    adminName: 'Maître Tahiri',
    isJoined: false,
    membershipStatus: 'none',
    tags: ['Justice', 'Procédure Civile', 'Greffe'],
  },
];

export const mockCommunityPosts: CommunityPost[] = [
  {
    id: 'post-1',
    authorName: 'Imane_E',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    authorRole: {
      fr: 'Technicien spécialisé',
      ar: 'تقني متخصص',
    },
    title: 'Conseils pour réviser la culture générale ?',
    content: 'Bonjour à tous,\n\nJe prépare le concours de technicien spécialisé et j’aimerais avoir vos conseils pour réviser la culture générale.\nQuels sont les meilleurs livres, sites ou résumés ?\n\nMerci d’avance !',
    category: 'questions',
    contestId: 'c-interieur-tech-2026',
    contestTitle: {
      fr: 'Ministère de l’Intérieur • Techniciens 4ème grade',
      ar: 'وزارة الداخلية • تقنيين من الدرجة الرابعة',
    },
    createdAt: '2h',
    likesCount: 14,
    isLiked: false,
    viewsCount: 342,
    commentsCount: 3,
    comments: [
      {
        id: 'comm-1',
        authorName: 'Yassine_B',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        authorRole: {
          fr: 'Lauréat 2025',
          ar: 'ناجح دورة 2025',
        },
        content: 'Salut Imane ! Je te conseille de te concentrer sur l’histoire du Maroc, les institutions politiques (Constitution 2011, régionalisation avancée), et les grands chantiers en cours (INDH, protection sociale). Bon courage !',
        createdAt: '1h',
        likesCount: 5,
        isLiked: true,
      },
      {
        id: 'comm-2',
        authorName: 'Fatima_Z',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        content: 'Regarde aussi le portail maroctests et les annales des 5 dernières années, les questions reviennent souvent sous différentes formes.',
        createdAt: '45min',
        likesCount: 2,
        isLiked: false,
      },
      {
        id: 'comm-3',
        authorName: 'Karim_M',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        authorRole: {
          fr: 'Ingénieur d’État',
          ar: 'مهندس دولة',
        },
        content: 'Fais des fiches synthétiques par thématique : Organisation administrative, Finances publiques, et Sujets d’actualité économique.',
        createdAt: '20min',
        likesCount: 1,
        isLiked: false,
      },
    ],
  },
  {
    id: 'post-2',
    authorName: 'Dr_Amine',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    authorRole: {
      fr: 'Médecin généraliste',
      ar: 'طبيب عام',
    },
    title: 'Retour d’expérience : Oral du concours de santé 2025',
    content: 'Chers futurs confrères,\n\nVoici un récapitulatif des questions posées lors de mon entretien oral au ministère de la Santé :\n1. Présentation du parcours et motivations pour la santé publique\n2. Gestion d’une urgence en centre de santé rural avec moyens limités\n3. Le rôle de la digitalisation et du dossier médical partagé\n4. Questions sur la déontologie médicale et le secret professionnel\n\nRestez calmes, structurés et mettez en avant votre sens du service public.',
    category: 'experiences',
    contestId: 'c-sante-infirmiers-2026',
    contestTitle: {
      fr: 'Ministère de la Santé • Infirmiers & ISPITS',
      ar: 'وزارة الصحة • ممرضين وتقنيي الصحة',
    },
    createdAt: '5h',
    likesCount: 42,
    isLiked: true,
    viewsCount: 890,
    commentsCount: 2,
    comments: [
      {
        id: 'comm-4',
        authorName: 'Sara_T',
        authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        content: 'Merci infiniment Docteur pour ce partage précieux ! Combien de temps a duré votre entretien ?',
        createdAt: '4h',
        likesCount: 3,
        isLiked: false,
      },
      {
        id: 'comm-5',
        authorName: 'Dr_Amine',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        authorRole: {
          fr: 'Médecin généraliste',
          ar: 'طبيب عام',
        },
        content: 'Environ 20 minutes au total : 5 min de présentation et 15 min d’échange avec le jury de 3 personnes.',
        createdAt: '3h',
        likesCount: 4,
        isLiked: false,
      },
    ],
  },
  {
    id: 'post-3',
    authorName: 'Mehdi_Admin',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    authorRole: {
      fr: 'Administrateur 2e grade',
      ar: 'متصرف من الدرجة الثانية',
    },
    title: 'Méthodologie de la dissertation administrative pour le concours des Finances',
    content: 'Bonjour à tous les candidats au concours d’Administrateur aux Finances.\n\nLa dissertation administrative obéit à des règles strictes :\n- Une introduction en 4 temps : Amorce, Définition des termes, Problématique, Annonce de plan bipartite (I/II).\n- Un plan en deux parties équilibrées (A/B).\n- Des transitions soignées et une conclusion avec ouverture.\n\nPrivilégiez les exemples concrets tirés de la Loi Organique relative à la Loi de Finances (LOLF n° 130-13) et de la stratégie Maroc Digital 2030.',
    category: 'conseils',
    contestId: 'c-finances-admin-2026',
    contestTitle: {
      fr: 'Ministère de l’Économie & Finances • Administrateurs',
      ar: 'وزارة الاقتصاد والمالية • متصرفين من الدرجة الثانية',
    },
    createdAt: '1j',
    likesCount: 67,
    isLiked: false,
    viewsCount: 1420,
    commentsCount: 1,
    comments: [
      {
        id: 'comm-6',
        authorName: 'Omar_K',
        authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        content: 'Excellente synthèse ! Pourriez-vous partager une bibliographie recommandée pour approfondir la LOLF ?',
        createdAt: '18h',
        likesCount: 2,
        isLiked: false,
      },
    ],
  },
  {
    id: 'post-4',
    authorName: 'KounKour_Officiel',
    authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    authorRole: {
      fr: 'Modérateur Officiel',
      ar: 'مشرف رسمي',
    },
    title: 'Rappel : Clôture imminente des inscriptions pour plusieurs concours',
    content: 'Avis aux candidats :\n\nLes délais de dépôt des dossiers approchent à grands pas pour plusieurs grands concours d’État :\n- Ministère de l’Intérieur (Techniciens) : Clôture imminente\n- Ministère des Finances (Administrateurs) : Derniers jours pour finaliser votre dossier numérique.\n\nPensez à vérifier la validité de vos pièces justificatives (CNIE, diplôme, équivalence si nécessaire).',
    category: 'annonces',
    createdAt: '2j',
    likesCount: 89,
    isLiked: false,
    viewsCount: 2150,
    commentsCount: 0,
    comments: [],
  },
];
