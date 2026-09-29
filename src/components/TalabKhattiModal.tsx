import React, { useState, useEffect, useRef } from 'react';
import { Contest, Language } from '../types';
import { 
  X, Printer, Copy, Check, Download, Edit3, Eye, FileText, 
  Sparkles, RefreshCw, User, Building2, MapPin, Calendar
} from 'lucide-react';
import { loadCandidateProfile, CandidateProfile } from '../utils/candidateStorage';

interface TalabKhattiModalProps {
  contest: Contest | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const TalabKhattiModal: React.FC<TalabKhattiModalProps> = ({
  contest,
  isOpen,
  onClose,
  language: appLanguage,
}) => {
  const [docLang, setDocLang] = useState<'ar' | 'fr'>('ar');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Candidate data initialized from profile
  const profile = loadCandidateProfile();
  const [candidateName, setCandidateName] = useState(profile.fullName || 'فاطمة الزهراء المنصوري');
  const [cin, setCin] = useState('AA123456');
  const [address, setAddress] = useState('شارع محمد الخامس، حي الرياض');
  const [city, setCity] = useState(profile.region?.split('-')[0] || 'الرباط');
  const [phone, setPhone] = useState(profile.phone || '0661234567');
  const [email, setEmail] = useState(profile.email || 'candidat@email.ma');
  const [diploma, setDiploma] = useState(profile.degreeLevel || 'الإجازة');
  const [specialty, setSpecialty] = useState(contest?.specialty?.ar || contest?.specialtiesList?.[0] || 'المعلوميات وتدبير النظم');

  // Contest references
  const adminNameAr = contest?.administration?.name?.ar || 'وزارة الشؤون الخارجية والتعاون الإفريقي';
  const adminNameFr = contest?.administration?.name?.fr || 'Ministère des Affaires Étrangères';
  const gradeAr = contest?.grade || contest?.title?.ar || 'تقني من الدرجة الرابعة';
  const gradeFr = contest?.grade || contest?.title?.fr || 'Technicien de 4ème grade';
  const refCode = contest?.referenceCode || 'C43033/26';
  const contestDate = contest?.contestDate || '2026';

  const todayAr = new Date().toLocaleDateString('ar-MA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const todayFr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Custom text override if user edited directly
  const [customTextAr, setCustomTextAr] = useState('');
  const [customTextFr, setCustomTextFr] = useState('');

  // Generate Recipient Title
  const getRecipientAr = () => {
    if (adminNameAr.includes('وزارة')) {
      return `إلى السيد وزير ${adminNameAr.replace('وزارة', '').trim()} المحترم`;
    } else if (adminNameAr.includes('جامعة')) {
      return `إلى السيد رئيس ${adminNameAr} المحترم`;
    } else if (adminNameAr.includes('مجلس') || adminNameAr.includes('جهة') || adminNameAr.includes('جماعة')) {
      return `إلى السيد رئيس ${adminNameAr} المحترم`;
    }
    return `إلى السيد المدير العام لـ ${adminNameAr} المحترم`;
  };

  const getRecipientFr = () => {
    if (adminNameFr.toLowerCase().includes('ministère')) {
      return `À Monsieur le Ministre de (${adminNameFr.replace(/ministère de/i, '').replace(/ministère/i, '').trim()})`;
    }
    return `À Monsieur le Directeur Général de (${adminNameFr})`;
  };

  // Generate standard body in Arabic
  const generateBodyAr = () => {
    return `${city}، في: ${todayAr}

من: ${candidateName}
الحامل(ة) للبطاقة الوطنية للتعريف رقم: ${cin}
العنوان: ${address} - ${city}
الهاتف: ${phone}
البريد الإلكتروني: ${email}
الحاصل(ة) على دبلوم: ${diploma} في تخصص (${specialty})

${getRecipientAr()}
تحت إشراف السلم الإداري (إن وجد)

الموضوع: طلب المشاركة في مباراة توظيف ${gradeAr}
مرجع الإعلان: ${refCode}

سلام تام بوجود مولانا الإمام المؤيد بالله،

وبعد،
يشرفني بكل احترام وتقدير أن أتقدم إلى سيادتكم بطلبي هذا من أجل المشاركة في مباراة توظيف ${gradeAr} (تخصص: ${specialty})، والمزمع إجراؤها بتاريخ ${contestDate} تحت رقم المرجع (${refCode}).

وأحيطكم علماً سيدي المحترم، أنني من جنسية مغربية وأتمتع بكامل حقوقي الوطنية والمدنية، وحاصل(ة) على شهادة ${diploma} في ${specialty}، وتتوفر فيّ كافة الشروط القانونية والمؤهلات المطلوبة لاجتياز هذه المباراة والمساهمة الفعالة في خدمة إدارتكم الموقرة.

تجدون رفقة هذا الطلب كافة الوثائق المكونة لملف ترشيحي وفق ما ينص عليه قرار فتح المباراة.

وفي انتظار ردكم الكريم، تقبلوا مني سيدي المحترم فائق عبارات التقدير والاحترام.

والسلام.

إمضاء المترشح(ة):
${candidateName}`;
  };

  // Generate standard body in French
  const generateBodyFr = () => {
    return `${city}, le ${todayFr}

Nom & Prénom : ${candidateName}
CIN : ${cin}
Adresse : ${address} - ${city}
Téléphone : ${phone}
E-mail : ${email}
Diplôme : ${diploma} en ${contest?.specialty?.fr || specialty}

${getRecipientFr()}

Objet : Candidature au concours de recrutement de ${gradeFr}
Réf. de l'avis : ${refCode}

Monsieur le Ministre / Monsieur le Directeur,

J'ai l'honneur de solliciter votre haute bienveillance de bien vouloir accepter ma candidature au concours de recrutement de ${gradeFr}, spécialité « ${contest?.specialty?.fr || specialty} », prévu pour la session du ${contestDate} sous la référence officielle ${refCode}.

Je porte à votre aimable connaissance que je suis de nationalité marocaine, âgé(e) de ${profile.age || 24} ans, titulaire d'un diplôme de ${diploma} et que je remplis toutes les conditions statutaires requises par l'arrêté officiel d'ouverture du concours.

Vous trouverez ci-joint l'ensemble des pièces justificatives constitutives de mon dossier de candidature.

Dans l'attente d'une suite favorable, je vous prie d'agréer, Monsieur, l'expression de mes salutations les plus distinguées et de mon profond respect.

Signature :
${candidateName}`;
  };

  useEffect(() => {
    setCustomTextAr(generateBodyAr());
    setCustomTextFr(generateBodyFr());
  }, [candidateName, cin, address, city, phone, email, diploma, specialty, contest]);

  if (!isOpen || !contest) return null;

  const currentText = docLang === 'ar' ? customTextAr : customTextFr;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les fenêtres pop-up pour imprimer');
      return;
    }

    const isAr = docLang === 'ar';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'fr'}">
      <head>
        <meta charset="utf-8">
        <title>Demande_Manuscrite_${refCode.replace('/', '_')}</title>
        <style>
          @page { size: A4; margin: 25mm 20mm 20mm 20mm; }
          body {
            font-family: ${isAr ? '"Traditional Arabic", "Amiri", serif' : 'Georgia, serif'};
            font-size: ${isAr ? '16pt' : '12pt'};
            line-height: ${isAr ? '1.8' : '1.6'};
            color: #111;
            padding: 20px;
            white-space: pre-wrap;
          }
          .header { margin-bottom: 25px; }
        </style>
      </head>
      <body>
        ${currentText}
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([currentText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Demande_${refCode.replace('/', '_')}_${docLang.toUpperCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-[#F1E5EC] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#8D174B] via-[#75123E] to-[#5C0E31] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase bg-amber-400 text-[#242126] px-2 py-0.5 rounded">
                  {docLang === 'ar' ? 'طلب خطي رسمي' : 'DEMANDE OFFICIELLE'}
                </span>
                <span className="text-xs font-mono text-white/80">{refCode}</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">
                {docLang === 'ar' ? 'مولد الطلب الخطي لمباراة التوظيف' : 'Générateur de Demande Manuscrite Officielle'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="bg-white/15 rounded-xl p-0.5 flex items-center text-xs font-bold">
              <button
                onClick={() => setDocLang('ar')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  docLang === 'ar' ? 'bg-white text-[#8D174B] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                العربية
              </button>
              <button
                onClick={() => setDocLang('fr')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  docLang === 'fr' ? 'bg-white text-[#8D174B] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Français
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-[#FAF4F7] border-b border-[#F1E5EC] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isEditing
                  ? 'bg-[#8D174B] text-white shadow-xs'
                  : 'bg-white text-[#6E6773] border border-[#F1E5EC] hover:text-[#8D174B]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? (docLang === 'ar' ? 'معاينة الورقة' : 'Voir l’aperçu') : (docLang === 'ar' ? 'تعديل النص' : 'Éditer le texte')}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-[#F1E5EC] hover:border-[#8D174B]/40 text-[#242126] hover:text-[#8D174B] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#8D174B]" />}
              <span>{copied ? (docLang === 'ar' ? 'تم النسخ !' : 'Copié !') : (docLang === 'ar' ? 'نسخ النص' : 'Copier')}</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-[#F1E5EC] hover:border-[#8D174B]/40 text-[#242126] hover:text-[#8D174B] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#8D174B]" />
              <span>{docLang === 'ar' ? 'تحميل (.txt)' : 'Télécharger'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{docLang === 'ar' ? 'طباعة / حفظ PDF' : 'Imprimer / PDF'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#F8F4F6]">
          {/* Quick Input Bar to customize placeholders */}
          <div className="bg-white border border-[#F1E5EC] rounded-2xl p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-[#8D174B] uppercase block mb-3">
              {docLang === 'ar' ? 'معلوماتك الشخصية للتضمين في الطلب' : 'Vos coordonnées à insérer dans la lettre'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-gray-500 block text-[10px] mb-0.5">{docLang === 'ar' ? 'الاسم الكامل' : 'Nom complet'}</label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-lg px-2.5 py-1.5 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                />
              </div>
              <div>
                <label className="text-gray-500 block text-[10px] mb-0.5">{docLang === 'ar' ? 'رقم البطاقة الوطنية (CIN)' : 'N° CIN'}</label>
                <input
                  type="text"
                  value={cin}
                  onChange={(e) => setCin(e.target.value)}
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-lg px-2.5 py-1.5 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                />
              </div>
              <div>
                <label className="text-gray-500 block text-[10px] mb-0.5">{docLang === 'ar' ? 'المدينة' : 'Ville'}</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-lg px-2.5 py-1.5 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                />
              </div>
            </div>
          </div>

          {/* Paper View or Direct Textarea */}
          {isEditing ? (
            <div className="bg-white border border-[#F1E5EC] rounded-2xl p-4 shadow-md">
              <label className="text-xs font-bold text-[#8D174B] block mb-2">
                {docLang === 'ar' ? 'تعديل نص الطلب بحرية :' : 'Éditer le texte librement :'}
              </label>
              <textarea
                rows={16}
                value={currentText}
                onChange={(e) => {
                  if (docLang === 'ar') setCustomTextAr(e.target.value);
                  else setCustomTextFr(e.target.value);
                }}
                dir={docLang === 'ar' ? 'rtl' : 'ltr'}
                className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl p-4 text-xs sm:text-sm text-[#242126] font-mono leading-relaxed focus:outline-none focus:border-[#8D174B] focus:bg-white"
              />
            </div>
          ) : (
            /* Moroccan Administrative A4 Sheet Simulation */
            <div 
              ref={printRef}
              dir={docLang === 'ar' ? 'rtl' : 'ltr'}
              className="bg-white border border-[#E8DCE2] rounded-2xl p-6 sm:p-12 shadow-md max-w-2xl mx-auto text-[#1C1420] text-xs sm:text-sm leading-relaxed"
              style={{ fontFamily: docLang === 'ar' ? 'serif' : 'Georgia, serif' }}
            >
              {/* Date & Location */}
              <div className="flex justify-end mb-6 text-gray-600 font-medium">
                <span>{city}، {docLang === 'ar' ? 'في' : 'le'} : <strong>{docLang === 'ar' ? todayAr : todayFr}</strong></span>
              </div>

              {/* Candidate Info */}
              <div className="mb-8 space-y-1 text-gray-800 bg-[#FDF9FB] p-3.5 rounded-xl border border-[#F1E5EC]/80">
                <p className="font-bold text-[#8D174B] text-sm">{candidateName}</p>
                <p>{docLang === 'ar' ? 'رقم ب.ت.و :' : 'CIN :'} <strong>{cin}</strong></p>
                <p>{docLang === 'ar' ? 'العنوان :' : 'Adresse :'} {address} - {city}</p>
                <p>{docLang === 'ar' ? 'الهاتف :' : 'Tél :'} {phone} • {email}</p>
                <p>{docLang === 'ar' ? 'المستوى الدراسي :' : 'Diplôme :'} {diploma} ({specialty})</p>
              </div>

              {/* Recipient */}
              <div className="text-center font-bold text-sm sm:text-base text-[#8D174B] mb-8 px-4 py-2 border-y border-[#8D174B]/20 bg-[#FDF2F7]/50 rounded-lg">
                {docLang === 'ar' ? getRecipientAr() : getRecipientFr()}
              </div>

              {/* Object & Reference */}
              <div className="mb-6 space-y-1">
                <p>
                  <strong className="text-[#8D174B]">{docLang === 'ar' ? 'الموضوع :' : 'Objet :'}</strong>{' '}
                  <span>{docLang === 'ar' ? `طلب المشاركة في مباراة توظيف ${gradeAr}` : `Candidature au concours de recrutement de ${gradeFr}`}</span>
                </p>
                <p className="text-gray-500 text-xs">
                  <strong>{docLang === 'ar' ? 'مرجع الإعلان :' : 'Réf :'}</strong> {refCode}
                </p>
              </div>

              {/* Opening greeting */}
              <div className="mb-4 font-bold text-center">
                {docLang === 'ar' ? 'سلام تام بوجود مولانا الإمام المؤيد بالله،' : 'Monsieur le Ministre / Monsieur le Directeur,'}
              </div>

              {/* Body Text */}
              <div className="space-y-4 text-justify leading-relaxed">
                <p>
                  {docLang === 'ar' 
                    ? `يشرفني بكل احترام وتقدير أن أتقدم إلى سيادتكم بطلبي هذا من أجل المشاركة في مباراة توظيف ${gradeAr} (تخصص: ${specialty})، والمزمع إجراؤها بتاريخ ${contestDate} تحت رقم المرجع (${refCode}).`
                    : `J'ai l'honneur de solliciter votre haute bienveillance de bien vouloir accepter ma candidature au concours de recrutement de ${gradeFr}, spécialité « ${contest.specialty?.fr || specialty} », prévu pour la session du ${contestDate} sous la référence officielle ${refCode}.`}
                </p>
                <p>
                  {docLang === 'ar'
                    ? `وأحيطكم علماً سيدي المحترم، أنني من جنسية مغربية وأتمتع بكامل حقوقي الوطنية والمدنية، وحاصل(ة) على شهادة ${diploma} في ${specialty}، وتتوفر فيّ كافة الشروط القانونية والمؤهلات المطلوبة لاجتياز هذه المباراة والمساهمة الفعالة في خدمة إدارتكم الموقرة.`
                    : `Je porte à votre aimable connaissance que je suis de nationalité marocaine, titulaire d'un diplôme de ${diploma} en ${contest.specialty?.fr || specialty} et que je remplis toutes les conditions statutaires requises par l'arrêté officiel d'ouverture du concours.`}
                </p>
                <p>
                  {docLang === 'ar'
                    ? 'تجدون رفقة هذا الطلب كافة الوثائق المكونة لملف ترشيحي وفق ما ينص عليه قرار فتح المباراة.'
                    : 'Vous trouverez ci-joint l’ensemble des pièces justificatives constitutives de mon dossier de candidature.'}
                </p>
                <p>
                  {docLang === 'ar'
                    ? 'وفي انتظار ردكم الكريم، تقبلوا مني سيدي المحترم فائق عبارات التقدير والاحترام.'
                    : 'Dans l’attente d’une suite favorable, je vous prie d’agréer, Monsieur, l’expression de mes salutations les plus distinguées.'}
                </p>
              </div>

              {/* Signature Block */}
              <div className="mt-10 pt-4 flex justify-between items-end">
                <div className="text-[10px] text-gray-400">
                  {docLang === 'ar' ? 'حرر للتسجيل في منصة المباريات' : 'Généré via KounKour V1'}
                </div>
                <div className="text-center font-bold">
                  <span className="block text-gray-600 mb-6">{docLang === 'ar' ? 'إمضاء المترشح(ة) :' : 'Signature :'}</span>
                  <span className="text-[#8D174B] underline decoration-[#8D174B]/40 font-mono text-xs">{candidateName}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#F1E5EC] bg-white flex items-center justify-between text-xs text-[#6E6773] shrink-0">
          <span>
            {docLang === 'ar' 
              ? 'جاهز للطباعة أو الإرفاق مع ملف الترشيح الرسمي.' 
              : 'Prêt à être imprimé ou joint à votre dossier officiel.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-all cursor-pointer"
          >
            {docLang === 'ar' ? 'إغلاق' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};
