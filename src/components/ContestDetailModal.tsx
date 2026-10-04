import React, { useState, useEffect } from 'react';
import { Contest, Language } from '../types';
import { translations } from '../i18n/translations';
import { 
  X, ArrowLeft, ArrowRight, Bookmark, Share2, Calendar, MapPin, 
  GraduationCap, Users, ShieldCheck, Download, ExternalLink, 
  FileText, Clock, Award, MessageCircle, AlertCircle, Sparkles, Check,
  CheckCircle2, Tag, AlertTriangle, Eye, DollarSign, Building2
} from 'lucide-react';
import { PdfViewerModal } from './PdfViewerModal';
import { loadCandidateProfile, checkEligibility } from '../utils/candidateStorage';
import { resolveAdministrationLogo } from '../utils/radarStorage';
import { inferSalaryScaleFromContest } from '../data/salaryScales';
import { downloadContestIcs, getGoogleCalendarUrl } from '../utils/calendarExport';

interface ContestDetailModalProps {
  contest: Contest | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  isBookmarked: boolean;
  onToggleBookmark: (contestId: string, e: React.MouseEvent) => void;
  onOpenCommunityTopic?: (contestId: string) => void;
  onOpenSalarySimulator?: (contest: Contest) => void;
}

// Identifiant du concours SUR emploi-public.ma (pour l'arrêté et les listes officielles).
function emploiPublicId(c: { id: string; officialSourceUrl?: string }): string | null {
  const url = c.officialSourceUrl || '';
  if (!url.includes('emploi-public.ma')) return null;
  const m = url.match(/details\/([0-9a-f-]{36})/i);
  return m ? m[1] : null;
}

export const ContestDetailModal: React.FC<ContestDetailModalProps> = ({
  contest,
  isOpen,
  onClose,
  language,
  isBookmarked,
  onToggleBookmark,
  onOpenCommunityTopic,
  onOpenSalarySimulator,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'apply' | 'exams' | 'docs' | 'community'>('info');
  const [copied, setCopied] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [activePdfTitle, setActivePdfTitle] = useState<string>('');

  const t = translations[language];
  const isRTL = language === 'ar';
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  if (!isOpen || !contest) return null;

  const profile = loadCandidateProfile();
  const eligibility = checkEligibility(contest, profile);
  const epId = emploiPublicId(contest);
  
  const officialArreteUrl = contest.arreteUrl || 
    (epId ? `https://www.emploi-public.ma/fr/concours/download/arrete/${epId}` : 
    (contest.officialSourceUrl && contest.officialSourceUrl.endsWith('.pdf') ? contest.officialSourceUrl : ''));
  
  const applicationUrl = contest.applyUrl || contest.depositSite || contest.officialSourceUrl || contest.administration?.officialWebsite || '';

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Check if exams exist
  const hasExams = (contest.exams?.written && contest.exams.written.length > 0) || 
    (contest.exams?.oral && contest.exams.oral.length > 0);

  // Available tabs (only non-empty ones!)
  const tabs: { id: 'info' | 'apply' | 'exams' | 'docs' | 'community'; label: string; count?: number }[] = [
    { id: 'info', label: language === 'fr' ? 'Informations' : 'معلومات' },
    { id: 'apply', label: language === 'fr' ? 'Comment postuler' : 'طريقة الترشيح' },
    ...(hasExams ? [{ id: 'exams' as const, label: language === 'fr' ? 'Épreuves' : 'الاختبارات' }] : []),
    { id: 'docs', label: language === 'fr' ? 'Documents' : 'الوثائق', count: (officialArreteUrl ? 1 : 0) + (contest.convoquesUrl ? 1 : 0) + (contest.documents?.length || 0) },
    { id: 'community', label: language === 'fr' ? 'Discussion' : 'المنتدى' },
  ];

  // Resolve administration logo / image
  const officialEmblem = contest.image || contest.administration?.logo || 
    resolveAdministrationLogo(contest.administration?.name?.fr, contest.administration?.category, contest.title?.fr);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-center items-start sm:items-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-3xl min-h-screen sm:min-h-0 sm:max-h-[92vh] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between my-auto border border-[#F1E5EC]">
        
        {/* Sticky Top App Bar */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#F1E5EC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-2xl hover:bg-gray-100 text-[#242126] transition-colors cursor-pointer"
              title="Fermer"
            >
              <BackIcon className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-[#8D174B] bg-[#FAF0F5] px-3 py-1 rounded-full border border-[#8D174B]/15 truncate max-w-[200px] sm:max-w-xs">
              {contest.administration?.name?.[language] || contest.administration?.name?.fr}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-2 rounded-2xl hover:bg-gray-100 text-[#6E6773] hover:text-[#8D174B] transition-colors relative cursor-pointer"
              title="Partager"
            >
              <Share2 className="w-5 h-5" />
              {copied && (
                <span className="absolute -bottom-8 start-1/2 -translate-x-1/2 text-[10px] bg-[#242126] text-white px-2 py-0.5 rounded-lg shadow-md whitespace-nowrap">
                  {t.contests.copiedToClipboard}
                </span>
              )}
            </button>

            <button
              onClick={(e) => onToggleBookmark(contest.id, e)}
              className={`p-2 rounded-2xl transition-colors cursor-pointer ${
                isBookmarked 
                  ? 'bg-[#FDF2F7] text-[#8D174B]' 
                  : 'hover:bg-gray-100 text-[#6E6773] hover:text-[#8D174B]'
              }`}
              title={isBookmarked ? t.contests.bookmarked : t.contests.bookmark}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors ms-1 cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto">
          
          {/* ========================================================================= */}
          {/* 1. HERO IDENTITY & MOROCCAN BANNER (IMMEDIATE VISUAL SCAN IN 5 SECONDS) */}
          {/* ========================================================================= */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#240A18] via-[#8D174B] to-[#450C25] text-white p-5 sm:p-7">
            {/* Subtle Moroccan geometric watermark */}
            <div 
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.9'%3E%3Cpath d='M24 0 L29 19 L48 24 L29 29 L24 48 L19 29 L0 24 L19 19 Z'/%3E%3Cpath d='M24 8 L32 24 L24 40 L16 24 Z' stroke-dasharray='1 2'/%3E%3Ccircle cx='24' cy='24' r='4'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '36px 36px',
              }}
            />

            <div className="relative z-10 space-y-4">
              {/* Administration logo + Status tag */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 shadow-lg shrink-0 flex items-center justify-center overflow-hidden border border-white/80">
                    <img
                      src={officialEmblem}
                      alt="Emblème officiel"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as any).src = resolveAdministrationLogo(contest.administration?.name?.fr, contest.administration?.category, contest.title?.fr);
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-200 block">
                      {contest.administration?.name?.[language] || contest.administration?.name?.fr}
                    </span>
                    {contest.referenceCode && (
                      <span className="text-[10px] text-rose-300/80 font-mono">
                        {contest.referenceCode}
                      </span>
                    )}
                  </div>
                </div>

                <span className="px-3.5 py-1 rounded-full bg-white text-[#8D174B] text-xs font-black shadow-md shrink-0">
                  {contest.status === 'closing_soon' 
                    ? (language === 'fr' ? '● Bientôt clôturé' : '● قريب الإغلاق')
                    : contest.status === 'in_progress'
                    ? (contest.stage === 'oral' ? '● Convoqués Oral' : '● Convoqués Écrit')
                    : (language === 'fr' ? '● Ouvert' : '● مفتوح')}
                </span>
              </div>

              {/* Main Title */}
              <h1 className="text-lg sm:text-2xl font-black text-white leading-snug drop-shadow-sm">
                {contest.title[language] || contest.title.fr}
              </h1>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. THE 3 CORE INFORMATION BLOCKS (SECTION 10: DIPLÔME • SPÉCIALITÉ • POSTES) */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-6 space-y-5 bg-[#FAF7F9]/60">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Block 1: DIPLÔME REQUIS */}
              <div className="bg-white rounded-2xl p-4 border border-[#F1E5EC] shadow-2xs flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#FAF0F5] text-[#8D174B] flex items-center justify-center shrink-0 border border-[#8D174B]/15">
                  <GraduationCap className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-extrabold text-gray-400 block tracking-wider">
                    {language === 'fr' ? 'Diplôme requis' : 'الدبلوم المطلوب'}
                  </span>
                  <strong className="text-sm sm:text-base font-black text-[#8D174B] truncate block">
                    {contest.degreeLevel || (language === 'fr' ? 'Selon arrêté' : 'حسب القرار')}
                  </strong>
                </div>
              </div>

              {/* Block 2: SPÉCIALITÉ */}
              <div className="bg-white rounded-2xl p-4 border border-[#F1E5EC] shadow-2xs flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#FAF0F5] text-[#8D174B] flex items-center justify-center shrink-0 border border-[#8D174B]/15">
                  <Tag className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-extrabold text-gray-400 block tracking-wider">
                    {language === 'fr' ? 'Spécialité' : 'التخصص'}
                  </span>
                  <div className="text-xs sm:text-sm font-black text-[#242126] leading-snug whitespace-normal break-words mt-0.5">
                    {contest.specialtiesList && contest.specialtiesList.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {contest.specialtiesList.map((sp, idx) => (
                          <span key={idx} className="inline-block px-2 py-0.5 rounded-lg bg-[#FAF0F5] text-[#8D174B] text-[11px] font-bold border border-[#8D174B]/15 whitespace-normal break-words">
                            {sp}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="whitespace-normal break-words">
                        {contest.specialty?.[language] || contest.specialty?.fr || (language === 'fr' ? 'Toutes spécialités' : 'كافة التخصصات')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Block 3: NOMBRE DE POSTES */}
              <div className="bg-white rounded-2xl p-4 border border-[#F1E5EC] shadow-2xs flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                  <Users className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-extrabold text-gray-400 block tracking-wider">
                    {language === 'fr' ? 'Nombre de postes' : 'عدد المناصب'}
                  </span>
                  <strong className="text-sm sm:text-base font-black text-emerald-800 truncate block">
                    {contest.postsCount > 0 ? `${contest.postsCount} ${language === 'fr' ? 'postes' : 'منصب'}` : (language === 'fr' ? 'À vérifier' : 'غير محدد')}
                  </strong>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. DATES, DEADLINE & SALARY ROW */}
            {/* ========================================================================= */}
            <div className="bg-white rounded-2xl p-4 border border-[#F1E5EC] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Date limite */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF0F5] text-[#8D174B] flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-[#8D174B]" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-gray-400 block">
                    {language === 'fr' ? 'Date limite de dépôt' : 'آخر أجل لإيداع الترشيحات'}
                  </span>
                  <strong className="text-sm font-black text-[#8D174B]">
                    {contest.deadlineDate || (language === 'fr' ? 'À vérifier' : 'غير محدد')}
                  </strong>
                </div>
              </div>

              {/* Date du concours if officially available */}
              {contest.contestDate && (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#242126] border-t sm:border-t-0 sm:border-s border-gray-100 sm:ps-4 pt-2 sm:pt-0">
                  <Clock className="w-4 h-4 text-[#8D174B]" />
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold">
                      {language === 'fr' ? 'Date du concours' : 'تاريخ إجراء المباراة'}
                    </span>
                    <strong className="text-xs text-[#242126] font-extrabold">{contest.contestDate}</strong>
                  </div>
                </div>
              )}

              {/* Calendar Export Buttons */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                <a
                  href={getGoogleCalendarUrl(contest, language)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#FAF4F7] hover:bg-[#F9E6F0] text-[#8D174B] border border-[#8D174B]/20 text-[11px] font-extrabold flex items-center gap-1 transition-all"
                  title="Ajouter à Google Calendar"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Google</span>
                </a>
                <button
                  onClick={() => downloadContestIcs(contest, language)}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF4F7] hover:bg-[#F9E6F0] text-[#8D174B] border border-[#8D174B]/20 text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                  title="Télécharger rappel .ics"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.ICS</span>
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 4. PRIMARY ACTION BUTTONS (HIGH VISIBILITY ABOVE THE FOLD) */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Primary CTA: Postuler sur le site officiel */}
              {applicationUrl ? (
                <a
                  href={applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 rounded-2xl bg-[#8D174B] hover:bg-[#70113B] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#8D174B]/20 transition-all cursor-pointer"
                >
                  <span>{language === 'fr' ? 'Postuler sur le site officiel →' : 'الترشيح عبر البوابة الرسمية →'}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <div className="w-full py-3.5 px-4 rounded-2xl bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center text-center">
                  <span>{language === 'fr' ? 'Modalités de dépôt indiquées sur l’arrêté' : 'طريقة الترشيح محددة بقرار المباراة'}</span>
                </div>
              )}

              {/* Official PDF / Announcement in-site viewer CTA */}
              {officialArreteUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setActivePdfUrl(officialArreteUrl);
                    setActivePdfTitle(language === 'fr' ? "Arrêté d’ouverture officiel (PDF)" : "قرار فتح المباراة (PDF)");
                  }}
                  className="w-full py-3.5 px-5 rounded-2xl bg-[#FAF0F5] hover:bg-[#F3E2EC] text-[#8D174B] border border-[#8D174B]/30 font-black text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#8D174B]" />
                  <span>{language === 'fr' ? 'Voir l’arrêté officiel (PDF)' : 'معاينة قرار المباراة (PDF)'}</span>
                </button>
              ) : (contest.officialSourceUrl || contest.image || contest.administration?.officialWebsite) ? (
                <button
                  type="button"
                  onClick={() => {
                    setActivePdfUrl(contest.officialSourceUrl || contest.image || contest.administration?.officialWebsite || '');
                    setActivePdfTitle(contest.title[language] || contest.title.fr);
                  }}
                  className="w-full py-3.5 px-5 rounded-2xl bg-[#FAF0F5] hover:bg-[#F3E2EC] text-[#8D174B] border border-[#8D174B]/30 font-black text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#8D174B]" />
                  <span>{language === 'fr' ? 'Voir l’annonce officielle' : 'معاينة الإعلان الرسمي'}</span>
                </button>
              ) : null}
            </div>

            {/* Smart Match Eligibility Verdict Banner */}
            {eligibility && (
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                eligibility.verdict === 'eligible' 
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : eligibility.verdict === 'verify'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                  : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 shrink-0 ${
                    eligibility.verdict === 'eligible' ? 'text-emerald-700' : eligibility.verdict === 'verify' ? 'text-amber-700' : 'text-rose-700'
                  }`} />
                  <span className="font-bold">
                    {language === 'fr' ? 'Smart Match :' : 'المطابقة الذكية :'}
                  </span>
                  <span className="font-medium truncate max-w-md">
                    {eligibility.reasons?.[0]?.[language] || eligibility.reasons?.[0]?.fr || (language === 'fr' ? 'Profil vérifié' : 'تم التدقيق')}
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                  eligibility.verdict === 'eligible' ? 'bg-emerald-600 text-white' : eligibility.verdict === 'verify' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'
                }`}>
                  {eligibility.verdict === 'eligible' ? (language === 'fr' ? 'Éligible' : 'مؤهل') : eligibility.verdict === 'verify' ? (language === 'fr' ? 'À vérifier' : 'للتحقق') : (language === 'fr' ? 'Non éligible' : 'غير مؤهل')}
                </span>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 5. TABS NAVIGATION (ONLY NON-EMPTY SECTIONS) */}
          {/* ========================================================================= */}
          <div className="bg-white border-y border-[#F1E5EC] px-4 sticky top-14 z-20 flex overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`py-3.5 px-4 font-bold text-xs sm:text-sm whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'border-[#8D174B] text-[#8D174B]'
                      : 'border-transparent text-[#6E6773] hover:text-[#242126]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#FDF2F7] text-[#8D174B] text-[10px] font-extrabold">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* 6. TAB CONTENT PANELS */}
          {/* ========================================================================= */}
          <div className="p-5 sm:p-7 space-y-6">

            {/* TAB 1: INFORMATIONS & CONDITIONS */}
            {activeSubTab === 'info' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white rounded-3xl border border-[#F1E5EC] p-5 shadow-xs space-y-4">
                  <h3 className="text-sm font-extrabold text-[#1F1924] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#8D174B]" />
                    <span>{language === 'fr' ? 'Conditions d’accès au concours' : 'شروط المشاركة في المباراة'}</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Grade & Cadre */}
                    {(contest.grade_fr || contest.grade) && (
                      <div className="p-3 bg-[#FAF7F9] rounded-2xl border border-[#F1E5EC]">
                        <span className="text-[10px] font-extrabold uppercase text-gray-400 block mb-0.5">
                          {language === 'fr' ? 'Grade / Cadre' : 'الدرجة والإطار'}
                        </span>
                        <strong className="text-xs text-[#242126] font-bold block">
                          {contest.grade_fr || contest.grade}
                        </strong>
                      </div>
                    )}

                    {/* Limite d'âge */}
                    {contest.criteria?.ageLimit?.fr?.trim() && (
                      <div className="p-3 bg-[#FAF7F9] rounded-2xl border border-[#F1E5EC]">
                        <span className="text-[10px] font-extrabold uppercase text-gray-400 block mb-0.5">
                          {language === 'fr' ? 'Limite d’âge légale' : 'السن القانوني'}
                        </span>
                        <strong className="text-xs text-[#242126] font-bold block">
                          {contest.criteria.ageLimit[language] || contest.criteria.ageLimit.fr}
                        </strong>
                      </div>
                    )}

                    {/* Nationalité */}
                    {contest.criteria?.nationality?.fr?.trim() && (
                      <div className="p-3 bg-[#FAF7F9] rounded-2xl border border-[#F1E5EC]">
                        <span className="text-[10px] font-extrabold uppercase text-gray-400 block mb-0.5">
                          {language === 'fr' ? 'Nationalité' : 'الجنسية'}
                        </span>
                        <strong className="text-xs text-[#242126] font-bold block">
                          {contest.criteria.nationality[language] || contest.criteria.nationality.fr}
                        </strong>
                      </div>
                    )}

                    {/* Région / Affectation */}
                    {(contest.region?.fr || contest.location?.fr) && (
                      <div className="p-3 bg-[#FAF7F9] rounded-2xl border border-[#F1E5EC]">
                        <span className="text-[10px] font-extrabold uppercase text-gray-400 block mb-0.5">
                          {language === 'fr' ? 'Lieu d’affectation / Région' : 'جهة التعيين'}
                        </span>
                        <strong className="text-xs text-[#242126] font-bold block">
                          {contest.region?.[language] || contest.location?.[language] || contest.region?.fr || contest.location?.fr}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Overview summary text if available */}
                  {contest.overviewSummary?.[language] && (
                    <div className="pt-3 border-t border-[#FAF4F7] text-xs text-[#4A4250] leading-relaxed">
                      {contest.overviewSummary[language]}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: COMMENT POSTULER */}
            {activeSubTab === 'apply' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white rounded-3xl border border-[#F1E5EC] p-5 shadow-xs space-y-4">
                  <h3 className="text-sm font-extrabold text-[#1F1924] flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-[#8D174B]" />
                    <span>{language === 'fr' ? 'Modalités officielles de candidature' : 'كيفية وإجراءات إيداع الترشيح'}</span>
                  </h3>

                  <div className="space-y-3 text-xs text-[#3E3844]">
                    <div className="p-3.5 bg-[#FAF7F9] rounded-2xl border border-[#F1E5EC] space-y-1.5">
                      <strong className="block text-[#8D174B] font-extrabold text-xs">
                        1. {language === 'fr' ? 'Dépôt du dossier en ligne' : 'إيداع الترشيح إلكترونياً'}
                      </strong>
                      <p className="leading-relaxed">
                        {language === 'fr'
                          ? 'Les candidatures doivent être enregistrées obligatoirement avant la date limite sur le portail officiel de recrutement.'
                          : 'يجب تسجيل الترشيحات وجوباً عبر البوابة الرسمية المعتمدة قبل انصرام آخر أجل.'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#FAF7F9] rounded-2xl border border-[#F1E5EC] space-y-1.5">
                      <strong className="block text-[#8D174B] font-extrabold text-xs">
                        2. {language === 'fr' ? 'Pièces justificatives à joindre' : 'الوثائق والشهادات المطلوبة'}
                      </strong>
                      <ul className="list-disc list-inside space-y-1 text-[#6E6773] ps-1">
                        <li>{language === 'fr' ? 'Copie de la Carte Nationale d’Identité (CNIE)' : 'نسخة من البطاقة الوطنية للتعريف الإلكترونية'}</li>
                        <li>{language === 'fr' ? 'Copie du Diplôme exigé ou attestation de réussite' : 'نسخة من الدبلوم المطلوب أو شهادة النجاح'}</li>
                        <li>{language === 'fr' ? 'CV actualisé avec photo d’identité' : 'سيرة ذاتية محينة مع صورة شمسية'}</li>
                        <li>{language === 'fr' ? 'Équivalence pour les diplômes étrangers (le cas échéant)' : 'قرار المعادلة بالنسبة للشهادات الأجنبية'}</li>
                      </ul>
                    </div>
                  </div>

                  {applicationUrl && (
                    <div className="pt-2">
                      <a
                        href={applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 rounded-2xl bg-[#8D174B] hover:bg-[#70113B] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <span>{language === 'fr' ? 'Accéder à la plateforme de dépôt →' : 'الانتقال إلى بوابة الترشيح →'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: ÉPREUVES (ONLY IF REAL EXAMS EXIST) */}
            {activeSubTab === 'exams' && hasExams && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white rounded-3xl border border-[#F1E5EC] p-5 shadow-xs space-y-4">
                  <h3 className="text-sm font-extrabold text-[#1F1924] flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#8D174B]" />
                    <span>{language === 'fr' ? 'Programme & Épreuves du concours' : 'برنامج ومواد الاختبارات'}</span>
                  </h3>

                  {/* Written Exams */}
                  {contest.exams?.written && contest.exams.written.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#8D174B] block">
                        {language === 'fr' ? 'Épreuves écrites :' : 'الاختبارات الكتابية :'}
                      </span>
                      {contest.exams.written.map((item, idx) => (
                        <div key={idx} className="p-3 bg-[#FAF7F9] rounded-2xl border border-[#F1E5EC] flex items-center justify-between gap-3 text-xs">
                          <div>
                            <strong className="text-[#242126] font-bold block">{item.title[language] || item.title.fr}</strong>
                            <span className="text-[11px] text-[#6E6773]">Durée : {item.duration}</span>
                          </div>
                          <span className="px-2.5 py-1 rounded-xl bg-white text-[#8D174B] font-extrabold border border-[#F1E5EC] shadow-2xs">
                            Coeff. {item.coefficient}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Oral Exams */}
                  {contest.exams?.oral && contest.exams.oral.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[#FAF4F7]">
                      <span className="text-xs font-bold text-[#8D174B] block">
                        {language === 'fr' ? 'Épreuve orale :' : 'الاختبار الشفوي :'}
                      </span>
                      {contest.exams.oral.map((item, idx) => (
                        <div key={idx} className="p-3 bg-[#FAF7F9] rounded-2xl border border-[#F1E5EC] flex items-center justify-between gap-3 text-xs">
                          <div>
                            <strong className="text-[#242126] font-bold block">{item.title[language] || item.title.fr}</strong>
                            <span className="text-[11px] text-[#6E6773]">Durée : {item.duration}</span>
                          </div>
                          <span className="px-2.5 py-1 rounded-xl bg-white text-[#8D174B] font-extrabold border border-[#F1E5EC] shadow-2xs">
                            Coeff. {item.coefficient}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: DOCUMENTS OFFICIELS & LISTES */}
            {activeSubTab === 'docs' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white rounded-3xl border border-[#F1E5EC] p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-extrabold text-[#1F1924] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#8D174B]" />
                    <span>{language === 'fr' ? 'Documents officiels téléchargeables' : 'الوثائق الرسمية القابلة للتحميل'}</span>
                  </h3>

                  {/* Arrêté PDF Card */}
                  {officialArreteUrl ? (
                    <div className="p-4 rounded-2xl border border-[#8D174B]/20 bg-[#FAF0F5] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#8D174B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          PDF
                        </div>
                        <div>
                          <strong className="text-xs sm:text-sm font-extrabold text-[#242126] block">
                            {language === 'fr' ? 'Arrêté d’ouverture du concours' : 'قرار فتح وإجراء المباراة (PDF)'}
                          </strong>
                          <span className="text-[11px] text-[#6E6773]">
                            {language === 'fr' ? 'Document officiel scanné' : 'وثيقة رسمية صادرة بالجريدة أو البوابة'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setActivePdfUrl(officialArreteUrl);
                            setActivePdfTitle(language === 'fr' ? "Arrêté d’ouverture officiel (PDF)" : "قرار فتح المباراة (PDF)");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white text-[#8D174B] border border-[#8D174B]/20 text-xs font-bold flex items-center gap-1 shadow-2xs hover:bg-[#FAF0F5] transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{language === 'fr' ? 'Voir' : 'معاينة'}</span>
                        </button>
                        <a
                          href={officialArreteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="px-3 py-1.5 rounded-xl bg-[#8D174B] text-white text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-[#70113B] transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{language === 'fr' ? 'Télécharger' : 'تحميل'}</span>
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {/* Liste des convoqués si publiée */}
                  {contest.convoquesUrl && (
                    <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          PDF
                        </div>
                        <div>
                          <strong className="text-xs sm:text-sm font-extrabold text-[#242126] block">
                            {language === 'fr' ? 'Liste des candidats convoqués aux épreuves' : 'لائحة المرشحين المدعوين لاجتياز الاختبارات'}
                          </strong>
                          <span className="text-[11px] text-blue-800">
                            {language === 'fr' ? 'Publication officielle' : 'نشر رسمي'}
                          </span>
                        </div>
                      </div>

                      <a
                        href={contest.convoquesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-blue-700 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{language === 'fr' ? 'Télécharger' : 'تحميل'}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: DISCUSSION & ENTRAIDE */}
            {activeSubTab === 'community' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white rounded-3xl border border-[#F1E5EC] p-6 text-center shadow-xs space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF0F5] text-[#8D174B] flex items-center justify-center mx-auto">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-extrabold text-[#242126]">
                    {language === 'fr' ? 'Salon d’entraide pour ce concours' : 'فضاء النقاش والتبادل لهذه المباراة'}
                  </h4>
                  <p className="text-xs text-[#6E6773] max-w-md mx-auto leading-relaxed">
                    {language === 'fr' 
                      ? 'Échangez avec les autres candidats à ce concours : questions, conseils de préparation et retours d’expérience.' 
                      : 'تواصل مع باقي المترشحين، تبادل نصائح الامتحان ونماذج الاختبارات السابقة.'}
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenCommunityTopic) onOpenCommunityTopic(contest.id);
                      }}
                      className="px-6 py-3 rounded-2xl bg-[#8D174B] hover:bg-[#70113B] text-white font-extrabold text-xs shadow-md shadow-[#8D174B]/20 transition-all cursor-pointer"
                    >
                      {language === 'fr' ? 'Rejoindre la communauté du concours →' : 'الانتقال إلى منتدى المباراة →'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Disclaimer Footer Note */}
            <div className="pt-2">
              <div className="flex items-start gap-2 text-[11px] text-[#8E8694] bg-[#FAF7F9] p-3 rounded-2xl border border-[#F1E5EC]">
                <AlertCircle className="w-4 h-4 text-[#8D174B] shrink-0 mt-0.5" />
                <span>
                  {language === 'fr' 
                    ? 'KounKour relaie les informations officielles issues des arrêtés et portails ministériels marocains. Seul l’arrêté officiel fait foi.' 
                    : 'تنشر المنصة البيانات الرسمية المعتمدة بقرارات فتح المباريات. القرار الرسمي المرفق هو المرجع القانوني الملزم.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Bottom Bar on Mobile */}
        <div className="sticky bottom-0 z-20 bg-white border-t border-[#F1E5EC] p-3 sm:hidden flex items-center gap-2">
          {applicationUrl ? (
            <a
              href={applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-[#8D174B] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <span>{language === 'fr' ? 'Postuler sur le site officiel' : 'الترشيح الرسمي'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
            >
              <span>{language === 'fr' ? 'Fermer la fiche' : 'إغلاق'}</span>
            </button>
          )}
        </div>
      </div>

      {/* In-Site Official PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={!!activePdfUrl}
        onClose={() => setActivePdfUrl(null)}
        pdfUrl={activePdfUrl || ''}
        title={activePdfTitle}
        contest={contest}
        language={language}
      />
    </div>
  );
};
