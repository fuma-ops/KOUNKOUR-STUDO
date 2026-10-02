import { QcmSet } from '../types';

export const mockQcmSets: QcmSet[] = [
  // =========================================================================
  // 1. ANNALES OFFICIELLES DGSN : GARDIENS DE LA PAIX (حراس الأمن)
  // =========================================================================
  {
    id: 'qcm-dgsn-gardiens-paix-annales',
    slug: 'annales-qcm-gardiens-de-la-paix-dgsn',
    title: {
      fr: 'Entraînement QCM — Gardiens de la Paix (DGSN)',
      ar: 'استبيان مباراة حراس الأمن - المديرية العامة للأمن الوطني',
    },
    description: {
      fr: 'QCM d’entraînement préparé par KounKour sur les thèmes du concours des Gardiens de la Paix (Culture Générale, Histoire & Géographie du Maroc, DGSN). Ce n’est pas un sujet officiel.',
      ar: 'أسئلة تدريبية أعدّتها KounKour حول مواضيع مباراة حراس الأمن (الثقافة العامة، تاريخ وجغرافية المغرب، الأمن الوطني). ليست اختباراً رسمياً.',
    },
    category: 'culture_generale',
    durationMinutes: 30,
    difficulty: 'accessible',
    questionsCount: 20,
    isDemo: false,
    questions: [
      {
        id: 'gp-q1',
        number: 1,
        text: {
          fr: 'Lequel de ces sommets appartient à la chaîne montagneuse du Rif au Maroc ?',
          ar: 'أي جبل من هذه الجبال ينتمي إلى سلسلة جبال الريف ؟',
        },
        options: [
          { id: 'gp-1-a', text: { fr: 'Mont Toubkal', ar: 'جبل توبقال' } },
          { id: 'gp-1-b', text: { fr: 'Mont Tidghine', ar: 'جبل تدغين' } },
          { id: 'gp-1-c', text: { fr: 'Mont Ayachi', ar: 'جبل العياشي' } },
          { id: 'gp-1-d', text: { fr: 'Mont M’goun', ar: 'جبل مكون' } },
          { id: 'gp-1-e', text: { fr: 'Mont Saghro', ar: 'جبل صغرو' } },
        ],
        correctOptionId: 'gp-1-b',
        explanation: {
          fr: 'Le mont Tidghine (2 456 m) est le point culminant de la chaîne du Rif au Maroc. Le mont Toubkal culmine quant à lui dans le Haut Atlas.',
          ar: 'جبل تدغين (2456 م) هو أعلى قمة جبلية في سلسلة جبال الريف المغربية. أما جبل توبقال فيقع في الأطلس الكبير.',
        },
        source: 'Géographie du Maroc',
      },
      {
        id: 'gp-q2',
        number: 2,
        text: {
          fr: 'Où se situe le siège mondial de l’organisation internationale de police criminelle (INTERPOL) ?',
          ar: 'أين يوجد المقر الرئيسي لمنظمة الإنتربول (INTERPOL) ؟',
        },
        options: [
          { id: 'gp-2-a', text: { fr: 'Paris (France)', ar: 'باريس' } },
          { id: 'gp-2-b', text: { fr: 'Lyon (France)', ar: 'ليون' } },
          { id: 'gp-2-c', text: { fr: 'Genève (Suisse)', ar: 'جنيف' } },
          { id: 'gp-2-d', text: { fr: 'Berlin (Allemagne)', ar: 'برلين' } },
          { id: 'gp-2-e', text: { fr: 'New York (USA)', ar: 'نيويورك' } },
        ],
        correctOptionId: 'gp-2-b',
        explanation: {
          fr: 'Le Secrétariat général d’INTERPOL est basé à Lyon, en France, depuis 1989.',
          ar: 'يقع المقر الرئيسي للأمانة العامة لمنظمة الإنتربول الدولية في مدينة ليون بفرنسا منذ سنة 1989.',
        },
        source: 'Organisation Internationale INTERPOL',
      },
      {
        id: 'gp-q3',
        number: 3,
        text: {
          fr: 'Que signifie l’acronyme INTERPOL ?',
          ar: 'ماذا نعني بالإنتربول (INTERPOL) ؟',
        },
        options: [
          { id: 'gp-3-a', text: { fr: 'Organisation de la Sécurité Internationale', ar: 'منظمة الأمن الدولي' } },
          { id: 'gp-3-b', text: { fr: 'Organisation Internationale de Sécurité Civile', ar: 'منظمة الأمن والسلامة الدولية' } },
          { id: 'gp-3-c', text: { fr: 'Organisation Internationale de Police Criminelle', ar: 'منظمة الشرطة الجنائية الدولية' } },
          { id: 'gp-3-d', text: { fr: 'Organisation Mondiale de la Police Judiciaire', ar: 'المنظمة الدولية للشرطة القضائية' } },
          { id: 'gp-3-e', text: { fr: 'Organisation des Polices Frontalières', ar: 'المنظمة الدولية لحرس الحدود' } },
        ],
        correctOptionId: 'gp-3-c',
        explanation: {
          fr: 'INTERPOL est l’abréviation officielle de l’Organisation Internationale de Police Criminelle (OIPC).',
          ar: 'الإنتربول (INTERPOL) هو الاسم المختصر الرسمي لـ "منظمة الشرطة الجنائية الدولية".',
        },
        source: 'Statuts officiels d’INTERPOL',
      },
      {
        id: 'gp-q4',
        number: 4,
        text: {
          fr: 'De combien d’émirats est composé l’État des Émirats Arabes Unis ?',
          ar: 'تتكون دولة الإمارات العربية المتحدة من :',
        },
        options: [
          { id: 'gp-4-a', text: { fr: '4 Émirats', ar: '4 إمارات' } },
          { id: 'gp-4-b', text: { fr: '5 Émirats', ar: '5 إمارات' } },
          { id: 'gp-4-c', text: { fr: '6 Émirats', ar: '6 إمارات' } },
          { id: 'gp-4-d', text: { fr: '7 Émirats', ar: '7 إمارات' } },
          { id: 'gp-4-e', text: { fr: '8 Émirats', ar: '8 إمارات' } },
        ],
        correctOptionId: 'gp-4-d',
        explanation: {
          fr: 'Les Émirats Arabes Unis sont composés de 7 émirats : Abou Dhabi, Dubaï, Sharjah, Ajman, Oumm al-Qaïwaïn, Ras al-Khaïmah et Fujaïrah.',
          ar: 'تتكون دولة الإمارات العربية المتحدة من 7 إمارات: أبوظبي، دبي، الشارقة، عجمان، أم القيوين، رأس الخيمة، والفجيرة.',
        },
        source: 'Géographie politique & Relations internationales',
      },
      {
        id: 'gp-q5',
        number: 5,
        text: {
          fr: 'En quelle année le Soudan du Sud a-t-il officiellement accédé à son indépendance ?',
          ar: 'في أي سنة انفصل جنوب السودان عن السودان رسمياً ؟',
        },
        options: [
          { id: 'gp-5-a', text: { fr: '2009', ar: '2009' } },
          { id: 'gp-5-b', text: { fr: '2010', ar: '2010' } },
          { id: 'gp-5-c', text: { fr: '2011', ar: '2011' } },
          { id: 'gp-5-d', text: { fr: '2012', ar: '2012' } },
          { id: 'gp-5-e', text: { fr: '2013', ar: '2013' } },
        ],
        correctOptionId: 'gp-5-c',
        explanation: {
          fr: 'Le Soudan du Sud a proclamé son indépendance le 9 juillet 2011 à la suite du référendum d’autodétermination.',
          ar: 'أعلن جنوب السودان استقلاله رسمياً في 9 يوليوز 2011 بعد تنظيم استفتاء تقرير المصير.',
        },
        source: 'ONU & Histoire contemporaine',
      },
      {
        id: 'gp-q6',
        number: 6,
        text: {
          fr: 'Quelle ville historique est surnommée « Fleur des Cités » (زهرة المدائن) ?',
          ar: 'يطلق عليها لقب "زهرة المدائن" :',
        },
        options: [
          { id: 'gp-6-a', text: { fr: 'Gaza', ar: 'غزة' } },
          { id: 'gp-6-b', text: { fr: 'Al-Qods (Jérusalem)', ar: 'القدس' } },
          { id: 'gp-6-c', text: { fr: 'Damas', ar: 'دمشق' } },
          { id: 'gp-6-d', text: { fr: 'Naplouse', ar: 'نابلس' } },
          { id: 'gp-6-e', text: { fr: 'Bethléem', ar: 'بيت لحم' } },
        ],
        correctOptionId: 'gp-6-b',
        explanation: {
          fr: 'Al-Qods Acharif (Jérusalem) est historiquement et poétiquement surnommée « Fleur des Cités » (Zahrat Al-Madaen).',
          ar: 'تُلقب مدينة القدس الشريف بـ "زهرة المدائن" في الأدب والشعر العربي المعاصر.',
        },
        source: 'Culture générale & Patrimoine',
      },
      {
        id: 'gp-q7',
        number: 7,
        text: {
          fr: 'Dans quelle ville marocaine se situent les célèbres Jardins Majorelle ?',
          ar: 'أين توجد حدائق الماجوريل بالمغرب ؟',
        },
        options: [
          { id: 'gp-7-a', text: { fr: 'Rabat', ar: 'الرباط' } },
          { id: 'gp-7-b', text: { fr: 'Casablanca', ar: 'الدار البيضاء' } },
          { id: 'gp-7-c', text: { fr: 'Marrakech', ar: 'مراكش' } },
          { id: 'gp-7-d', text: { fr: 'Agadir', ar: 'أكادير' } },
          { id: 'gp-7-e', text: { fr: 'Fès', ar: 'فاس' } },
        ],
        correctOptionId: 'gp-7-c',
        explanation: {
          fr: 'Les Jardins Majorelle sont un célèbre jardin botanique et touristique situé à Marrakech, créé par le peintre français Jacques Majorelle.',
          ar: 'توجد حدائق الماجوريل بمدينة مراكش، وهي معلمة سياحية ونباتية شهيرة أسسها الرسام الفرنسي جاك ماجوريل.',
        },
        source: 'Patrimoine touristique & Culture marocaine',
      },
      {
        id: 'gp-q8',
        number: 8,
        text: {
          fr: 'Selon l’article 1er de la Constitution de 2011, la nature du régime politique au Maroc est :',
          ar: 'نظام الحكم في المغرب حسب الفصل الأول من دستور 2011 هو :',
        },
        options: [
          { id: 'gp-8-a', text: { fr: 'Une monarchie démocratique, politique et sociale', ar: 'ملكية ديمقراطية، سياسية واجتماعية' } },
          { id: 'gp-8-b', text: { fr: 'Une monarchie constitutionnelle, démocratique, parlementaire et sociale', ar: 'ملكية دستورية، ديمقراطية برلمانية واجتماعية' } },
          { id: 'gp-8-c', text: { fr: 'Une monarchie présidentielle et constitutionnelle', ar: 'ملكية رئاسية ودستورية' } },
          { id: 'gp-8-d', text: { fr: 'Une monarchie parlementaire fédérale', ar: 'ملكية برلمانية فيدرالية' } },
          { id: 'gp-8-e', text: { fr: 'Une monarchie élective et représentative', ar: 'ملكية انتخابية وتمثيلية' } },
        ],
        correctOptionId: 'gp-8-b',
        explanation: {
          fr: 'L’article 1er de la Constitution dispose : « Le Maroc est une monarchie constitutionnelle, démocratique, parlementaire et sociale ».',
          ar: 'ينص الفصل 1 من دستور 2011 على أن : « نظام الحكم بالمغرب نظام ملكية دستورية، ديمقراطية برلمانية واجتماعية ».',
        },
        source: 'Constitution du Royaume du Maroc de 2011 (Article 1)',
      },
      {
        id: 'gp-q9',
        number: 9,
        text: {
          fr: 'Quelle est la date officielle de création de la Direction Générale de la Sûreté Nationale (DGSN) ?',
          ar: 'متى تم تأسيس المديرية العامة للأمن الوطني (DGSN) بتاريخ :',
        },
        options: [
          { id: 'gp-9-a', text: { fr: '16 mai 1953', ar: '16 ماي 1953' } },
          { id: 'gp-9-b', text: { fr: '16 mai 1954', ar: '16 ماي 1954' } },
          { id: 'gp-9-c', text: { fr: '16 mai 1955', ar: '16 ماي 1955' } },
          { id: 'gp-9-d', text: { fr: '16 mai 1956', ar: '16 ماي 1956' } },
          { id: 'gp-9-e', text: { fr: '16 mai 1957', ar: '16 ماي 1957' } },
        ],
        correctOptionId: 'gp-9-d',
        explanation: {
          fr: 'La DGSN a été fondée le 16 mai 1956 par Feu Sa Majesté le Roi Mohammed V, au lendemain de l’indépendance du Maroc.',
          ar: 'تأسست المديرية العامة للأمن الوطني في 16 ماي 1956 بمبادرة من جلالة المغفور له الملك محمد الخامس طيب الله ثراه.',
        },
        source: 'Histoire des institutions marocaines & DGSN',
      },
      {
        id: 'gp-q10',
        number: 10,
        text: {
          fr: 'En quelle date l’Initiative Nationale pour le Développement Humain (INDH) a-t-elle été officiellement lancée ?',
          ar: 'تم الإعلان رسمياً عن انطلاق المبادرة الوطنية للتنمية البشرية (INDH) في :',
        },
        options: [
          { id: 'gp-10-a', text: { fr: '18 mai 2005', ar: '18 ماي 2005' } },
          { id: 'gp-10-b', text: { fr: '18 mai 2006', ar: '18 ماي 2006' } },
          { id: 'gp-10-c', text: { fr: '18 mai 2007', ar: '18 ماي 2007' } },
          { id: 'gp-10-d', text: { fr: '18 mai 2008', ar: '18 ماي 2008' } },
          { id: 'gp-10-e', text: { fr: '18 mai 2009', ar: '18 ماي 2009' } },
        ],
        correctOptionId: 'gp-10-a',
        explanation: {
          fr: 'Sa Majesté le Roi Mohammed VI a lancé officiellement l’Initiative Nationale pour le Développement Humain (INDH) lors du discours royal du 18 mai 2005.',
          ar: 'أعطى صاحب الجلالة الملك محمد السادس نصره الله الانطلاقة الرسمية للمبادرة الوطنية للتنمية البشرية في خطابه السامي يوم 18 ماي 2005.',
        },
        source: 'Discours Royal du 18 mai 2005',
      },
      {
        id: 'gp-q11',
        number: 11,
        text: {
          fr: 'Dans quel pays se situe le « Débarquement de la Baie des Cochons » (1961) ?',
          ar: 'أين يقع "خليج الخنازير" الشهير في التاريخ المعاصر ؟',
        },
        options: [
          { id: 'gp-11-a', text: { fr: 'Vietnam', ar: 'فيتنام' } },
          { id: 'gp-11-b', text: { fr: 'Honduras', ar: 'الهندوراس' } },
          { id: 'gp-11-c', text: { fr: 'Laos', ar: 'اللاووس' } },
          { id: 'gp-11-d', text: { fr: 'Cuba', ar: 'كوبا' } },
          { id: 'gp-11-e', text: { fr: 'Argentine', ar: 'الأرجنتين' } },
        ],
        correctOptionId: 'gp-11-d',
        explanation: {
          fr: 'La baie des Cochons est une baie de la côte sud de Cuba, théâtre d’une tentative de débarquement en avril 1961.',
          ar: 'يقع خليج الخنازير على الساحل الجنوبي لدولة كوبا، وشهد أحداث الإنزال الشهيرة في أبريل 1961.',
        },
        source: 'Histoire contemporaine & Géopolitique',
      },
      {
        id: 'gp-q12',
        number: 12,
        text: {
          fr: 'Qui est l’auteur du célèbre roman « Le Voleur et les Chiens » (اللص والكلاب) ?',
          ar: 'من هو مؤلف رواية "اللص والكلاب" الشهيرة ؟',
        },
        options: [
          { id: 'gp-12-a', text: { fr: 'Naguib Mahfouz', ar: 'نجيب محفوظ' } },
          { id: 'gp-12-b', text: { fr: 'Yasmina Khadra', ar: 'ياسمينة خضرا' } },
          { id: 'gp-12-c', text: { fr: 'Abbas Mahmoud Al-Akkad', ar: 'محمود عباس العقاد' } },
          { id: 'gp-12-d', text: { fr: 'Taha Hussein', ar: 'طه حسين' } },
          { id: 'gp-12-e', text: { fr: 'Ahlam Mosteghanemi', ar: 'أحلام مستغانمي' } },
        ],
        correctOptionId: 'gp-12-a',
        explanation: {
          fr: '« Le Voleur et les Chiens » est un roman écrit par l’écrivain égyptien Naguib Mahfouz, lauréat du Prix Nobel de littérature.',
          ar: 'رواية "اللص والكلاب" هي إحدى أشهر روايات الأديب المصري الحائز على جائزة نوبل للآداب نجيب محفوظ (1961).',
        },
        source: 'Littérature arabe moderne',
      },
      {
        id: 'gp-q13',
        number: 13,
        text: {
          fr: 'Où se situe le siège international de l’organisation non gouvernementale Amnesty International ?',
          ar: 'أين يقع المقر الدولي لمنظمة "العفو الدولية" (Amnesty International) ؟',
        },
        options: [
          { id: 'gp-13-a', text: { fr: 'Stockholm (Suède)', ar: 'ستوكهولم' } },
          { id: 'gp-13-b', text: { fr: 'Bruxelles (Belgique)', ar: 'بروكسيل' } },
          { id: 'gp-13-c', text: { fr: 'Paris (France)', ar: 'باريس' } },
          { id: 'gp-13-d', text: { fr: 'Vienne (Autriche)', ar: 'فيينا' } },
          { id: 'gp-13-e', text: { fr: 'Londres (Royaume-Uni)', ar: 'لندن' } },
        ],
        correctOptionId: 'gp-13-e',
        explanation: {
          fr: 'Le siège international d’Amnesty International est établi à Londres, au Royaume-Uni.',
          ar: 'يقع المقر الرئيسي للأمانة الدولية لمنظمة العفو الدولية في العاصمة البريطانية لندن.',
        },
        source: 'Organisations non gouvernementales internationales',
      },
      {
        id: 'gp-q14',
        number: 14,
        text: {
          fr: 'Qui a été le premier Chef du Gouvernement (Président du Conseil) du Maroc après l’indépendance en 1955 ?',
          ar: 'من هو أول رئيس حكومة للمغرب بعد الاستقلال (دجنبر 1955) ؟',
        },
        options: [
          { id: 'gp-14-a', text: { fr: 'Ahmed Bahnini', ar: 'أحمد باحنيني' } },
          { id: 'gp-14-b', text: { fr: 'Abdallah Ibrahim', ar: 'عبد الله إبراهيم' } },
          { id: 'gp-14-c', text: { fr: 'Mbarek Bekkaï (Mbarek Lahbil)', ar: 'البكاي بن مبارك الهبيل' } },
          { id: 'gp-14-d', text: { fr: 'Ahmed Balafrej', ar: 'أحمد بلافريج' } },
          { id: 'gp-14-e', text: { fr: 'Allal El Fassi', ar: 'علال الفاسي' } },
        ],
        correctOptionId: 'gp-14-c',
        explanation: {
          fr: 'Mbarek Bekkaï a été désigné par Feu Mohammed V à la tête du premier gouvernement marocain de l’indépendance (7 décembre 1955).',
          ar: 'عُين البكاي بن مبارك الهبيل رئيساً لأول حكومة مغربية بعد الاستقلال بتاريخ 7 دجنبر 1955.',
        },
        source: 'Histoire politique du Maroc moderne',
      },
      {
        id: 'gp-q15',
        number: 15,
        text: {
          fr: 'Quel gaz de l’atmosphère terrestre absorbe la majeure partie des rayons ultraviolets solaires nocifs ?',
          ar: 'ما هو الغاز الذي يمتص الأشعة فوق البنفسجية في الغلاف الجوي للأرض ؟',
        },
        options: [
          { id: 'gp-15-a', text: { fr: 'L’Oxygène', ar: 'الأكسجين' } },
          { id: 'gp-15-b', text: { fr: 'Le Méthane', ar: 'الميثان' } },
          { id: 'gp-15-c', text: { fr: 'Le Dioxyde de carbone', ar: 'ثاني أكسيد الكربون' } },
          { id: 'gp-15-d', text: { fr: 'L’Ozone (O3)', ar: 'الأوزون' } },
          { id: 'gp-15-e', text: { fr: 'L’Azote', ar: 'النيتروجين' } },
        ],
        correctOptionId: 'gp-15-d',
        explanation: {
          fr: 'La couche d’ozone (O3) située dans la stratosphère absorbe 97 à 99 % du rayonnement ultraviolet haute fréquence émis par le Soleil.',
          ar: 'تمتص طبقة الأوزون (O3) الموجودة في طبقة الستراتوسفير النسبة الكبرى من الأشعة فوق البنفسجية الضارة القادمة من الشمس.',
        },
        source: 'Sciences de la Terre & Environnement',
      },
      {
        id: 'gp-q16',
        number: 16,
        text: {
          fr: 'Quel gaz ininflammable plus léger que l’air est principalement utilisé pour le gonflage des montgolfières et dirigeables modernes ?',
          ar: 'ما هو الغاز الآمن المستعمل في طيران المناطيد الحديثة ؟',
        },
        options: [
          { id: 'gp-16-a', text: { fr: 'L’Uranium', ar: 'الأورانيوم' } },
          { id: 'gp-16-b', text: { fr: 'L’Hydrogène', ar: 'الهيدروجين' } },
          { id: 'gp-16-c', text: { fr: 'L’Oxygène', ar: 'الأكسجين' } },
          { id: 'gp-16-d', text: { fr: 'L’Hélium', ar: 'الهيليوم' } },
          { id: 'gp-16-e', text: { fr: 'Le Méthane', ar: 'الميثان' } },
        ],
        correctOptionId: 'gp-16-d',
        explanation: {
          fr: 'L’hélium est un gaz noble inerte, ininflammable et plus léger que l’air, idéal pour assurer la portance des ballons et dirigeables en toute sécurité.',
          ar: 'غاز الهيليوم غاز خامل غير قابل للاشتعال وأخف من الهواء، مما يجعله الغاز المثالي والآمن لرفع المناطيد والمركبات الهوائية.',
        },
        source: 'Physique & Aéronautique',
      },
      {
        id: 'gp-q17',
        number: 17,
        text: {
          fr: 'Qui est l’éminent penseur et historien marocain, auteur de l’ouvrage « L’Idéologie arabe contemporaine » ?',
          ar: 'من هو المفكر والمؤرخ المغربي صاحب مؤلف "الإيديولوجيا العربية المعاصرة" ؟',
        },
        options: [
          { id: 'gp-17-a', text: { fr: 'Mohammed Abed Al-Jabri', ar: 'محمد عابد الجابري' } },
          { id: 'gp-17-b', text: { fr: 'Abdelilah Belkeziz', ar: 'عبد الإله بلقزيز' } },
          { id: 'gp-17-c', text: { fr: 'Mahdi Elmandjra', ar: 'المهدي المنجرة' } },
          { id: 'gp-17-d', text: { fr: 'Abdallah Laroui', ar: 'عبد الله العروي' } },
          { id: 'gp-17-e', text: { fr: 'Mohamed Sabila', ar: 'محمد سبيلا' } },
        ],
        correctOptionId: 'gp-17-d',
        explanation: {
          fr: '« L’Idéologie arabe contemporaine » (1967) est une œuvre maîtresse de l’historien et philosophe marocain Abdallah Laroui.',
          ar: 'كتاب "الإيديولوجيا العربية المعاصرة" (1967) هو أحد أهم مؤلفات المفكر والمؤرخ المغربي عبد الله العروي.',
        },
        source: 'Pensée marocaine contemporaine & Philosophie',
      },
      {
        id: 'gp-q18',
        number: 18,
        text: {
          fr: 'Qui est l’auteur du célèbre roman autobiographique marocain « Le Pain nu » (الخبز الحافي) ?',
          ar: 'من هو الكاتب المغربي صاحب الرواية العالمية "الخبز الحافي" ؟',
        },
        options: [
          { id: 'gp-18-a', text: { fr: 'Mohamed Choukri', ar: 'محمد شكري' } },
          { id: 'gp-18-b', text: { fr: 'Driss Chraïbi', ar: 'إدريس الشرايبي' } },
          { id: 'gp-18-c', text: { fr: 'Tahar Ben Jelloun', ar: 'طاهر بن جلون' } },
          { id: 'gp-18-d', text: { fr: 'Abdellatif Laâbi', ar: 'عبد اللطيف اللعبي' } },
          { id: 'gp-18-e', text: { fr: 'Abdelkarim Ghallab', ar: 'عبد الكريم غلاب' } },
        ],
        correctOptionId: 'gp-18-a',
        explanation: {
          fr: '« Le Pain nu » (Al-Khobz Al-Hafi) est le roman autobiographique culte de l’écrivain marocain Mohamed Choukri, traduit en plusieurs dizaines de langues.',
          ar: 'رواية "الخبز الحافي" هي السيرة الروائية الذاتية العالمية للكاتب المغربي الراحل محمد شكري (1973).',
        },
        source: 'Littérature marocaine',
      },
      {
        id: 'gp-q19',
        number: 19,
        text: {
          fr: 'À quelle date le Maroc a-t-il célébré le recouvrement de la province d’Oued Ed-Dahab ?',
          ar: 'ما هو التاريخ الرسمي لاسترجاع إقليم وادي الذهب إلى حظيرة الوطن الأم ؟',
        },
        options: [
          { id: 'gp-19-a', text: { fr: '14 mai 1979', ar: '14 ماي 1979' } },
          { id: 'gp-19-b', text: { fr: '14 juin 1979', ar: '14 يونيو 1979' } },
          { id: 'gp-19-c', text: { fr: '14 juillet 1979', ar: '14 يوليوز 1979' } },
          { id: 'gp-19-d', text: { fr: '14 août 1979', ar: '14 غشت 1979' } },
          { id: 'gp-19-e', text: { fr: '15 septembre 1979', ar: '15 شتنبر 1979' } },
        ],
        correctOptionId: 'gp-19-d',
        explanation: {
          fr: 'Le 14 août 1979, les oulémas et chefs de tribus d’Oued Ed-Dahab se sont rendus à Rabat pour prêter serment d’allégeance (Beia) à Feu Sa Majesté Hassan II.',
          ar: 'في 14 غشت 1979، استرجع المغرب رسمياً إقليم وادي الذهب وقدم وفد شيوخ ووجهاء قبائل الإقليم البيعة الشرعية لجلالة المغفور له الحسن الثاني بالرباط.',
        },
        source: 'Histoire du Maroc contemporain & Intégrité territoriale',
      },
      {
        id: 'gp-q20',
        number: 20,
        text: {
          fr: 'Quel illustre écrivain et intellectuel égyptien est surnommé « Le Doyen de la littérature arabe » (عميد الأدب العربي) ?',
          ar: 'يطلق لقب "عميد الأدب العربي" على الكاتب والمفكر :',
        },
        options: [
          { id: 'gp-20-a', text: { fr: 'Tawfiq Al-Hakim', ar: 'توفيق الحكيم' } },
          { id: 'gp-20-b', text: { fr: 'Naguib Mahfouz', ar: 'نجيب محفوظ' } },
          { id: 'gp-20-c', text: { fr: 'Taha Hussein', ar: 'طه حسين' } },
          { id: 'gp-20-d', text: { fr: 'Abbas Mahmoud Al-Akkad', ar: 'عباس محمود العقاد' } },
          { id: 'gp-20-e', text: { fr: 'Mostafa Saadeq Al-Rafe’ie', ar: 'مصطفى صادق الرافعي' } },
        ],
        correctOptionId: 'gp-20-c',
        explanation: {
          fr: 'Taha Hussein (1889-1973) est unanimement surnommé « Le Doyen de la littérature arabe » en reconnaissance de son apport monumental au roman et à la critique littéraire.',
          ar: 'يُلقب الأديب والناقد المصري طه حسين (1889-1973) بـ "عميد الأدب العربي".',
        },
        source: 'Histoire de la littérature arabe',
      },
    ],
  },

  // =========================================================================
  // 2. ANNALES OFFICIELLES DGSN : INSPECTEURS DE POLICE (مفتشو الشرطة - Français)
  // =========================================================================
  {
    id: 'qcm-dgsn-inspecteurs-police-fr',
    slug: 'annales-qcm-inspecteurs-de-police-dgsn-francais',
    title: {
      fr: 'Concours Inspecteurs de Police - Épreuve en Français (DGSN)',
      ar: 'مباراة مفتشي الشرطة - اختبار اللغة الفرنسية والثقافة العامة',
    },
    description: {
      fr: 'QCM d’entraînement en langue française sur les thèmes du concours des Inspecteurs de Police (Institutions marocaines, Droit, Culture Générale, Orthographe). Ce n’est pas un sujet officiel.',
      ar: 'أسئلة تدريبية باللغة الفرنسية حول مواضيع مباراة مفتشي الشرطة (المؤسسات الدستورية، القواعد اللغوية، الثقافة العامة). ليست اختباراً رسمياً.',
    },
    category: 'francais',
    durationMinutes: 25,
    difficulty: 'moyen',
    questionsCount: 15,
    isDemo: false,
    questions: [
      {
        id: 'insp-1',
        number: 1,
        text: {
          fr: 'Au Maroc, les députés de la Chambre des Représentants sont élus pour une durée de :',
          ar: 'يُنتخب أعضاء مجلس النواب في المغرب لولاية مدتها :',
        },
        options: [
          { id: 'insp-1-a', text: { fr: '3 ans', ar: '3 سنوات' } },
          { id: 'insp-1-b', text: { fr: '4 ans', ar: '4 سنوات' } },
          { id: 'insp-1-c', text: { fr: '5 ans', ar: '5 سنوات' } },
          { id: 'insp-1-d', text: { fr: '6 ans', ar: '6 سنوات' } },
          { id: 'insp-1-e', text: { fr: '7 ans', ar: '7 سنوات' } },
        ],
        correctOptionId: 'insp-1-c',
        explanation: {
          fr: 'Conformément à l’article 62 de la Constitution marocaine de 2011, les membres de la Chambre des Représentants sont élus pour cinq ans au suffrage universel direct.',
          ar: 'ينص الفصل 62 من الدستور على أن أعضاء مجلس النواب يُنتخبون لمدة خمس سنوات بالاقتراع العام المباشر.',
        },
        source: 'Constitution du Maroc de 2011 (Article 62)',
      },
      {
        id: 'insp-2',
        number: 2,
        text: {
          fr: 'Selon la Constitution marocaine, la session extraordinaire du Parlement est close par :',
          ar: 'تُختتم الدورة الاستثنائية للبرلمان المغربي بموجب :',
        },
        options: [
          { id: 'insp-2-a', text: { fr: 'Décision Royale', ar: 'قرار ملكي' } },
          { id: 'insp-2-b', text: { fr: 'Décret', ar: 'مرسوم' } },
          { id: 'insp-2-c', text: { fr: 'À la demande du tiers des membres de la Chambre des Représentants', ar: 'بطلب من ثلث أعضاء مجلس النواب' } },
          { id: 'insp-2-d', text: { fr: 'À la majorité des membres de la Chambre des Conseillers', ar: 'بأغلبية أعضاء مجلس المستشارين' } },
          { id: 'insp-2-e', text: { fr: 'À l’unanimité des deux chambres', ar: 'بإجماع المجلسين' } },
        ],
        correctOptionId: 'insp-2-b',
        explanation: {
          fr: 'L’article 66 de la Constitution dispose que la session extraordinaire est close par décret dès que le Parlement a épuisé l’ordre du jour pour lequel elle a été convoquée.',
          ar: 'ينص الفصل 66 من الدستور على أن الدورة الاستثنائية تُختتم بمرسوم بمجرد استنفاد جدول الأعمال الذي دُعيت من أجله.',
        },
        source: 'Constitution de 2011 (Article 66)',
      },
      {
        id: 'insp-3',
        number: 3,
        text: {
          fr: 'Le conseil communal au Maroc se réunit obligatoirement en sessions ordinaires au moins :',
          ar: 'يجتمع المجلس الجماعي في المغرب وجوباً في دورات عادية بمعدل :',
        },
        options: [
          { id: 'insp-3-a', text: { fr: 'Deux fois par an', ar: 'مرتين في السنة' } },
          { id: 'insp-3-b', text: { fr: 'Trois fois par an', ar: 'ثلاث مرات في السنة' } },
          { id: 'insp-3-c', text: { fr: 'Quatre fois par an', ar: 'أربع مرات في السنة' } },
          { id: 'insp-3-d', text: { fr: 'Cinq fois par an', ar: 'خمس مرات في السنة' } },
          { id: 'insp-3-e', text: { fr: 'Six fois par an', ar: 'ست مرات في السنة' } },
        ],
        correctOptionId: 'insp-3-b',
        explanation: {
          fr: 'Selon l’article 33 de la Loi Organique n° 113-14 relative aux communes, le conseil communal tient obligatoirement ses sessions ordinaires trois fois par an (février, mai et octobre).',
          ar: 'تحدد المادة 33 من القانون التنظيمي 113.14 المتعلق بالجماعات عقد ثلاث دورات عادية في السنة (فبراير، ماي، وأكتوبر).',
        },
        source: 'Loi Organique n° 113-14 relative aux communes',
      },
      {
        id: 'insp-4',
        number: 4,
        text: {
          fr: '« L’Étranger » est un célèbre roman de la littérature française écrit par :',
          ar: 'رواية "الغريب" (L’Étranger) من أشهر روايات الأدب الفرنسي، كتبها :',
        },
        options: [
          { id: 'insp-4-a', text: { fr: 'Victor Hugo', ar: 'فيكتور هوغو' } },
          { id: 'insp-4-b', text: { fr: 'Albert Camus', ar: 'ألبير كامو' } },
          { id: 'insp-4-c', text: { fr: 'Émile Zola', ar: 'إميل زولا' } },
          { id: 'insp-4-d', text: { fr: 'Denis Diderot', ar: 'ديدرو' } },
          { id: 'insp-4-e', text: { fr: 'Charles Baudelaire', ar: 'شارل بودلير' } },
        ],
        correctOptionId: 'insp-4-b',
        explanation: {
          fr: '« L’Étranger » (1942) est le chef-d’œuvre d’Albert Camus, figure majeure de la philosophie de l’absurde et Prix Nobel de littérature.',
          ar: 'رواية "الغريب" هي العمل الأدبي الأبرز للكاتب الفرنسي ألبير كامو الحائز على جائزة نوبل للآداب.',
        },
        source: 'Littérature française & Culture générale',
      },
      {
        id: 'insp-5',
        number: 5,
        text: {
          fr: 'Quelle est l’orthographe grammaticale correcte du nombre 80 156 en lettres ?',
          ar: 'ما هي الكتابة الإملائية الصحيحة للعدد 80156 بالحروف باللغة الفرنسية ؟',
        },
        options: [
          { id: 'insp-5-a', text: { fr: 'Quatre-vingt mille cent cinquante-six', ar: 'Quatre-vingt mille cent cinquante-six' } },
          { id: 'insp-5-b', text: { fr: 'Quatre vingt milles cents cinquante six', ar: 'Quatre vingt milles cents cinquante six' } },
          { id: 'insp-5-c', text: { fr: 'Quatre vingts mille cent cinquante six', ar: 'Quatre vingts mille cent cinquante six' } },
          { id: 'insp-5-d', text: { fr: 'Quatre-vingts mille cent cinquante-six', ar: 'Quatre-vingts mille cent cinquante-six' } },
          { id: 'insp-5-e', text: { fr: 'Quatre vingt mille cent cinquantes six', ar: 'Quatre vingt mille cent cinquantes six' } },
        ],
        correctOptionId: 'insp-5-a',
        explanation: {
          fr: 'Règle grammaticale : "vingt" et "cent" ne prennent pas de "s" quand ils sont suivis d’un autre nombre cardinal (mille étant par ailleurs toujours invariable).',
          ar: 'وفق قواعد الإملاء الفرنسية، لا تأخذ كلمة vingt حرف s عندما تكون متبوعة بعدد آخر، وكلمة mille لا تجمع أبداً.',
        },
        source: 'Grammaire & Orthographe de la langue française',
      },
      {
        id: 'insp-6',
        number: 6,
        text: {
          fr: 'La maladie infectieuse provoquée par le bacille de Koch (BK) est :',
          ar: 'المرض المعدي الذي تسببه عصيات كوخ (Bacille de Koch) هو :',
        },
        options: [
          { id: 'insp-6-a', text: { fr: 'La peste', ar: 'الطاعون' } },
          { id: 'insp-6-b', text: { fr: 'La tuberculose', ar: 'داء السل' } },
          { id: 'insp-6-c', text: { fr: 'La poliomyélite', ar: 'شلل الأطفال' } },
          { id: 'insp-6-d', text: { fr: 'La gale', ar: 'الجرب' } },
          { id: 'insp-6-e', text: { fr: 'La grippe aviaire', ar: 'أنفلونزا الطيور' } },
        ],
        correctOptionId: 'insp-6-b',
        explanation: {
          fr: 'La tuberculose est causée par la bactérie Mycobacterium tuberculosis, également appelée bacille de Koch, découverte par Robert Koch en 1882.',
          ar: 'داء السل تسببه بكتيريا المتفطرة السلية المعروفة بعصيات كوخ التي اكتشفها العالم الألماني روبرت كوخ سنة 1882.',
        },
        source: 'Sciences médicales & Santé publique',
      },
      {
        id: 'insp-7',
        number: 7,
        text: {
          fr: 'Dans quelle ville mondiale se situe le siège central de l’UNESCO ?',
          ar: 'في أي مدينة يقع المقر الرئيسي لمنظمة الأمم المتحدة للتربية والعلم والثقافة (UNESCO) ؟',
        },
        options: [
          { id: 'insp-7-a', text: { fr: 'Londres (Royaume-Uni)', ar: 'لندن' } },
          { id: 'insp-7-b', text: { fr: 'Paris (France)', ar: 'باريس' } },
          { id: 'insp-7-c', text: { fr: 'New York (USA)', ar: 'نيويورك' } },
          { id: 'insp-7-d', text: { fr: 'Genève (Suisse)', ar: 'جنيف' } },
          { id: 'insp-7-e', text: { fr: 'Bruxelles (Belgique)', ar: 'بروكسيل' } },
        ],
        correctOptionId: 'insp-7-b',
        explanation: {
          fr: 'Le siège central de l’UNESCO (Organisation des Nations unies pour l’éducation, la science et la culture) est situé à Paris, en France.',
          ar: 'يقع المقر الدائم لمنظمة اليونسكو في العاصمة الفرنسية باريس.',
        },
        source: 'Organisations du système des Nations Unies',
      },
      {
        id: 'insp-8',
        number: 8,
        text: {
          fr: 'Quelle est la devise officielle de l’Union Européenne ?',
          ar: 'ما هو الشعار الرسمي للاتحاد الأوروبي ؟',
        },
        options: [
          { id: 'insp-8-a', text: { fr: 'Unis pour l’éternité', ar: 'متحدون إلى الأبد' } },
          { id: 'insp-8-b', text: { fr: 'Unis dans l’égalité et la fraternité', ar: 'متحدون في المساواة والأخوة' } },
          { id: 'insp-8-c', text: { fr: 'Unis dans la diversité', ar: 'متحدون في التنوع' } },
          { id: 'insp-8-d', text: { fr: 'Unis dans la pluralité', ar: 'متحدون في التعددية' } },
          { id: 'insp-8-e', text: { fr: 'Unis pour le bien de tous', ar: 'متحدون لخير الجميع' } },
        ],
        correctOptionId: 'insp-8-c',
        explanation: {
          fr: 'La devise officielle de l’Union Européenne est « Unis dans la diversité » (In varietate concordia), adoptée en l’an 2000.',
          ar: 'الشعار الرسمي للاتحاد الأوروبي هو "متحدون في التنوع" (Unis dans la diversité).',
        },
        source: 'Institutions internationales & Droit européen',
      },
      {
        id: 'insp-9',
        number: 9,
        text: {
          fr: 'Au Maroc, l’abréviation officielle « ANRAC » désigne :',
          ar: 'في المغرب، يشير الاختصار الرسمي "ANRAC" إلى :',
        },
        options: [
          { id: 'insp-9-a', text: { fr: 'L’Agence Nationale de Règlementation des Avoirs Relatifs au Consommateur', ar: 'الوكالة الوطنية لتقنين الأصول الاستهلاكية' } },
          { id: 'insp-9-b', text: { fr: 'L’Agence Nationale de Réglementation des Activités Relatives au Commerce', ar: 'الوكالة الوطنية لتنظيم الأنشطة التجارية' } },
          { id: 'insp-9-c', text: { fr: 'L’Agence Nationale de Réflexion sur les Activités Relatives au Climat', ar: 'الوكالة الوطنية لدراسات المناخ' } },
          { id: 'insp-9-d', text: { fr: 'L’Agence Nationale de Réglementation des Activités Relatives au Cannabis', ar: 'الوكالة الوطنية لتقنين الأنشطة المتعلقة بالقنب الهندي' } },
          { id: 'insp-9-e', text: { fr: 'L’Agence Nationale de Rehaussement de l’Artisanat', ar: 'الوكالة الوطنية للنهوض بالصناعة التقليدية' } },
        ],
        correctOptionId: 'insp-9-d',
        explanation: {
          fr: 'L’ANRAC est l’Agence Nationale de Réglementation des Activités Relatives au Cannabis, créée en vertu de la loi n° 13-21 relative aux usages licites du cannabis.',
          ar: 'الوكالة الوطنية لتقنين الأنشطة المتعلقة بالقنب الهندي (ANRAC) أحدثت بموجب القانون رقم 13.21 المتعلق بالاستعمالات المشروعة للقنب الهندي.',
        },
        source: 'Loi n° 13-21 relative aux usages licites du cannabis au Maroc',
      },
      {
        id: 'insp-10',
        number: 10,
        text: {
          fr: 'En quelle année la Direction Générale de la Sûreté Nationale (DGSN) a-t-elle été instituée ?',
          ar: 'في أي سنة تم إحداث المديرية العامة للأمن الوطني (DGSN) بالمغرب ؟',
        },
        options: [
          { id: 'insp-10-a', text: { fr: '1912', ar: '1912' } },
          { id: 'insp-10-b', text: { fr: '1956', ar: '1956' } },
          { id: 'insp-10-c', text: { fr: '1961', ar: '1961' } },
          { id: 'insp-10-d', text: { fr: '1975', ar: '1975' } },
          { id: 'insp-10-e', text: { fr: '1981', ar: '1981' } },
        ],
        correctOptionId: 'insp-10-b',
        explanation: {
          fr: 'La DGSN a été instituée le 16 mai 1956 par Dahir royal pour garantir la sûreté publique et l’application des lois dans le Royaume.',
          ar: 'أحدثت المديرية العامة للأمن الوطني بظهير شريف في 16 ماي 1956 لضمان الأمن العام وتطبيق القانون بالمملكة.',
        },
        source: 'Dahir royal instituant la DGSN (16 mai 1956)',
      },
      {
        id: 'insp-11',
        number: 11,
        text: {
          fr: 'Quel écrivain marocain francophone est l’auteur du roman classique « La Boîte à merveilles » ?',
          ar: 'من هو الكاتب المغربي مؤلف الرواية الشهيرة "صندوق العجائب" (La Boîte à merveilles) ؟',
        },
        options: [
          { id: 'insp-11-a', text: { fr: 'Abdelkrim Ghallab', ar: 'عبد الكريم غلاب' } },
          { id: 'insp-11-b', text: { fr: 'Ahmed Sefrioui', ar: 'أحمد الصفريوي' } },
          { id: 'insp-11-c', text: { fr: 'Mohamed Choukri', ar: 'محمد شكري' } },
          { id: 'insp-11-d', text: { fr: 'Driss Chraïbi', ar: 'إدريس الشرايبي' } },
          { id: 'insp-11-e', text: { fr: 'Tahar Ben Jelloun', ar: 'طاهر بن جلون' } },
        ],
        correctOptionId: 'insp-11-b',
        explanation: {
          fr: 'Ahmed Sefrioui (1915-2004) a publié « La Boîte à merveilles » en 1954, considérée comme l’une des œuvres fondatrices de la littérature marocaine d’expression française.',
          ar: 'أحمد الصفريوي (1915-2004) هو مؤلف رواية "صندوق العجائب" (1954) التي تعد من أبرز أعمال الأدب المغربي المكتوب بالفرنسية.',
        },
        source: 'Littérature marocaine d’expression française',
      },
      {
        id: 'insp-12',
        number: 12,
        text: {
          fr: 'La théorie de la séparation des pouvoirs (législatif, exécutif, judiciaire) a été théorisée par :',
          ar: 'نظريّة فصل السلط (التشريعية، التنفيذية، القضائية) صاغها الفيلسوف :',
        },
        options: [
          { id: 'insp-12-a', text: { fr: 'Jean-Jacques Rousseau', ar: 'جان جاك روسو' } },
          { id: 'insp-12-b', text: { fr: 'Montesquieu', ar: 'مونتسكيو' } },
          { id: 'insp-12-c', text: { fr: 'Voltaire', ar: 'فولتير' } },
          { id: 'insp-12-d', text: { fr: 'Machiavel', ar: 'ميكيافيلي' } },
          { id: 'insp-12-e', text: { fr: 'Thomas Hobbes', ar: 'توماس هوبز' } },
        ],
        correctOptionId: 'insp-12-b',
        explanation: {
          fr: 'Montesquieu a formalisé le principe de la séparation des pouvoirs dans son ouvrage majeur « De l’esprit des lois » publié en 1748.',
          ar: 'صاغ المفكر الفرنسي مونتسكيو مبدأ فصل السلطات في كتابه الشهير "روح القوانين" الصادر سنة 1748.',
        },
        source: 'Droit constitutionnel & Philosophie politique',
      },
      {
        id: 'insp-13',
        number: 13,
        text: {
          fr: 'Quel écrivain marocain a remporté le Prix Goncourt en 1987 pour son roman « La Nuit sacrée » ?',
          ar: 'من هو الكاتب المغربي الحائز على جائزة غونكور المرموقة سنة 1987 عن رواية "ليلة القدر" ؟',
        },
        options: [
          { id: 'insp-13-a', text: { fr: 'Mohamed Choukri', ar: 'محمد شكري' } },
          { id: 'insp-13-b', text: { fr: 'Driss Chraïbi', ar: 'إدريس الشرايبي' } },
          { id: 'insp-13-c', text: { fr: 'Tahar Ben Jelloun', ar: 'طاهر بن جلون' } },
          { id: 'insp-13-d', text: { fr: 'Ahmed Sefrioui', ar: 'أحمد الصفريوي' } },
          { id: 'insp-13-e', text: { fr: 'Abdellatif Laâbi', ar: 'عبد اللطيف اللعبي' } },
        ],
        correctOptionId: 'insp-13-c',
        explanation: {
          fr: 'Tahar Ben Jelloun est le premier écrivain maghrébin à avoir obtenu le prestigieux Prix Goncourt en 1987 pour « La Nuit sacrée ».',
          ar: 'طاهر بن جلون هو أول كاتب مغاربي وعربي يحصل على جائزة غونكور الفرنسية للرواية سنة 1987 عن عمله "ليلة القدر".',
        },
        source: 'Prix littéraires & Culture francophone',
      },
      {
        id: 'insp-14',
        number: 14,
        text: {
          fr: 'Conformément à la Constitution marocaine de 2011, par qui est nommé le Chef du Gouvernement ?',
          ar: 'بمقتضى دستور المملكة لعام 2011، من يُعين رئيس الحكومة ؟',
        },
        options: [
          { id: 'insp-14-a', text: { fr: 'Le Parlement réuni en congrès', ar: 'البرلمان بمجلسيه' } },
          { id: 'insp-14-b', text: { fr: 'Sa Majesté le Roi', ar: 'جلالة الملك' } },
          { id: 'insp-14-c', text: { fr: 'Le Président de la Cour de Cassation', ar: 'رئيس محكمة النقض' } },
          { id: 'insp-14-d', text: { fr: 'Le Conseil des Ministres', ar: 'المجلس الوزاري' } },
          { id: 'insp-14-e', text: { fr: 'La Cour Constitutionnelle', ar: 'المحكمة الدستورية' } },
        ],
        correctOptionId: 'insp-14-b',
        explanation: {
          fr: 'L’article 47 de la Constitution stipule que Sa Majesté le Roi nomme le Chef du Gouvernement au sein du parti politique arrivé en tête des élections des membres de la Chambre des Représentants.',
          ar: 'ينص الفصل 47 من الدستور على أن الملك يعين رئيس الحكومة من الحزب السياسي الذي تصدر انتخابات أعضاء مجلس النواب.',
        },
        source: 'Constitution du Maroc de 2011 (Article 47)',
      },
      {
        id: 'insp-15',
        number: 15,
        text: {
          fr: 'Le décathlon est une épreuve combinée officielle appartenant à la discipline de :',
          ar: 'تعتبر مسابقة "العشاري" (Décathlon) منافسة رياضية مركبة تابعة لرياضة :',
        },
        options: [
          { id: 'insp-15-a', text: { fr: 'Le patinage artistique', ar: 'التزلج الفني' } },
          { id: 'insp-15-b', text: { fr: 'L’athlétisme', ar: 'ألعاب القوى' } },
          { id: 'insp-15-c', text: { fr: 'Le ski alpin', ar: 'التزلج على الجليد' } },
          { id: 'insp-15-d', text: { fr: 'La natation synchronisée', ar: 'السباحة' } },
          { id: 'insp-15-e', text: { fr: 'L’équitation', ar: 'الفروسية' } },
        ],
        correctOptionId: 'insp-15-b',
        explanation: {
          fr: 'Le décathlon est une discipline de l’athlétisme composée de dix épreuves consécutives disputées sur deux journées.',
          ar: 'العشاري هو مسابقة أولمبية في ألعاب القوى تتألف من عشر مسابقات متنوعة (جري، رمي، قفز) تجرى على مدى يومين.',
        },
        source: 'Jeux Olympiques & Athlétisme mondial',
      },
    ],
  },

  // =========================================================================
  // 3. ANNALES OFFICIELLES DGSN : OFFICIERS DE POLICE & SÉCURITÉ (ضباط الشرطة)
  // =========================================================================
  {
    id: 'qcm-dgsn-officiers-police-droit',
    slug: 'annales-qcm-officiers-de-police-securite-dgsn',
    title: {
      fr: 'Concours Officiers de Police & Sécurité (DGSN)',
      ar: 'مباراة ضباط الشرطة وضباط الأمن - التنظيم القضائي والقانون',
    },
    description: {
      fr: 'QCM d’entraînement en droit pénal, procédure pénale, organisation judiciaire marocaine et institutions constitutionnelles, sur les thèmes du concours des Officiers de Police. Ce n’est pas un sujet officiel.',
      ar: 'أسئلة تدريبية في المسطرة الجنائية والتنظيم القضائي والمؤسسات الدستورية حول مواضيع مباراة ضباط الشرطة. ليست اختباراً رسمياً.',
    },
    category: 'droit_public',
    durationMinutes: 30,
    difficulty: 'avance',
    questionsCount: 15,
    isDemo: false,
    questions: [
      {
        id: 'off-1',
        number: 1,
        text: {
          fr: 'Dans le système juridique marocain, comment sont fixés et déterminés les délais légaux de recours et de procédure ?',
          ar: 'تُحدد الآجال القانونية للتقاضي والإجراءات بموجب :',
        },
        options: [
          { id: 'off-1-a', text: { fr: 'Un jugement judiciaire', ar: 'حكم قضائي' } },
          { id: 'off-1-b', text: { fr: 'Une décision judiciaire', ar: 'قرار قضائي' } },
          { id: 'off-1-c', text: { fr: 'Une décision administrative', ar: 'قرار إداري' } },
          { id: 'off-1-d', text: { fr: 'Une ordonnance sur requête', ar: 'أمر قضائي' } },
          { id: 'off-1-e', text: { fr: 'Un texte dans la loi', ar: 'نص في القانون' } },
        ],
        correctOptionId: 'off-1-e',
        explanation: {
          fr: 'En droit marocain, les délais légaux sont fixés expressément par des dispositions législatives (Code de procédure civile ou pénale) et sont d’ordre public.',
          ar: 'تحدد الآجال القانونية في التشريع المغربي بمقتضى نصوص تشريعية صريحة في قانون المسطرة المدنية أو الجنائية وتعتبر من النظام العام.',
        },
        source: 'Code de procédure civile & Théorie générale du droit',
      },
      {
        id: 'off-2',
        number: 2,
        text: {
          fr: 'Dans l’organisation judiciaire marocaine, où sont créées et instituées les sections de la justice de proximité ?',
          ar: 'يُحدث قضاء القرب بدوائر نفوذ :',
        },
        options: [
          { id: 'off-2-a', text: { fr: 'Des Tribunaux Administratifs', ar: 'المحاكم الإدارية' } },
          { id: 'off-2-b', text: { fr: 'Des Tribunaux de Première Instance (TPI)', ar: 'المحاكم الابتدائية' } },
          { id: 'off-2-c', text: { fr: 'Des Tribunaux de Commerce', ar: 'المحاكم التجارية' } },
          { id: 'off-2-d', text: { fr: 'Des Cours d’Appel', ar: 'محاكم الاستئناف' } },
          { id: 'off-2-e', text: { fr: 'De la Cour de Cassation', ar: 'محكمة النقض' } },
        ],
        correctOptionId: 'off-2-b',
        explanation: {
          fr: 'En vertu de la loi n° 42-10, des sections de juridictions de proximité sont instituées dans le ressort des tribunaux de première instance.',
          ar: 'بموجب القانون رقم 42.10 المتعلق بتنظيم قضاء القرب، تُحدث أقسام لقضاء القرب بدوائر نفوذ المحاكم الابتدائية والمراكز القضائية التابعة لها.',
        },
        source: 'Loi n° 42-10 portant organisation des juridictions de proximité au Maroc',
      },
      {
        id: 'off-3',
        number: 3,
        text: {
          fr: 'Qui représente le Ministère Public (Parquet Général) près la Cour de Cassation au Maroc ?',
          ar: 'يمثل النيابة العامة لدى محكمة النقض بالمغرب :',
        },
        options: [
          { id: 'off-3-a', text: { fr: 'Le Procureur Général du Roi assisté des Avocats Généraux', ar: 'الوكيل العام للملك يساعده المحامون العامون' } },
          { id: 'off-3-b', text: { fr: 'Le Procureur du Roi assisté de substituts ordinaires', ar: 'وكيل الملك يساعده نواب عاديون' } },
          { id: 'off-3-c', text: { fr: 'Le Ministre de la Justice assisté des secrétaires généraux', ar: 'وزير العدل' } },
          { id: 'off-3-d', text: { fr: 'Le Commissaire Royal', ar: 'المفوض الملكي' } },
          { id: 'off-3-e', text: { fr: 'Le Bâtonnier des avocats', ar: 'نقيب المحامين' } },
        ],
        correctOptionId: 'off-3-a',
        explanation: {
          fr: 'Le ministère public près la Cour de Cassation est représenté par le Procureur Général du Roi près ladite cour, assisté des Avocats Généraux.',
          ar: 'يمثل النيابة العامة لدى محكمة النقض الوكيل العام للملك لدى هذه المحكمة، ويساعده في مهامه المحامون العامون.',
        },
        source: 'Loi relative à l’organisation judiciaire du Royaume & Code de procédure pénale',
      },
      {
        id: 'off-4',
        number: 4,
        text: {
          fr: 'Conformément à l’article 54 de la Constitution marocaine de 2011, quelle haute autorité préside le Conseil Supérieur de Sécurité ?',
          ar: 'وفقاً للفصل 54 من الدستور، من يرأس المجلس الأعلى للأمن بالمملكة المغربية ؟',
        },
        options: [
          { id: 'off-4-a', text: { fr: 'Sa Majesté le Roi', ar: 'جلالة الملك' } },
          { id: 'off-4-b', text: { fr: 'Le Chef du Gouvernement', ar: 'رئيس الحكومة' } },
          { id: 'off-4-c', text: { fr: 'Le Directeur Général de la Sûreté Nationale (DGSN)', ar: 'المدير العام للأمن الوطني' } },
          { id: 'off-4-d', text: { fr: 'Le Ministre de l’Intérieur', ar: 'وزير الداخلية' } },
          { id: 'off-4-e', text: { fr: 'Le Ministre de la Justice', ar: 'وزير العدل' } },
        ],
        correctOptionId: 'off-4-a',
        explanation: {
          fr: 'L’article 54 de la Constitution dispose que le Conseil Supérieur de Sécurité, instance de concertation sur les stratégies de sécurité intérieure et extérieure, est présidé par Sa Majesté le Roi.',
          ar: 'ينص الفصل 54 من دستور 2011 على إحداث "المجلس الأعلى للأمن" كهيئة للتشاور بشأن استراتيجيات الأمن الداخلي والخارجي، ويرأسه الملك.',
        },
        source: 'Constitution du Maroc de 2011 (Article 54)',
      },
      {
        id: 'off-5',
        number: 5,
        text: {
          fr: 'Quelle institution exerce légalement le privilège exclusif de l’émission des billets de banque et des pièces de monnaie au Maroc ?',
          ar: 'يمارس امتياز إصدار الأوراق البنكية والقطع النقدية قانوناً في المملكة المغربية حصرياً :',
        },
        options: [
          { id: 'off-5-a', text: { fr: 'La Bourse de Casablanca', ar: 'بورصة القيم بالدار البيضاء' } },
          { id: 'off-5-b', text: { fr: 'Bank Al-Maghrib (Banque Centrale)', ar: 'بنك المغرب' } },
          { id: 'off-5-c', text: { fr: 'Barid Al-Maghrib', ar: 'بريد المغرب' } },
          { id: 'off-5-d', text: { fr: 'Le Ministère de l’Économie et des Finances', ar: 'وزارة الاقتصاد والمالية' } },
          { id: 'off-5-e', text: { fr: 'La Caisse de Dépôt et de Gestion (CDG)', ar: 'صندوق الإيداع والتدبير' } },
        ],
        correctOptionId: 'off-5-b',
        explanation: {
          fr: 'Bank Al-Maghrib est la banque centrale du Royaume du Maroc et détient le privilège exclusif de l’émission de la monnaie fiduciaire.',
          ar: 'بنك المغرب هو البنك المركزي للمملكة ويمارس قانوناً امتياز إصدار العملة الوطنية الورقية والمعدنية.',
        },
        source: 'Statut de Bank Al-Maghrib (Loi n° 76-03)',
      },
      {
        id: 'off-6',
        number: 6,
        text: {
          fr: 'Selon le Code de commerce marocain, la femme mariée a-t-elle le droit d’exercer le commerce sans autorisation de son époux ?',
          ar: 'وفقاً لمدونة التجارة المغربية، هل يحق للمرأة المتزوجة ممارسة التجارة دون إذن زوجها ؟',
        },
        options: [
          { id: 'off-6-a', text: { fr: 'Non, elle doit obtenir l’autorisation écrite de son époux', ar: 'لا، يشترط إذن زوجها كتابة' } },
          { id: 'off-6-b', text: { fr: 'Oui, elle peut exercer le commerce librement sans aucune autorisation de son époux', ar: 'نعم، يحق لها ممارسة التجارة دون أخذ الإذن من زوجها' } },
          { id: 'off-6-c', text: { fr: 'Uniquement après autorisation du président du tribunal de commerce', ar: 'بعد أخذ الإذن من رئيس المحكمة التجارية' } },
          { id: 'off-6-d', text: { fr: 'Uniquement si elle est mariée sous le régime de la séparation des biens', ar: 'فقط في حالة الفصل بين الأموال' } },
          { id: 'off-6-e', text: { fr: 'Non, elle nécessite l’accord du juge de la famille', ar: 'تشترط موافقة قاضي الأسرة' } },
        ],
        correctOptionId: 'off-6-b',
        explanation: {
          fr: 'L’article 17 du Code de commerce marocain dispose clairement que la femme mariée peut exercer le commerce sans autorisation de son mari.',
          ar: 'تنص المادة 17 من مدونة التجارة المغربية على أن للمرأة المتزوجة أن تمارس التجارة دون أن يتوقف ذلك على إذن من زوجها.',
        },
        source: 'Code de commerce marocain (Loi n° 15-95, Article 17)',
      },
      {
        id: 'off-7',
        number: 7,
        text: {
          fr: 'Selon le Code de la famille (Moudawana), quelle est la limite maximale légale des legs (testament) sans accord des héritiers ?',
          ar: 'وفقاً لمدونة الأسرة المغربية، ما هو الحد الأقصى للوصية الجائزة دون توقفها على إجازة الورثة ؟',
        },
        options: [
          { id: 'off-7-a', text: { fr: 'Le tiers (1/3) de la succession', ar: 'ثلث مال عاقده يلزم بموته' } },
          { id: 'off-7-b', text: { fr: 'Le quart (1/4) de la succession', ar: 'ربع مال عاقده يلزم بموته' } },
          { id: 'off-7-c', text: { fr: 'La moitié (1/2) de la succession', ar: 'نصف مال عاقده يلزم بموته' } },
          { id: 'off-7-d', text: { fr: 'Le huitième (1/8) de la succession', ar: 'ثمن مال عاقده يلزم بموته' } },
          { id: 'off-7-e', text: { fr: 'Les deux tiers (2/3) de la succession', ar: 'ثلثي مال عاقده يلزم بموته' } },
        ],
        correctOptionId: 'off-7-a',
        explanation: {
          fr: 'La Moudawana fixe le legs testamentaire dans la limite maximale du tiers de l’actif net successoral, au-delà duquel l’accord des héritiers est obligatoire.',
          ar: 'تنص أحكام مدونة الأسرة على أن الوصية تنفذ في حدود ثلث التركة دون حاجة لإجازة الورثة، وما زاد على الثلث يتوقف على إجازتهم.',
        },
        source: 'Code de la famille marocain (Articles 277 et suivants)',
      },
      {
        id: 'off-8',
        number: 8,
        text: {
          fr: 'En droit successoral marocain, quelle est la part légale d’héritage (Farida) de l’épouse en présence d’enfants descendants ?',
          ar: 'في المواريث، ما هو فرض الزوجة الشرعي عند وجود فرع وارث للزوج ؟',
        },
        options: [
          { id: 'off-8-a', text: { fr: 'Le quart (1/4)', ar: 'الربع' } },
          { id: 'off-8-b', text: { fr: 'La moitié (1/2)', ar: 'النصف' } },
          { id: 'off-8-c', text: { fr: 'Le huitième (1/8)', ar: 'الثمن' } },
          { id: 'off-8-d', text: { fr: 'Les deux tiers (2/3)', ar: 'الثلثين' } },
          { id: 'off-8-e', text: { fr: 'Le sixième (1/6)', ar: 'السدس' } },
        ],
        correctOptionId: 'off-8-c',
        explanation: {
          fr: 'L’épouse hérite du huitième (1/8) en présence d’un descendant successoral (enfants), et du quart (1/4) en son absence.',
          ar: 'ترث الزوجة الثمن (1/8) عند وجود الفرع الوارث للزوج، وترث الربع (1/4) عند انعدامه.',
        },
        source: 'Code de la famille (Livre VI sur les Successions)',
      },
      {
        id: 'off-9',
        number: 9,
        text: {
          fr: 'Auprès de quelles juridictions marocaines la fonction de « Commissaire Royal de la loi et du droit » est-elle instituée ?',
          ar: 'يوجد المفوض الملكي للدفاع عن القانون والحق لدى :',
        },
        options: [
          { id: 'off-9-a', text: { fr: 'Des Tribunaux Militaires Permanents', ar: 'المحاكم العسكرية الدائمة' } },
          { id: 'off-9-b', text: { fr: 'Des Tribunaux de Commerce', ar: 'المحاكم التجارية' } },
          { id: 'off-9-c', text: { fr: 'Des Tribunaux de Première Instance', ar: 'المحاكم الابتدائية' } },
          { id: 'off-9-d', text: { fr: 'Des Tribunaux Administratifs et Cours d’Appel Administratives', ar: 'المحاكم الإدارية ومحاكم الاستئناف الإدارية' } },
          { id: 'off-9-e', text: { fr: 'Des sections de justice de la famille', ar: 'أقسام قضاء الأسرة' } },
        ],
        correctOptionId: 'off-9-d',
        explanation: {
          fr: 'La loi n° 41-90 instituant les tribunaux administratifs prévoit la présence d’un ou plusieurs Commissaires Royaux de la loi et du droit chargés d’exposer leurs conclusions en toute indépendance.',
          ar: 'يُعين بمقتضى القانون 41.90 مفوض ملكي للدفاع عن القانون والحق لدى المحاكم الإدارية يعرض آراءه ومستنتجاته القانونية باستقلال تام.',
        },
        source: 'Loi n° 41-90 instituant les tribunaux administratifs au Maroc',
      },
      {
        id: 'off-10',
        number: 10,
        text: {
          fr: 'Dans quelle ville se situe le siège central de l’Union Africaine (UA) ?',
          ar: 'أين يوجد المقر الرئيسي للاتحاد الإفريقي (UA) ؟',
        },
        options: [
          { id: 'off-10-a', text: { fr: 'Dakar (Sénégal)', ar: 'دكار' } },
          { id: 'off-10-b', text: { fr: 'Le Caire (Égypte)', ar: 'القاهرة' } },
          { id: 'off-10-c', text: { fr: 'Addis-Abeba (Éthiopie)', ar: 'أديس أبابا' } },
          { id: 'off-10-d', text: { fr: 'Nairobi (Kenya)', ar: 'نيروبي' } },
          { id: 'off-10-e', text: { fr: 'Abuja (Nigeria)', ar: 'أبوجا' } },
        ],
        correctOptionId: 'off-10-c',
        explanation: {
          fr: 'Le siège central de l’Union Africaine est établi à Addis-Abeba, capitale de l’Éthiopie.',
          ar: 'يقع المقر الدائم للاتحاد الإفريقي في العاصمة الإثيوبية أديس أبابا.',
        },
        source: 'Union Africaine & Relations internationales',
      },
      {
        id: 'off-11',
        number: 11,
        text: {
          fr: 'Quelle est la juridiction marocaine spécialisée compétente à l’échelle nationale pour statuer sur les infractions terroristes ?',
          ar: 'الجهة القضائية المختصة وطنياً بالنظر في الجرائم الإرهابية بالمغرب ابتدائياً واستئنافياً هي :',
        },
        options: [
          { id: 'off-11-a', text: { fr: 'La Cour d’Appel de Rabat (Annexe de Salé)', ar: 'محكمة الاستئناف بالرباط (ملحقة سلا)' } },
          { id: 'off-11-b', text: { fr: 'Le Tribunal de Première Instance de Casablanca', ar: 'المحكمة الابتدائية بالدار البيضاء' } },
          { id: 'off-11-c', text: { fr: 'Le Tribunal Militaire de Rabat', ar: 'المحكمة العسكرية بالرباط' } },
          { id: 'off-11-d', text: { fr: 'La Cour des Comptes', ar: 'محكمة النقض' } },
          { id: 'off-11-e', text: { fr: 'La Cour d’Appel de Tanger', ar: 'محكمة الاستئناف بطنجة' } },
        ],
        correctOptionId: 'off-11-a',
        explanation: {
          fr: 'En vertu de l’article 706-1 du Code de procédure pénale, la Cour d’Appel de Rabat (chambre criminelle chargée des affaires de terrorisme à Salé) a compétence exclusive sur tout le territoire pour les infractions terroristes.',
          ar: 'تختص محكمة الاستئناف بالرباط (غرفة الجنايات المكلفة بقضايا الإرهاب بسلا) بالنظر في قضايا الجرائم الإرهابية على الصعيد الوطني.',
        },
        source: 'Code de procédure pénale marocain (Loi n° 03-03 relative à la lutte contre le terrorisme)',
      },
      {
        id: 'off-12',
        number: 12,
        text: {
          fr: 'Selon le Code de procédure pénale, à quelle fréquence les officiers de police judiciaire (OPJ) doivent-ils adresser au Ministère Public l’état nominatif des personnes placées en garde à vue ?',
          ar: 'بموجب قانون المسطرة الجنائية، توجه لائحة الأشخاص الموضوعين تحت الحراسة النظرية إلى النيابة العامة بصفة :',
        },
        options: [
          { id: 'off-12-a', text: { fr: 'Quotidienne (chaque jour)', ar: 'يومياً' } },
          { id: 'off-12-b', text: { fr: 'Hebdomadaire (chaque semaine)', ar: 'أسبوعياً' } },
          { id: 'off-12-c', text: { fr: 'Mensuelle', ar: 'شهرياً' } },
          { id: 'off-12-d', text: { fr: 'Uniquement après expiration du délai légal', ar: 'فقط بعد انصرام مدة الحراسة' } },
          { id: 'off-12-e', text: { fr: 'Après déferrement devant le juge', ar: 'بعد تقديم المشتبه فيه' } },
        ],
        correctOptionId: 'off-12-a',
        explanation: {
          fr: 'L’article 66 du Code de procédure pénale impose à l’officier de police judiciaire de transmettre quotidiennement au Parquet compétent la liste des personnes gardées à vue.',
          ar: 'تنص المادة 66 من قانون المسطرة الجنائية على أن ضابط الشرطة القضائية يمسك سجلاً خاصاً ويوجه يومياً إلى النيابة العامة لائحة بأسماء الأشخاص الموضوعين تحت الحراسة النظرية.',
        },
        source: 'Code de procédure pénale marocain (Article 66)',
      },
      {
        id: 'off-13',
        number: 13,
        text: {
          fr: 'Qui est l’économiste et philosophe écossais, père du libéralisme classique et auteur de « Recherches sur la nature et les causes de la richesse des nations » (1776) ?',
          ar: 'من هو المفكر الاقتصادي صاحب مؤلف "ثروة الأمم" (The Wealth of Nations) لسنة 1776 ؟',
        },
        options: [
          { id: 'off-13-a', text: { fr: 'John Maynard Keynes', ar: 'جون ماينارد كينز' } },
          { id: 'off-13-b', text: { fr: 'Karl Marx', ar: 'كارل ماركس' } },
          { id: 'off-13-c', text: { fr: 'Milton Friedman', ar: 'ميلتون فريدمان' } },
          { id: 'off-13-d', text: { fr: 'Adam Smith', ar: 'آدم سميث' } },
          { id: 'off-13-e', text: { fr: 'David Ricardo', ar: 'ديفيد ريكاردو' } },
        ],
        correctOptionId: 'off-13-d',
        explanation: {
          fr: 'Adam Smith est le pionnier de l’économie politique classique, célèbre pour sa théorie de la « main invisible » et son ouvrage fondateur « La Richesse des nations ».',
          ar: 'آدم سميث (1723-1790) هو فيلسوف ورائد الاقتصاد السياسي الكلاسيكي وصاحب كتاب "ثروة الأمم".',
        },
        source: 'Histoire de la pensée économique',
      },
      {
        id: 'off-14',
        number: 14,
        text: {
          fr: 'Dans quelle ville marocaine est implanté le mégacomplexe de centrale thermo-solaire « Noor » ?',
          ar: 'بأي مدينة مغربية يقع مركب الطاقة الشمسية العالمي "نور" (Noor) ؟',
        },
        options: [
          { id: 'off-14-a', text: { fr: 'Laâyoune', ar: 'العيون' } },
          { id: 'off-14-b', text: { fr: 'Ouarzazate', ar: 'ورزازات' } },
          { id: 'off-14-c', text: { fr: 'Tanger', ar: 'طنجة' } },
          { id: 'off-14-d', text: { fr: 'Errachidia', ar: 'الرشيدية' } },
          { id: 'off-14-e', text: { fr: 'Figuig', ar: 'فكيك' } },
        ],
        correctOptionId: 'off-14-b',
        explanation: {
          fr: 'Le complexe thermo-solaire Noor Ouarzazate est l’un des plus grands parcs solaires à concentration du monde, développé par MASEN.',
          ar: 'يقع مركب "نور ورزازات" للطاقة الشمسية بإقليم ورزازات، وهو أحد أضخم مجمعات الطاقة الشمسية الحرارية في العالم.',
        },
        source: 'Agence Marocaine pour l’Énergie Durable (MASEN)',
      },
      {
        id: 'off-15',
        number: 15,
        text: {
          fr: 'Quel tribunal est compétent en première instance pour les litiges opposant les administrés à l’État ou aux collectivités territoriales au Maroc ?',
          ar: 'ما هي المحكمة المختصة نوعياً بالنظر في دعاوى إلغاء القرارات الإدارية ومنازعات المسؤولية الإدارية ؟',
        },
        options: [
          { id: 'off-15-a', text: { fr: 'Le Tribunal de Commerce', ar: 'المحكمة التجارية' } },
          { id: 'off-15-b', text: { fr: 'Le Tribunal Administratif', ar: 'المحكمة الإدارية' } },
          { id: 'off-15-c', text: { fr: 'Le Tribunal de Première Instance', ar: 'المحكمة الابتدائية' } },
          { id: 'off-15-d', text: { fr: 'Le Conseil National des Droits de l’Homme', ar: 'المجلس الوطني لحقوق الإنسان' } },
          { id: 'off-15-e', text: { fr: 'La Cour des Comptes', ar: 'المجلس الأعلى للحسابات' } },
        ],
        correctOptionId: 'off-15-b',
        explanation: {
          fr: 'Les Tribunaux Administratifs institués par la loi n° 41-90 sont seuls compétents pour juger des recours en annulation pour excès de pouvoir et du contentieux de la responsabilité administrative.',
          ar: 'تختص المحاكم الإدارية بالنظر في طلبات إلغاء قرارات السلطات الإدارية بسبب التجاوز في استعمال السلطة وفي النزاعات المتعلقة بالعقود الإدارية ودعاوى التعويض.',
        },
        source: 'Loi n° 41-90 instituant les tribunaux administratifs au Maroc',
      },
    ],
  },

  // =========================================================================
  // 4. ANNALES OFFICIELLES DGSN : INSPECTEURS DE POLICE (مفتشو الشرطة - العربية)
  // =========================================================================
  {
    id: 'qcm-dgsn-inspecteurs-arabe',
    slug: 'annales-qcm-inspecteurs-de-police-dgsn-arabe',
    title: {
      fr: 'Concours Inspecteurs de Police - Épreuve en Arabe & DGSN',
      ar: 'مباراة مفتشي الشرطة - الثقافة العامة واللغة العربية وقوانين الأمن',
    },
    description: {
      fr: 'QCM d’entraînement en langue arabe sur les thèmes du concours des Inspecteurs de Police (Droit administratif, Histoire du Maroc, Institutions policières). Ce n’est pas un sujet officiel.',
      ar: 'أسئلة تدريبية باللغة العربية حول مواضيع مباراة مفتشي الشرطة (القانون الإداري، تاريخ المغرب، مؤسسات الشرطة). ليست اختباراً رسمياً.',
    },
    category: 'arabe',
    durationMinutes: 30,
    difficulty: 'moyen',
    questionsCount: 15,
    isDemo: false,
    questions: [
      {
        id: 'insp-ar-1',
        number: 1,
        text: {
          fr: 'Quelle est la plus haute juridiction financière au Maroc chargée du contrôle des finances publiques ?',
          ar: 'ما هي أعلى هيئة قضائية مكلفة بمراقبة المالية العمومية في المغرب ؟',
        },
        options: [
          { id: 'insp-ar-1-a', text: { fr: 'L’Inspection Générale des Finances (IGF)', ar: 'المفتشية العامة للمالية' } },
          { id: 'insp-ar-1-b', text: { fr: 'La Cour des Comptes', ar: 'المجلس الأعلى للحسابات' } },
          { id: 'insp-ar-1-c', text: { fr: 'La Cour de Cassation', ar: 'محكمة النقض' } },
          { id: 'insp-ar-1-d', text: { fr: 'La Trésorerie Générale du Royaume', ar: 'الخزينة العامة للمملكة' } },
          { id: 'insp-ar-1-e', text: { fr: 'Le Conseil Économique et Social', ar: 'المجلس الاقتصادي والاجتماعي' } },
        ],
        correctOptionId: 'insp-ar-1-b',
        explanation: {
          fr: 'Selon l’article 147 de la Constitution, la Cour des Comptes est l’institution supérieure de contrôle des finances publiques du Royaume.',
          ar: 'وفقاً للفصل 147 من الدستور، يعتبر المجلس الأعلى للحسابات الهيئة العليا لمراقبة المالية العمومية بالمملكة.',
        },
        source: 'Constitution du Maroc de 2011 (Article 147)',
      },
      {
        id: 'insp-ar-2',
        number: 2,
        text: {
          fr: 'Dans quelle région administrative se situe la ville de Guelmim au Maroc ?',
          ar: 'إلى أي جهة إدارية تنتمي مدينة كلميم وفق التقسيم الجهوي الحالي ؟',
        },
        options: [
          { id: 'insp-ar-2-a', text: { fr: 'Souss-Massa', ar: 'جهة سوس ماسة' } },
          { id: 'insp-ar-2-b', text: { fr: 'Guelmim-Oued Noun', ar: 'جهة كلميم واد نون' } },
          { id: 'insp-ar-2-c', text: { fr: 'Laâyoune-Sakia El Hamra', ar: 'جهة العيون الساقية الحمراء' } },
          { id: 'insp-ar-2-d', text: { fr: 'Drâa-Tafilalet', ar: 'جهة درعة تافيلالت' } },
          { id: 'insp-ar-2-e', text: { fr: 'Dakhla-Oued Ed-Dahab', ar: 'جهة الداخلة وادي الذهب' } },
        ],
        correctOptionId: 'insp-ar-2-b',
        explanation: {
          fr: 'La ville de Guelmim est le chef-lieu administratif de la région de Guelmim-Oued Noun (découpage des 12 régions de 2015).',
          ar: 'مدينة كلميم هي عاصمة جهة كلميم واد نون وفق التقسيم الجهوي الإداري للمملكة (12 جهة).',
        },
        source: 'Découpage territorial du Royaume du Maroc (Décret n° 2-15-40)',
      },
      {
        id: 'insp-ar-3',
        number: 3,
        text: {
          fr: 'Quel traité historique signé en 1912 a instauré le régime du Protectorat au Maroc ?',
          ar: 'ما هي المعاهدة التاريخية التي فرضت نظام الحماية على المغرب سنة 1912 ؟',
        },
        options: [
          { id: 'insp-ar-3-a', text: { fr: 'Le Traité d’Algésiras (1906)', ar: 'معاهدة الجزيرة الخضراء (1906)' } },
          { id: 'insp-ar-3-b', text: { fr: 'Le Traité de Fès (30 mars 1912)', ar: 'معاهدة فاس (30 مارس 1912)' } },
          { id: 'insp-ar-3-c', text: { fr: 'Le Traité de Lalla Maghnia (1845)', ar: 'معاهدة للا مغنية (1845)' } },
          { id: 'insp-ar-3-d', text: { fr: 'La Convention de Madrid (1880)', ar: 'مؤتمر مدريد (1880)' } },
          { id: 'insp-ar-3-e', text: { fr: 'Le Traité de Tanger (1844)', ar: 'معاهدة طنجة (1844)' } },
        ],
        correctOptionId: 'insp-ar-3-b',
        explanation: {
          fr: 'Le traité de Fès, signé le 30 mars 1912 entre le Sultan Moulay Abdelhafid et la France, a établi le protectorat français au Maroc.',
          ar: 'وُقعت معاهدة فاس في 30 مارس 1912 بين السلطان مولاي عبد الحفيظ والجمهورية الفرنسية لفرض الحماية.',
        },
        source: 'Histoire contemporaine du Maroc',
      },
      {
        id: 'insp-ar-4',
        number: 4,
        text: {
          fr: 'En quelle année a eu lieu la glorieuse Marche Verte (المسيرة الخضراء) ?',
          ar: 'في أي سنة انطلقت المسيرة الخضراء المظفرة لاسترجاع الأقاليم الصحراوية ؟',
        },
        options: [
          { id: 'insp-ar-4-a', text: { fr: '1973', ar: '1973' } },
          { id: 'insp-ar-4-b', text: { fr: '1974', ar: '1974' } },
          { id: 'insp-ar-4-c', text: { fr: '1975', ar: '1975' } },
          { id: 'insp-ar-4-d', text: { fr: '1976', ar: '1976' } },
          { id: 'insp-ar-4-e', text: { fr: '1979', ar: '1979' } },
        ],
        correctOptionId: 'insp-ar-4-c',
        explanation: {
          fr: 'La Marche Verte a été déclenchée le 6 novembre 1975 à l’appel de Feu Sa Majesté le Roi Hassan II, mobilisant 350 000 volontaires marocains.',
          ar: 'انطلقت المسيرة الخضراء السلمية المظفرة في 6 نونبر 1975 بمشاركة 350 ألف متطوع مغربي بدعوة من الملك الراحل الحسن الثاني.',
        },
        source: 'Événements historiques majeurs du Royaume du Maroc',
      },
      {
        id: 'insp-ar-5',
        number: 5,
        text: {
          fr: 'Quel organe consultatif constitutionnel marocain est chargé de la protection et de la promotion des droits de l’Homme ?',
          ar: 'ما هي المؤسسة الدستورية الوطنية المكلفة بحماية حقوق الإنسان والنهوض بها في المغرب ؟',
        },
        options: [
          { id: 'insp-ar-5-a', text: { fr: 'Le Conseil National des Droits de l’Homme (CNDH)', ar: 'المجلس الوطني لحقوق الإنسان (CNDH)' } },
          { id: 'insp-ar-5-b', text: { fr: 'L’Institution du Médiateur du Royaume', ar: 'مؤسسة وسيط المملكة' } },
          { id: 'insp-ar-5-c', text: { fr: 'Le Conseil Économique, Social et Environnemental (CESE)', ar: 'المجلس الاقتصادي والاجتماعي والبيئي' } },
          { id: 'insp-ar-5-d', text: { fr: 'L’Instance Centrale de Prévention de la Corruption', ar: 'الهيئة المركزية للوقاية من الرشوة' } },
          { id: 'insp-ar-5-e', text: { fr: 'Le Conseil Supérieur de la Magistrature', ar: 'المجلس الأعلى للقضاء' } },
        ],
        correctOptionId: 'insp-ar-5-a',
        explanation: {
          fr: 'Le CNDH (article 161 de la Constitution) est l’institution nationale indépendante dédiée à la protection et la promotion des droits de l’Homme.',
          ar: 'المجلس الوطني لحقوق الإنسان (الفصل 161 من الدستور) هو المؤسسة الوطنية المستقلة المكلفة بحماية حقوق الإنسان والحريات.',
        },
        source: 'Constitution du Maroc de 2011 (Article 161)',
      },
      {
        id: 'insp-ar-6',
        number: 6,
        text: {
          fr: 'Quel fleuve marocain est le plus long cours d’eau du Royaume avec plus de 550 km de parcours ?',
          ar: 'ما هو أطول نهر دائم الجريان في المملكة المغربية ؟',
        },
        options: [
          { id: 'insp-ar-6-a', text: { fr: 'Oued Sebou', ar: 'وادي سبو' } },
          { id: 'insp-ar-6-b', text: { fr: 'Oued Oum Er-Rbia', ar: 'وادي أم الربيع' } },
          { id: 'insp-ar-6-c', text: { fr: 'Oued Moulouya', ar: 'وادي ملوية' } },
          { id: 'insp-ar-6-d', text: { fr: 'Oued Bouregreg', ar: 'وادي أبي رقراق' } },
          { id: 'insp-ar-6-e', text: { fr: 'Oued Drâa', ar: 'وادي درعة' } },
        ],
        correctOptionId: 'insp-ar-6-e',
        explanation: {
          fr: 'L’Oued Drâa est le plus long cours d’eau du Maroc (environ 1 100 km). Parmi les fleuves permanents, Oum Er-Rbia mesure 550 km et Moulouya 520 km.',
          ar: 'وادي درعة هو أطول واد في المغرب (حوالي 1100 كلم)، بينما يعد وادي أم الربيع أطول نهر ذي جريان مائي دائم (550 كلم).',
        },
        source: 'Géographie hydrographique du Maroc',
      },
      {
        id: 'insp-ar-7',
        number: 7,
        text: {
          fr: 'Quelle est la durée légale de la garde à vue en droit commun au Maroc avant prolongation ?',
          ar: 'ما هي المدة القانونية للحراسة النظرية في الجرائم العادية قبل التمديد ؟',
        },
        options: [
          { id: 'insp-ar-7-a', text: { fr: '24 heures', ar: '24 ساعة' } },
          { id: 'insp-ar-7-b', text: { fr: '48 heures', ar: '48 ساعة' } },
          { id: 'insp-ar-7-c', text: { fr: '72 heures', ar: '72 ساعة' } },
          { id: 'insp-ar-7-d', text: { fr: '96 heures', ar: '96 ساعة' } },
          { id: 'insp-ar-7-e', text: { fr: '12 heures', ar: '12 ساعة' } },
        ],
        correctOptionId: 'insp-ar-7-b',
        explanation: {
          fr: 'En vertu de l’article 66 du Code de procédure pénale, la durée de la garde à vue en droit commun est de 48 heures, renouvelable une seule fois pour 24 heures sur autorisation écrite du Parquet.',
          ar: 'تنص المادة 66 من قانون المسطرة الجنائية على أن مدة الحراسة النظرية في قضايا الحق العام هي 48 ساعة ويمكن تمديدها لـ 24 ساعة بإذن من النيابة العامة.',
        },
        source: 'Code de procédure pénale marocain (Article 66)',
      },
      {
        id: 'insp-ar-8',
        number: 8,
        text: {
          fr: 'Qui est chargé de diriger les enquêtes préliminaires et d’exercer l’action publique au niveau du Tribunal de Première Instance ?',
          ar: 'من هو المكلف بممارسة الدعوى العمومية وتوجيه أبحاث الشرطة القضائية بالمحكمة الابتدائية ؟',
        },
        options: [
          { id: 'insp-ar-8-a', text: { fr: 'Le Président du Tribunal', ar: 'رئيس المحكمة الابتدائية' } },
          { id: 'insp-ar-8-b', text: { fr: 'Le Procureur du Roi', ar: 'وكيل الملك' } },
          { id: 'insp-ar-8-c', text: { fr: 'Le Juge d’instruction', ar: 'قاضي التحقيق' } },
          { id: 'insp-ar-8-d', text: { fr: 'Le Procureur Général du Roi', ar: 'الوكيل العام للملك' } },
          { id: 'insp-ar-8-e', text: { fr: 'Le Juge de proximité', ar: 'قاضي القرب' } },
        ],
        correctOptionId: 'insp-ar-8-b',
        explanation: {
          fr: 'Le Procureur du Roi près le Tribunal de Première Instance représente le Ministère Public et exerce l’action publique au niveau des délits et contraventions.',
          ar: 'يتولى وكيل الملك لدى المحكمة الابتدائية شخصياً أو بواسطة نوابه ممارسة الدعوى العمومية والإشراف على أعمال ضباط الشرطة القضائية بدائرته.',
        },
        source: 'Code de procédure pénale marocain (Articles 39 et suivants)',
      },
      {
        id: 'insp-ar-9',
        number: 9,
        text: {
          fr: 'Dans le système constitutionnel marocain, le pouvoir réglementaire autonome et d’exécution des lois appartient à :',
          ar: 'يمارس السلطة التنظيمية المستقلة والتنفيذية بمقتضى الدستور :',
        },
        options: [
          { id: 'insp-ar-9-a', text: { fr: 'Le Chef du Gouvernement', ar: 'رئيس الحكومة' } },
          { id: 'insp-ar-9-b', text: { fr: 'Le Président du Parlement', ar: 'رئيس مجلس النواب' } },
          { id: 'insp-ar-9-c', text: { fr: 'Le Président de la Cour Constitutionnelle', ar: 'رئيس المحكمة الدستورية' } },
          { id: 'insp-ar-9-d', text: { fr: 'Le Ministre de l’Intérieur', ar: 'وزير الداخلية' } },
          { id: 'insp-ar-9-e', text: { fr: 'Le Secrétaire Général du Gouvernement', ar: 'الأمين العام للحكومة' } },
        ],
        correctOptionId: 'insp-ar-9-a',
        explanation: {
          fr: 'Conformément à l’article 90 de la Constitution de 2011, le Chef du Gouvernement exerce le pouvoir réglementaire et signe les décrets.',
          ar: 'يمارس رئيس الحكومة السلطة التنظيمية ويوقع المراسيم التي يتخذها بمقتضى الفصل 90 من دستور 2011.',
        },
        source: 'Constitution du Maroc de 2011 (Article 90)',
      },
      {
        id: 'insp-ar-10',
        number: 10,
        text: {
          fr: 'Quelle est la signification de l’acronyme « BCIJ » au sein du pôle sécuritaire marocain ?',
          ar: 'ماذا يعني الاختصار الأمني الوطني (BCIJ) التابع للمديرية العامة لمراقبة التراب الوطني ؟',
        },
        options: [
          { id: 'insp-ar-10-a', text: { fr: 'Bureau Central d’Investigation Judiciaire', ar: 'المكتب المركزي للأبحاث القضائية' } },
          { id: 'insp-ar-10-b', text: { fr: 'Brigade Centrale d’Intervention et de Justice', ar: 'الفرقة المركزية للتدخل والعدالة' } },
          { id: 'insp-ar-10-c', text: { fr: 'Bureau de Contrôle des Infractions Juridiques', ar: 'مكتب مراقبة المخالفات القانونية' } },
          { id: 'insp-ar-10-d', text: { fr: 'Brigade Criminelle d’Investigation et de Juridiction', ar: 'فرقة التحقيقات الجنائية والقضائية' } },
          { id: 'insp-ar-10-e', text: { fr: 'Bureau Canin d’Intervention Judiciaire', ar: 'مكتب الكلاب البوليسية القضائية' } },
        ],
        correctOptionId: 'insp-ar-10-a',
        explanation: {
          fr: 'Le BCIJ (المكتب المركزي للأبحاث القضائية) a été créé en 2015 en tant que bras judiciaire de la DGST pour lutter contre le terrorisme et le grand banditisme.',
          ar: 'أُحدث المكتب المركزي للأبحاث القضائية (BCIJ) سنة 2015 كفرع قضائي للمديرية العامة لمراقبة التراب الوطني لمكافحة الإرهاب والجريمة المنظمة.',
        },
        source: 'Organisation et structures de la sécurité nationale au Maroc',
      },
      {
        id: 'insp-ar-11',
        number: 11,
        text: {
          fr: 'Quel est l’âge de la majorité civile légale au Maroc selon le Code de la famille (Moudawana) ?',
          ar: 'ما هو سن الرشد القانوني المدني في المغرب حسب مدونة الأسرة وقانون الالتزامات والعقود ؟',
        },
        options: [
          { id: 'insp-ar-11-a', text: { fr: '16 ans grégoriens révolus', ar: '16 سنة شمسية كاملة' } },
          { id: 'insp-ar-11-b', text: { fr: '18 ans grégoriens révolus', ar: '18 سنة شمسية كاملة' } },
          { id: 'insp-ar-11-c', text: { fr: '20 ans grégoriens révolus', ar: '20 سنة شمسية كاملة' } },
          { id: 'insp-ar-11-d', text: { fr: '21 ans grégoriens révolus', ar: '21 سنة شمسية كاملة' } },
          { id: 'insp-ar-11-e', text: { fr: '17 ans grégoriens révolus', ar: '17 سنة شمسية كاملة' } },
        ],
        correctOptionId: 'insp-ar-11-b',
        explanation: {
          fr: 'L’article 209 du Code de la famille dispose : « L’âge de la majorité légale est fixé à 18 années grégoriennes révolues ».',
          ar: 'تنص المادة 209 من مدونة الأسرة على أن سن الرشد القانوني محدد في 18 سنة شمسية كاملة.',
        },
        source: 'Code de la famille marocain (Article 209)',
      },
      {
        id: 'insp-ar-12',
        number: 12,
        text: {
          fr: 'Quel célèbre explorateur marocain du XIVe siècle est l’auteur des récits de voyages « Tuhfat an-Nuzzar » ?',
          ar: 'من هو الرحالة المغربي العالمي الشهير صاحب كتاب "تحفة النظار في غرائب الأمصار وعجائب الأسفار" ؟',
        },
        options: [
          { id: 'insp-ar-12-a', text: { fr: 'Ibn Khaldoun', ar: 'ابن خلدون' } },
          { id: 'insp-ar-12-b', text: { fr: 'Ibn Battûta', ar: 'ابن بطوطة' } },
          { id: 'insp-ar-12-c', text: { fr: 'Ibn Rochd (Averroès)', ar: 'ابن رشد' } },
          { id: 'insp-ar-12-d', text: { fr: 'Ibn Toufail', ar: 'ابن طفيل' } },
          { id: 'insp-ar-12-e', text: { fr: 'Léon l’Africain', ar: 'الحسن الوزان (ليون الإفريقي)' } },
        ],
        correctOptionId: 'insp-ar-12-b',
        explanation: {
          fr: 'Ibn Battûta (1304-1368), né à Tanger, est l’un des plus grands explorateurs du monde musulman.',
          ar: 'ابن بطوطة (1304-1368) هو الرحالة الطنجي الشهير الذي جاب أرجاء العالم المعروف في العصر الوسيط.',
        },
        source: 'Histoire du patrimoine marocain & Géographie',
      },
      {
        id: 'insp-ar-13',
        number: 13,
        text: {
          fr: 'Quelle ville marocaine abrite le port « Tanger Med », l’un des plus grands hubs maritimes d’Afrique et de Méditerranée ?',
          ar: 'على أي مضيق مائي استراتيجي يطل ميناء "طنجة المتوسط" المغربي الرائد عالمياً ؟',
        },
        options: [
          { id: 'insp-ar-13-a', text: { fr: 'Le détroit de Gibraltar', ar: 'مضيق جبل طارق' } },
          { id: 'insp-ar-13-b', text: { fr: 'Le détroit d’Ormuz', ar: 'مضيق هرمز' } },
          { id: 'insp-ar-13-c', text: { fr: 'Le détroit du Bosphore', ar: 'مضيق البوسفور' } },
          { id: 'insp-ar-13-d', text: { fr: 'Le détroit de Malacca', ar: 'مضيق ملقا' } },
          { id: 'insp-ar-13-e', text: { fr: 'Le canal de Suez', ar: 'قناة السويس' } },
        ],
        correctOptionId: 'insp-ar-13-a',
        explanation: {
          fr: 'Le complexe portuaire Tanger Med est stratégiquement situé sur le détroit de Gibraltar, au carrefour des grandes routes maritimes mondiales.',
          ar: 'يقع مجمع طنجة المتوسط على مضيق جبل طارق، وهو الميناء الأول في إفريقيا والبحر الأبيض المتوسط في معالجة الحاويات.',
        },
        source: 'Économie maritime et logistique au Maroc',
      },
      {
        id: 'insp-ar-14',
        number: 14,
        text: {
          fr: 'Quelle institution royale marocaine est présidée par Sa Majesté le Roi et garantit l’indépendance de la justice ?',
          ar: 'ما هي المؤسسة الدستورية التي يرأسها جلالة الملك وتضمن استقلال السلطة القضائية بالمغرب ؟',
        },
        options: [
          { id: 'insp-ar-14-a', text: { fr: 'Le Conseil Supérieur du Pouvoir Judiciaire (CSPJ)', ar: 'المجلس الأعلى للسلطة القضائية' } },
          { id: 'insp-ar-14-b', text: { fr: 'Le Ministère de la Justice', ar: 'وزارة العدل' } },
          { id: 'insp-ar-14-c', text: { fr: 'La Cour de Cassation', ar: 'محكمة النقض' } },
          { id: 'insp-ar-14-d', text: { fr: 'La Cour Constitutionnelle', ar: 'المحكمة الدستورية' } },
          { id: 'insp-ar-14-e', text: { fr: 'Le Conseil de Régence', ar: 'مجلس الوصاية' } },
        ],
        correctOptionId: 'insp-ar-14-a',
        explanation: {
          fr: 'L’article 115 de la Constitution dispose que le Conseil Supérieur du Pouvoir Judiciaire (CSPJ) est présidé par Sa Majesté le Roi.',
          ar: 'ينص الفصل 115 من الدستور على أن المجلس الأعلى للسلطة القضائية يرأسه الملك وهو الضامن لاستقلال القضاء بالمملكة.',
        },
        source: 'Constitution du Maroc de 2011 (Article 115)',
      },
      {
        id: 'insp-ar-15',
        number: 15,
        text: {
          fr: 'Quel célèbre monument historique à Rabat a été érigé sous la dynastie Almohade au XIIe siècle ?',
          ar: 'ما هي الصومعة التاريخية الشهيرة بالرباط التي بناها الموحدون في عهد السلطان يعقوب المنصور ؟',
        },
        options: [
          { id: 'insp-ar-15-a', text: { fr: 'La Koutoubia', ar: 'صومعة الكتبية' } },
          { id: 'insp-ar-15-b', text: { fr: 'La Tour Hassan', ar: 'صومعة حسان' } },
          { id: 'insp-ar-15-c', text: { fr: 'La Giralda', ar: 'صومعة الخيرالدا' } },
          { id: 'insp-ar-15-d', text: { fr: 'Bab Mansour', ar: 'باب المنصور لعلج' } },
          { id: 'insp-ar-15-e', text: { fr: 'Bab Boujloud', ar: 'باب بوجلود' } },
        ],
        correctOptionId: 'insp-ar-15-b',
        explanation: {
          fr: 'La Tour Hassan à Rabat a été commencée en 1196 sous le règne du sultan almohade Yacoub El Mansour.',
          ar: 'صومعة حسان بالرباط معلمة موحدية شهيرة أسسها السلطان يعقوب المنصور الموحدي سنة 1196 م.',
        },
        source: 'Histoire de l’art et monuments islamiques du Maroc',
      },
    ],
  },

  // =========================================================================
  // 5. ANNALES OFFICIELLES DGSN : COMMISSAIRES DE POLICE (عمداء الشرطة)
  // =========================================================================
  {
    id: 'qcm-dgsn-commissaires-police',
    slug: 'annales-qcm-commissaires-de-police-dgsn',
    title: {
      fr: 'Concours Commissaires de Police - Droit Public & Sciences Criminelles (DGSN)',
      ar: 'مباراة عمداء الشرطة - القانون العام والعلوم الجنائية والأمنية',
    },
    description: {
      fr: 'QCM d’entraînement de haut niveau sur les thèmes du concours des Commissaires de Police (Droit pénal spécial, Procédure pénale, Droit constitutionnel). Ce n’est pas un sujet officiel.',
      ar: 'أسئلة المستوى العالي لمباراة عمداء الشرطة (القانون الجنائي الخاص، المسطرة الجنائية، الحريات العامة والتنظيم الأمني الدولي).',
    },
    category: 'droit_public',
    durationMinutes: 35,
    difficulty: 'avance',
    questionsCount: 15,
    isDemo: false,
    questions: [
      {
        id: 'com-1',
        number: 1,
        text: {
          fr: 'En droit pénal marocain, quelle est la qualification juridique d’une infraction punie d’une peine privative de liberté supérieure à 5 ans ?',
          ar: 'ما هو التكييف القانوني للجريمة المعاقب عليها بعقوبة سالبة للحرية تفوق 5 سنوات في القانون الجنائي المغربي ؟',
        },
        options: [
          { id: 'com-1-a', text: { fr: 'Une contravention', ar: 'مخالفة' } },
          { id: 'com-1-b', text: { fr: 'Un délit de police', ar: 'جنحة ضبطية' } },
          { id: 'com-1-c', text: { fr: 'Un délit correctionnel', ar: 'جنحة تأديبية' } },
          { id: 'com-1-d', text: { fr: 'Un crime (الجناية)', ar: 'جناية' } },
          { id: 'com-1-e', text: { fr: 'Une simple faute administrative', ar: 'خطأ إداري' } },
        ],
        correctOptionId: 'com-1-d',
        explanation: {
          fr: 'Conformément à l’article 16 du Code pénal, les peines criminelles principales comprennent la réclusion pour une durée supérieure à 5 ans (et jusqu’à 30 ans ou perpétuité) ainsi que la peine de mort.',
          ar: 'تنص المادة 16 من مجموعة القانون الجنائي على أن العقوبات الجنائية الأصلية هي الإعدام، السجن المؤبد، أو السجن المؤقت من 5 سنوات إلى 30 سنة.',
        },
        source: 'Code pénal marocain (Article 16)',
      },
      {
        id: 'com-2',
        number: 2,
        text: {
          fr: 'Selon le Code de procédure pénale marocain, qui préside la Chambre des Mises en Accusation (غرفة المشورة / غرفة المشورة الاستئنافية) ?',
          ar: 'من يترأس الغرفة الجنحية لدى محكمة الاستئناف المكلفة بمراقبة أعمال قضاة التحقيق وضباط الشرطة القضائية ؟',
        },
        options: [
          { id: 'com-2-a', text: { fr: 'Le Premier Président de la Cour d’Appel ou son délégataire', ar: 'الرئيس الأول لمحكمة الاستئناف أو من ينوب عنه' } },
          { id: 'com-2-b', text: { fr: 'Le Procureur Général du Roi', ar: 'الوكيل العام للملك' } },
          { id: 'com-2-c', text: { fr: 'Le Doyen des juges d’instruction', ar: 'عميد قضاة التحقيق' } },
          { id: 'com-2-d', text: { fr: 'Le Bâtonnier de l’Ordre des avocats', ar: 'نقيب هيئة المحامين' } },
          { id: 'com-2-e', text: { fr: 'Le Ministre de la Justice', ar: 'وزير العدل' } },
        ],
        correctOptionId: 'com-2-a',
        explanation: {
          fr: 'La Chambre des Mises en Accusation (غرفة الجنايات / الغرفة الجنحية بمحكمة الاستئناف) est présidée par le Premier Président de la Cour d’Appel ou un conseiller désigné.',
          ar: 'يرأس الغرفة الجنحية بمحكمة الاستئناف الرئيس الأول لمحكمة الاستئناف أو مستشار ينوب عنه وفق المادة 231 من قانون المسطرة الجنائية.',
        },
        source: 'Code de procédure pénale marocain (Article 231)',
      },
      {
        id: 'com-3',
        number: 3,
        text: {
          fr: 'Quel principe fondamental du droit pénal interdit de punir un acte qui n’était pas prévu par la loi au moment de sa commission ?',
          ar: 'ما هو المبدأ الجنائي الدستوري الذي يقضي بأن « لا جريمة ولا عقوبة إلا بنص » ؟',
        },
        options: [
          { id: 'com-3-a', text: { fr: 'Le principe du contradictoire', ar: 'مبدأ الوجاهية' } },
          { id: 'com-3-b', text: { fr: 'Le principe de la légalité criminelle (Nullum crimen, nulla poena sine lege)', ar: 'مبدأ شرعية الجرائم والعقوبات' } },
          { id: 'com-3-c', text: { fr: 'Le principe de la rétroactivité des peines plus sévères', ar: 'مبدأ الأثر الفوري للقوانين الأشد' } },
          { id: 'com-3-d', text: { fr: 'Le principe de l’opportunité des poursuites', ar: 'مبدأ ملاءمة المتابعة' } },
          { id: 'com-3-e', text: { fr: 'Le principe de la collégialité', ar: 'مبدأ القضاء الجماعي' } },
        ],
        correctOptionId: 'com-3-b',
        explanation: {
          fr: 'L’article 3 du Code pénal marocain et l’article 23 de la Constitution consacrent le principe universel de la légalité criminelle.',
          ar: 'ينص الفصل 3 من القانون الجنائي والفصل 23 من الدستور على مبدأ الشرعية الجنائية: « لا يسوغ مؤاخذة أحد على فعل لا يعد جريمة بنص القانون ».',
        },
        source: 'Code pénal marocain (Article 3) & Constitution de 2011',
      },
      {
        id: 'com-4',
        number: 4,
        text: {
          fr: 'Selon le Dahir n° 1-19-111 instituant le statut particulier du personnel de la DGSN, à quelle haute autorité est rattachée la DGSN ?',
          ar: 'تتبع المديرية العامة للأمن الوطني (DGSN) إدارياً ومؤسساتياً لـ :',
        },
        options: [
          { id: 'com-4-a', text: { fr: 'Ministère de la Justice', ar: 'وزارة العدل' } },
          { id: 'com-4-b', text: { fr: 'Ministère de l’Intérieur', ar: 'وزارة الداخلية' } },
          { id: 'com-4-c', text: { fr: 'Ministère de la Défense Nationale', ar: 'إدارة الدفاع الوطني' } },
          { id: 'com-4-d', text: { fr: 'Secrétariat Général du Gouvernement', ar: 'الأمانة العامة للحكومة' } },
          { id: 'com-4-e', text: { fr: 'Ministère des Affaires Étrangères', ar: 'وزارة الشؤون الخارجية' } },
        ],
        correctOptionId: 'com-4-b',
        explanation: {
          fr: 'La Direction Générale de la Sûreté Nationale (DGSN) est un établissement public à compétence nationale rattaché au Ministère de l’Intérieur.',
          ar: 'المديرية العامة للأمن الوطني تابعة إدارياً لوزارة الداخلية وتتمتع بوضع تنظيمي وميزانياتي خاص بموجب ظهير النظام الأساسي لموظفي الأمن الوطني.',
        },
        source: 'Statut du personnel de la Sûreté Nationale (Dahir n° 1-19-111)',
      },
      {
        id: 'com-5',
        number: 5,
        text: {
          fr: 'Dans le cadre de l’instruction criminelle préparatoire, le mandat de dépôt délivré par le juge d’instruction a pour effet :',
          ar: 'ما هو الأثر القانوني لـ "الأمر بالإيداع في السجن" (Mandat de dépôt) الصادر عن قاضي التحقيق ؟',
        },
        options: [
          { id: 'com-5-a', text: { fr: 'Une simple convocation de l’inculpé à l’audience', ar: 'مجرد استدعاء المتهم للجلسة' } },
          { id: 'com-5-b', text: { fr: 'L’incarcération immédiate du prévenu dans un établissement pénitentiaire', ar: 'إيداع المتهم في السجن فوراً واعتقاله احتياطياً' } },
          { id: 'com-5-c', text: { fr: 'Le retrait du passeport et l’interdiction de quitter le territoire', ar: 'سحب جواز السفر فقط' } },
          { id: 'com-5-d', text: { fr: 'La mise sous caution financière uniquement', ar: 'أداء كفالة مالية' } },
          { id: 'com-5-e', text: { fr: 'La perquisition du domicile', ar: 'تفتيش المنزل' } },
        ],
        correctOptionId: 'com-5-b',
        explanation: {
          fr: 'Le mandat de dépôt est l’ordre donné par le juge d’instruction au chef d’établissement pénitentiaire de recevoir et de détenir l’inculpé en détention préventive.',
          ar: 'الأمر بالإيداع في السجن هو أمر يوجهه قاضي التحقيق إلى رئيس المؤسسة السجنية لكي يتسلم المتهم ويعتقله احتياطياً طبقاً للمادة 142 من ق.م.ج.',
        },
        source: 'Code de procédure pénale marocain (Article 142)',
      },
      {
        id: 'com-6',
        number: 6,
        text: {
          fr: 'Quelle est la peine minimale de réclusion criminelle à temps prévue par le Code pénal marocain ?',
          ar: 'ما هو الحد الأدنى لعقوبة السجن الجنائي المؤقت في التشريع الجنائي المغربي ؟',
        },
        options: [
          { id: 'com-6-a', text: { fr: '2 ans', ar: 'سنتان' } },
          { id: 'com-6-b', text: { fr: '3 ans', ar: '3 سنوات' } },
          { id: 'com-6-c', text: { fr: '5 ans', ar: '5 سنوات' } },
          { id: 'com-6-d', text: { fr: '10 ans', ar: '10 سنوات' } },
          { id: 'com-6-e', text: { fr: '1 an', ar: 'سنة واحدة' } },
        ],
        correctOptionId: 'com-6-c',
        explanation: {
          fr: 'L’article 16 du Code pénal fixe la durée du séjour en prison pour la réclusion criminelle temporaire entre 5 ans et 30 ans.',
          ar: 'تتراوح مدة عقوبة السجن المؤقت في الجنايات من 5 سنوات إلى 30 سنة وفق الفصل 16 من القانون الجنائي.',
        },
        source: 'Code pénal marocain (Article 16)',
      },
      {
        id: 'com-7',
        number: 7,
        text: {
          fr: 'En matière de lutte contre le blanchiment de capitaux au Maroc, quelle autorité administrative spécialisée traite les déclarations de soupçon ?',
          ar: 'ما هي الهيئة الوطنية المكلفة بمعالجة التصاريح بالاشتباه ومكافحة غسل الأموال بالمغرب ؟',
        },
        options: [
          { id: 'com-7-a', text: { fr: 'L’Autorité Nationale du Renseignement Financier (ANRF)', ar: 'الهيئة الوطنية للمعلومات المالية (ANRF)' } },
          { id: 'com-7-b', text: { fr: 'Le Conseil de la Concurrence', ar: 'مجلس المنافسة' } },
          { id: 'com-7-c', text: { fr: 'L’Administration des Douanes et Impôts Indirects', ar: 'إدارة الجمارك والضرائب غير المباشرة' } },
          { id: 'com-7-d', text: { fr: 'La Direction Générale des Impôts', ar: 'المديرية العامة للضرائب' } },
          { id: 'com-7-e', text: { fr: 'La Trésorerie Principale', ar: 'الخزينة الرئيسية' } },
        ],
        correctOptionId: 'com-7-a',
        explanation: {
          fr: 'L’ANRF (anciennement UTFR) est la cellule de renseignement financier nationale chargée de recueillir et traiter les déclarations de soupçon de blanchiment et de financement du terrorisme.',
          ar: 'الهيئة الوطنية للمعلومات المالية (ANRF) المحدثة بموجب القانون 43.05 هي وحدة معالجة المعلومات المالية التابعة لرئاسة الحكومة.',
        },
        source: 'Loi n° 43-05 relative à la lutte contre le blanchiment de capitaux au Maroc',
      },
      {
        id: 'com-8',
        number: 8,
        text: {
          fr: 'Qui exerce le contrôle administratif et la notation des officiers de police judiciaire (OPJ) selon le Code de procédure pénale ?',
          ar: 'من يمارس قانوناً مراقبة وتأديب ضباط الشرطة القضائية بمحكمة الاستئناف ؟',
        },
        options: [
          { id: 'com-8-a', text: { fr: 'La Chambre Correctionnelle du TPI', ar: 'الغرفة الجنحية بالمحكمة الابتدائية' } },
          { id: 'com-8-b', text: { fr: 'La Chambre des Mises en Accusation (الغرفة الجنحية بمحكمة الاستئناف)', ar: 'الغرفة الجنحية بمحكمة الاستئناف' } },
          { id: 'com-8-c', text: { fr: 'Le Conseil de discipline de la préfecture', ar: 'مجلس الانضباط الإداري' } },
          { id: 'com-8-d', text: { fr: 'Le Bâtonnier', ar: 'نقيب المحامين' } },
          { id: 'com-8-e', text: { fr: 'Le Gouverneur de la préfecture', ar: 'عامل العمالة أو الإقليم' } },
        ],
        correctOptionId: 'com-8-b',
        explanation: {
          fr: 'L’article 29 et les articles 231 et suivants du CPP attribuent à la Chambre des Mises en Accusation de la Cour d’Appel le pouvoir de contrôler, sanctionner et suspendre les OPJ pour fautes commises dans l’exercice de leurs fonctions de police judiciaire.',
          ar: 'تختص الغرفة الجنحية بمحكمة الاستئناف بمقتضى المادتين 29 و 231 من ق.م.ج بمراقبة أعمال ضباط الشرطة القضائية وإصدار العقوبات التأديبية في حقهم.',
        },
        source: 'Code de procédure pénale marocain (Articles 29 à 35 et 231)',
      },
      {
        id: 'com-9',
        number: 9,
        text: {
          fr: 'En droit pénal international, où siège la Cour Pénale Internationale (CPI) compétente pour les crimes contre l’humanité ?',
          ar: 'أين يقع مقر المحكمة الجنائية الدولية (CPI) الدائمة ؟',
        },
        options: [
          { id: 'com-9-a', text: { fr: 'Genève (Suisse)', ar: 'جنيف' } },
          { id: 'com-9-b', text: { fr: 'La Haye (Pays-Bas)', ar: 'لاهاي (هولندا)' } },
          { id: 'com-9-c', text: { fr: 'Strasbourg (France)', ar: 'ستراسبورغ' } },
          { id: 'com-9-d', text: { fr: 'New York (États-Unis)', ar: 'نيويورك' } },
          { id: 'com-9-e', text: { fr: 'Vienne (Autriche)', ar: 'فيينا' } },
        ],
        correctOptionId: 'com-9-b',
        explanation: {
          fr: 'La Cour Pénale Internationale, régie par le Statut de Rome de 1998, a son siège officiel à La Haye aux Pays-Bas.',
          ar: 'يقع المقر الدائم للمحكمة الجنائية الدولية المنشأة بموجب نظام روما الأساسي في مدينة لاهاي بهولندا.',
        },
        source: 'Droit international pénal & Statut de Rome',
      },
      {
        id: 'com-10',
        number: 10,
        text: {
          fr: 'Au Maroc, quel organe présidé par le Roi est consulté obligatoirement avant toute déclaration de l’état d’exception (Fasl 59) ?',
          ar: 'ما هي الهيئات التي يجب على جلالة الملك استشارتها قبل إعلان حالة الاستثناء وفق الفصل 59 من الدستور ؟',
        },
        options: [
          { id: 'com-10-a', text: { fr: 'Le Chef du Gouvernement, les Présidents des deux Chambres et le Président de la Cour Constitutionnelle', ar: 'رئيس الحكومة ورئيس مجلس النواب ورئيس مجلس المستشارين ورئيس المحكمة الدستورية' } },
          { id: 'com-10-b', text: { fr: 'Le Conseil National des Droits de l’Homme uniquement', ar: 'المجلس الوطني لحقوق الإنسان فقط' } },
          { id: 'com-10-c', text: { fr: 'Le Conseil Économique et Social', ar: 'المجلس الاقتصادي والاجتماعي' } },
          { id: 'com-10-d', text: { fr: 'Le Ministre de l’Intérieur et le Ministre de la Défense', ar: 'وزير الداخلية وإدارة الدفاع الوطني' } },
          { id: 'com-10-e', text: { fr: 'Le Conseil Supérieur de la Magistrature', ar: 'المجلس الأعلى للقضاء' } },
        ],
        correctOptionId: 'com-10-a',
        explanation: {
          fr: 'L’article 59 de la Constitution de 2011 impose la consultation préalable du Chef du Gouvernement, du Président de la Chambre des Représentants, du Président de la Chambre des Conseillers ainsi que du Président de la Cour Constitutionnelle avant la proclamation de l’état d’exception.',
          ar: 'ينص الفصل 59 من الدستور على استشارة رئيس الحكومة، ورئيس مجلس النواب، ورئيس مجلس المستشارين، ورئيس المحكمة الدستورية قبل إعلان حالة الاستثناء وتوجيه خطاب للأمة.',
        },
        source: 'Constitution du Royaume du Maroc de 2011 (Article 59)',
      },
      {
        id: 'com-11',
        number: 11,
        text: {
          fr: 'En droit pénal marocain, la complicité criminelle (المشاركة الجنائية) est punie :',
          ar: 'وفقاً للفصل 130 من القانون الجنائي المغربي، يعاقب المشارك في الجناية أو الجنحة بـ :',
        },
        options: [
          { id: 'com-11-a', text: { fr: 'De la moitié de la peine de l’auteur principal', ar: 'بنصف عقوبة الفاعل الأصلي' } },
          { id: 'com-11-b', text: { fr: 'De la même peine que celle applicable à l’auteur principal (sauf disposition spéciale)', ar: 'بالعقوبة المقررة قانوناً لتلك الجناية أو الجنحة كالفاعل الأصلي ما لم ينص القانون على خلاف ذلك' } },
          { id: 'com-11-c', text: { fr: 'D’une simple amende correctionnelle', ar: 'بغرامة مالية فقط' } },
          { id: 'com-11-d', text: { fr: 'D’une peine double', ar: 'بضعف العقوبة' } },
          { id: 'com-11-e', text: { fr: 'D’une dispense légale de peine', ar: 'بالإعفاء من العقوبة' } },
        ],
        correctOptionId: 'com-11-b',
        explanation: {
          fr: 'L’article 130 du Code pénal dispose : « Le complice d’un crime ou d’un délit est puni de la peine afférente à ce crime ou à ce délit, sauf si la loi en dispose autrement ».',
          ar: 'ينص الفصل 130 من القانون الجنائي على أن المشارك في جناية أو جنحة يعاقب بالعقوبة المقررة قانوناً لهذه الجريمة كالفاعل الأصلي ما لم ينص القانون على خلاف ذلك.',
        },
        source: 'Code pénal marocain (Article 130)',
      },
      {
        id: 'com-12',
        number: 12,
        text: {
          fr: 'Quelle est la condition fondamentale de validité d’une perquisition domiciliaire de nuit (entre 21h et 6h) en droit commun marocain ?',
          ar: 'ما هو الشرط القانوني لإجراء تفتيش المنازل ليلاً في قضايا الحق العام بالمغرب وفق المسطرة الجنائية ؟',
        },
        options: [
          { id: 'com-12-a', text: { fr: 'Elle est interdite sauf réquisition expresse du chef de maison ou flagrant délit exceptionnel prévu par la loi', ar: 'يمنع التفتيش ليلاً إلا بطلب من صاحب المنزل أو في حالات استثنائية صريحة كالإرهاب والتلبس' } },
          { id: 'com-12-b', text: { fr: 'Elle est autorisée librement par simple décision verbale de l’OPJ', ar: 'يجوز لضابط الشرطة إجراؤها شفهياً في أي وقت' } },
          { id: 'com-12-c', text: { fr: 'Elle exige la présence de deux voisins mineurs', ar: 'تتطلب حضور قاصرين كشهود' } },
          { id: 'com-12-d', text: { fr: 'Elle est autorisée uniquement les jours fériés', ar: 'تجرى فقط في العطل' } },
          { id: 'com-12-e', text: { fr: 'Elle est autorisée par la Cour des Comptes', ar: 'تأذن بها محكمة النقض' } },
        ],
        correctOptionId: 'com-12-a',
        explanation: {
          fr: 'L’article 62 du Code de procédure pénale stipule que les perquisitions ne peuvent être commencées avant six heures du matin ni après vingt et une heures, sauf réclamations de l’intérieur ou infractions terroristes.',
          ar: 'تنص المادة 62 من قانون المسطرة الجنائية على أنه لا يمكن البدء في تفتيش المنازل قبل السادسة صباحاً وبعد التاسعة ليلاً إلا بطلب من رب المنزل أو في قضايا الإرهاب والجريمة المنظمة.',
        },
        source: 'Code de procédure pénale marocain (Article 62)',
      },
      {
        id: 'com-13',
        number: 13,
        text: {
          fr: 'Quel juriste et philosophe italien du XVIIIe siècle est l’auteur du traité révolutionnaire « Des délits et des peines » (1764) ?',
          ar: 'من هو الفيلسوف الإيطالي صاحب الكتاب الجنائي التأسيسي "في الجرائم والعقوبات" (1764) ؟',
        },
        options: [
          { id: 'com-13-a', text: { fr: 'Cesare Beccaria', ar: 'تشيزاري بيكاريا' } },
          { id: 'com-13-b', text: { fr: 'Cesare Lombroso', ar: 'تشيزاري لومبروزو' } },
          { id: 'com-13-c', text: { fr: 'Raffaele Garofalo', ar: 'رافائيل غاروفالو' } },
          { id: 'com-13-d', text: { fr: 'Enrico Ferri', ar: 'إنريكو فيري' } },
          { id: 'com-13-e', text: { fr: 'Jeremy Bentham', ar: 'جيريمي بنثام' } },
        ],
        correctOptionId: 'com-13-a',
        explanation: {
          fr: 'Cesare Beccaria (1738-1794) a posé les bases du droit pénal moderne et des principes de proportionnalité des peines dans « Des délits et des peines ».',
          ar: 'تشيزاري بيكاريا (1738-1794) هو الأب الروحي للمدرسة الجنائية الكلاسيكية وصاحب كتاب "في الجرائم والعقوبات".',
        },
        source: 'Histoire du droit pénal et des doctrines criminologiques',
      },
      {
        id: 'com-14',
        number: 14,
        text: {
          fr: 'Au Maroc, la DGST (Direction Générale de la Surveillance du Territoire) est principalement chargée de :',
          ar: 'تختص المديرية العامة لمراقبة التراب الوطني (DGST) أساساً بـ :',
        },
        options: [
          { id: 'com-14-a', text: { fr: 'La délivrance des cartes nationales d’identité uniquement', ar: 'إصدار بطائق التعريف الوطنية فقط' } },
          { id: 'com-14-b', text: { fr: 'La préservation de la sécurité nationale, la protection des intérêts vitaux du Royaume et la lutte antiterroriste', ar: 'صيانة وحماية أمن الدولة ومصالحها العليا ومكافحة الأنشطة التخريبية والإرهابية والتجسس' } },
          { id: 'com-14-c', text: { fr: 'La gestion des prisons', ar: 'تدبير المؤسسات السجنية' } },
          { id: 'com-14-d', text: { fr: 'La régulation du trafic maritime', ar: 'مراقبة الصيد البحري' } },
          { id: 'com-14-e', text: { fr: 'Le contrôle des prix dans les marchés', ar: 'مراقبة الأسعار في الأسواق' } },
        ],
        correctOptionId: 'com-14-b',
        explanation: {
          fr: 'La DGST est le service de renseignement intérieur du Royaume, voué à la défense de la sûreté de l’État, au contre-espionnage et à la neutralisation des menaces terroristes.',
          ar: 'المديرية العامة لمراقبة التراب الوطني (DGST) هي جهاز الاستخبارات والأمن الداخلي للمملكة المكلف بحماية أمن الوطن ووحدته الترابية من أي تهديد.',
        },
        source: 'Institutions et doctrine de sécurité nationale du Royaume du Maroc',
      },
      {
        id: 'com-15',
        number: 15,
        text: {
          fr: 'En droit pénal des affaires, que sanctionne le délit d’initié (جريمة استغلال معلومات ممتازة في البورصة) ?',
          ar: 'ماذا تعاقب جريمة "استغلال معلومات ممتازة" (Délit d’initié) في سوق البورصة والمال ؟',
        },
        options: [
          { id: 'com-13-a', text: { fr: 'Le non-paiement des impôts fonciers', ar: 'التهرب الضريبي العقاري' } },
          { id: 'com-13-b', text: { fr: 'L’utilisation d’informations confidentielles et privilégiées pour réaliser des opérations financières en bourse avant leur publication officielle', ar: 'استغلال معلومات سرية ومؤثرة لإجراء عمليات على أسهم وسندات مدرجة في البورصة لتحقيق أرباح قبل إعلانها للجمهور' } },
          { id: 'com-13-c', text: { fr: 'La contrefaçon de billets de banque', ar: 'تزييف النقود' } },
          { id: 'com-13-d', text: { fr: 'Le refus de vente d’un bien commercial', ar: 'الامتناع عن البيع' } },
          { id: 'com-13-e', text: { fr: 'L’émission de chèques certifiés', ar: 'إصدار شيكات بنكية' } },
        ],
        correctOptionId: 'com-13-b',
        explanation: {
          fr: 'Le délit d’initié sanctionne l’utilisation illicite d’informations privilégiées non encore rendues publiques afin de réaliser des gains boursiers déloyaux.',
          ar: 'يعاقب القانون رقم 43.12 المتعلق بالهيئة المغربية لسوق الرساميل استخدام المعلومات الداخلية الممتازة قبل إتاحتها للعموم لضمان نزاهة السوق المالية.',
        },
        source: 'Loi n° 43-12 relative à l’Autorité Marocaine du Marché des Capitaux (AMMC)',
      },
    ],
  },
];

