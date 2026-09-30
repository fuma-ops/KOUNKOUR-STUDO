import React, { useState, useEffect } from 'react';
import { Contest, Language } from '../types';
import { translations } from '../i18n/translations';
import { 
  User, Bookmark, Award, Bell, Shield, Globe, 
  Trash2, ExternalLink, Check, ToggleLeft, ToggleRight,
  GraduationCap, MapPin, Briefcase, Calendar, CheckSquare, Square,
  FileCheck, Download, Upload, RefreshCw, AlertCircle, Sparkles,
  ChevronDown, ChevronUp, Save, Edit3, ArrowRight, ArrowLeft, FileText
} from 'lucide-react';
import { 
  CandidateProfile, CandidateTrackingItem, ApplicationStatus,
  loadCandidateProfile, saveCandidateProfile,
  loadCandidateTracking, updateContestTracking,
  checkEligibility, exportAllBrowserData, importBrowserData, clearAllBrowserData
} from '../utils/candidateStorage';

interface ProfileModuleProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  bookmarkedContests: Contest[];
  allContests?: Contest[];
  completedQcmScores: { qcmId: string; score: number; total: number; completedAt: string }[];
  onSelectContest: (contest: Contest) => void;
  onRemoveBookmark: (contestId: string) => void;
  onProfileUpdated?: () => void;
  onOpenTalabKhatti?: (contest: Contest) => void;
  onOpenSalarySimulator?: (contest?: Contest) => void;
  onOpenAdminCv?: () => void;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({
  language,
  onLanguageChange,
  bookmarkedContests,
  allContests = [],
  completedQcmScores,
  onSelectContest,
  onRemoveBookmark,
  onProfileUpdated,
  onOpenTalabKhatti,
  onOpenSalarySimulator,
  onOpenAdminCv,
}) => {
  const t = translations[language];
  const isRTL = language === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // Tabs: 'tracking' | 'profile' | 'recommendations' | 'qcm' | 'storage'
  const [activeProfileTab, setActiveProfileTab] = useState<'tracking' | 'profile' | 'recommendations' | 'qcm' | 'storage'>('tracking');

  // Candidate Profile State from localStorage
  const [profile, setProfile] = useState<CandidateProfile>(loadCandidateProfile());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Tracking state from localStorage
  const [trackingMap, setTrackingMap] = useState<Record<string, CandidateTrackingItem>>(loadCandidateTracking());
  const [expandedContestId, setExpandedContestId] = useState<string | null>(bookmarkedContests[0]?.id || null);

  // Backup & Import
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    setTrackingMap(loadCandidateTracking());
  }, [bookmarkedContests]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveCandidateProfile(profile);
    setIsEditingProfile(false);
    setProfileSaveSuccess(true);
    if (onProfileUpdated) onProfileUpdated();
    setTimeout(() => setProfileSaveSuccess(false), 3000);
  };

  const handleUpdateStatus = (contestId: string, status: ApplicationStatus) => {
    const updated = updateContestTracking(contestId, { status });
    setTrackingMap(updated);
  };

  const handleToggleChecklistItem = (contestId: string, itemKey: keyof CandidateTrackingItem['checklist']) => {
    const current = trackingMap[contestId]?.checklist || {
      cinCertified: false,
      diplomaCertified: false,
      policeRecord: false,
      cvUpdated: false,
      motivationLetter: false,
      officialForm: false,
    };

    const nextChecklist = {
      ...current,
      [itemKey]: !current[itemKey],
    };

    const updated = updateContestTracking(contestId, { checklist: nextChecklist });
    setTrackingMap(updated);
  };

  const handleUpdateNotes = (contestId: string, notes: string) => {
    const updated = updateContestTracking(contestId, { notes });
    setTrackingMap(updated);
  };

  const handleExportData = () => {
    const dataStr = exportAllBrowserData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kounkour_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBrowserData(content);
      if (success) {
        setProfile(loadCandidateProfile());
        setTrackingMap(loadCandidateTracking());
        setImportStatus(language === 'fr' ? 'Données importées avec succès !' : 'تم استيراد البيانات بنجاح !');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setImportStatus(language === 'fr' ? 'Erreur de format de fichier' : 'صيغة الملف غير صالحة');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm(language === 'fr' 
      ? 'Êtes-vous sûr de vouloir réinitialiser vos données stockées localement ?' 
      : 'هل أنت متأكد من رغبتك في حذف البيانات المخزنة محلياً في المتصفح؟')) {
      clearAllBrowserData();
      setProfile(loadCandidateProfile());
      setTrackingMap({});
      window.location.reload();
    }
  };

  // Pipeline Status Labels
  const statusLabels: Record<ApplicationStatus, { fr: string; ar: string; color: string }> = {
    interested: { fr: 'En réflexion', ar: 'قيد التفكير', color: 'bg-gray-100 text-gray-700' },
    preparing_dossier: { fr: 'Dossier en préparation', ar: 'تجهيز الوثائق', color: 'bg-amber-100 text-amber-800' },
    submitted: { fr: 'Dossier déposé (Inscrit)', ar: 'تم إيداع الملف', color: 'bg-blue-100 text-blue-800' },
    convoked_written: { fr: 'Convoqué(e) à l’écrit', ar: 'استدعاء للاختبار الكتابي', color: 'bg-purple-100 text-purple-800' },
    eligible_oral: { fr: 'Admissible à l’oral', ar: 'مؤهل للاختبار الشفوي', color: 'bg-indigo-100 text-indigo-800' },
    admitted: { fr: 'Lauréat(e) Admis(e) 🎉', ar: 'ناجح نهائياً 🎉', color: 'bg-emerald-100 text-emerald-800 font-bold' },
    not_selected: { fr: 'Non retenu', ar: 'غير مقبول', color: 'bg-rose-100 text-rose-800' },
  };

  // Recommendations calculation
  const recommendedContests = allContests.filter((contest) => {
    const elig = checkEligibility(contest, profile);
    return elig.isEligible;
  });

  // Calculate QCM Stats
  const avgQcmScore = completedQcmScores.length > 0
    ? Math.round(
        completedQcmScores.reduce((acc, curr) => acc + (curr.score / curr.total) * 100, 0) /
          completedQcmScores.length
      )
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Candidate Profile Header Card */}
      <div className="bg-white border border-[#F1E5EC] rounded-3xl p-6 shadow-sm mb-6 relative overflow-hidden">
        <div className="absolute top-0 end-0 bg-gradient-to-l from-[#FDF2F7] to-transparent w-1/3 h-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-[#8D174B]/20 shrink-0">
              {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'ك'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#242126]">{profile.fullName || t.profile.title}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {language === 'fr' ? 'Stockage Navigateur Sécurisé' : 'تخزين آمن بالمتصفح'}
                </span>
              </div>
              <p className="text-xs text-[#6E6773] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{profile.degreeLevel} • {profile.specialty}</span>
                <span>•</span>
                <span>{profile.age} {language === 'fr' ? 'ans' : 'سنة'}</span>
                <span>•</span>
                <span>{profile.region}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 sm:border-s sm:border-[#F1E5EC] sm:ps-6 shrink-0">
            <div className="text-center">
              <span className="text-xl font-extrabold text-[#8D174B] block">{bookmarkedContests.length}</span>
              <span className="text-[10px] text-[#6E6773] uppercase font-semibold">
                {language === 'fr' ? 'Suivis' : 'متابعة'}
              </span>
            </div>
            <div className="text-center">
              <span className="text-xl font-extrabold text-emerald-600 block">{recommendedContests.length}</span>
              <span className="text-[10px] text-[#6E6773] uppercase font-semibold">
                {language === 'fr' ? 'Éligibles' : 'مطابقة'}
              </span>
            </div>
            <div className="text-center">
              <span className="text-xl font-extrabold text-[#C73578] block">
                {completedQcmScores.length > 0 ? `${avgQcmScore}%` : '-'}
              </span>
              <span className="text-[10px] text-[#6E6773] uppercase font-semibold">QCM</span>
            </div>
          </div>
        </div>

        {/* Local Storage badge notice */}
        <div className="mt-5 pt-4 border-t border-[#F1E5EC] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6E6773]">
          <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50/80 px-3 py-1 rounded-full border border-emerald-200">
            <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {language === 'fr' 
                ? 'Données privées sauvegardées sur votre navigateur (aucun compte externe requis).' 
                : 'البيانات الشخصية محفوظة محلياً في متصفحك (لا يلزم أي حساب خارجي).'}
            </span>
          </div>

          <button
            onClick={() => setActiveProfileTab('profile')}
            className="text-xs font-bold text-[#8D174B] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{language === 'fr' ? 'Modifier mon profil & diplôme' : 'تعديل الملف والدبلوم'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-[#F1E5EC] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveProfileTab('tracking')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeProfileTab === 'tracking'
              ? 'bg-[#8D174B] text-white shadow-xs'
              : 'text-[#6E6773] hover:bg-[#F8F2F5]'
          }`}
        >
          {language === 'fr' ? '📋 Suivi des Candidatures' : '📋 تتبع ملفات الترشيح'} ({bookmarkedContests.length})
        </button>

        <button
          onClick={() => setActiveProfileTab('recommendations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeProfileTab === 'recommendations'
              ? 'bg-[#8D174B] text-white shadow-xs'
              : 'text-[#6E6773] hover:bg-[#F8F2F5]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{language === 'fr' ? 'Concours Recommandés' : 'مباريات مقترحة'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold">
            {recommendedContests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveProfileTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeProfileTab === 'profile'
              ? 'bg-[#8D174B] text-white shadow-xs'
              : 'text-[#6E6773] hover:bg-[#F8F2F5]'
          }`}
        >
          {language === 'fr' ? '👤 Mon Profil Candidat' : '👤 ملف المترشح'}
        </button>

        <button
          onClick={() => setActiveProfileTab('qcm')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeProfileTab === 'qcm'
              ? 'bg-[#8D174B] text-white shadow-xs'
              : 'text-[#6E6773] hover:bg-[#F8F2F5]'
          }`}
        >
          {t.profile.qcmHistory} ({completedQcmScores.length})
        </button>

        <button
          onClick={() => setActiveProfileTab('storage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeProfileTab === 'storage'
              ? 'bg-[#8D174B] text-white shadow-xs'
              : 'text-[#6E6773] hover:bg-[#F8F2F5]'
          }`}
        >
          {language === 'fr' ? '💾 Sauvegarde & Paramètres' : '💾 النسخ الاحتياطي والإعدادات'}
        </button>
      </div>

      {/* TAB 1: Tracking & Interactive Checklist */}
      {activeProfileTab === 'tracking' && (
        <div className="space-y-4">
          {/* Candidate Fast Toolbox */}
          <div className="bg-gradient-to-r from-[#FAF4F7] via-[#FFFDFE] to-[#FAF4F7] border border-[#F1E5EC] rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#8D174B] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#242126]">
                  {language === 'fr' ? 'Boîte à Outils du Candidat' : 'صندوق أدوات المترشح'}
                </h4>
                <p className="text-[11px] text-[#6E6773]">
                  {language === 'fr' ? 'Simulateur de salaire statutaire et générateur de CV administratif marocain' : 'محاكي الأجر الصافي ومولد السيرة الذاتية الرسمية للمباريات'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  if (onOpenSalarySimulator) onOpenSalarySimulator();
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FDF2F7] border border-[#8D174B]/30 text-[#8D174B] font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <span>💰 {language === 'fr' ? 'Simulateur Salaire Net' : 'محاكي الأجور'}</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenAdminCv) onOpenAdminCv();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Générer mon CV Concours' : 'إنشاء CV المباراة'}</span>
              </button>
            </div>
          </div>

          {bookmarkedContests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-[#F1E5EC] p-6 shadow-xs">
              <Bookmark className="w-12 h-12 text-[#6E6773]/40 mx-auto mb-3" />
              <h4 className="text-base font-bold text-[#242126] mb-1">{t.profile.noSavedContests}</h4>
              <p className="text-xs text-[#6E6773] max-w-md mx-auto mb-4">
                {language === 'fr' 
                  ? 'Ajoutez des concours en favoris pour activer votre carnet de bord : suivi du dossier, calendrier des épreuves et checklist des pièces officielles.' 
                  : 'أضف مباريات إلى المفضلة لتفعيل لوحة التتبع: تجهيز الوثائق ومتابعة مراحل اجتياز الاختبارات.'}
              </p>
            </div>
          ) : (
            bookmarkedContests.map((c) => {
              const tracking = trackingMap[c.id] || {
                contestId: c.id,
                status: 'preparing_dossier',
                checklist: {
                  cinCertified: false,
                  diplomaCertified: false,
                  policeRecord: false,
                  cvUpdated: false,
                  motivationLetter: false,
                  officialForm: false,
                },
                savedAt: '2026-09-20',
              };

              const isExpanded = expandedContestId === c.id;
              const completedChecklistCount = Object.values(tracking.checklist).filter(Boolean).length;
              const checklistTotal = 6;
              const progressPercent = Math.round((completedChecklistCount / checklistTotal) * 100);

              return (
                <div
                  key={c.id}
                  className="bg-white border border-[#F1E5EC] hover:border-[#8D174B]/30 rounded-3xl overflow-hidden shadow-xs transition-all"
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div 
                      onClick={() => setExpandedContestId(isExpanded ? null : c.id)}
                      className="flex items-center gap-3.5 cursor-pointer flex-1"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[#FDF2F7] flex items-center justify-center text-2xl shrink-0 border border-[#F1E5EC]">
                        {c.administration.logo}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold text-[#8D174B] uppercase tracking-wide">
                            {c.administration.name[language]}
                          </span>
                          <span className="text-[10px] text-gray-400">•</span>
                          <span className="text-[10px] text-rose-600 font-semibold">
                            {c.deadlineDate} ({c.daysRemaining} {t.contests.daysLeft})
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-[#242126] line-clamp-1 hover:text-[#8D174B] transition-colors">
                          {c.title[language]}
                        </h4>
                      </div>
                    </div>

                    {/* Status badge & Expand Toggle */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <select
                        value={tracking.status}
                        onChange={(e) => handleUpdateStatus(c.id, e.target.value as ApplicationStatus)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border border-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8D174B]/40 ${
                          statusLabels[tracking.status]?.color || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <option value="interested">{statusLabels.interested[language]}</option>
                        <option value="preparing_dossier">{statusLabels.preparing_dossier[language]}</option>
                        <option value="submitted">{statusLabels.submitted[language]}</option>
                        <option value="convoked_written">{statusLabels.convoked_written[language]}</option>
                        <option value="eligible_oral">{statusLabels.eligible_oral[language]}</option>
                        <option value="admitted">{statusLabels.admitted[language]}</option>
                        <option value="not_selected">{statusLabels.not_selected[language]}</option>
                      </select>

                      <button
                        onClick={() => setExpandedContestId(isExpanded ? null : c.id)}
                        className="p-2 rounded-xl hover:bg-[#F8F2F5] text-[#6E6773] transition-colors cursor-pointer"
                        title={isExpanded ? 'Réduire' : 'Détails du dossier'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => onRemoveBookmark(c.id)}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Retirer des favoris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quick progress bar */}
                  <div className="px-5 pb-3">
                    <div className="flex items-center justify-between text-[11px] text-[#6E6773] mb-1 font-medium">
                      <span>{language === 'fr' ? 'Pièces du dossier validées' : 'وثائق الملف الجاهزة'} ({completedChecklistCount}/{checklistTotal})</span>
                      <span className="font-bold text-[#8D174B]">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#8D174B] to-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Expanded Checklist & Notes Section */}
                  {isExpanded && (
                    <div className="border-t border-[#F1E5EC] bg-[#FFFDFE] p-5 sm:p-6 space-y-5">
                      {/* Document Checklist Moroccan Administration */}
                      <div>
                        <h5 className="text-xs font-bold text-[#242126] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-[#8D174B]" />
                          <span>{language === 'fr' ? 'Checklist des pièces à fournir (Maroc)' : 'لائحة الوثائق المطلوبة (الإدارة المغربية)'}</span>
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {[
                            { key: 'cinCertified', fr: 'Copie certifiée C.I.N. (بطاقة التعريف الوطنية)', ar: 'نسخة مطابقة للأصل من بطاقة التعريف الوطنية' },
                            { key: 'diplomaCertified', fr: 'Copie certifiée du diplôme requis (الدبلوم)', ar: 'نسخة مطابقة للأصل من الدبلوم المطلوب' },
                            { key: 'policeRecord', fr: 'Fiche anthropométrique / Casier (السجل العدلي)', ar: 'بطاقة السوابق أو نسخة من السجل العدلي' },
                            { key: 'cvUpdated', fr: 'Curriculum Vitae actualisé avec photo (CV)', ar: 'سيرة ذاتية محينة تتضمن صورة شمسية' },
                            { key: 'motivationLetter', fr: 'Demande manuscrite signée (طلب خطي)', ar: 'طلب خطي موقع يحمل اسم المترشح وعنوانه' },
                            { key: 'officialForm', fr: 'Récépissé portail emploi-public.ma', ar: 'وصل التسجيل الإلكتروني عبر البوابة' },
                          ].map((doc) => {
                            const isChecked = !!tracking.checklist[doc.key as keyof CandidateTrackingItem['checklist']];
                            return (
                              <button
                                key={doc.key}
                                type="button"
                                onClick={() => handleToggleChecklistItem(c.id, doc.key as keyof CandidateTrackingItem['checklist'])}
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-[#8D174B]/30'
                                }`}
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-gray-400 shrink-0" />
                                )}
                                <span>{doc[language]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Candidate Notes */}
                      <div>
                        <label className="text-xs font-bold text-[#242126] block mb-1.5">
                          {language === 'fr' ? 'Notes personnelles & rappel de convocation :' : 'ملاحظات وتذكيرات شخصية :'}
                        </label>
                        <input
                          type="text"
                          value={tracking.notes || ''}
                          onChange={(e) => handleUpdateNotes(c.id, e.target.value)}
                          placeholder={language === 'fr' 
                            ? 'Ex: Légalisation à la commune, centre d’examen à Rabat, convocation reçue...' 
                            : 'مثال: المصادقة بالجماعة، مركز الامتحان، تم التوصل بالاستدعاء...'}
                          className="w-full bg-white border border-[#F1E5EC] rounded-xl px-3.5 py-2 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                        />
                      </div>

                      {/* Footer Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F1E5EC]/60">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectContest(c)}
                            className="text-xs font-bold text-[#8D174B] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{language === 'fr' ? 'Consulter l’annonce complète' : 'الاطلاع على تفاصيل المباراة'}</span>
                            <ArrowIcon className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (onOpenTalabKhatti) onOpenTalabKhatti(c);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#FDF2F7] hover:bg-[#F9E6F0] text-[#8D174B] font-bold text-xs flex items-center gap-1 border border-[#8D174B]/20 transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{language === 'fr' ? '📄 Demande (طلب خطي)' : '📄 طلب خطي'}</span>
                          </button>
                        </div>

                        <a
                          href={c.officialSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-[#8D174B] transition-colors"
                        >
                          <span>emploi-public.ma</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: Personalized Recommendations & Smart Matching */}
      {activeProfileTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="bg-[#FDF2F7] border border-[#8D174B]/20 rounded-2xl p-4 text-xs text-[#8D174B] flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#8D174B] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block text-sm mb-0.5">
                {language === 'fr' 
                  ? `Concours correspondants à votre profil (${profile.degreeLevel} • ${profile.specialty} • ${profile.age} ans)` 
                  : `المباريات المطابقة لمؤهلاتك (${profile.degreeLevel} • ${profile.specialty} • ${profile.age} سنة)`}
              </strong>
              <p className="text-[#6E6773]">
                {language === 'fr' 
                  ? 'Le moteur compare automatiquement votre diplôme, votre spécialité et votre âge avec les conditions officielles publiées.'
                  : 'يقوم النظام بمقارنة مستواك الدراسي وتخصصك وسنك تلقائياً مع الشروط الرسمية لكل مباراة.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allContests.map((c) => {
              const elig = checkEligibility(c, profile);
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectContest(c)}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between ${
                    elig.isHighMatch
                      ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                      : elig.isEligible
                      ? 'border-[#F1E5EC] hover:border-[#8D174B]/30'
                      : 'border-rose-200/80 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold text-[#8D174B] uppercase">
                        {c.administration.name[language]}
                      </span>

                      {elig.isHighMatch ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3 text-emerald-600" />
                          {language === 'fr' ? 'Match Parfait 100%' : 'مطابقة تامة 100%'}
                        </span>
                      ) : elig.isEligible ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {language === 'fr' ? 'Éligible' : 'مؤهل'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          {language === 'fr' ? 'Critères non remplis' : 'شروط غير مستوفاة'}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-[#242126] mb-2 line-clamp-2">
                      {c.title[language]}
                    </h4>

                    {/* Reasons breakdown */}
                    <div className="space-y-1 mb-3">
                      {elig.reasons.map((r, i) => (
                        <p key={i} className="text-[11px] text-[#6E6773] flex items-start gap-1.5">
                          <span className={elig.isEligible ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>•</span>
                          <span>{r[language]}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#F1E5EC] flex items-center justify-between text-xs text-[#6E6773]">
                    <span>{c.degreeLevel} • {c.postsCount} {t.contests.posts}</span>
                    <span className="text-[#8D174B] font-bold">{c.deadlineDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Candidate Profile Form */}
      {activeProfileTab === 'profile' && (
        <div className="bg-white border border-[#F1E5EC] rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#F1E5EC]">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#242126]">
                {language === 'fr' ? 'Mon Profil & Critères d’Éligibilité' : 'بيانات المترشح ومعايير الأهلية'}
              </h3>
              <p className="text-xs text-[#6E6773]">
                {language === 'fr'
                  ? 'Ces informations sont stockées dans votre navigateur et servent à filtrer les concours qui correspondent à vos compétences.'
                  : 'هذه المعطيات تُخزن في متصفحك وتُستخدم لترشيح المباريات المطابقة لمؤهلاتك تلقائياً.'}
              </p>
            </div>

            {profileSaveSuccess && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{language === 'fr' ? 'Enregistré en local !' : 'تم الحفظ محلياً !'}</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#242126] block mb-1">
                  {language === 'fr' ? 'Nom et Prénom' : 'الاسم الكامل'}
                </label>
                <input
                  type="text"
                  required
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3.5 py-2.5 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#242126] block mb-1">
                  {language === 'fr' ? 'Adresse E-mail' : 'البريد الإلكتروني'}
                </label>
                <input
                  type="email"
                  required
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3.5 py-2.5 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#242126] block mb-1">
                  {language === 'fr' ? 'Âge (pour contrôle limite légale)' : 'السن (للتأكد من الحد الأقصى القانوني)'}
                </label>
                <input
                  type="number"
                  min="18"
                  max="65"
                  required
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value, 10) || 18 })}
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3.5 py-2.5 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#242126] block mb-1">
                  {language === 'fr' ? 'Niveau de Diplôme' : 'المستوى الدراسي / الدبلوم'}
                </label>
                <select
                  value={profile.degreeLevel}
                  onChange={(e) => setProfile({ ...profile, degreeLevel: e.target.value })}
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3.5 py-2.5 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B] focus:bg-white cursor-pointer"
                >
                  <option value="Doctorat">Doctorat (الدكتوراه)</option>
                  <option value="Master">Master / Ingénieur d’État (ماستر / مهندس دولة)</option>
                  <option value="Licence">Licence Fondamentale ou Professionnelle (الإجازة)</option>
                  <option value="Bac+2">Bac+2 : DTS / DUT / BTS (تقني متخصص)</option>
                  <option value="Bac">Baccalauréat (الباكالوريا)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#242126] block mb-1">
                  {language === 'fr' ? 'Spécialité / Filière' : 'التخصص / الشعبة'}
                </label>
                <input
                  type="text"
                  list="specialties-list"
                  value={profile.specialty}
                  onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                  placeholder={language === 'fr' ? 'Choisissez ou tapez votre spécialité…' : 'اختر أو اكتب تخصصك…'}
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3.5 py-2.5 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B] focus:bg-white font-medium"
                />
                <datalist id="specialties-list">
                  <option value="Droit privé" />
                  <option value="Droit public" />
                  <option value="Sciences juridiques" />
                  <option value="Économie" />
                  <option value="Gestion" />
                  <option value="Finance" />
                  <option value="Comptabilité" />
                  <option value="Audit et contrôle de gestion" />
                  <option value="Management des systèmes d'information" />
                  <option value="Gestion des ressources humaines" />
                  <option value="Secrétariat et bureautique" />
                  <option value="Informatique" />
                  <option value="Développement informatique" />
                  <option value="Réseaux et sécurité" />
                  <option value="Cybersécurité" />
                  <option value="Intelligence artificielle et data" />
                  <option value="Statistique" />
                  <option value="Génie civil" />
                  <option value="BTP" />
                  <option value="Architecture" />
                  <option value="Génie électrique" />
                  <option value="Systèmes embarqués" />
                  <option value="Génie mécanique" />
                  <option value="Mécanique et électricité automobiles" />
                  <option value="Génie industriel" />
                  <option value="Énergétique" />
                  <option value="Agronomie" />
                  <option value="Agriculture" />
                  <option value="Techniques agricoles" />
                  <option value="Médecine" />
                  <option value="Pharmacie" />
                  <option value="Soins infirmiers" />
                  <option value="Kinésithérapie" />
                  <option value="Santé publique" />
                  <option value="Sciences de l'éducation" />
                  <option value="Enseignement" />
                  <option value="Mathématiques" />
                  <option value="Mathématiques appliquées" />
                  <option value="Physique" />
                  <option value="Chimie" />
                  <option value="Biologie" />
                  <option value="Lettres et langues" />
                  <option value="Traduction" />
                  <option value="Sciences politiques" />
                  <option value="Géographie et SIG" />
                  <option value="Commerce" />
                  <option value="Inspection du travail" />
                  <option value="Douanes" />
                  <option value="Sécurité (police / protection civile)" />
                </datalist>
                <p className="text-[10px] text-[#9A93A0] mt-1">
                  {language === 'fr'
                    ? 'Vous pouvez taper librement votre spécialité si elle n’est pas dans la liste.'
                    : 'يمكنك كتابة تخصصك بحرية إذا لم يكن في القائمة.'}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#242126] block mb-1">
                  {language === 'fr' ? 'Région de résidence au Maroc' : 'جهة الإقامة بالمغرب'}
                </label>
                <select
                  value={profile.region}
                  onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3.5 py-2.5 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B] focus:bg-white cursor-pointer"
                >
                  <option value="Rabat-Salé-Kénitra">Rabat-Salé-Kénitra (الرباط - سلا - القنيطرة)</option>
                  <option value="Casablanca-Settat">Casablanca-Settat (الدار البيضاء - سطات)</option>
                  <option value="Fès-Meknès">Fès-Meknès (فاس - مكناس)</option>
                  <option value="Marrakech-Safi">Marrakech-Safi (مراكش - آسفي)</option>
                  <option value="Tanger-Tétouan-Al Hoceïma">Tanger-Tétouan-Al Hoceïma (طنجة - تطوان - الحسيمة)</option>
                  <option value="Souss-Massa">Souss-Massa (سوس - ماسة)</option>
                  <option value="Béni Mellal-Khénifra">Béni Mellal-Khénifra (بني ملال - خنيفرة)</option>
                  <option value="Oriental">L'Oriental (الشرق)</option>
                  <option value="Autre région">Autre région du Royaume (جهة أخرى)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F1E5EC] flex justify-end">
              <button
                type="submit"
                className="bg-[#8D174B] hover:bg-[#75123E] text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{language === 'fr' ? 'Enregistrer les modifications' : 'حفظ التعديلات في المتصفح'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: QCM History & Analytics */}
      {activeProfileTab === 'qcm' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#F1E5EC] rounded-2xl p-4 shadow-xs text-center">
              <span className="text-2xl font-extrabold text-[#8D174B] block">{completedQcmScores.length}</span>
              <span className="text-xs text-[#6E6773]">
                {language === 'fr' ? 'Sessions d’entraînement' : 'جلسات التدريب'}
              </span>
            </div>
            <div className="bg-white border border-[#F1E5EC] rounded-2xl p-4 shadow-xs text-center">
              <span className="text-2xl font-extrabold text-emerald-600 block">{avgQcmScore}%</span>
              <span className="text-xs text-[#6E6773]">
                {language === 'fr' ? 'Taux de réussite moyen' : 'معدل النجاح الإجمالي'}
              </span>
            </div>
            <div className="bg-white border border-[#F1E5EC] rounded-2xl p-4 shadow-xs text-center">
              <span className="text-2xl font-extrabold text-[#C73578] block">
                {completedQcmScores.length > 0 ? 'Niveau Bon' : '-'}
              </span>
              <span className="text-xs text-[#6E6773]">
                {language === 'fr' ? 'Évaluation globale' : 'التقييم العام'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {completedQcmScores.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-[#F1E5EC] p-6 shadow-xs">
                <Award className="w-12 h-12 text-[#6E6773]/40 mx-auto mb-3" />
                <h4 className="text-base font-bold text-[#242126] mb-1">{t.profile.noQcmYet}</h4>
                <p className="text-xs text-[#6E6773] max-w-sm mx-auto">
                  {language === 'fr' 
                    ? 'Accédez à l’onglet Préparation pour tester vos connaissances et suivre vos progrès ici.' 
                    : 'توجه إلى قسم الاستعداد لاجتياز اختبارات تجريبية ومتابعة تقدمك.'}
                </p>
              </div>
            ) : (
              completedQcmScores.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#F1E5EC] rounded-2xl p-4 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                      QCM
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#242126]">
                        {item.qcmId.includes('droit')
                          ? (language === 'fr' ? 'Droit Public & Organisation Administrative' : 'القانون العام والتنظيم الإداري')
                          : (language === 'fr' ? 'Tests Psychotechniques & Logique' : 'الاختبارات النفسية والتقنية')}
                      </h4>
                      <span className="text-[10px] text-[#6E6773]">{item.completedAt}</span>
                    </div>
                  </div>

                  <div className="text-end">
                    <span className="text-base font-extrabold text-[#8D174B]">
                      {item.score} / {item.total}
                    </span>
                    <span className="text-[10px] text-emerald-700 block font-semibold">
                      {Math.round((item.score / item.total) * 100)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Storage & Backup */}
      {activeProfileTab === 'storage' && (
        <div className="bg-white border border-[#F1E5EC] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-[#242126] mb-1">
              {language === 'fr' ? 'Gestion du Stockage Local Navigateur' : 'إدارة التخزين المحلي في المتصفح'}
            </h3>
            <p className="text-xs text-[#6E6773]">
              {language === 'fr'
                ? 'Vos favoris, checklists, notes et profils sont hébergés à 100% dans le stockage de votre navigateur (LocalStorage). Vous pouvez exporter vos données ou les restaurer sur un autre appareil.'
                : 'يتم تخزين جميع بياناتك وملاحظاتك محلياً داخل متصفحك بنسبة 100%. يمكنك تصدير ملفك أو استرجاعه على أي جهاز آخر.'}
            </p>
          </div>

          {importStatus && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold">
              {importStatus}
            </div>
          )}

          {/* Export & Import Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="border border-[#F1E5EC] rounded-2xl p-4 bg-[#FAF7F9]">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-5 h-5 text-[#8D174B]" />
                <h4 className="text-xs font-bold text-[#242126]">
                  {language === 'fr' ? 'Sauvegarder mes données (Export)' : 'تصدير نسخة احتياطية'}
                </h4>
              </div>
              <p className="text-[11px] text-[#6E6773] mb-3">
                {language === 'fr'
                  ? 'Téléchargez un fichier JSON contenant votre profil, vos concours suivis et vos scores.'
                  : 'حمّل ملف JSON يحتوي على معطياتك ومبارياتك المحفوظة.'}
              </p>
              <button
                type="button"
                onClick={handleExportData}
                className="w-full bg-white hover:bg-gray-50 border border-[#F1E5EC] text-[#8D174B] font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Télécharger la sauvegarde' : 'تحميل النسخة الاحتياطية'}</span>
              </button>
            </div>

            <div className="border border-[#F1E5EC] rounded-2xl p-4 bg-[#FAF7F9]">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-emerald-700" />
                <h4 className="text-xs font-bold text-[#242126]">
                  {language === 'fr' ? 'Restaurer une sauvegarde (Import)' : 'استيراد نسخة احتياطية'}
                </h4>
              </div>
              <p className="text-[11px] text-[#6E6773] mb-3">
                {language === 'fr'
                  ? 'Sélectionnez un fichier JSON KounKour pour recharger vos données sur ce navigateur.'
                  : 'اختر ملف JSON لاسترجاع بياناتك السابقة.'}
              </p>
              <label className="w-full bg-white hover:bg-gray-50 border border-[#F1E5EC] text-emerald-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Parcourir un fichier JSON' : 'اختيار ملف JSON'}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Language and notifications settings */}
          <div className="pt-4 border-t border-[#F1E5EC] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-[#8D174B]" />
                <div>
                  <strong className="text-xs sm:text-sm font-bold text-[#242126] block">
                    {t.profile.languageSelect}
                  </strong>
                  <span className="text-[11px] text-[#6E6773]">
                    {language === 'fr' ? 'Français (LTR) / العربية (RTL)' : 'العربية (RTL) / الفرنسية (LTR)'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-[#F8F2F5] p-1 rounded-xl">
                <button
                  onClick={() => onLanguageChange('fr')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === 'fr' ? 'bg-white text-[#8D174B] shadow-xs' : 'text-[#6E6773]'
                  }`}
                >
                  Français
                </button>
                <button
                  onClick={() => onLanguageChange('ar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === 'ar' ? 'bg-white text-[#8D174B] shadow-xs' : 'text-[#6E6773]'
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>

            {/* Clear data button */}
            <div className="pt-4 border-t border-[#F1E5EC] flex items-center justify-between">
              <div className="text-xs text-[#6E6773]">
                <span>{language === 'fr' ? 'Effacer toutes les données locales du navigateur :' : 'مسح البيانات المخزنة بالمتصفح :'}</span>
              </div>
              <button
                type="button"
                onClick={handleResetData}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Réinitialiser le stockage' : 'إعادة ضبط التخزين'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
