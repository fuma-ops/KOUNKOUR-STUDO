import React, { useState, useEffect } from 'react';
import { Language, Contest } from '../types';
import { 
  X, Calculator, Coins, ShieldCheck, TrendingUp, Info, 
  Users, MapPin, Building2, ChevronRight, Award, Check,
  GraduationCap, Sparkles, BookOpen, Briefcase
} from 'lucide-react';
import { 
  MOROCCAN_SALARY_SCALES, 
  calculateMoroccanPublicSalary, 
  inferSalaryScaleFromContest, 
  inferSalaryScaleFromProfile 
} from '../data/salaryScales';
import { loadCandidateProfile } from '../utils/candidateStorage';

interface SalarySimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  initialContest?: Contest | null;
}

export const SalarySimulatorModal: React.FC<SalarySimulatorModalProps> = ({
  isOpen,
  onClose,
  language,
  initialContest,
}) => {
  const profile = loadCandidateProfile();

  // Smart deduction of initial scale
  const getInitialScale = () => {
    if (initialContest) {
      return inferSalaryScaleFromContest(initialContest);
    }
    if (profile && (profile.degreeLevel || profile.specialty)) {
      return inferSalaryScaleFromProfile(profile);
    }
    return MOROCCAN_SALARY_SCALES[3]; // Default: Echelle 10
  };

  const [selectedScaleId, setSelectedScaleId] = useState<string>(() => getInitialScale().id);
  const [selectedEchelon, setSelectedEchelon] = useState<number>(1);
  const [zone, setZone] = useState<'A' | 'B' | 'C'>('A');
  const [isMarried, setIsMarried] = useState<boolean>(false);
  const [childrenCount, setChildrenCount] = useState<number>(0);

  // Sync scale whenever initialContest changes
  useEffect(() => {
    if (initialContest) {
      const deduced = inferSalaryScaleFromContest(initialContest);
      setSelectedScaleId(deduced.id);
      setSelectedEchelon(1);
    } else if (profile && (profile.degreeLevel || profile.specialty)) {
      const deduced = inferSalaryScaleFromProfile(profile);
      setSelectedScaleId(deduced.id);
      setSelectedEchelon(1);
    }
  }, [initialContest]);

  if (!isOpen) return null;

  const result = calculateMoroccanPublicSalary({
    scaleId: selectedScaleId,
    echelonNumber: selectedEchelon,
    zone,
    isMarried,
    childrenCount,
  });

  const isRTL = language === 'ar';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-[#F1E5EC] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8D174B] via-[#75123E] to-[#5C0E31] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 shadow-inner">
              <Coins className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase bg-amber-400 text-[#242126] px-2 py-0.5 rounded shadow-xs">
                  {language === 'fr' ? 'GRILLE OFFICIELLE DES SALAIRES' : 'سلم الأجور الرسمي'}
                </span>
                <span className="text-xs font-mono text-white/90 font-bold">Maroc 2025/2026 (+1000 DH net)</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">
                {language === 'fr' 
                  ? 'Simulateur Intelligent de Salaire Net & Rémunération de la Fonction Publique' 
                  : 'محاكي الأجور الصافية والتعويضات النظامية بالوظيفة العمومية'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#FAF4F7]">
          
          {/* Smart Contest or Profile Context Banner */}
          {initialContest ? (
            <div className="bg-gradient-to-r from-[#FDF2F7] to-white border border-[#8D174B]/20 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
              <Sparkles className="w-5 h-5 text-[#8D174B] shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase text-[#8D174B] bg-[#8D174B]/10 px-2 py-0.5 rounded-full">
                    {language === 'fr' ? 'Concours ciblé' : 'المباراة المستهدفة'}
                  </span>
                  <span className="text-xs font-bold text-[#242126]">
                    {initialContest.administration.name[language] || initialContest.administration.name.fr}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#242126]">
                  {initialContest.title[language] || initialContest.title.fr}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#6E6773] mt-1.5">
                  <span>🎓 {initialContest.degreeLevel || 'Niveau requis'}</span>
                  <span>•</span>
                  <span>🏛️ {result.scale.corps[language] || result.scale.corps.fr}</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">~{result.scale.baseNetEstimate.toLocaleString('fr-FR')} DH net / mois</span>
                </div>
              </div>
            </div>
          ) : profile?.degreeLevel ? (
            <div className="bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
              <GraduationCap className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mb-1">
                  {language === 'fr' ? 'Estimation selon votre profil & diplôme' : 'تقدير حسب دبلومك وتخصصك'}
                </span>
                <h3 className="text-sm font-bold text-[#242126]">
                  {profile.degreeLevel} {profile.specialty ? `— ${profile.specialty}` : ''}
                </h3>
                <p className="text-xs text-[#6E6773] mt-0.5">
                  {language === 'fr'
                    ? `Grille déduite : ${result.scale.grade.fr} (${result.scale.echelle})`
                    : `السلم المقترح : ${result.scale.grade.ar}`}
                </p>
              </div>
            </div>
          ) : null}

          {/* 1. Scale Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#8D174B] uppercase tracking-wide">
                {language === 'fr' ? '1. Choisissez le Grade / L’Échelle Statutaire :' : '1. اختر السلم الإداري / الدرجة المستهدفة :'}
              </label>
              <span className="text-[11px] text-[#6E6773]">
                {language === 'fr' ? '9 échelles et corps officiels' : '9 سلالم نظامية رسمية'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {MOROCCAN_SALARY_SCALES.map((scale) => {
                const isSelected = selectedScaleId === scale.id;
                return (
                  <button
                    key={scale.id}
                    onClick={() => {
                      setSelectedScaleId(scale.id);
                      setSelectedEchelon(1);
                    }}
                    className={`p-3 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#8D174B] text-white border-[#8D174B] shadow-md shadow-[#8D174B]/20 scale-[1.02]'
                        : 'bg-white text-[#242126] border-[#F1E5EC] hover:border-[#8D174B]/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-[#FAF4F7] text-[#8D174B]'
                        }`}>
                          {scale.echelle.split('(')[0]}
                        </span>
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-emerald-700'}`}>
                          ~{scale.baseNetEstimate.toLocaleString('fr-FR')} DH net
                        </span>
                      </div>
                      <h4 className="text-xs font-bold line-clamp-2 mt-1">
                        {scale.grade[language] || scale.grade.fr}
                      </h4>
                      <p className={`text-[10px] line-clamp-1 mt-1 ${isSelected ? 'text-rose-100' : 'text-gray-500'}`}>
                        {scale.diplomaReq[language] || scale.diplomaReq.fr}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Parameters Grid (Échelon, Zone, Situation) */}
          <div className="bg-white border border-[#F1E5EC] rounded-3xl p-4 sm:p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Echelon */}
            <div>
              <label className="text-xs font-bold text-[#6E6773] block mb-1.5">
                {language === 'fr' ? 'Échelon (Ancienneté) :' : 'الرتبة (الأقدمية) :'}
              </label>
              <select
                value={selectedEchelon}
                onChange={(e) => setSelectedEchelon(Number(e.target.value))}
                className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs font-semibold text-[#242126] focus:outline-none focus:border-[#8D174B]"
              >
                {result.scale.echelons.map((ech) => (
                  <option key={ech.echelon} value={ech.echelon}>
                    {language === 'fr' 
                      ? `${ech.echelon}${ech.echelon === 1 ? 'er' : 'ème'} Échelon (Indice ${ech.indice}) ${ech.echelon === 1 ? '— Débutant' : ''}`
                      : `الرتبة ${ech.echelon} (النقطة الاستدلالية ${ech.indice})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Zone de résidence */}
            <div>
              <label className="text-xs font-bold text-[#6E6773] block mb-1.5">
                {language === 'fr' ? 'Zone d’Affectation :' : 'منطقة الإقامة والتعيين :'}
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value as any)}
                className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs font-semibold text-[#242126] focus:outline-none focus:border-[#8D174B]"
              >
                <option value="A">{language === 'fr' ? 'Zone A (Rabat, Casablanca, Tanger, Fès...)' : 'المنطقة أ (الرباط، البيضاء، طنجة، فاس...)'}</option>
                <option value="B">{language === 'fr' ? 'Zone B (Marrakech, Agadir, Oujda, Meknès...)' : 'المنطقة ب (مراكش، أكادير، وجدة، مكناس...)'}</option>
                <option value="C">{language === 'fr' ? 'Zone C (Autres provinces et communes)' : 'المنطقة ج (باقي الأقاليم والجماعات)'}</option>
              </select>
            </div>

            {/* Situation Familiale & Enfants */}
            <div>
              <label className="text-xs font-bold text-[#6E6773] block mb-1.5">
                {language === 'fr' ? 'Enfants à charge :' : 'الأطفال المتكفل بهم :'}
              </label>
              <select
                value={childrenCount}
                onChange={(e) => setChildrenCount(Number(e.target.value))}
                className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs font-semibold text-[#242126] focus:outline-none focus:border-[#8D174B]"
              >
                <option value="0">{language === 'fr' ? '0 enfant (Célibataire / Sans enfant)' : '0 طفل (أعزب / بدون أطفال)'}</option>
                <option value="1">{language === 'fr' ? '1 enfant (+300 DH/mois)' : '1 طفل (+300 درهم/شهر)'}</option>
                <option value="2">{language === 'fr' ? '2 enfants (+600 DH/mois)' : '2 أطفال (+600 درهم/شهر)'}</option>
                <option value="3">{language === 'fr' ? '3 enfants (+900 DH/mois)' : '3 أطفال (+900 درهم/شهر)'}</option>
                <option value="4">{language === 'fr' ? '4 enfants et plus' : '4 أطفال فما فوق'}</option>
              </select>
            </div>
          </div>

          {/* 3. Salary Result Card (Highlight) */}
          <div className="bg-gradient-to-br from-[#8D174B] via-[#75123E] to-[#450C25] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 end-0 p-8 opacity-10 pointer-events-none">
              <Coins className="w-48 h-48 text-white" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-extrabold uppercase backdrop-blur-md mb-2">
                  {result.scale.echelle} • {language === 'fr' ? `Échelon ${result.echelon.echelon} (Indice ${result.echelon.indice})` : `الرتبة ${result.echelon.echelon}`}
                </span>
                <h3 className="text-base sm:text-xl font-extrabold text-white">
                  {result.scale.grade[language] || result.scale.grade.fr}
                </h3>
                <p className="text-xs text-rose-200 mt-1 max-w-lg">
                  {result.scale.decreeRef}
                </p>
              </div>

              {/* Big Net Figure */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 text-center shrink-0 min-w-[230px]">
                <span className="text-xs text-rose-200 uppercase font-bold block">
                  {language === 'fr' ? 'Salaire Net Mensuel Estimé' : 'الأجر الصافي الشهري المقدر'}
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-amber-300 mt-1 font-mono">
                  {result.salaireNet.toLocaleString('fr-FR')} <span className="text-sm font-bold text-white">DH / Mois</span>
                </div>
                <span className="text-[10px] text-white/80 block mt-1">
                  {language === 'fr' ? 'Net en poche après déductions (CMR, CNOPS, IGR)' : 'صافي الحساب البنكي بعد الاقتطاعات'}
                </span>
              </div>
            </div>

            {/* Detailed Breakdown Grid */}
            <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
              <div className="bg-black/20 p-2.5 rounded-xl">
                <span className="text-rose-200 block text-[10px]">{language === 'fr' ? 'Traitement de base :' : 'المرتب الأساسي :'}</span>
                <strong className="text-white text-sm font-mono">{result.traitementBase} DH</strong>
              </div>

              <div className="bg-black/20 p-2.5 rounded-xl">
                <span className="text-rose-200 block text-[10px]">{language === 'fr' ? 'Indemnités statutaires :' : 'التعويضات النظامية :'}</span>
                <strong className="text-white text-sm font-mono">{result.indemniteSujetion + result.indemniteEncadrement} DH</strong>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-400/30 p-2.5 rounded-xl">
                <span className="text-emerald-200 block text-[10px]">{language === 'fr' ? 'Dialogue Social :' : 'الحوار الاجتماعي :'}</span>
                <strong className="text-emerald-300 text-sm font-mono">+{result.primeRevalorisationAccordSocial} DH</strong>
              </div>

              <div className="bg-black/20 p-2.5 rounded-xl">
                <span className="text-rose-200 block text-[10px]">{language === 'fr' ? 'Retraite (CMR 14%) :' : 'اقتطاع التقاعد :'}</span>
                <strong className="text-rose-300 text-sm font-mono">-{result.deductionCMR} DH</strong>
              </div>

              <div className="bg-black/20 p-2.5 rounded-xl">
                <span className="text-rose-200 block text-[10px]">{language === 'fr' ? 'Impôt Revenu (IGR) :' : 'الضريبة IGR :'}</span>
                <strong className="text-rose-300 text-sm font-mono">-{result.igr} DH</strong>
              </div>
            </div>
          </div>

          {/* Legal Information & Notes */}
          <div className="bg-white border border-[#F1E5EC] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#6E6773]">
            <Info className="w-5 h-5 text-[#8D174B] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#242126] block font-bold mb-0.5">
                {language === 'fr' ? 'Références officielles de la fonction publique marocaine :' : 'المرجعيات الرسمية للوظيفة العمومية المغربية :'}
              </strong>
              <span>
                {language === 'fr' 
                  ? 'Calculé selon le dahir n° 1-58-008 (Statut général de la fonction publique), les décrets statutaires des corps de fonctionnaires (Ingénieurs, Administrateurs, Techniciens, Santé, Enseignement) et la hausse générale nette de 1 000 DH issue de l’accord du dialogue social.'
                  : 'محتسب وفق الظهير الشريف رقم 1-58-008 بمثابة النظام الأساسي العام للوظيفة العمومية والمراسيم الخاصة بالهيئات المشتركة ومخرجات اتفاق الحوار الاجتماعي.'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#F1E5EC] bg-white flex items-center justify-between text-xs shrink-0">
          <span className="text-[#6E6773] font-medium">
            {language === 'fr' ? 'Grille de Rémunération KounKour • Royaume du Maroc' : 'سلم الأجور كونكور • المملكة المغربية'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white font-bold transition-all cursor-pointer"
          >
            {language === 'fr' ? 'Fermer' : 'إغلاق'}
          </button>
        </div>
      </div>
    </div>
  );
};
