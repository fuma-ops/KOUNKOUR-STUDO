// Pages « tests psychotechniques » par recruteur (SEO) : même contenu pour l'application
// et le rendu serveur. Seuls les recruteurs dont une source publique mentionne des tests
// psychotechniques (ou d'aptitude) figurent ici, avec cette source. Le contenu exact des
// tests n'est publié par aucun d'eux : les pages renvoient vers l'entraînement général.

export type Lang = 'fr' | 'ar';
type T = { fr: string; ar: string };

export interface PsychoRecruiter {
  slug: string;
  name: T;
  /** Nom court pour le titre de la page (onglet et Google), si le nom complet est long. */
  short?: T;
  /** Expression (texte normalisé sans accents, en minuscules) qui reconnaît ses concours. */
  match: string;
  /** Ce que dit la source, sans rien ajouter. */
  fact: T;
  sourceUrl: string;
  sourceLabel: string;
  /** Postes concernés d'après les sources (formulation prudente). */
  posts: T;
  /** Série KounKour réelle liée, s'il y en a une. */
  realSet?: { slug: string; label: T };
}

export const PSYCHO_FOLDER = 'tests-psychotechniques';
export const PSYCHO_FOLDER_EN = 'psychometric-tests';
export const PSYCHO_INDEX_PATH = '/tests-psychotechniques';
export const psychoPath = (slug: string) => `${PSYCHO_INDEX_PATH}/${slug}`;

export const PSYCHO_RECRUITERS: PsychoRecruiter[] = [
  {
    slug: 'oncf',
    name: { fr: 'ONCF', ar: 'المكتب الوطني للسكك الحديدية' },
    short: { fr: 'ONCF', ar: 'ONCF' },
    match: '\\boncf\\b|chemins? de fer',
    fact: {
      fr: "En 2026, l'ONCF a publié des listes de candidats retenus pour les « tests psychotechniques et visite médicale » : en juin pour le concours de 150 encadrants (Licence, Bac+3), et en mars pour les tests « psycho & médic » des 580 techniciens spécialisés (Bac+2).",
      ar: 'في سنة 2026 نشر المكتب الوطني للسكك الحديدية لوائح المترشحين المقبولين لاجتياز «الاختبارات البسيكوتقنية والكشف الطبي»: في يونيو لمباراة 150 إطاراً (الإجازة، باك+3)، وفي مارس لمباريات 580 تقنياً متخصصاً (باك+2).',
    },
    sourceUrl: 'https://alwadifa-maroc.com/offre/show/id/23197',
    sourceLabel: 'alwadifa-maroc.com (ONCF, juin 2026)',
    posts: { fr: 'encadrants (Bac+3) et techniciens spécialisés (Bac+2)', ar: 'الأطر (باك+3) والتقنيون المتخصصون (باك+2)' },
  },
  {
    slug: 'royal-air-maroc',
    name: { fr: 'Royal Air Maroc', ar: 'الخطوط الملكية المغربية' },
    match: 'royal air maroc|\\bram\\b|atlas multiservices|atlas on line|pilotes? de ligne',
    fact: {
      fr: "Pour le recrutement de 96 élèves pilotes de ligne de Royal Air Maroc (juin 2026, sélection menée par sa filiale Atlas Multiservices), les candidats retenus passent plusieurs étapes, dont des tests écrits, des tests psychotechniques et des entretiens, puis des examens d'aptitude physique et mentale (Le Matin).",
      ar: 'في توظيف 96 طياراً متدرباً لدى الخطوط الملكية المغربية (يونيو 2026، انتقاء تشرف عليه شركتها الفرعية أطلس ملتي سيرفيس)، يجتاز المترشحون عدة مراحل منها اختبارات كتابية واختبارات نفسية تقنية ومقابلات، ثم فحوص الأهلية البدنية والذهنية (لوماتان).',
    },
    sourceUrl: 'https://lematin.ma/emploi/royal-air-maroc-recrute-96-eleves-pilotes-de-ligne/348788/amp',
    sourceLabel: 'Le Matin (RAM, élèves pilotes de ligne)',
    posts: { fr: 'élèves pilotes de ligne (programme 2026)', ar: 'الطيارون المتدربون (برنامج 2026)' },
  },
  {
    slug: 'protection-civile',
    name: { fr: 'Protection civile', ar: 'الوقاية المدنية' },
    match: 'protection civile',
    fact: {
      fr: 'Le concours des élèves agents de secours de la Protection civile (1 081 postes, 2026) comporte un test psychotechnique, organisé par groupes du 18 au 23 mai 2026 pour les candidats retenus.',
      ar: 'تتضمن مباراة الأعوان التلاميذ للإنقاذ بالوقاية المدنية (1081 منصباً، 2026) اختباراً نفسياً تقنياً، أجري على شكل مجموعات من 18 إلى 23 ماي 2026 للمترشحين المقبولين.',
    },
    sourceUrl: 'https://www.tawjihnet.net/test-psychotechnique-1081-agents-secours-protection-civile-2026/',
    sourceLabel: 'tawjihnet.net (Protection civile 2026)',
    posts: { fr: 'agents de secours et autres grades de la Protection civile', ar: 'أعوان الإنقاذ' },
  },
  {
    slug: 'far-academie-royale-militaire',
    name: { fr: 'Forces armées royales (Académie royale militaire)', ar: 'القوات المسلحة الملكية (الأكاديمية الملكية العسكرية)' },
    short: { fr: 'FAR', ar: 'القوات المسلحة الملكية' },
    match: 'forces armees royales|academie royale militaire|\\bfar\\b',
    fact: {
      fr: "Le concours des élèves officiers de l'Académie royale militaire (2026) comprend une visite médicale, des tests physiques, psychotechniques et psychologiques, ainsi qu'un entretien oral.",
      ar: 'تشمل مباراة الضباط التلاميذ بالأكاديمية الملكية العسكرية (2026) فحصاً طبياً واختبارات بدنية ونفسية تقنية ونفسية، إضافة إلى مقابلة شفوية.',
    },
    sourceUrl: 'https://www.9rayti.com/concoursa/concours-eleves-officiers-academie-royale-militaire-2026',
    sourceLabel: '9rayti.com (ARM 2026)',
    posts: { fr: 'élèves officiers et autres recrutements des FAR', ar: 'الضباط التلاميذ' },
  },
  {
    slug: 'srm',
    name: { fr: 'Sociétés régionales multiservices (SRM)', ar: 'الشركات الجهوية متعددة الخدمات' },
    short: { fr: 'SRM', ar: 'الشركات الجهوية' },
    match: 'multiservices|\\bsrm\\b',
    fact: {
      fr: "Dans le sujet réel des techniciens électricité de la SRM Casablanca-Settat (2025), le « test n° 2 : connaissances générales » est fait de questions de type psychotechnique : suites de nombres et de lettres, codage, problèmes de calcul et suites de figures. Ce sujet est transcrit sur KounKour.",
      ar: 'في الموضوع الحقيقي لتقنيي الكهرباء بالشركة الجهوية متعددة الخدمات الدار البيضاء سطات (2025)، يتكون «الاختبار رقم 2: المعارف العامة» من أسئلة من النوع النفسي التقني: سلاسل الأعداد والحروف، الترميز، مسائل الحساب وسلاسل الأشكال. هذا الموضوع منقول على KounKour.',
    },
    sourceUrl: '/preparation/qcm/concours-srm-casablanca-settat-technicien-electricite-2025-sujet-corrige',
    sourceLabel: 'sujet réel SRM Casablanca-Settat 2025 (KounKour)',
    posts: { fr: 'techniciens, agents et cadres des SRM', ar: 'التقنيون والأعوان والأطر' },
    realSet: { slug: 'concours-srm-casablanca-settat-technicien-electricite-2025-sujet-corrige', label: { fr: 'Sujet réel SRM Casablanca-Settat 2025 (techniciens électricité)', ar: 'الموضوع الحقيقي للشركة الجهوية الدار البيضاء سطات 2025' } },
  },
  {
    slug: 'ocp',
    name: { fr: 'OCP', ar: 'المكتب الشريف للفوسفاط' },
    short: { fr: 'OCP', ar: 'OCP' },
    match: '\\bocp\\b|cherifien des phosphates',
    fact: {
      fr: "Pour le recrutement de jeunes ingénieurs de l'OCP (2014), l'annonce précisait que les candidats sélectionnés seraient invités à passer un test d'aptitude ainsi qu'un test de personnalité, avant des entretiens.",
      ar: 'في توظيف المهندسين الشباب لدى المكتب الشريف للفوسفاط (2014)، نص الإعلان على أن المترشحين المنتقين سيجتازون اختبار كفاءة واختبار شخصية قبل المقابلات.',
    },
    sourceUrl: 'https://alwadifa-maroc.com/offre/show/id/5263',
    sourceLabel: 'alwadifa-maroc.com (OCP 2014)',
    posts: { fr: 'jeunes ingénieurs (annonce de 2014)', ar: 'المهندسون الشباب (إعلان 2014)' },
  },

];

export const findPsychoRecruiter = (slug: string) => PSYCHO_RECRUITERS.find((r) => r.slug === slug) || null;

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'");

/** Recruteur dont relève un concours (intitulé + organisme), s'il fait partie de la liste. */
export function psychoRecruiterFor(text: string): PsychoRecruiter | null {
  const t = norm(text);
  return PSYCHO_RECRUITERS.find((r) => new RegExp(r.match).test(t)) || null;
}

// Familles d'exercices entraînées dans le dossier KounKour (mêmes thèmes que la base).
export const PSYCHO_FAMILIES: T[] = [
  { fr: 'Suites numériques', ar: 'سلاسل الأعداد' },
  { fr: 'Suites de lettres et alphanumériques', ar: 'سلاسل الحروف والرموز' },
  { fr: 'Codage et décodage', ar: 'الترميز وفك الترميز' },
  { fr: 'Calcul et problèmes', ar: 'الحساب والمسائل' },
  { fr: 'Raisonnement logique', ar: 'الاستدلال المنطقي' },
  { fr: 'Analogies et intrus', ar: 'التشابه والدخيل' },
  { fr: 'Dominos et matrices', ar: 'الدومينو والمصفوفات' },
];

export interface PsychoDoc {
  title: string;
  h1: string;
  description: string;
  intro: string;
  sections: { title: string; paragraphs: string[]; bullets?: string[] }[];
  faq: { q: string; a: string }[];
}

export function psychoIndexDoc(lang: Lang): PsychoDoc {
  const fr = lang === 'fr';
  return {
    title: fr ? 'Tests psychotechniques au Maroc : ONCF, RAM, Protection civile, FAR, SRM, OCP' : 'الاختبارات النفسية التقنية بالمغرب: ONCF، الخطوط الملكية، الوقاية المدنية…',
    h1: fr ? 'Tests psychotechniques des concours et recrutements au Maroc' : 'الاختبارات النفسية التقنية في مباريات التوظيف بالمغرب',
    description: fr
      ? "Quels recruteurs marocains font passer des tests psychotechniques (ONCF, Royal Air Maroc, Protection civile, FAR, SRM, OCP) et comment s'y entraîner gratuitement avec des séries corrigées."
      : 'المؤسسات المغربية التي تعتمد الاختبارات النفسية التقنية في التوظيف، وكيف تتدرب عليها مجاناً بسلاسل مصححة.',
    intro: fr
      ? "Plusieurs établissements publics et grandes entreprises marocaines ajoutent un test psychotechnique à leur sélection. Voici ceux pour lesquels une source publique le confirme, avec le lien vers cette source, et l'entraînement KounKour qui couvre les familles d'exercices les plus courantes."
      : 'تضيف عدة مؤسسات عمومية ومقاولات كبرى بالمغرب اختباراً نفسياً تقنياً إلى مسار الانتقاء. هذه المؤسسات التي يؤكد ذلك مصدر علني، مع رابط المصدر، والتدريب على KounKour.',
    sections: [
      {
        title: fr ? 'Les familles d’exercices à travailler' : 'عائلات التمارين التي يجب التدرب عليها',
        paragraphs: [fr ? "Les recruteurs ne publient pas leurs tests. Les épreuves de ce type reposent en général sur ces familles d'exercices :" : 'لا تنشر المؤسسات اختباراتها، لكن هذا النوع من الاختبارات يعتمد عادة على العائلات التالية:'],
        bullets: PSYCHO_FAMILIES.map((f) => f[lang]),
      },
    ],
    faq: [],
  };
}

export function psychoRecruiterDoc(r: PsychoRecruiter, lang: Lang): PsychoDoc {
  const fr = lang === 'fr';
  const n = r.name[lang];
  return {
    title: fr ? `Tests psychotechniques ${(r.short || r.name).fr} : exercices corrigés gratuits` : `الاختبارات النفسية التقنية ${(r.short || r.name).ar}: تمارين مصححة`,
    h1: fr ? `Tests psychotechniques ${n}` : `الاختبارات النفسية التقنية: ${n}`,
    description: fr
      ? `Ce que l'on sait des tests psychotechniques ${n} (source à l'appui) et entraînement gratuit : suites, logique, codage, calcul, dominos, avec corrigés.`
      : `ما نعرفه عن الاختبارات النفسية التقنية لدى ${n} (مع المصدر) وتدريب مجاني بسلاسل مصححة.`,
    intro: fr
      ? `Recrutements ${n} : ce qu'une source publique dit des tests psychotechniques, les concours ouverts en ce moment et un entraînement gratuit, corrigé, sur les familles d'exercices les plus courantes.`
      : `توظيفات ${n}: ما يقوله مصدر علني عن الاختبارات النفسية التقنية، والمباريات المفتوحة حالياً، وتدريب مجاني مصحح على أكثر عائلات التمارين شيوعاً.`,
    sections: [
      {
        title: fr ? 'Ce que dit la source' : 'ما يقوله المصدر',
        paragraphs: [
          r.fact[lang],
          fr
            ? `Postes concernés d'après les avis publiés : ${r.posts.fr}. Le contenu exact, la durée et le barème des tests ne sont pas publiés : vérifiez toujours l'avis officiel de votre session.`
            : `المناصب المعنية حسب الإعلانات المنشورة: ${r.posts.ar}. لا يُنشر المحتوى الدقيق للاختبارات ولا مدتها ولا سلم التنقيط: راجع دائماً الإعلان الرسمي لدورتك.`,
        ],
      },
      {
        title: fr ? 'Les familles d’exercices à travailler' : 'عائلات التمارين التي يجب التدرب عليها',
        paragraphs: [fr ? 'Les tests psychotechniques de recrutement reposent en général sur ces familles :' : 'تعتمد الاختبارات النفسية التقنية في التوظيف عادة على العائلات التالية:'],
        bullets: PSYCHO_FAMILIES.map((f) => f[lang]),
      },
      {
        title: fr ? 'Comment se préparer' : 'كيف تستعد',
        paragraphs: [
          fr
            ? "Lisez d'abord la fiche méthode, puis faites une série par famille en notant vos erreurs. Terminez par le test blanc chronométré (30 questions en 20 minutes) pour travailler la vitesse : environ 40 secondes par question."
            : 'ابدأ بقراءة البطاقة المنهجية، ثم أنجز سلسلة لكل عائلة مع تدوين أخطائك، واختم بالاختبار التجريبي المؤقت (30 سؤالاً في 20 دقيقة) لتحسين السرعة.',
        ],
      },
    ],
    faq: [
      {
        q: fr ? `Y a-t-il un test psychotechnique dans les recrutements ${n} ?` : `هل توجد اختبارات نفسية تقنية في توظيفات ${n}؟`,
        a: `${r.fact[lang]} ${fr ? `Source : ${r.sourceLabel}.` : `المصدر: ${r.sourceLabel}.`}`,
      },
      {
        q: fr ? 'Les exercices KounKour sont-ils les vrais tests ?' : 'هل تمارين KounKour هي الاختبارات الحقيقية؟',
        a: fr
          ? "Non. Ce sont des exercices d'entraînement rédigés par KounKour sur les familles classiques des tests psychotechniques, avec des réponses vérifiées et expliquées. Ce n'est pas un sujet officiel."
          : 'لا. إنها تمارين تدريبية من إعداد KounKour على العائلات الكلاسيكية للاختبارات النفسية التقنية، بأجوبة مصححة ومشروحة. ليست موضوعاً رسمياً.',
      },
    ],
  };
}
