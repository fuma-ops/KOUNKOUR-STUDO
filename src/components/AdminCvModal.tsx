import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { 
  X, Printer, Download, Copy, Check, User, GraduationCap, 
  Briefcase, Award, Languages, FileText, Sparkles, Plus, Trash2
} from 'lucide-react';
import { loadCandidateProfile } from '../utils/candidateStorage';

interface AdminCvModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const AdminCvModal: React.FC<AdminCvModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const profile = loadCandidateProfile();

  const [docLang, setDocLang] = useState<'fr' | 'ar'>('fr');
  const [copied, setCopied] = useState(false);

  // Profile data
  const [fullName, setFullName] = useState(profile.fullName || 'فاطمة الزهراء المنصوري');
  const [cin, setCin] = useState('AA123456');
  const [birthDate, setBirthDate] = useState('15/04/1998');
  const [address, setAddress] = useState('Avenue Mohammed V, Rabat');
  const [phone, setPhone] = useState(profile.phone || '0661234567');
  const [email, setEmail] = useState(profile.email || 'candidat@email.ma');
  const [drivingLicense, setDrivingLicense] = useState('Permis B (2020)');

  // Education list
  const [diplomas, setDiplomas] = useState([
    { year: '2023', title: profile.degreeLevel || 'Master Spécialisé en Droit & Gestion Publique', school: 'Université Mohammed V - Rabat', mention: 'Bien' },
    { year: '2021', title: 'Licence en Études Fondamentales', school: 'FSJES - Rabat', mention: 'Assez Bien' },
    { year: '2018', title: 'Baccalauréat Sciences Économiques', school: 'Lycée Hassan II', mention: 'Bien' },
  ]);

  // Experiences list
  const [experiences, setExperiences] = useState([
    { period: '2024 - 2025', role: 'Chargé d’études et gestion administrative (Stage pré-embauche)', org: 'Direction Régionale de l’Équipement - Rabat', tasks: 'Gestion des dossiers administratifs, rédaction des rapports et suivi des marchés publics.' },
    { period: '2023 (6 mois)', role: 'Stage d’application de fin d’études', org: 'Commune Urbaine de Rabat', tasks: 'Traitement des courriers administratifs et accueil des usagers.' },
  ]);

  // Skills
  const [skills, setSkills] = useState('Bureautique (Word, Excel avancé, PowerPoint), Gestion documentaire, Rédaction administrative marocaine, Outils SIG.');
  const [languagesList, setLanguagesList] = useState('Arabe (Langue maternelle), Français (Courant / Professionnel), Anglais (Intermédiaire), Amazighe (Notions).');

  if (!isOpen) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const isAr = docLang === 'ar';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'fr'}">
      <head>
        <meta charset="utf-8">
        <title>CV_Administratif_${fullName.replace(/ /g, '_')}</title>
        <style>
          @page { size: A4; margin: 18mm 18mm 18mm 18mm; }
          body {
            font-family: ${isAr ? '"Traditional Arabic", "Amiri", serif' : 'Arial, Helvetica, sans-serif'};
            font-size: ${isAr ? '13pt' : '10.5pt'};
            color: #222;
            line-height: 1.4;
          }
          .header { border-bottom: 2px solid #8D174B; padding-bottom: 12px; margin-bottom: 16px; }
          .name { font-size: 18pt; font-weight: bold; color: #8D174B; }
          .section-title {
            font-size: 12pt;
            font-weight: bold;
            color: #8D174B;
            background: #FAF4F7;
            padding: 4px 8px;
            margin-top: 14px;
            margin-bottom: 8px;
            border-left: 4px solid #8D174B;
          }
          .item { margin-bottom: 8px; }
          .item-title { font-weight: bold; }
          .item-sub { color: #555; font-size: 9.5pt; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="name">${fullName}</div>
          <div>CIN: <strong>${cin}</strong> • Date de naissance: ${birthDate}</div>
          <div>${address} • Tél: ${phone} • E-mail: ${email} • ${drivingLicense}</div>
        </div>

        <div class="section-title">${isAr ? 'الدبلومات والشواهد الجامعية' : 'FORMATION & DIPLÔMES ACADÉMIQUES'}</div>
        ${diplomas.map(d => `
          <div class="item">
            <div class="item-title">${d.year} — ${d.title} (${d.school})</div>
            <div class="item-sub">Mention: ${d.mention}</div>
          </div>
        `).join('')}

        <div class="section-title">${isAr ? 'التجارب المهنية والتدريب' : 'EXPÉRIENCES PROFESSIONNELLES & STAGES'}</div>
        ${experiences.map(e => `
          <div class="item">
            <div class="item-title">${e.period} : ${e.role} — ${e.org}</div>
            <div class="item-sub">${e.tasks}</div>
          </div>
        `).join('')}

        <div class="section-title">${isAr ? 'الكفاءات والمهارات' : 'COMPÉTENCES TECHNIQUES & BUREAUTIQUES'}</div>
        <div class="item">${skills}</div>

        <div class="section-title">${isAr ? 'اللغات' : 'LANGUES'}</div>
        <div class="item">${languagesList}</div>

        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-[#F1E5EC] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8D174B] via-[#75123E] to-[#5C0E31] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase bg-amber-400 text-[#242126] px-2 py-0.5 rounded">
                  {language === 'fr' ? 'CV OFFICIEL MAROC' : 'السيرة الذاتية الرسمية'}
                </span>
                <span className="text-xs font-mono text-white/80">Format Standard Jury</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">
                {language === 'fr' 
                  ? 'Générateur de CV Administratif Conforme pour Concours' 
                  : 'مولد السيرة الذاتية الرسمية المطابقة لمعايير مباريات التوظيف'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/15 rounded-xl p-0.5 flex items-center text-xs font-bold">
              <button
                onClick={() => setDocLang('fr')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  docLang === 'fr' ? 'bg-white text-[#8D174B] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Français
              </button>
              <button
                onClick={() => setDocLang('ar')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  docLang === 'ar' ? 'bg-white text-[#8D174B] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                العربية
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
        <div className="bg-[#FAF4F7] border-b border-[#F1E5EC] px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-[#6E6773] font-medium">
            {language === 'fr' 
              ? 'Mise en page sobre et structurée conforme aux exigences des commissions de concours.' 
              : 'تنسيق مهني ورسمي مطابق لمتطلبات لجان مباريات التوظيف العمومي.'}
          </span>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'fr' ? 'Imprimer / Exporter en PDF' : 'طباعة / حفظ PDF'}</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#FAF4F7]">
          
          {/* Quick Edit Inputs */}
          <div className="bg-white border border-[#F1E5EC] rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#8D174B] uppercase tracking-wide">
              {language === 'fr' ? 'État Civil & Informations Générales' : 'الحالة المدنية والمعلومات الشخصية'}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-gray-500 block text-[10px] mb-0.5">{language === 'fr' ? 'Nom et Prénom' : 'الاسم الكامل'}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                />
              </div>

              <div>
                <label className="text-gray-500 block text-[10px] mb-0.5">{language === 'fr' ? 'N° C.I.N.' : 'رقم البطاقة الوطنية'}</label>
                <input
                  type="text"
                  value={cin}
                  onChange={(e) => setCin(e.target.value)}
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                />
              </div>

              <div>
                <label className="text-gray-500 block text-[10px] mb-0.5">{language === 'fr' ? 'Ville & Adresse' : 'المدينة والعنوان'}</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                />
              </div>
            </div>
          </div>

          {/* Paper Preview */}
          <div 
            dir={docLang === 'ar' ? 'rtl' : 'ltr'}
            className="bg-white border border-[#E8DCE2] rounded-2xl p-6 sm:p-10 shadow-md max-w-2xl mx-auto text-[#1C1420] text-xs leading-relaxed"
          >
            {/* Header Identity */}
            <div className="border-b-2 border-[#8D174B] pb-4 mb-5">
              <h1 className="text-xl font-extrabold text-[#8D174B]">{fullName}</h1>
              <div className="text-gray-600 mt-1 space-y-0.5">
                <p>CIN : <strong>{cin}</strong> • {docLang === 'ar' ? 'تاريخ الازدياد :' : 'Né(e) le :'} {birthDate}</p>
                <p>{address} • {phone} • {email}</p>
              </div>
            </div>

            {/* Formation */}
            <div className="mb-5">
              <h2 className="text-xs font-bold text-[#8D174B] bg-[#FDF2F7] px-3 py-1 rounded-lg border-s-4 border-[#8D174B] mb-2.5 uppercase">
                {docLang === 'ar' ? 'الدبلومات والتكوين الأكاديمي' : 'Formation & Diplômes Académiques'}
              </h2>
              <div className="space-y-2 ps-2">
                {diplomas.map((d, i) => (
                  <div key={i} className="flex justify-between items-baseline">
                    <div>
                      <strong className="text-[#242126]">{d.title}</strong>
                      <span className="text-gray-500 block text-[11px]">{d.school} (Mention : {d.mention})</span>
                    </div>
                    <span className="text-gray-400 font-mono text-[11px] font-bold">{d.year}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Experiences */}
            <div className="mb-5">
              <h2 className="text-xs font-bold text-[#8D174B] bg-[#FDF2F7] px-3 py-1 rounded-lg border-s-4 border-[#8D174B] mb-2.5 uppercase">
                {docLang === 'ar' ? 'التجارب المهنية والتدريب' : 'Expériences Professionnelles & Stages'}
              </h2>
              <div className="space-y-2 ps-2">
                {experiences.map((exp, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline">
                      <strong className="text-[#242126]">{exp.role} — {exp.org}</strong>
                      <span className="text-gray-400 font-mono text-[11px] font-bold">{exp.period}</span>
                    </div>
                    <p className="text-gray-600 text-[11px] mt-0.5">{exp.tasks}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills & Languages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h2 className="text-xs font-bold text-[#8D174B] bg-[#FDF2F7] px-3 py-1 rounded-lg border-s-4 border-[#8D174B] mb-1.5 uppercase">
                  {docLang === 'ar' ? 'المهارات التقنية' : 'Compétences'}
                </h2>
                <p className="text-gray-600 text-[11px] ps-2">{skills}</p>
              </div>

              <div>
                <h2 className="text-xs font-bold text-[#8D174B] bg-[#FDF2F7] px-3 py-1 rounded-lg border-s-4 border-[#8D174B] mb-1.5 uppercase">
                  {docLang === 'ar' ? 'اللغات' : 'Langues'}
                </h2>
                <p className="text-gray-600 text-[11px] ps-2">{languagesList}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#F1E5EC] bg-white flex items-center justify-between text-xs shrink-0">
          <span className="text-[#6E6773]">
            {language === 'fr' ? 'Généré via KounKour V1' : 'تم الإنشاء بواسطة منصة كونكور'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-all cursor-pointer"
          >
            {language === 'fr' ? 'Fermer' : 'إغلاق'}
          </button>
        </div>
      </div>
    </div>
  );
};
