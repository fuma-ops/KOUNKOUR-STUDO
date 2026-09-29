import { QcmSet } from '../types';

export const mockQcmSets: QcmSet[] = [
  {
    id: 'qcm-droit-public-maroc-1',
    slug: 'droit-public-organisation-administrative-maroc',
    title: {
      fr: 'Droit Public & Organisation Administrative du Maroc',
      ar: 'القانون العام والتنظيم الإداري بالمغرب',
    },
    description: {
      fr: 'Testez vos connaissances sur la Constitution de 2011, la déconcentration, et la décentralisation territoriale au Maroc.',
      ar: 'اختبر معارفك حول دستور 2011، اللاتمركز الإداري، واللامركزية والجهوية المتقدمة بالمملكة المغربية.',
    },
    category: 'droit_public',
    durationMinutes: 15,
    difficulty: 'moyen',
    questionsCount: 4,
    isDemo: false,
    questions: [
      {
        id: 'q1',
        number: 1,
        text: {
          fr: 'Selon la Constitution marocaine de 2011, quel organe préside le Conseil des Ministres ?',
          ar: 'وفقاً لدستور المملكة المغربية لسنة 2011، من يرأس المجلس الوزاري ؟',
        },
        options: [
          { id: 'opt-a', text: { fr: 'Le Chef du Gouvernement', ar: 'رئيس الحكومة' } },
          { id: 'opt-b', text: { fr: 'Le Roi', ar: 'الملك' } },
          { id: 'opt-c', text: { fr: 'Le Président de la Chambre des Représentants', ar: 'رئيس مجلس النواب' } },
          { id: 'opt-d', text: { fr: 'Le Ministre de l’Intérieur', ar: 'وزير الداخلية' } },
        ],
        correctOptionId: 'opt-b',
        explanation: {
          fr: 'En vertu de l’article 48 de la Constitution marocaine de 2011, Sa Majesté le Roi préside le Conseil des Ministres.',
          ar: 'بمقتضى الفصل 48 من دستور 2011، يرأس الملك المجلس الوزاري.',
        },
        source: 'Constitution du Royaume du Maroc de 2011 (Article 48)',
      },
      {
        id: 'q2',
        number: 2,
        text: {
          fr: 'Combien de Régions administratives compte le Royaume du Maroc depuis le découpage de 2015 ?',
          ar: 'كم عدد الجهات الإدارية بالمملكة المغربية منذ التقسيم الجهوي لسنة 2015 ؟',
        },
        options: [
          { id: 'opt-a', text: { fr: '16 régions', ar: '16 جهة' } },
          { id: 'opt-b', text: { fr: '10 régions', ar: '10 جهات' } },
          { id: 'opt-c', text: { fr: '12 régions', ar: '12 جهة' } },
          { id: 'opt-d', text: { fr: '14 régions', ar: '14 جهة' } },
        ],
        correctOptionId: 'opt-c',
        explanation: {
          fr: 'Le décret n° 2-15-40 du 20 février 2015 a fixé à 12 le nombre des régions administratives du Maroc.',
          ar: 'حدد المرسوم رقم 2.15.40 الصادر بتاريخ 20 فبراير 2015 عدد جهات المملكة المغربية في 12 جهة.',
        },
        source: 'Décret n° 2-15-40 du 20 février 2015',
      },
      {
        id: 'q3',
        number: 3,
        text: {
          fr: 'Quelle est la durée normale du mandat des membres de la Chambre des Représentants au Maroc ?',
          ar: 'ما هي المدة القانونية لولاية أعضاء مجلس النواب بالمغرب ؟',
        },
        options: [
          { id: 'opt-a', text: { fr: '4 ans', ar: '4 سنوات' } },
          { id: 'opt-b', text: { fr: '5 ans', ar: '5 سنوات' } },
          { id: 'opt-c', text: { fr: '6 ans', ar: '6 سنوات' } },
          { id: 'opt-d', text: { fr: '3 ans', ar: '3 سنوات' } },
        ],
        correctOptionId: 'opt-b',
        explanation: {
          fr: 'L’article 62 de la Constitution dispose que les membres de la Chambre des Représentants sont élus pour cinq ans au suffrage universel direct.',
          ar: 'ينص الفصل 62 من الدستور على أن أعضاء مجلس النواب يُنتخبون للاقتراع العام المباشر لمدة خمس سنوات.',
        },
        source: 'Constitution du Maroc de 2011 (Article 62)',
      },
      {
        id: 'q4',
        number: 4,
        text: {
          fr: 'Dans le cadre de la déconcentration administrative au Maroc, qui représente l’autorité centrale au niveau de la Région ?',
          ar: 'في إطار اللاتمركز الإداري بالمغرب، من يمثل السلطة المركزية على صعيد الجهة ؟',
        },
        options: [
          { id: 'opt-a', text: { fr: 'Le Président du Conseil Régional', ar: 'رئيس مجلس الجهة' } },
          { id: 'opt-b', text: { fr: 'Le Wali de la Région', ar: 'والي الجهة' } },
          { id: 'opt-c', text: { fr: 'Le Doyen des magistrats', ar: 'عميد القضاة' } },
          { id: 'opt-d', text: { fr: 'Le Directeur Régional des Impôts', ar: 'المدير الجهوي للضرائب' } },
        ],
        correctOptionId: 'opt-b',
        explanation: {
          fr: 'Selon l’article 145 de la Constitution, le Wali de région représente le pouvoir central dans la région et coordonne les services déconcentrés.',
          ar: 'وفقاً للفصل 145 من الدستور، يمثل والي الجهة السلطة المركزية في الجهة وينسق أنشطة المصالح اللاممركزة.',
        },
        source: 'Constitution de 2011 (Art. 145)',
      },
    ],
  },
  {
    id: 'qcm-statut-fonction-publique',
    slug: 'statut-general-fonction-publique-maroc',
    title: {
      fr: 'Statut Général de la Fonction Publique (Dahir 1.58.008)',
      ar: 'النظام الأساسي العام للوظيفة العمومية (ظهير 1.58.008)',
    },
    description: {
      fr: 'Droits, devoirs, positions statutaires, avancement et régime disciplinaire des fonctionnaires au Maroc.',
      ar: 'حقوق وواجبات الموظف العمومي، الوضعيات الإدارية، الترقية والنظام التأديبي بالمغرب.',
    },
    category: 'fonction_publique',
    durationMinutes: 15,
    difficulty: 'moyen',
    questionsCount: 4,
    isDemo: false,
    questions: [
      {
        id: 'qfp1',
        number: 1,
        text: {
          fr: 'Quelle est la durée du congé annuel payé auquel a droit un fonctionnaire titulaire au Maroc ?',
          ar: 'ما هي مدة الرخصة السنوية المؤدى عنها التي يستحقها الموظف المرسم بالمغرب ؟',
        },
        options: [
          { id: 'opt-a', text: { fr: '22 jours ouvrables', ar: '22 يوم عمل' } },
          { id: 'opt-b', text: { fr: '30 jours ouvrables', ar: '30 يوم عمل' } },
          { id: 'opt-c', text: { fr: '45 jours', ar: '45 يوماً' } },
          { id: 'opt-d', text: { fr: '15 jours', ar: '15 يوماً' } },
        ],
        correctOptionId: 'opt-a',
        explanation: {
          fr: 'Selon l’article 40 du Dahir n° 1-58-008 portant statut général de la fonction publique, tout fonctionnaire en activité a droit à un congé annuel payé de 22 jours ouvrables après 11 mois de service accompli.',
          ar: 'بمقتضى الفصل 40 من النظام الأساسي العام للوظيفة العمومية، يستحق كل موظف في وضعية القيام بالوظيفة رخصة سنوية مدتها 22 يوم عمل بعد قضاء 11 شهراً من الخدمة الفعلية.',
        },
        source: 'Dahir n° 1-58-008 (Article 40)',
      },
      {
        id: 'qfp2',
        number: 2,
        text: {
          fr: 'Parmi les positions administratives suivantes, laquelle N’EST PAS une position statutaire du fonctionnaire ?',
          ar: 'من بين الوضعيات الإدارية التالية، ما هي الوضعية التي لا تعتبر وضعية نظامية قانونية للموظف ؟',
        },
        options: [
          { id: 'opt-a', text: { fr: 'L’Activité (القيام بالوظيفة)', ar: 'القيام بالوظيفة' } },
          { id: 'opt-b', text: { fr: 'Le Détachement (الإلحاق)', ar: 'الإلحاق' } },
          { id: 'opt-c', text: { fr: 'La Mise en Disponibilité (الاستيداع)', ar: 'الاستيداع' } },
          { id: 'opt-d', text: { fr: 'La Démission tacite (الاستقالة الضمنية)', ar: 'الاستقالة الضمنية' } },
        ],
        correctOptionId: 'opt-d',
        explanation: {
          fr: 'Selon l’article 37 du statut général, les trois seules positions statutaires sont : 1. L’activité, 2. Le détachement, 3. La mise en disponibilité. La démission est un mode de cessation définitive de fonctions.',
          ar: 'وفق الفصل 37، الوضعيات النظامية الثلاث هي: 1. القيام بالوظيفة، 2. الإلحاق، 3. الاستيداع. بينما الاستقالة تعتبر انقطاعاً نهائياً عن العمل وليست وضعية إدارية.',
        },
        source: 'Dahir n° 1-58-008 (Article 37)',
      },
      {
        id: 'qfp3',
        number: 3,
        text: {
          fr: 'Quel est l’âge légal de la limite d’âge d’accès à la fonction publique marocaine (règle générale) ?',
          ar: 'ما هو الحد الأقصى للسن القانوني لولوج الوظيفة العمومية بالمغرب (القاعدة العامة) ؟',
        },
        options: [
          { id: 'opt-a', text: { fr: '35 ans', ar: '35 سنة' } },
          { id: 'opt-b', text: { fr: '40 ans (pouvant être prolongé à 45 ans)', ar: '40 سنة (يمكن تمديده إلى 45 سنة)' } },
          { id: 'opt-c', text: { fr: '50 ans', ar: '50 سنة' } },
          { id: 'opt-d', text: { fr: '30 ans', ar: '30 سنة' } },
        ],
        correctOptionId: 'opt-b',
        explanation: {
          fr: 'Selon le décret fixant les conditions d’accès aux emplois publics, la limite d’âge générale est fixée à 40 ans au 1er janvier de l’année du concours, pouvant être portée à 45 ans pour certaines catégories.',
          ar: 'تحدد السن القانونية العامة لولوج الوظيفة العمومية في 40 سنة على الأكثر في فاتح يناير من سنة المباراة، مع إمكانية التمديد إلى 45 سنة لبعض الأطر والدرجات.',
        },
        source: 'Décret n° 2-02-349',
      },
      {
        id: 'qfp4',
        number: 4,
        text: {
          fr: 'Quelle est la sanction disciplinaire du 2ème degré parmi les suivantes ?',
          ar: 'ما هي العقوبة التأديبية المصنفة ضمن الدرجة الثانية من بين ما يلي ؟',
        },
        options: [
          { id: 'opt-a', text: { fr: 'L’Avertissement (الإنذار)', ar: 'الإنذار' } },
          { id: 'opt-b', text: { fr: 'Le Blâme (التوبيخ)', ar: 'التوبيخ' } },
          { id: 'opt-c', text: { fr: 'La Révocation sans suspension des droits à pension', ar: 'العزل من غير توقيف حق التقاعد' } },
          { id: 'opt-d', text: { fr: 'La Radiation du tableau d’avancement', ar: 'الحذف من لائحة الترقي' } },
        ],
        correctOptionId: 'opt-d',
        explanation: {
          fr: 'L’article 66 du Dahir n° 1-58-008 classe l’avertissement et le blâme dans le 1er degré, la radiation du tableau d’avancement et l’abaissement d’échelon dans le 2ème degré, et la rétrogradation/révocation dans les degrés supérieurs.',
          ar: 'يقسم الفصل 66 العقوبات التأديبية: الإنذار والتوبيخ (الدرجة الأولى)؛ الحذف من لائحة الترقي والانحدار في الرتبة (الدرجة الثانية)؛ الإقصاء المؤقت والعزل (الدرجات الموالية).',
        },
        source: 'Dahir n° 1-58-008 (Article 66)',
      },
    ],
  },
  {
    id: 'qcm-finances-publiques-maroc',
    slug: 'finances-publiques-loi-organique-finances',
    title: {
      fr: 'Finances Publiques & Loi Organique de Finances (LOF 130-13)',
      ar: 'المالية العامة والقانون التنظيمي للمالية (130.13)',
    },
    description: {
      fr: 'Préparation incontournable pour les concours du Ministère de l’Économie et des Finances, Douanes, DGI et Trésorerie.',
      ar: 'تحضير أساسي لمباريات وزارة المالية، الجمارك، المديرية العامة للضرائب والخزينة العامة للمملكة.',
    },
    category: 'finances_publiques',
    durationMinutes: 15,
    difficulty: 'moyen',
    questionsCount: 4,
    isDemo: false,
    questions: [
      {
        id: 'qfin1',
        number: 1,
        text: {
          fr: 'Quel est le principe budgétaire selon lequel toutes les recettes et toutes les dépenses de l’État sont inscrites dans un document unique ?',
          ar: 'ما هو المبدأ الميزانياتي الذي يقضي بإدراج كافة مداخيل ونفقات الدولة في وثيقة واحدة ؟',
        },
        options: [
          { id: 'opt-a', text: { fr: 'Le principe d’universalité', ar: 'مبدأ الشمولية' } },
          { id: 'opt-b', text: { fr: 'Le principe d’unité', ar: 'مبدأ الوحدة' } },
          { id: 'opt-c', text: { fr: 'Le principe d’annualité', ar: 'مبدأ السنوية' } },
          { id: 'opt-d', text: { fr: 'Le principe de spécialité', ar: 'مبدأ التخصيص' } },
        ],
        correctOptionId: 'opt-b',
        explanation: {
          fr: 'Le principe d’unité budgétaire exige que l’ensemble des recettes et des dépenses publiques figurent dans un seul et même document : la Loi de Finances de l’année.',
          ar: 'يقتضي مبدأ وحدة الميزانية جمع كافة المداخيل والنفقات التابعة للدولة في وثيقة ميزانياتية موحدة هي قانون المالية للسنة.',
        },
        source: 'Loi Organique n° 130-13 relative à la loi de finances',
      },
      {
        id: 'qfin2',
        number: 2,
        text: {
          fr: 'Avant quelle date limite le projet de loi de finances de l’année (PLF) doit-il être déposé au bureau de la Chambre des Représentants ?',
          ar: 'ما هو التاريخ الأقصى الذي يجب أن يُودع فيه مشروع قانون المالية بمكتب مجلس النواب ؟',
        },
        options: [
          { id: 'opt-a', text: { fr: 'Au plus tard le 20 octobre', ar: 'في أجل أقصاه 20 أكتوبر' } },
          { id: 'opt-b', text: { fr: 'Au plus tard le 1er novembre', ar: 'في أجل أقصاه 1 نونبر' } },
          { id: 'opt-c', text: { fr: 'Au plus tard le 31 décembre', ar: 'في أجل أقصاه 31 دجنبر' } },
          { id: 'opt-d', text: { fr: 'Au plus tard le 15 septembre', ar: 'في أجل أقصاه 15 شتنبر' } },
        ],
        correctOptionId: 'opt-a',
        explanation: {
          fr: 'En vertu de l’article 48 de la Loi Organique n° 130-13 relative à la loi de finances, le projet de loi de finances de l’année est déposé sur le bureau de la Chambre des Représentants au plus tard le 20 octobre de l’année qui précède l’année budgétaire.',
          ar: 'تنص المادة 48 من القانون التنظيمي للمالية رقم 130.13 على إيداع مشروع قانون المالية للسنة بمكتب مجلس النواب في أجل أقصاه 20 أكتوبر من السنة الجارية.',
        },
        source: 'Loi Organique n° 130-13 (Article 48)',
      },
      {
        id: 'qfin3',
        number: 3,
        text: {
          fr: 'Quelle haute juridiction financière est chargée d’assurer le contrôle supérieur de l’exécution des lois de finances au Maroc ?',
          ar: 'ما هي الهيئة القضائية العليا المكلفة بمراقبة تنفيذ قوانين المالية بالمغرب ؟',
        },
        options: [
          { id: 'opt-a', text: { fr: 'La Cour de Cassation', ar: 'محكمة النقض' } },
          { id: 'opt-b', text: { fr: 'La Cour des Comptes', ar: 'المجلس الأعلى للحسابات' } },
          { id: 'opt-c', text: { fr: 'Le Conseil Économique et Social', ar: 'المجلس الاقتصادي والاجتماعي' } },
          { id: 'opt-d', text: { fr: 'L’Inspection Générale des Finances', ar: 'المفتشية العامة للمالية' } },
        ],
        correctOptionId: 'opt-b',
        explanation: {
          fr: 'L’article 147 de la Constitution de 2011 dispose que la Cour des Comptes est l’institution supérieure de contrôle des finances publiques du Royaume et assure le contrôle de l’exécution des lois de finances.',
          ar: 'ينص الفصل 147 من الدستور على أن المجلس الأعلى للحسابات هو الهيئة العليا لمراقبة المالية العمومية بالمملكة ويتولى مراقبة تنفيذ قوانين المالية.',
        },
        source: 'Constitution du Maroc de 2011 (Article 147)',
      },
      {
        id: 'qfin4',
        number: 4,
        text: {
          fr: 'Que signifie le sigle SEGMA dans la nomenclature budgétaire marocaine ?',
          ar: 'ماذا يعني اختصار "SEGMA" في هيكلة ميزانية الدولة المغربية ؟',
        },
        options: [
          { id: 'opt-a', text: { fr: 'Services de l’État Gérés de Manière Autonome', ar: 'مرافق الدولة المسيرة بصورة مستقلة' } },
          { id: 'opt-b', text: { fr: 'Système d’Évaluation Globale des Marchés Administratifs', ar: 'نظام التقييم الشامل للصفقات الإدارية' } },
          { id: 'opt-c', text: { fr: 'Sociétés d’État à Gestion Ministérielle Approuvée', ar: 'شركات الدولة ذات التسيير الوزاري' } },
          { id: 'opt-d', text: { fr: 'Section Économique Générale du Ministère de l’Agriculture', ar: 'الشعبة الاقتصادية العامة لوزارة الفلاحة' } },
        ],
        correctOptionId: 'opt-a',
        explanation: {
          fr: 'Les SEGMA (Services de l’État Gérés de Manière Autonome) sont des services de l’État non dotés de la personnalité morale dont l’activité tend à produire des biens ou à rendre des services donnant lieu à rémunération.',
          ar: 'مرافق الدولة المسيرة بصورة مستقلة (SEGMA) هي مصالح تابعة للدولة لا تتمتع بالشخصية المعنوية وتهدف إلى إنتاج سلع أو تقديم خدمات بمقابل.',
        },
        source: 'Loi Organique n° 130-13 (Article 21)',
      },
    ],
  },
  {
    id: 'qcm-informatique-digital-maroc',
    slug: 'informatique-digitalisation-cybersecurite-maroc',
    title: {
      fr: 'Informatique & Digitalisation de l’Administration (Maroc Digital 2030)',
      ar: 'المعلوميات والتحول الرقمي بالإدارة المغربية',
    },
    description: {
      fr: 'Concepts clés pour les concours d’ingénieurs et techniciens en informatique (Réseaux, Bases de données, Cybersécurité, CNDP).',
      ar: 'مفاهيم أساسية لمباريات المهندسين والتقنيين في المعلوميات وتطوير البرمجيات والأمن السيبراني.',
    },
    category: 'informatique',
    durationMinutes: 15,
    difficulty: 'moyen',
    questionsCount: 4,
    isDemo: false,
    questions: [
      {
        id: 'qinf1',
        number: 1,
        text: {
          fr: 'Quelle loi marocaine régit la protection des personnes physiques à l’égard du traitement des données à caractère personnel ?',
          ar: 'ما هو القانون المغربي المنظم لحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي ؟',
        },
        options: [
          { id: 'opt-a', text: { fr: 'Loi n° 09-08 (CNDP)', ar: 'القانون رقم 09-08 (اللجنة الوطنية لمراقبة حماية المعطيات)' } },
          { id: 'opt-b', text: { fr: 'Loi n° 53-05', ar: 'القانون رقم 53-05' } },
          { id: 'opt-c', text: { fr: 'Loi n° 31-13', ar: 'القانون رقم 31-13' } },
          { id: 'opt-d', text: { fr: 'Loi n° 05-20', ar: 'القانون رقم 05-20' } },
        ],
        correctOptionId: 'opt-a',
        explanation: {
          fr: 'La loi n° 09-08 promulguée par le Dahir n° 1-09-15 du 18 février 2009 fixe le cadre légal de protection des données personnelles et a institué la CNDP.',
          ar: 'يحدد القانون رقم 09-08 الإطار القانوني لحماية المعطيات الشخصية بالمغرب وأحدث اللجنة الوطنية لمراقبة حماية المعطيات ذات الطابع الشخصي (CNDP).',
        },
        source: 'Loi n° 09-08 (Dahir n° 1-09-15)',
      },
      {
        id: 'qinf2',
        number: 2,
        text: {
          fr: 'En architecture de bases de données relationnelles, que garantissent les propriétés ACID ?',
          ar: 'في قواعد البيانات العلائقية، ماذا تضمن خصائص "ACID" ؟',
        },
        options: [
          { id: 'opt-a', text: { fr: 'La vitesse de compression des images', ar: 'سرعة ضغط الصور والملفات' } },
          { id: 'opt-b', text: { fr: 'La fiabilité et la cohérence des transactions', ar: 'موثوقية وتكامل المعاملات والعمليات' } },
          { id: 'opt-c', text: { fr: 'Le chiffrement matériel du disque dur', ar: 'التشفير المادي للقرص الصلب' } },
          { id: 'opt-d', text: { fr: 'La bande passante réseau', ar: 'سعة تدفق شبكة الاتصال' } },
        ],
        correctOptionId: 'opt-b',
        explanation: {
          fr: 'ACID signifie : Atomicité, Cohérence, Isolation et Durabilité. Ce sont les 4 critères garantissant la fiabilité des transactions dans un SGBDR.',
          ar: 'ترمز ACID إلى: الذرية (Atomicité)، الاتساق (Cohérence)، العزل (Isolation) والاستدامة (Durabilité)، وهي تضمن سلامة المعاملات في قواعد البيانات.',
        },
        source: 'Systèmes de gestion de bases de données relationnelles (SGBD)',
      },
      {
        id: 'qinf3',
        number: 3,
        text: {
          fr: 'Quelle autorité marocaine est chargée de la sécurité des systèmes d’information et de la réponse aux cyberattaques ?',
          ar: 'ما هي السلطة الوطنية المكلفة بأمن نظم المعلومات بالمغرب والتصدي للهجمات السيبرانية ؟',
        },
        options: [
          { id: 'opt-a', text: { fr: 'La DGSSI / maCERT', ar: 'المديرية العامة لأمن نظم المعلومات (DGSSI / maCERT)' } },
          { id: 'opt-b', text: { fr: 'L’ANRT', ar: 'الوكالة الوطنية لتقنين المواصلات' } },
          { id: 'opt-c', text: { fr: 'L’ADD (Agence du Développement Digital)', ar: 'وكالة التنمية الرقمية' } },
          { id: 'opt-d', text: { fr: 'La HACA', ar: 'الهيئة العليا للاتصال السمعي البصري' } },
        ],
        correctOptionId: 'opt-a',
        explanation: {
          fr: 'La Direction Générale de la Sécurité des Systèmes d’Information (DGSSI), relevant de l’Administration de la Défense Nationale, est l’autorité nationale en matière de cybersécurité.',
          ar: 'تتولى المديرية العامة لأمن نظم المعلومات (DGSSI) التابعة لإدارة الدفاع الوطني مهمة تأمين الفضاء السيبراني الوطني وتدبير مركز اليقظة والرصد (maCERT).',
        },
        source: 'Loi n° 05-20 relative à la cybersécurité',
      },
      {
        id: 'qinf4',
        number: 4,
        text: {
          fr: 'Quel port réseau standard est utilisé pour le protocole HTTPS sécurisé ?',
          ar: 'ما هو المنفذ الشبكي القياسي (Port) المستعمل لبروتوكول التصفح الآمن HTTPS ؟',
        },
        options: [
          { id: 'opt-a', text: { fr: 'Port 80', ar: 'المنفذ 80' } },
          { id: 'opt-b', text: { fr: 'Port 443', ar: 'المنفذ 443' } },
          { id: 'opt-c', text: { fr: 'Port 22', ar: 'المنفذ 22' } },
          { id: 'opt-d', text: { fr: 'Port 21', ar: 'المنفذ 21' } },
        ],
        correctOptionId: 'opt-b',
        explanation: {
          fr: 'Le port 443 est le port TCP par défaut utilisé pour les communications web sécurisées chiffrées par TLS/SSL (HTTPS). Le port 80 est utilisé pour le HTTP non sécurisé.',
          ar: 'المنفذ 443 هو المنفذ القياسي المخصص لاتصالات الويب المشفرة عبر HTTPS، في حين يستعمل المنفذ 80 لـ HTTP العادي والمنفذ 22 لـ SSH.',
        },
        source: 'Protocoles réseaux TCP/IP & Sécurité web',
      },
    ],
  },
  {
    id: 'qcm-psychotech-logique-2026',
    slug: 'psychotechnique-suites-logiques-aptitude',
    title: {
      fr: 'Tests Psychotechniques & Suites Logiques',
      ar: 'الاختبارات النفسية والتقنية والسلاسل المنطقية',
    },
    description: {
      fr: 'Entraînement indispensable pour les concours de techniciens, officiers de police et cadres bancaires/ONCF.',
      ar: 'تدريب أساسي لمباريات التقنيين والأمن الوطني والمؤسسات العمومية.',
    },
    category: 'psychotechnique',
    durationMinutes: 10,
    difficulty: 'accessible',
    questionsCount: 3,
    isDemo: false,
    questions: [
      {
        id: 'qp1',
        number: 1,
        text: {
          fr: 'Complétez la suite logique numérique : 3, 7, 15, 31, 63, ?',
          ar: 'أكمل المتتالية العددية المنطقية : 3 ، 7 ، 15 ، 31 ، 63 ، ؟',
        },
        options: [
          { id: 'opt-1', text: { fr: '94', ar: '94' } },
          { id: 'opt-2', text: { fr: '127', ar: '127' } },
          { id: 'opt-3', text: { fr: '126', ar: '126' } },
          { id: 'opt-4', text: { fr: '135', ar: '135' } },
        ],
        correctOptionId: 'opt-2',
        explanation: {
          fr: 'Chaque terme est obtenu par la règle (terme × 2) + 1 : (3×2)+1=7 ; (7×2)+1=15 ; (15×2)+1=31 ; (31×2)+1=63 ; (63×2)+1 = 127.',
          ar: 'كل حد ينتج عن ضرب الحد السابق في 2 ثم إضافة 1: (3×2)+1=7 ؛ (7×2)+1=15 ؛ (15×2)+1=31 ؛ (63×2)+1 = 127.',
        },
        source: 'Logique mathématique de concours',
      },
      {
        id: 'qp2',
        number: 2,
        text: {
          fr: 'Si 5 ouvriers réalisent un travail en 12 jours, combien de jours faudra-t-il à 10 ouvriers travaillant au même rythme pour réaliser le même travail ?',
          ar: 'إذا كان 5 عمال ينجزون عملاً في 12 يوماً، فكم يوماً يحتاجه 10 عمال بنفس الوتيرة لإنجاز نفس العمل ؟',
        },
        options: [
          { id: 'opt-1', text: { fr: '24 jours', ar: '24 يوماً' } },
          { id: 'opt-2', text: { fr: '6 jours', ar: '6 أيام' } },
          { id: 'opt-3', text: { fr: '10 jours', ar: '10 أيام' } },
          { id: 'opt-4', text: { fr: '8 jours', ar: '8 أيام' } },
        ],
        correctOptionId: 'opt-2',
        explanation: {
          fr: 'Il s’agit d’une proportionnalité inverse : le nombre total d’ouvrier-jours est de 5 × 12 = 60. Avec 10 ouvriers : 60 / 10 = 6 jours.',
          ar: 'تناسب عكسي: الحجم الإجمالي للعمل هو 5 × 12 = 60 يوم/عامل. مع 10 عمال: 60 ÷ 10 = 6 أيام.',
        },
        source: 'Raisonnement arithmétique',
      },
      {
        id: 'qp3',
        number: 3,
        text: {
          fr: 'Trouvez l’intrus parmi les mots suivants :',
          ar: 'عين الكلمة الدخيلة بين الكلمات التالية :',
        },
        options: [
          { id: 'opt-1', text: { fr: 'Rabat', ar: 'الرباط' } },
          { id: 'opt-2', text: { fr: 'Casablanca', ar: 'الدار البيضاء' } },
          { id: 'opt-3', text: { fr: 'Tanger', ar: 'طنجة' } },
          { id: 'opt-4', text: { fr: 'Toubkal', ar: 'توبقال' } },
        ],
        correctOptionId: 'opt-4',
        explanation: {
          fr: 'Rabat, Casablanca et Tanger sont des villes et chefs-lieux, alors que Toubkal est le plus haut sommet montagneux du Maroc (Haut Atlas).',
          ar: 'الرباط والدار البيضاء وطنجة مدن حضرية، بينما توبقال قمة جبلية (أعلى قمة في المغرب وشمال إفريقيا).',
        },
        source: 'Culture générale & Géographie',
      },
    ],
  },
];
