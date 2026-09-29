import React, { useState } from 'react';
import { Language, Contest } from '../types';
import { 
  X, Calculator, Coins, ShieldCheck, TrendingUp, Info, 
  Users, MapPin, Building2, ChevronRight, Award, Check
} from 'lucide-react';
import { MOROCCAN_SALARY_SCALES, calculateMoroccanPublicSalary } from '../data/salaryScales';

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
  // Infer initial scale based on contest grade
  const getInitialScaleId = () => {
    if (!initialContest) return 'echelle-10';
    const grade = (initialContest.grade || initialContest.degreeLevel || '').toLowerCase();
    if (grade.includes('technique') || grade.includes('échelle 6') || grade.includes('echelle 6') || grade.includes('6')) {
      return 'echelle-6';
    }
    if (grade.includes('4ème grade') || grade.includes('4eme') || grade.includes('échelle 8') || grade.includes('echelle 8')) {
      return 'echelle-8';
    }
    if (grade.includes('3ème grade') || grade.includes('3eme') || grade.includes('échelle 9') || grade.includes('echelle 9')) {
      return 'echelle-9';
    }
    if (grade.includes('ingénieur') || grade.includes('ingenieur')) {
      return 'echelle-11-ingenieur';
    }
    if (grade.includes('2ème grade') || grade.includes('master') || grade.includes('échelle 11') || grade.includes('echelle 11')) {
      return 'echelle-11-admin';
    }
    return 'echelle-10';
  };

  const [selectedScaleId, setSelectedScaleId] = useState<string>(getInitialScaleId);
  const [selectedEchelon, setSelectedEchelon] = useState<number>(1);
  const [zone, setZone] = useState<'A' | 'B' | 'C'>('A');
  const [isMarried, setIsMarried] = useState<boolean>(false);
  const [childrenCount, setChildrenCount] = useState<number>(0);

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
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase bg-amber-400 text-[#242126] px-2 py-0.5 rounded">
                  {language === 'fr' ? 'SIMULATEUR OFFICIEL' : 'محاكي الأجور الرسمي'}
                </span>
                <span className="text-xs font-mono text-white/80">Grille 2025/2026</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">
                {language === 'fr' 
                  ? 'Simulateur de Salaire Net & Rémunération de la Fonction Publique' 
                  : 'محاكي الأجر الصافي والتعويضات النظامية بالوظيفة العمومية'}
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
          
          {/* 1. Scale Selector */}
          <div>
            <label className="text-xs font-bold text-[#8D174B] uppercase tracking-wide block mb-2">
              {language === 'fr' ? '1. Choisissez le Grade / L’Échelle Statutaire :' : '1. اختر السلم الإداري / الدرجة المستهدفة :'}
            </label>
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
                        ? 'bg-[#8D174B] text-white border-[#8D174B] shadow-md shadow-[#8D174B]/20'
                        : 'bg-white text-[#242126] border-[#F1E5EC] hover:border-[#8D174B]/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-[#FAF4F7] text-[#8D174B]'
                        }`}>
                          {scale.echelle.split('(')[0]}
                        </span>
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-emerald-700'}`}>
                          ~{scale.baseNetEstimate} DH net
                        </span>
                      </div>
                      <h4 className="text-xs font-bold line-clamp-2 mt-1">
                        {scale.grade[language]}
                      </h4>
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
                      ? `${ech.echelon}${ech.echelon === 1 ? 'er' : 'ème'} Échelon (Indice ${ech.indice}) - ${ech.echelon === 1 ? 'Recrutement débutant' : ''}`
                      : `الرتبة ${ech.echelon} (النقطة الاستدلالية ${ech.indice})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Zone de résidence */}
            <div>
              <label className="text-xs font-bold text-[#6E6773] block mb-1.5">
                {language === 'fr' ? 'Zone de Résidence :' : 'منطقة الإقامة والتعيين :'}
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value as any)}
                className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs font-semibold text-[#242126] focus:outline-none focus:border-[#8D174B]"
              >
                <option value="A">{language === 'fr' ? 'Zone A (Rabat, Casa, Tanger...)' : 'المنطقة أ (الرباط، البيضاء، طنجة...)'}</option>
                <option value="B">{language === 'fr' ? 'Zone B (Fès, Marrakech, Oujda...)' : 'المنطقة ب (فاس، مراكش، وجدة...)'}</option>
                <option value="C">{language === 'fr' ? 'Zone C (Autres provinces)' : 'المنطقة ج (باقي الأقاليم)'}</option>
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
                  {result.scale.echelle} • {language === 'fr' ? `Échelon ${result.echelon.echelon}` : `الرتبة ${result.echelon.echelon}`}
                </span>
                <h3 className="text-base sm:text-xl font-extrabold text-white">
                  {result.scale.grade[language]}
                </h3>
                <p className="text-xs text-rose-200 mt-1">
                  {language === 'fr' 
                    ? 'Estimation nette mensuelle selon le barème indiciaire de la fonction publique marocaine.' 
                    : 'تقدير الأجر الصافي الشهري وفق سلم أجور الوظيفة العمومية بالمغرب.'}
                </p>
              </div>

              {/* Big Net Figure */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 text-center shrink-0 min-w-[220px]">
                <span className="text-xs text-rose-200 uppercase font-bold block">
                  {language === 'fr' ? 'Salaire Net à Percevoir' : 'الأجر الصافي الشهري'}
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-amber-300 mt-1 font-mono">
                  {result.salaireNet.toLocaleString('fr-FR')} <span className="text-sm font-bold text-white">DH / Mois</span>
                </div>
                <span className="text-[10px] text-white/80 block mt-1">
                  {language === 'fr' ? 'Net d’impôt et après déductions (CMR, CNOPS)' : 'صافي بعد اقتطاعات التقاعد والتأمين والضريبة'}
                </span>
              </div>
            </div>

            {/* Detailed Breakdown Grid */}
            <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-black/15 p-3 rounded-xl">
                <span className="text-rose-200 block text-[10px]">{language === 'fr' ? 'Traitement de base :' : 'المرتب الأساسي :'}</span>
                <strong className="text-white text-sm font-mono">{result.traitementBase} DH</strong>
              </div>

              <div className="bg-black/15 p-3 rounded-xl">
                <span className="text-rose-200 block text-[10px]">{language === 'fr' ? 'Indemnité de Sujétion :' : 'تعويض التدرج والتأطير :'}</span>
                <strong className="text-white text-sm font-mono">{result.indemniteSujetion + result.indemniteEncadrement} DH</strong>
              </div>

              <div className="bg-black/15 p-3 rounded-xl">
                <span className="text-rose-200 block text-[10px]">{language === 'fr' ? 'Retenue Retraite (CMR 14%) :' : 'اقتطاع التقاعد (CMR 14%) :'}</span>
                <strong className="text-rose-300 text-sm font-mono">-{result.deductionCMR} DH</strong>
              </div>

              <div className="bg-black/15 p-3 rounded-xl">
                <span className="text-rose-200 block text-[10px]">{language === 'fr' ? 'Impôt sur le Revenu (IGR) :' : 'الضريبة على الدخل (IGR) :'}</span>
                <strong className="text-rose-300 text-sm font-mono">-{result.igr} DH</strong>
              </div>
            </div>
          </div>

          {/* Legal Information & Notes */}
          <div className="bg-white border border-[#F1E5EC] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#6E6773]">
            <Info className="w-5 h-5 text-[#8D174B] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#242126] block font-bold mb-0.5">
                {language === 'fr' ? 'Cadre légal & Références statutaires :' : 'الإطار القانوني والمرجعية النظامية :'}
              </strong>
              <span>
                {language === 'fr' 
                  ? 'Ce simulateur intègre les dispositions du Statut général de la fonction publique (Dahir 1.58.008), le décret sur le système de rémunération et les revalorisations salariales de l’accord du dialogue social (2024-2026).'
                  : 'تم إعداد هذا المحاكي وفق النظام الأساسي العام للوظيفة العمومية ومراسيم الأجور والتعويضات النظامية ومخرجات الحوار الاجتماعي (2024-2026).'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#F1E5EC] bg-white flex items-center justify-between text-xs shrink-0">
          <span className="text-[#6E6773]">
            {language === 'fr' ? 'Simulateur KounKour V1 • Fonction Publique Maroc' : 'محاكي كونكور V1 • الوظيفة العمومية بالمغرب'}
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
