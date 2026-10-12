// Pages légales (politique de confidentialité, conditions d'utilisation).
// Un seul contenu, utilisé par l'application (LegalPage) et par le rendu serveur
// (api/_lib/seo.ts) pour que Google et la console Google OAuth lisent le texte.
//
// À COMPLÉTER PAR L'ÉDITEUR avant le lancement public (aucune valeur inventée) :
// identité de l'éditeur, adresse de contact et numéro de récépissé CNDP. Tant
// qu'une valeur est vide, la page affiche « à compléter » à cet endroit.
export const LEGAL_INFO = {
  editor: '', // ex. nom de la personne ou de la société qui édite KounKour
  contactEmail: '', // adresse pour exercer les droits (accès, rectification, suppression)
  cndpReceipt: '', // n° de récépissé de la déclaration auprès de la CNDP (loi 09-08)
  updatedAt: '2026-10-12',
};

export type LegalKind = 'privacy' | 'terms';
type Lang = 'fr' | 'ar';
export interface LegalSection {
  title: string;
  paragraphs: string[];
}
export interface LegalDoc {
  title: string;
  intro: string;
  sections: LegalSection[];
}

const pending = (lang: Lang) => (lang === 'ar' ? '(سيتم استكماله)' : '(à compléter)');
const v = (value: string, lang: Lang) => value || pending(lang);

export function legalDoc(kind: LegalKind, lang: Lang): LegalDoc {
  const editor = v(LEGAL_INFO.editor, lang);
  const contact = v(LEGAL_INFO.contactEmail, lang);
  const cndp = v(LEGAL_INFO.cndpReceipt, lang);
  const date = LEGAL_INFO.updatedAt.split('-').reverse().join('/');

  if (kind === 'privacy' && lang === 'fr') {
    return {
      title: 'Politique de confidentialité',
      intro: `Dernière mise à jour : ${date}. Cette page explique quelles données KounKour enregistre, pourquoi, et comment exercer vos droits prévus par la loi n° 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel.`,
      sections: [
        { title: 'Responsable du traitement', paragraphs: [`Éditeur : ${editor}. Contact : ${contact}.`, `Déclaration auprès de la Commission nationale de contrôle de la protection des données à caractère personnel (CNDP) : ${cndp}.`] },
        {
          title: 'Données enregistrées',
          paragraphs: [
            'Sans compte : aucune donnée personnelle n\'est enregistrée dans notre base (hors journaux techniques de l\'hébergeur, conservés pour la sécurité). Vos préférences (langue, profil saisi, favoris) restent dans le stockage local de votre navigateur.',
            'Avec un compte : votre adresse e-mail (ou les informations transmises par Google si vous vous connectez avec Google : nom, adresse e-mail, photo de profil) et un mot de passe chiffré.',
            'Profil Smart Match, si vous le remplissez : niveau de diplôme, spécialités, région, âge et situation. Il sert uniquement à trier les concours qui vous correspondent.',
            'Activité : concours suivis, résultats de vos QCM d\'entraînement, pseudo, messages, commentaires, « j\'aime » et signalements publiés dans la communauté.',
            'Notifications : si vous les activez, l\'adresse technique d\'abonnement fournie par votre navigateur ou votre téléphone, et la liste des concours déjà signalés pour ne pas vous les envoyer deux fois.',
          ],
        },
        {
          title: 'Pourquoi',
          paragraphs: [
            'Vous permettre de suivre des concours, de vous préparer et d\'échanger avec d\'autres candidats ; vous signaler les nouveaux concours qui correspondent à votre profil et les dates limites proches, si vous l\'avez demandé.',
            'Ces traitements reposent sur votre consentement : vous créez un compte, remplissez votre profil et activez les notifications volontairement, et vous pouvez revenir sur ces choix à tout moment.',
          ],
        },
        {
          title: 'Ce qui est public',
          paragraphs: ['Vos messages et commentaires dans la communauté sont visibles par tous avec votre pseudo. Votre adresse e-mail, votre profil Smart Match et vos résultats ne sont jamais affichés aux autres utilisateurs.'],
        },
        {
          title: 'Hébergement et destinataires',
          paragraphs: [
            'Les données sont hébergées par nos prestataires techniques : Supabase (base de données et comptes) et Vercel (hébergement du site). Les notifications passent par le service de notification de votre navigateur ou de votre téléphone (Google, Apple, Mozilla ou Microsoft). Ces prestataires peuvent stocker les données hors du Maroc.',
            'Aucune donnée n\'est vendue ni transmise à des fins publicitaires. KounKour n\'est pas une administration : aucune donnée n\'est transmise aux organismes qui recrutent.',
          ],
        },
        { title: 'Durée de conservation', paragraphs: ['Les données de votre compte sont conservées tant que le compte existe. Elles sont supprimées lorsque vous demandez la suppression de votre compte.'] },
        {
          title: 'Vos droits',
          paragraphs: [
            'Conformément à la loi 09-08, vous disposez d\'un droit d\'accès, de rectification, d\'opposition et de suppression. Vous pouvez modifier votre profil et désactiver les notifications depuis la page Profil, et demander l\'accès à vos données ou leur suppression en écrivant à : ' + contact + '.',
            'Vous pouvez aussi adresser une réclamation à la CNDP (www.cndp.ma).',
          ],
        },
        { title: 'Stockage local et cookies', paragraphs: ['KounKour n\'utilise pas de cookies publicitaires. Le stockage local du navigateur sert à garder votre session ouverte et vos préférences.'] },
      ],
    };
  }
  if (kind === 'privacy') {
    return {
      title: 'سياسة الخصوصية',
      intro: `آخر تحديث: ${date}. توضح هذه الصفحة المعطيات التي يسجلها كونكور، والغرض منها، وكيفية ممارسة حقوقك المنصوص عليها في القانون رقم 09-08 المتعلق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي.`,
      sections: [
        { title: 'المسؤول عن المعالجة', paragraphs: [`الناشر: ${editor}. للتواصل: ${contact}.`, `التصريح لدى اللجنة الوطنية لمراقبة حماية المعطيات ذات الطابع الشخصي: ${cndp}.`] },
        {
          title: 'المعطيات المسجلة',
          paragraphs: [
            'بدون حساب: لا نسجل أي معطيات شخصية في قاعدة معطياتنا (باستثناء السجلات التقنية للمستضيف لأغراض الأمان). تبقى تفضيلاتك (اللغة، الملف المدخل، المفضلة) في التخزين المحلي لمتصفحك.',
            'مع حساب: بريدك الإلكتروني (أو المعلومات التي يرسلها Google إذا سجلت الدخول عبره: الاسم، البريد الإلكتروني، صورة الملف) وكلمة مرور مشفرة.',
            'ملف المطابقة الذكية إذا ملأته: المستوى الدراسي، التخصصات، الجهة، السن والوضعية. يستعمل فقط لترتيب المباريات التي تناسبك.',
            'النشاط: المباريات المتابعة، نتائج تمارين الأسئلة متعددة الاختيارات، الاسم المستعار، الرسائل والتعليقات والإعجابات والتبليغات في المجتمع.',
            'الإشعارات: إذا فعّلتها، العنوان التقني للاشتراك الذي يقدمه متصفحك أو هاتفك، ولائحة المباريات التي سبق إشعارك بها حتى لا تتكرر.',
          ],
        },
        {
          title: 'الغرض',
          paragraphs: [
            'تمكينك من متابعة المباريات والاستعداد لها والتواصل مع مترشحين آخرين، وإشعارك بالمباريات الجديدة التي تناسب ملفك وبالآجال القريبة إذا طلبت ذلك.',
            'تقوم هذه المعالجة على موافقتك: إنشاء الحساب وملء الملف وتفعيل الإشعارات اختيارية، ويمكنك التراجع عنها في أي وقت.',
          ],
        },
        { title: 'ما هو عمومي', paragraphs: ['رسائلك وتعليقاتك في المجتمع ظاهرة للجميع باسمك المستعار. لا يظهر بريدك الإلكتروني ولا ملفك ولا نتائجك لباقي المستخدمين.'] },
        {
          title: 'الاستضافة والجهات المتلقية',
          paragraphs: [
            'تستضيف المعطيات شركاتنا التقنية: Supabase (قاعدة المعطيات والحسابات) وVercel (استضافة الموقع). تمر الإشعارات عبر خدمة الإشعارات الخاصة بمتصفحك أو هاتفك (Google أو Apple أو Mozilla أو Microsoft). قد تُخزَّن هذه المعطيات خارج المغرب.',
            'لا تُباع أي معطيات ولا تُستعمل لأغراض إشهارية. كونكور ليس إدارة عمومية: لا تُرسل أي معطيات إلى الجهات المنظمة للمباريات.',
          ],
        },
        { title: 'مدة الاحتفاظ', paragraphs: ['يُحتفظ بمعطيات حسابك ما دام الحساب قائما، وتُحذف عند طلب حذفه.'] },
        {
          title: 'حقوقك',
          paragraphs: [
            'طبقا للقانون 09-08، لك حق الولوج والتصحيح والتعرض والحذف. يمكنك تعديل ملفك وإيقاف الإشعارات من صفحة الملف الشخصي، وطلب الاطلاع على معطياتك أو حذفها عبر: ' + contact + '.',
            'يمكنك أيضا تقديم شكاية إلى اللجنة الوطنية لمراقبة حماية المعطيات (www.cndp.ma).',
          ],
        },
        { title: 'التخزين المحلي وملفات تعريف الارتباط', paragraphs: ['لا يستعمل كونكور ملفات تعريف ارتباط إشهارية. يُستعمل التخزين المحلي للمتصفح للإبقاء على جلستك وتفضيلاتك.'] },
      ],
    };
  }
  if (lang === 'fr') {
    return {
      title: 'Conditions d\'utilisation',
      intro: `Dernière mise à jour : ${date}. En utilisant KounKour, vous acceptez les conditions ci-dessous.`,
      sections: [
        { title: 'Le service', paragraphs: [`KounKour (éditeur : ${editor}) est une plateforme d'information indépendante sur les concours publics au Maroc. Ce n'est pas un site officiel : KounKour n'organise aucun concours et ne reçoit aucune candidature.`] },
        {
          title: 'Exactitude des informations',
          paragraphs: [
            'Les fiches sont établies à partir des avis et arrêtés publiés par les administrations (notamment sur emploi-public.ma). Malgré nos vérifications, une erreur ou un changement de dernière minute reste possible.',
            'Avant de déposer un dossier, vérifiez toujours les conditions, les pièces et la date limite sur l\'arrêté officiel, accessible depuis chaque fiche. Seul l\'arrêté officiel fait foi.',
            'Le Smart Match indique si un concours semble correspondre à votre profil ; c\'est une aide, pas une décision d\'éligibilité.',
          ],
        },
        {
          title: 'QCM et annales',
          paragraphs: ['Les QCM servent à s\'entraîner. Les annales reprennent des sujets réels quand leur source est indiquée ; les corrigés sont établis par KounKour et ne sont pas des corrigés officiels.'],
        },
        { title: 'Votre compte', paragraphs: ['Vous êtes responsable des informations que vous saisissez et de la confidentialité de votre mot de passe. Vous pouvez demander la suppression de votre compte à tout moment.'] },
        {
          title: 'Règles de la communauté',
          paragraphs: [
            'Restez respectueux. Sont interdits : insultes, harcèlement, propos discriminatoires, publicité ou spam, vente de « fuites » de sujets ou promesses de réussite, publication de données personnelles d\'autrui et tout contenu illégal.',
            'Chaque message peut être signalé. L\'équipe peut masquer un contenu ou suspendre un compte qui ne respecte pas ces règles.',
            'Vous restez responsable de ce que vous publiez. Les conseils des autres candidats n\'engagent pas KounKour.',
          ],
        },
        { title: 'Notifications', paragraphs: ['Les notifications sont facultatives et se désactivent depuis la page Profil ou les réglages de votre téléphone ou navigateur.'] },
        { title: 'Responsabilité', paragraphs: ['KounKour ne peut être tenu responsable d\'un dossier refusé, d\'une date manquée ou d\'une décision prise sur la base des informations du site sans vérification sur la source officielle.'] },
        { title: 'Droit applicable', paragraphs: [`Ces conditions sont soumises au droit marocain. Contact : ${contact}.`] },
      ],
    };
  }
  return {
    title: 'شروط الاستخدام',
    intro: `آخر تحديث: ${date}. باستعمالك لكونكور فإنك توافق على الشروط التالية.`,
    sections: [
      { title: 'الخدمة', paragraphs: [`كونكور (الناشر: ${editor}) منصة إخبارية مستقلة حول المباريات العمومية بالمغرب. ليس موقعا رسميا: لا ينظم كونكور أي مباراة ولا يتلقى أي ترشيح.`] },
      {
        title: 'دقة المعلومات',
        paragraphs: [
          'تُعد البطاقات انطلاقا من الإعلانات والقرارات التي تنشرها الإدارات (خاصة على emploi-public.ma). رغم المراجعة، قد يقع خطأ أو تغيير في آخر لحظة.',
          'قبل إيداع ملفك، تحقق دائما من الشروط والوثائق والأجل في القرار الرسمي المتاح في كل بطاقة. القرار الرسمي وحده هو المرجع.',
          'تشير المطابقة الذكية إلى ما إذا كانت المباراة تبدو مناسبة لملفك؛ هي مساعدة وليست قرارا بالأهلية.',
        ],
      },
      { title: 'الأسئلة متعددة الاختيارات والنماذج', paragraphs: ['الأسئلة للتدرب. تنقل النماذج مواضيع حقيقية عندما يُذكر مصدرها؛ الأجوبة من إعداد كونكور وليست أجوبة رسمية.'] },
      { title: 'حسابك', paragraphs: ['أنت مسؤول عن المعلومات التي تدخلها وعن سرية كلمة مرورك. يمكنك طلب حذف حسابك في أي وقت.'] },
      {
        title: 'قواعد المجتمع',
        paragraphs: [
          'احترم الآخرين. يُمنع السب والتحرش والتمييز والإشهار والرسائل المزعجة وبيع «تسريبات» المواضيع أو وعود النجاح ونشر المعطيات الشخصية للغير وكل محتوى غير قانوني.',
          'يمكن التبليغ عن أي رسالة. يمكن للفريق إخفاء محتوى أو توقيف حساب لا يحترم هذه القواعد.',
          'أنت مسؤول عما تنشره. نصائح باقي المترشحين لا تُلزم كونكور.',
        ],
      },
      { title: 'الإشعارات', paragraphs: ['الإشعارات اختيارية ويمكن إيقافها من صفحة الملف الشخصي أو من إعدادات الهاتف أو المتصفح.'] },
      { title: 'المسؤولية', paragraphs: ['لا يتحمل كونكور مسؤولية رفض ملف أو فوات أجل أو قرار اتُّخذ اعتمادا على معلومات الموقع دون التحقق من المصدر الرسمي.'] },
      { title: 'القانون المطبق', paragraphs: [`تخضع هذه الشروط للقانون المغربي. للتواصل: ${contact}.`] },
    ],
  };
}

export const LEGAL_PATH: Record<LegalKind, string> = { privacy: '/confidentialite', terms: '/conditions' };
