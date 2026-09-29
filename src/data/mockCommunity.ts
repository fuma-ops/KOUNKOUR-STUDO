import { CommunityPost } from '../types';

export interface ContestCommunityRoom {
  id: string; // 'all' or contestId
  name: {
    fr: string;
    ar: string;
  };
  icon: string;
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
    icon: '🌐',
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
    name: {
      fr: 'Ministère de l’Intérieur • Techniciens 4ème grade',
      ar: 'وزارة الداخلية • تقنيين من الدرجة الرابعة',
    },
    icon: '🏛️',
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
    name: {
      fr: 'Ministère de l’Économie & Finances • Administrateurs',
      ar: 'وزارة الاقتصاد والمالية • متصرفين من الدرجة الثانية',
    },
    icon: '💰',
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
    name: {
      fr: 'Éducation Nationale • Enseignants & Cadres AREF',
      ar: 'التربية الوطنية • أطر الأكاديميات الجهوية',
    },
    icon: '🎓',
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
    name: {
      fr: 'Ministère de la Santé • Infirmiers & ISPITS',
      ar: 'وزارة الصحة • ممرضين وتقنيي الصحة',
    },
    icon: '🏥',
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
    name: {
      fr: 'Cercle Privé : Admissibles à l’Oral • Intérieur 2026',
      ar: 'فضاء خاص : المؤهلون للاختبار الشفوي • الداخلية 2026',
    },
    icon: '🔒',
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
    name: {
      fr: 'Groupe d’Élite : Inspecteurs des Finances & Douanes',
      ar: 'نخبة التفتيش : مفتشو المالية وإدارة الجمارك',
    },
    icon: '🛡️',
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
    name: {
      fr: 'Atelier Fermé : Rédacteurs Judiciaires & Greffe',
      ar: 'ورشة مغلقة : المحررين القضائيين وكتابة الضبط',
    },
    icon: '⚖️',
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
    likesCount: 12,
    isLiked: false,
    isBookmarked: false,
    viewsCount: 324,
    commentsCount: 3,
    comments: [
      {
        id: 'comm-1',
        authorName: 'Youssef93',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        authorRole: {
          fr: 'Administrateur 2ème grade',
          ar: 'متصرف من الدرجة الثانية',
        },
        content: 'Je te recommande les annales et les résumés disponibles dans la section Ressources et Préparation de KounKour. Tu peux aussi suivre les vidéos d’actualité institutionnelle marocaine, elles sont très utiles.',
        createdAt: '1h',
        likesCount: 5,
        isLiked: false,
      },
      {
        id: 'comm-2',
        authorName: 'Sara_K',
        authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        authorRole: {
          fr: 'Rédacteur judiciaire',
          ar: 'محرر قضائي',
        },
        content: 'Personnellement, j’utilise des fiches de synthèse sur la Constitution de 2011 et les grands chantiers royaux, et je fais des QCM régulièrement. Ça m’a beaucoup aidée pour décrocher l’écrit !',
        createdAt: '2h',
        likesCount: 4,
        isLiked: false,
      },
      {
        id: 'comm-3',
        authorName: 'Amine_L',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        authorRole: {
          fr: 'Inspecteur des douanes',
          ar: 'مفتش الجمارك',
        },
        content: 'N’oublie pas de suivre l’actualité nationale et internationale (Maroc Digital 2030, généralisation de l’AMO, transition énergétique), c’est souvent demandé dans les concours de l’État.',
        createdAt: '3h',
        likesCount: 3,
        isLiked: false,
      },
    ],
  },
  {
    id: 'post-2',
    authorName: 'Youssef93',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    authorRole: {
      fr: 'Administrateur 2ème grade',
      ar: 'متصرف من الدرجة الثانية',
    },
    title: 'Annales ministère de l’Intérieur 2023 - 2025',
    content: 'Est-ce que quelqu’un a le sujet corrigé de l’épreuve écrite de 2023 pour les techniciens spécialisés génie civil et informatique ? Je peux partager en échange les sujets des finances.',
    category: 'questions',
    contestId: 'c-interieur-tech-2026',
    contestTitle: {
      fr: 'Ministère de l’Intérieur • Techniciens 4ème grade',
      ar: 'وزارة الداخلية • تقنيين من الدرجة الرابعة',
    },
    createdAt: '5h',
    likesCount: 26,
    isLiked: false,
    isBookmarked: true,
    viewsCount: 1200,
    commentsCount: 1,
    comments: [
      {
        id: 'comm-2-1',
        authorName: 'Rachid_B',
        authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
        authorRole: {
          fr: 'Ingénieur d’État',
          ar: 'مهندس دولة',
        },
        content: 'Oui, j’ai le scan officiel du sujet 2023 et les éléments de correction de l’épreuve spécifique. Je viens de le déposer dans l’espace documents partagés !',
        createdAt: '4h',
        likesCount: 8,
        isLiked: true,
      },
    ],
  },
  {
    id: 'post-private-1',
    authorName: 'Karim_Admin_Oral',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    authorRole: {
      fr: 'Encadrant Jury Oral',
      ar: 'مؤطر لجان الشفوي',
    },
    title: '🔒 Grille d’évaluation réelle de l’entretien oral 2026 (Privé)',
    content: 'Voici les 5 critères éliminatoires appliqués par les commissions : 1. Maîtrise de l’organisation du ministère (5 pts), 2. Élocution et prestance (4 pts), 3. Réponse aux questions de mise en situation professionnelle (6 pts), 4. Culture institutionnelle (3 pts), 5. Motivation (2 pts).',
    category: 'conseils',
    contestId: 'c-private-interieur-oral',
    contestTitle: {
      fr: 'Cercle Privé : Admissibles à l’Oral • Intérieur',
      ar: 'فضاء خاص : المؤهلون للاختبار الشفوي • الداخلية',
    },
    createdAt: '3h',
    likesCount: 42,
    isLiked: true,
    isBookmarked: true,
    viewsCount: 560,
    commentsCount: 2,
    comments: [
      {
        id: 'comm-priv-1',
        authorName: 'Hajar_Admissible',
        authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        authorRole: { fr: 'Admissible Oral', ar: 'مؤهلة للشفوي' },
        content: 'Merci beaucoup ! Est-ce que l’entretien se déroule obligatoirement en bilingue Arabe/Français ?',
        createdAt: '2h',
        likesCount: 6,
      },
      {
        id: 'comm-priv-2',
        authorName: 'Karim_Admin_Oral',
        authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        authorRole: { fr: 'Encadrant Jury Oral', ar: 'مؤطر لجان الشفوي' },
        content: 'Généralement, la présentation de 3 minutes se fait en français, suivie de questions en arabe sur le droit public.',
        createdAt: '1h',
        likesCount: 9,
      }
    ],
  },
  {
    id: 'post-3',
    authorName: 'Sara_K',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    authorRole: {
      fr: 'Rédacteur judiciaire',
      ar: 'محرر قضائي',
    },
    title: 'Organisation du temps de révision : Méthode 25/5',
    content: 'Comment vous organisez votre planning de révision quotidien entre les fiches de droit administratif, les QCM et les tests psychotechniques ? Voici mon planning pour ceux que ça intéresse.',
    category: 'conseils',
    contestId: 'all',
    contestTitle: {
      fr: 'Communauté Globale',
      ar: 'المجتمع العام',
    },
    createdAt: '1j',
    likesCount: 18,
    isLiked: false,
    isBookmarked: false,
    viewsCount: 856,
    commentsCount: 0,
    comments: [],
  },
];
