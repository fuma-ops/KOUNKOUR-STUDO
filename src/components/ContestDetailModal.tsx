import React, { useState, useEffect } from 'react';
import { Contest, Language } from '../types';
import { translations } from '../i18n/translations';
import { 
  X, ArrowLeft, ArrowRight, Bookmark, Share2, Calendar, MapPin, 
  GraduationCap, Users, ShieldCheck, Download, ExternalLink, 
  FileText, Clock, Award, MessageCircle, AlertCircle, Sparkles, Check,
  CheckSquare, Square, FileCheck, Trash2, AlertTriangle, ZoomIn, Image as ImageIcon,
  Eye
} from 'lucide-react';
import { PdfViewerModal } from './PdfViewerModal';
import { 
  loadCandidateProfile, checkEligibility, 
  loadCandidateTracking, updateContestTracking, CandidateTrackingItem 
} from '../utils/candidateStorage';
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
// Il est extrait STRICTEMENT d'une URL de type emploi-public.ma/.../details/<uuid>.
// L'identifiant interne Supabase ne doit JAMAIS être envoyé à emploi-public (provoquait une Erreur 500).
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
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'conditions' | 'exams' | 'documents' | 'discussions'>('overview');
  const [copied, setCopied] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [activePdfTitle, setActivePdfTitle] = useState<string>('');

  const profile = loadCandidateProfile();
  const eligibility = contest ? checkEligibility(contest, profile) : null;
  const epId = contest ? emploiPublicId(contest) : null;
  const officialArreteUrl = contest
    ? (contest.arreteUrl || (epId ? `https://www.emploi-public.ma/fr/concours/download/arrete/${epId}` : (contest.officialSourceUrl && contest.officialSourceUrl.endsWith('.pdf') ? contest.officialSourceUrl : '')))
    : '';
  const applicationUrl = contest
    ? (contest.depositSite || contest.applyUrl || contest.officialSourceUrl || contest.administration?.officialWebsite || '')
    : '';
  const [tracking, setTracking] = useState<CandidateTrackingItem>(() => {
    if (!contest) {
      return {
        contestId: '',
        status: 'interested',
        checklist: {
          cinCertified: false,
          diplomaCertified: false,
          policeRecord: false,
          cvUpdated: false,
          motivationLetter: false,
          officialForm: false,
        },
        savedAt: '',
      };
    }
    const all = loadCandidateTracking();
    return all[contest.id] || {
      contestId: contest.id,
      status: 'interested',
      checklist: {
        cinCertified: false,
        diplomaCertified: false,
        policeRecord: false,
        cvUpdated: false,
        motivationLetter: false,
        officialForm: false,
      },
      savedAt: new Date().toISOString().split('T')[0],
    };
  });

  useEffect(() => {
    if (contest) {
      const all = loadCandidateTracking();
      if (all[contest.id]) {
        setTracking(all[contest.id]);
      }
    }
  }, [contest]);

  if (!isOpen || !contest) return null;

  const handleToggleChecklist = (key: keyof CandidateTrackingItem['checklist']) => {
    const nextChecklist = {
      ...tracking.checklist,
      [key]: !tracking.checklist[key],
    };
    const updatedMap = updateContestTracking(contest.id, { checklist: nextChecklist });
    setTracking(updatedMap[contest.id]);
  };

  const t = translations[language];
  const isRTL = language === 'ar';
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-3xl min-h-screen sm:min-h-0 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Floating App Bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-[#F1E5EC] flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-[#242126] transition-colors"
            title="Retour"
          >
            <BackIcon className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-gray-100 text-[#6E6773] hover:text-[#8D174B] transition-colors relative"
              title={t.contests.share}
            >
              <Share2 className="w-5 h-5" />
              {copied && (
                <span className="absolute -bottom-8 start-1/2 -translate-x-1/2 text-[10px] bg-[#242126] text-white px-2 py-0.5 rounded shadow whitespace-nowrap">
                  {t.contests.copiedToClipboard}
                </span>
              )}
            </button>

            <button
              onClick={(e) => onToggleBookmark(contest.id, e)}
              className={`p-2 rounded-full transition-colors ${
                isBookmarked 
                  ? 'bg-[#FDF2F7] text-[#8D174B]' 
                  : 'hover:bg-gray-100 text-[#6E6773] hover:text-[#8D174B]'
              }`}
              title={isBookmarked ? t.contests.bookmarked : t.contests.bookmark}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Institutional Banner Header with uploaded image backdrop */}
          <div className="relative min-h-[180px] sm:min-h-[220px] w-full overflow-hidden bg-gradient-to-br from-[#240A18] via-[#8D174B] to-[#450C25] flex items-end">
            {/* Uploaded or Official Scraped Image as Hero Background */}
            {contest.image && (
              <img
                src={contest.image}
                alt={contest.title[language]}
                className="absolute inset-0 w-full h-full object-cover object-center opacity-40 scale-105 filter blur-xs"
              />
            )}

            {/* Moroccan geometric watermark */}
            <div 
              className="absolute inset-0 opacity-[0.10] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.9'%3E%3Cpath d='M24 0 L29 19 L48 24 L29 29 L24 48 L19 29 L0 24 L19 19 Z'/%3E%3Cpath d='M24 8 L32 24 L24 40 L16 24 Z' stroke-dasharray='1 2'/%3E%3Ccircle cx='24' cy='24' r='4'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '36px 36px',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1F0714]/95 via-[#8D174B]/70 to-[#1F0714]/40 pointer-events-none" />

            {/* Floating Title & Official Scraped Logo in the profile badge */}
            <div className="relative z-10 p-4 sm:p-6 w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-center gap-3.5 sm:gap-4">
                {/* Official Scraped Administration Logo Profile Box */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 shadow-2xl shrink-0 flex items-center justify-center overflow-hidden border-2 border-white/80">
                  <img
                    src={contest.image || contest.administration?.logo || resolveAdministrationLogo(contest.administration?.name?.fr || contest.administration?.name?.[language], contest.administration?.category, contest.title?.fr || contest.title?.[language])}
                    alt={contest.administration?.name?.[language] || 'Administration'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as any).src = resolveAdministrationLogo(contest.administration?.name?.fr, contest.administration?.category, contest.title?.fr);
                    }}
                  />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-200 block drop-shadow-sm">
                    {contest.administration.name[language]}
                  </span>
                  <h1 className="text-base sm:text-xl md:text-2xl font-extrabold text-white leading-tight drop-shadow-md mt-0.5">
                    {contest.title[language]}
                  </h1>
                </div>
              </div>

              <div className="shrink-0 self-start sm:self-end">
                <span className="px-4 py-1.5 rounded-full bg-white text-[#8D174B] text-xs font-bold shadow-lg inline-block">
                  {contest.status === 'open' 
                    ? t.status.open 
                    : contest.status === 'closing_soon' 
                    ? t.status.closing_soon 
                    : contest.status === 'in_progress'
                    ? (contest.stage === 'oral' ? (language === 'fr' ? 'Convoqués Oral' : 'المدعوون للشفوي') : (language === 'fr' ? 'Convoqués Écrit' : 'المدعوون للكتابي'))
                    : t.status.closed}
                </span>
              </div>
            </div>
          </div>

          {/* Quick highlight chips bar */}
          <div className="bg-[#8D174B] text-white px-5 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs font-medium border-t border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              {contest.degreeLevel && (
                <span className="bg-white/15 px-3 py-1 rounded-lg backdrop-blur-xs">
                  {contest.degreeLevel}
                </span>
              )}
              <span className="bg-white/15 px-3 py-1 rounded-lg backdrop-blur-xs">
                {contest.postsCount} {t.contests.posts}
              </span>
              {contest.region?.[language] && contest.region[language].trim().length > 0 && (
                <span className="bg-white/15 px-3 py-1 rounded-lg backdrop-blur-xs">
                  {contest.region[language]}
                </span>
              )}
            </div>

            {(() => {
              const gradeText = contest.grade_fr || contest.grade || '';
              const hasScale = /echelle\s*\d+|échelle\s*\d+/i.test(gradeText);
              if (!hasScale) return null;
              const scale = inferSalaryScaleFromContest(contest);
              return (
                <button
                  onClick={() => {
                    if (onOpenSalarySimulator) onOpenSalarySimulator(contest);
                  }}
                  className="bg-amber-400 hover:bg-amber-300 text-[#242126] font-extrabold px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer text-xs"
                >
                  <span>💰 ~{scale.baseNetEstimate.toLocaleString('fr-FR')} DH net ({language === 'fr' ? 'estimation' : 'تقدير'})</span>
                  <span className="opacity-70 font-normal">({language === 'fr' ? 'Détails salaire' : 'تفاصيل الأجر'})</span>
                </button>
              );
            })()}
          </div>

          {/* Navigation Tabs (Aperçu, Conditions, Épreuves, Documents, Discussions) */}
          <div className="bg-white border-b border-[#F1E5EC] px-4 sticky top-14 z-10 flex overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: t.tabs.overview },
              { id: 'conditions', label: t.tabs.conditions },
              { id: 'exams', label: t.tabs.exams },
              { id: 'documents', label: t.tabs.documents, count: contest.documents.length },
              { id: 'discussions', label: t.tabs.discussions },
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`py-3.5 px-4 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                    isActive
                      ? 'border-[#8D174B] text-[#8D174B]'
                      : 'border-transparent text-[#6E6773] hover:text-[#242126]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#FDF2F7] text-[#8D174B] text-[10px]">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Panels */}
          <div className="p-5 sm:p-8 space-y-6">

            {/* 1. APERÇU / OVERVIEW (Conforme 100% à l'affichage officiel emploi-public.ma avec style Burgundy) */}
            {activeSubTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Official Stepper / Progression Bar in Burgundy style */}
                <div className="bg-[#FAF4F7] border border-[#F1E5EC] p-3 rounded-2xl flex items-center justify-between gap-1 sm:gap-2 text-[11px] sm:text-xs overflow-x-auto no-scrollbar">
                  <span className={`px-3 sm:px-4 py-1.5 rounded-full font-bold whitespace-nowrap shadow-xs ${
                    contest.stage === 'depot' || !contest.stage
                      ? 'bg-[#8D174B] text-white'
                      : 'bg-white text-[#8D174B] border border-[#8D174B]/30'
                  }`}>
                    {language === 'fr' ? 'Annonce' : 'الإعلان'}
                  </span>
                  <div className="h-[2px] w-4 sm:w-8 bg-[#E2D5DE] shrink-0"></div>
                  <span className={`px-3 sm:px-4 py-1.5 rounded-full font-bold whitespace-nowrap ${
                    contest.stage === 'ecrit'
                      ? 'bg-[#8D174B] text-white shadow-xs'
                      : 'bg-white text-[#6E6773] border border-[#F1E5EC]'
                  }`}>
                    {language === 'fr' ? "Convocation examen écrit" : 'استدعاء الامتحان الكتابي'}
                  </span>
                  <div className="h-[2px] w-4 sm:w-8 bg-[#E2D5DE] shrink-0"></div>
                  <span className={`px-3 sm:px-4 py-1.5 rounded-full font-bold whitespace-nowrap ${
                    contest.stage === 'oral'
                      ? 'bg-[#8D174B] text-white shadow-xs'
                      : 'bg-white text-[#6E6773] border border-[#F1E5EC]'
                  }`}>
                    {language === 'fr' ? "Convocation entretien oral" : 'استدعاء المقابلة الشفوية'}
                  </span>
                  <div className="h-[2px] w-4 sm:w-8 bg-[#E2D5DE] shrink-0"></div>
                  <span className={`px-3 sm:px-4 py-1.5 rounded-full font-bold whitespace-nowrap ${
                    contest.stage === 'resultat' || contest.status === 'results'
                      ? 'bg-[#8D174B] text-white shadow-xs'
                      : 'bg-white text-[#6E6773] border border-[#F1E5EC]'
                  }`}>
                    {language === 'fr' ? 'Résultats' : 'النتائج'}
                  </span>
                </div>

                {/* Tableau Synthétique Officiel des Critères (Extrait de l'Arrêté) */}
                <div className="bg-white border-2 border-[#8D174B]/20 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#FAF4F7]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#FAF0F5] text-[#8D174B] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-[#8D174B]" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-[#1F1924]">
                          {language === 'fr' ? 'Fiche Synthétique Officielle du Concours' : 'البطاقة التركيبية الرسمية للمباراة'}
                        </h3>
                        <span className="text-[11px] text-[#6E6773]">
                          {language === 'fr' ? 'Critères statutaires vérifiés & conditions d’accès de l’arrêté' : 'الشروط النظامية الرسمية وفق قرار فتح المباراة'}
                        </span>
                      </div>
                    </div>

                    {officialArreteUrl ? (
                      <a
                        href={officialArreteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="px-3.5 py-2 rounded-xl bg-[#8D174B] hover:bg-[#70113B] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{language === 'fr' ? 'Arrêté officiel (PDF)' : 'قرار المباراة (PDF)'}</span>
                      </a>
                    ) : (contest.officialSourceUrl || contest.administration?.officialWebsite) ? (
                      <a
                        href={contest.officialSourceUrl || contest.administration?.officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-[#FAF0F5] hover:bg-[#F3E2EC] text-[#8D174B] border border-[#8D174B]/20 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{language === 'fr' ? 'Portail de l’administration' : 'بوابة المباراة'}</span>
                      </a>
                    ) : null}
                  </div>

                  {/* Criteria Grid Table */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-[#FAF7F9] rounded-2xl border border-[#F1E5EC]">
                      <span className="text-[11px] text-gray-500 font-semibold block mb-0.5">
                        {language === 'fr' ? 'Grade & Échelle statutaire' : 'الدرجة والسلم الإداري'}
                      </span>
                      <strong className="text-xs sm:text-sm text-[#242126] font-extrabold block">
                        {contest.grade_fr || contest.grade || contest.title[language] || contest.title.fr}
                      </strong>
                    </div>

                    <div className="p-3 bg-[#FAF7F9] rounded-2xl border border-[#F1E5EC]">
                      <span className="text-[11px] text-gray-500 font-semibold block mb-0.5">
                        {language === 'fr' ? 'Niveau d’études exigé' : 'المستوى الدراسي المطلوب'}
                      </span>
                      <strong className="text-xs sm:text-sm text-[#8D174B] font-extrabold block">
                        {contest.degreeLevel || (language === 'fr' ? 'Selon arrêté' : 'حسب القرار')}
                      </strong>
                    </div>

                    <div className="p-3 bg-[#FAF7F9] rounded-2xl border border-[#F1E5EC]">
                      <span className="text-[11px] text-gray-500 font-semibold block mb-0.5">
                        {language === 'fr' ? 'Limite d’âge légale' : 'الحد القانوني للسن'}
                      </span>
                      <strong className="text-xs sm:text-sm text-[#242126] font-bold block">
                        {contest.criteria?.ageLimit?.[language] || (language === 'fr' ? '18 à 45 ans' : '18 إلى 45 سنة')}
                      </strong>
                    </div>

                    <div className="p-3 bg-[#FAF7F9] rounded-2xl border border-[#F1E5EC]">
                      <span className="text-[11px] text-gray-500 font-semibold block mb-0.5">
                        {language === 'fr' ? 'Nombre de postes ouverts' : 'عدد المناصب المفتوحة'}
                      </span>
                      <strong className="text-xs sm:text-sm text-[#242126] font-extrabold block">
                        {contest.postsCount > 0 ? `${contest.postsCount} ${language === 'fr' ? 'poste(s)' : 'منصب'}` : (language === 'fr' ? 'À vérifier' : 'غير محدد')}
                      </strong>
                    </div>

                    <div className="p-3 bg-[#FAF7F9] rounded-2xl border border-[#F1E5EC]">
                      <span className="text-[11px] text-gray-500 font-semibold block mb-0.5">
                        {language === 'fr' ? 'Dernier délai de dépôt' : 'آخر أجل لإيداع الترشيحات'}
                      </span>
                      <strong className="text-xs sm:text-sm text-[#8D174B] font-extrabold block">
                        {contest.deadlineDate || (language === 'fr' ? 'À vérifier' : 'غير محدد')}
                      </strong>
                    </div>

                    <div className="p-3 bg-[#FAF7F9] rounded-2xl border border-[#F1E5EC]">
                      <span className="text-[11px] text-gray-500 font-semibold block mb-0.5">
                        {language === 'fr' ? 'Mode & Plateforme de candidature' : 'طريقة وبوابة الترشيح'}
                      </span>
                      <strong className="text-xs sm:text-sm text-[#242126] font-bold block truncate">
                        {contest.depositType || (contest.applyUrl ? 'Dépôt en ligne officiel' : 'Voir modalités')}
                      </strong>
                    </div>
                  </div>

                  {/* Specialty badge summary */}
                  <div className="pt-2 border-t border-[#FAF4F7] flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[#6E6773] font-bold">
                      {language === 'fr' ? 'Spécialités mentionnées :' : 'التخصصات المحددة :'}
                    </span>
                    {contest.specialtiesList && contest.specialtiesList.length > 0 ? (
                      contest.specialtiesList.map((spec, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-xl bg-[#FAF0F5] text-[#8D174B] text-[11px] font-bold border border-[#8D174B]/20">
                          {spec}
                        </span>
                      ))
                    ) : contest.specialty?.[language] && !contest.specialty[language].toLowerCase().includes('mentionn') ? (
                      <span className="text-xs font-semibold text-[#8D174B]">
                        {contest.specialty[language]}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[#6E6773] italic">
                        {language === 'fr' ? 'Spécialités fixées par décision de l’administration' : 'التخصصات المحددة بقرار الإدارة'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Dual Card Official Structure in Burgundy Palette */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Détail de l'annonce */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-[#FFFDFE] border border-[#F1E5EC] rounded-2xl p-5 shadow-xs space-y-4">
                      <h3 className="text-base font-extrabold text-[#8D174B] pb-2 border-b border-[#FAF4F7]">
                        {language === 'fr' ? "Détail de l'annonce" : 'تفاصيل الإعلان'}
                      </h3>

                      <div>
                        <span className="text-xs text-[#6E6773] block font-medium">
                          {language === 'fr' ? 'Administration qui recrute' : 'الإدارة المشغلة'}
                        </span>
                        <strong className="text-xs sm:text-sm text-[#242126] font-bold block mt-0.5 leading-snug">
                          {contest.administration.name[language]}
                        </strong>
                      </div>

                      <div className="pt-2 border-t border-[#FAF4F7] flex items-center justify-between gap-2">
                        <div>
                          <span className="text-xs text-[#6E6773] block font-medium">
                            {language === 'fr' ? 'Délai de dépôt des candidatures' : 'آخر أجل لإيداع الترشيحات'}
                          </span>
                          <strong className="text-xs sm:text-sm text-[#8D174B] font-extrabold block mt-0.5">
                            {contest.deadlineDate}
                          </strong>
                        </div>

                        {/* Calendar Sync Dropdown / Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={getGoogleCalendarUrl(contest, language)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-[#FAF4F7] hover:bg-[#F9E6F0] text-[#8D174B] border border-[#8D174B]/20 text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs"
                            title={language === 'fr' ? 'Ajouter à Google Calendar' : 'إضافة إلى Google Calendar'}
                          >
                            <Calendar className="w-3 h-3 text-[#8D174B]" />
                            <span>Google</span>
                          </a>

                          <button
                            onClick={() => downloadContestIcs(contest, language)}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF4F7] hover:bg-[#F9E6F0] text-[#8D174B] border border-[#8D174B]/20 text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                            title={language === 'fr' ? 'Télécharger le fichier .ics (Apple / Outlook / Android)' : 'تحميل تذكير للتقويم .ics'}
                          >
                            <Download className="w-3 h-3 text-[#8D174B]" />
                            <span>.ICS</span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#FAF4F7]">
                        <span className="text-xs text-[#6E6773] block font-medium">
                          {language === 'fr' ? 'Date du concours' : 'تاريخ إجراء المباراة'}
                        </span>
                        <strong className="text-xs sm:text-sm text-[#242126] font-extrabold block mt-0.5">
                          {contest.contestDate ? (
                            contest.contestDate
                          ) : (
                            <span className="text-[#8E8694] font-normal italic">
                              {language === 'fr' ? 'À préciser sur convocation' : 'حسب الاستدعاء'}
                            </span>
                          )}
                        </strong>
                      </div>

                      <div className="pt-2 border-t border-[#FAF4F7]">
                        <span className="text-xs text-[#6E6773] block font-medium">
                          {language === 'fr' ? 'Date de publication' : 'تاريخ النشر'}
                        </span>
                        <strong className="text-xs sm:text-sm text-[#242126] font-medium block mt-0.5">
                          {contest.publicationDate ? (
                            contest.publicationDate
                          ) : (
                            <span className="text-[#8E8694] font-normal italic">
                              {language === 'fr' ? 'À vérifier sur l’arrêté' : 'غير محدد'}
                            </span>
                          )}
                        </strong>
                      </div>
                    </div>

                    {/* Official Téléchargement & Listes Publiées Box in Burgundy */}
                    <div className="bg-[#FAF4F7] border border-[#F1E5EC] rounded-2xl p-4 space-y-2.5">
                      <span className="text-xs font-bold text-[#8D174B] block">
                        {language === 'fr' ? 'Téléchargements & Listes Officielles Publiées' : 'التحميلات واللوائح الرسمية المنشورة'}
                      </span>
                      
                      {/* Arrêté PDF button */}
                      {officialArreteUrl ? (
                        <div className="flex flex-col sm:flex-row items-stretch gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActivePdfUrl(officialArreteUrl);
                              setActivePdfTitle(language === 'fr' ? "Arrêté d’ouverture du concours (PDF)" : "قرار فتح المباراة (PDF)");
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8D174B] hover:bg-[#70113B] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4 shrink-0" />
                            <span>{language === 'fr' ? 'Visualiser l’arrêté officiel (PDF)' : 'معاينة قرار فتح المباراة (PDF)'}</span>
                          </button>
                          <a
                            href={officialArreteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="px-3.5 py-3 rounded-xl bg-white border border-[#8D174B]/20 hover:border-[#8D174B] text-[#8D174B] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                            title={language === 'fr' ? 'Télécharger le fichier PDF' : 'تحميل الملف'}
                          >
                            <Download className="w-4 h-4 shrink-0" />
                            <span className="sm:hidden">{language === 'fr' ? 'Télécharger' : 'تحميل'}</span>
                          </a>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-white border border-[#F1E5EC] text-xs text-[#6E6773] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#8D174B] shrink-0" />
                          <span>
                            {language === 'fr'
                              ? 'Arrêté officiel consultable sur le portail officiel de l’administration.'
                              : 'القرار الرسمي متاح للاطلاع عبر البوابة الرسمية للجهة المشغلة.'}
                          </span>
                        </div>
                      )}

                      {/* Listes des convoqués / admis publiées */}
                      <div className="pt-2 border-t border-[#F1E5EC] space-y-2">
                        <span className="text-[11px] font-bold text-[#6E6773] uppercase block">
                          {language === 'fr' ? 'Listes des candidats publiées :' : 'لوائح المرشحين المنشورة :'}
                        </span>

                        {contest.convoquesUrl ? (
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#8D174B]/20 hover:border-[#8D174B] text-xs font-bold text-[#8D174B] transition-all shadow-xs gap-2">
                            <div className="flex items-center gap-2 truncate">
                              <Users className="w-4 h-4 text-[#8D174B] shrink-0" />
                              <span className="truncate">
                                {contest.stage === 'oral'
                                  ? (language === 'fr' ? 'Liste des convoqués à l’oral (PDF)' : 'لائحة المدعوين للاختبار الشفوي (PDF)')
                                  : (language === 'fr' ? 'Liste des convoqués à l’écrit (PDF)' : 'لائحة المدعوين للاختبار الكتابي (PDF)')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setActivePdfUrl(contest.convoquesUrl || '');
                                  setActivePdfTitle(language === 'fr' ? 'Liste des convoqués (PDF)' : 'لائحة المدعوين (PDF)');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#FAF0F5] hover:bg-[#F3E2EC] text-[#8D174B] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{language === 'fr' ? 'Visualiser' : 'معاينة'}</span>
                              </button>
                              <a
                                href={contest.convoquesUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="p-1 rounded-lg hover:bg-gray-100 text-[#8D174B]"
                                title={language === 'fr' ? 'Télécharger' : 'تحميل'}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-white border border-dashed border-[#F1E5EC] text-[11px] text-[#6E6773] flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-[#8D174B] shrink-0" />
                            <span>
                              {language === 'fr'
                                ? 'Listes non encore publiées par l’administration (dépôt en cours).'
                                : 'لم تنشر اللوائح بعد من طرف الإدارة (الترشيحات جارية).'}
                            </span>
                          </div>
                        )}

                        {contest.status === 'results' && epId && (
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 shadow-xs gap-2">
                            <div className="flex items-center gap-2 truncate">
                              <Award className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span className="truncate">
                                {language === 'fr' ? 'Liste des admis définitifs (PDF)' : 'لائحة الناجحين بصفة نهائية (PDF)'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setActivePdfUrl(`https://www.emploi-public.ma/fr/concours/download/resultats/${epId}`);
                                  setActivePdfTitle(language === 'fr' ? 'Liste des admis définitifs (PDF)' : 'لائحة الناجحين (PDF)');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{language === 'fr' ? 'Visualiser' : 'معاينة'}</span>
                              </button>
                              <a
                                href={`https://www.emploi-public.ma/fr/concours/download/resultats/${epId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-800"
                                title={language === 'fr' ? 'Télécharger' : 'تحميل'}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Description in Burgundy Palette */}
                  <div className="lg:col-span-7">
                    <div className="bg-[#FFFDFE] border border-[#F1E5EC] rounded-2xl p-5 shadow-xs space-y-4">
                      <h3 className="text-base font-extrabold text-[#8D174B] pb-2 border-b border-[#FAF4F7]">
                        {language === 'fr' ? 'Description' : 'الوصف'}
                      </h3>

                      {/* Spécialité(s) */}
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#6E6773] mb-1.5">
                          <span className="text-[#8D174B]">★</span>
                          <span>{language === 'fr' ? 'Spécialité :' : 'التخصص :'}</span>
                        </div>
                        {contest.specialtiesList && contest.specialtiesList.length > 0 ? (
                          <ul className="space-y-1.5 ps-2">
                            {contest.specialtiesList.map((spec, idx) => (
                              <li key={idx} className="text-xs sm:text-sm font-bold text-[#8D174B] flex items-start gap-1.5 leading-snug">
                                <span className="font-extrabold text-[#8D174B]">•</span>
                                <span>{spec}</span>
                              </li>
                            ))}
                          </ul>
                        ) : contest.specialty?.[language] && !contest.specialty[language].includes('mentionnée') ? (
                          <div className="text-xs sm:text-sm font-bold text-[#8D174B] ps-2">
                            {contest.specialty[language]}
                          </div>
                        ) : (
                          <div className="ps-2">
                            <span className="text-xs sm:text-sm text-[#8E8694] italic font-normal">
                              {language === 'fr' ? 'À vérifier sur l’arrêté officiel' : 'غير محدد في الإعلان الرسمي'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Grade */}
                      <div className="pt-2 border-t border-[#FAF4F7]">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#6E6773] mb-0.5">
                          <span className="text-[#8D174B]">📊</span>
                          <span>{language === 'fr' ? 'Grade :' : 'الدرجة / الإطار :'}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-extrabold text-[#242126] ps-2">
                          {contest.grade_fr || contest.grade ? (
                            contest.grade_fr || contest.grade
                          ) : (
                            <span className="text-[#8E8694] font-normal italic">
                              {language === 'fr' ? 'À vérifier sur l’arrêté officiel' : 'غير محدد في الإعلان الرسمي'}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Nombre de postes */}
                      <div className="pt-2 border-t border-[#FAF4F7]">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#6E6773] mb-0.5">
                          <span className="text-[#8D174B]">👥</span>
                          <span>{language === 'fr' ? 'Nombre de postes :' : 'عدد المناصب :'}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-black text-[#8D174B] ps-2">
                          {contest.postsCount > 0 ? (
                            contest.postsCount
                          ) : (
                            <span className="text-[#8E8694] font-normal italic">
                              {language === 'fr' ? 'À vérifier sur l’arrêté' : 'غير محدد'}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Type de recrutement */}
                      <div className="pt-2 border-t border-[#FAF4F7]">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#6E6773] mb-0.5">
                          <span className="text-[#8D174B]">💼</span>
                          <span>{language === 'fr' ? 'Type de recrutement :' : 'نوع التوظيف :'}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-[#242126] ps-2">
                          {contest.recruitmentType ? (
                            contest.recruitmentType
                          ) : (
                            <span className="text-[#8E8694] font-normal italic">
                              {language === 'fr' ? 'Recrutement régulier' : 'توظيف نظامي'}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Région */}
                      <div className="pt-2 border-t border-[#FAF4F7]">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#6E6773] mb-0.5">
                          <span className="text-[#8D174B]">📍</span>
                          <span>{language === 'fr' ? 'Région :' : 'الجهة / التعيين :'}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-extrabold text-[#242126] ps-2">
                          {contest.region?.[language] && !contest.region[language].includes('National') ? (
                            <>
                              {contest.region[language]}{' '}
                              {contest.postsCount > 0 && (
                                <span className="text-[#8D174B] font-semibold">
                                  ({contest.postsCount} {language === 'fr' ? 'postes' : 'مناصب'})
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[#8E8694] font-normal italic">
                              {language === 'fr' ? 'Selon les centres de l’arrêté' : 'حسب مراكز القرار'}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Type de dépôt */}
                      <div className="pt-2 border-t border-[#FAF4F7]">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#6E6773] mb-0.5">
                          <span className="text-[#8D174B]">🎓</span>
                          <span>{language === 'fr' ? 'Type de dépôt :' : 'طريقة إيداع الترشيح :'}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-[#8D174B] ps-2">
                          {contest.depositType ? (
                            contest.depositType
                          ) : (
                            <span className="text-[#8E8694] font-normal italic">
                              {language === 'fr' ? 'Dépôt en ligne sur portail officiel' : 'إيداع إلكتروني'}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Site de dépôt */}
                      <div className="pt-2 border-t border-[#FAF4F7]">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#6E6773] mb-0.5">
                          <span className="text-[#8D174B]">🔗</span>
                          <span>{language === 'fr' ? 'Site de dépôt :' : 'موقع إيداع الترشيح :'}</span>
                        </div>
                        {contest.depositSite || contest.applyUrl ? (
                          <a
                            href={contest.depositSite || contest.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm font-extrabold text-[#8D174B] hover:underline ps-2 flex items-center gap-1 break-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span>{contest.depositSite || contest.applyUrl}</span>
                          </a>
                        ) : contest.administration?.officialWebsite ? (
                          <a
                            href={contest.administration.officialWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm font-extrabold text-[#8D174B] hover:underline ps-2 flex items-center gap-1 break-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span>{contest.administration.officialWebsite}</span>
                          </a>
                        ) : (
                          <p className="ps-2">
                            <span className="text-xs sm:text-sm text-[#8E8694] font-normal italic">
                              {language === 'fr' ? 'Voir modalités sur l’arrêté' : 'راجع تفاصيل الإيداع في القرار'}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Code du concours */}
                      <div className="pt-2 border-t border-[#FAF4F7]">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#6E6773] mb-0.5">
                          <span className="text-[#8D174B]">#</span>
                          <span>{language === 'fr' ? 'Code du concours :' : 'رمز المباراة :'}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-mono font-black text-[#242126] ps-2">
                          {contest.referenceCode ? (
                            contest.referenceCode
                          ) : (
                            <span className="text-[#8E8694] font-normal font-sans italic">
                              {language === 'fr' ? 'Référence interne' : 'مرجع داخلي'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Affiche & Avis officiel scanné (si disponible sous forme d'image) */}
                    {contest.image && contest.image.startsWith('http') && (
                      <div className="bg-[#FAF7F9] border border-[#F1E5EC] rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-[#8D174B]" />
                            <h4 className="text-xs sm:text-sm font-bold text-[#242126]">
                              {language === 'fr' ? 'Affiche & Avis officiel scanné' : 'ملصق وإعلان المباراة الرسمي'}
                            </h4>
                          </div>
                          <a
                            href={contest.image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-[#8D174B] hover:underline flex items-center gap-1"
                          >
                            <span>{language === 'fr' ? 'Plein écran' : 'عرض كامل'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        <div 
                          onClick={() => window.open(contest.image, '_blank')}
                          className="relative group rounded-xl overflow-hidden border border-[#F1E5EC] bg-white cursor-pointer max-h-80 flex items-center justify-center p-1"
                        >
                          <img
                            src={contest.image}
                            alt={contest.title[language]}
                            className="w-full h-auto max-h-80 object-contain rounded-lg group-hover:scale-[1.01] transition-transform duration-200"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-xl">
                            <span className="px-3 py-1.5 rounded-xl bg-[#8D174B] text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
                              <ZoomIn className="w-3.5 h-3.5" />
                              <span>{language === 'fr' ? 'Agrandir l’affiche' : 'تكبير الملصق'}</span>
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#6E6773]">
                          {language === 'fr'
                            ? 'Cette affiche officielle contient le tableau complet des postes, spécialités et conditions d’accès.'
                            : 'يتضمن هذا الإعلان الرسمي جدول المناصب والتخصصات وشروط المشاركة.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. CONDITIONS */}
            {activeSubTab === 'conditions' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Official Requirements Card (Extracted strictly from Official Arrêté) */}
                <div className="p-4 sm:p-5 rounded-2xl border-2 border-[#8D174B]/20 bg-gradient-to-br from-[#FFFDFE] to-[#FAF4F7] shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#8D174B]" />
                      <h3 className="text-sm font-bold text-[#242126]">
                        {language === 'fr' ? 'Exigences et Spécialités Officielles de l’Arrêté' : 'شروط وتخصصات قرار فتح المباراة'}
                      </h3>
                    </div>
                    {contest.referenceCode && (
                      <span className="text-[11px] font-mono font-bold bg-[#8D174B]/10 text-[#8D174B] px-2.5 py-0.5 rounded-full">
                        {contest.referenceCode}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="p-3 bg-white rounded-xl border-2 border-[#8D174B]/30 shadow-xs">
                      <span className="text-xs text-[#6E6773] block mb-1">
                        {language === 'fr' ? 'Domaine / Spécialité officielle exigée' : 'التخصص الرسمي المشترط في الإعلان'}
                      </span>
                      <strong className="text-[#8D174B] text-sm sm:text-base font-extrabold block">
                        {contest.specialty[language]}
                      </strong>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#F1E5EC]">
                      <span className="text-xs text-[#6E6773] block mb-1">
                        {language === 'fr' ? 'Diplôme minimum requis' : 'الدبلوم المشترط'}
                      </span>
                      <strong className="text-[#242126] font-bold block">
                        {contest.degreeLevel} ({language === 'fr' ? 'ou équivalent reconnu' : 'أو ما يعادله معترف به'})
                      </strong>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#F1E5EC]">
                      <span className="text-xs text-[#6E6773] block mb-1">
                        {language === 'fr' ? 'Région / Affectation territoriale' : 'مقر التعيين والجهة'}
                      </span>
                      <strong className="text-[#242126] font-bold block">
                        {contest.region[language]}
                      </strong>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#F1E5EC]">
                      <span className="text-xs text-[#6E6773] block mb-1">
                        {language === 'fr' ? 'Portail officiel d’inscription' : 'بوابة الترشيح الرسمية'}
                      </span>
                      <a
                        href={contest.administration.officialWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8D174B] hover:underline font-bold flex items-center gap-1.5 truncate"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{contest.administration.officialWebsite}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Personalized Eligibility Audit for the Candidate */}
                {eligibility && (
                  <div className={`p-4 sm:p-5 rounded-2xl border ${
                    eligibility.isHighMatch 
                      ? 'bg-emerald-50/70 border-emerald-300' 
                      : eligibility.isEligible 
                      ? 'bg-blue-50/70 border-blue-200' 
                      : eligibility.verdict === 'verify'
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-rose-50/70 border-rose-300'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className={`w-4 h-4 ${eligibility.isEligible ? 'text-emerald-700' : 'text-rose-600'}`} />
                        <strong className="text-xs sm:text-sm font-bold text-[#242126]">
                          {language === 'fr' 
                            ? `Audit d’éligibilité pour ${profile.fullName || 'votre profil'}` 
                            : `مؤشرات الأهلية لملف: ${profile.fullName || 'المترشح'}`}
                        </strong>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        eligibility.isHighMatch
                          ? 'bg-emerald-200 text-emerald-900'
                          : eligibility.isEligible
                          ? 'bg-blue-200 text-blue-900'
                          : eligibility.verdict === 'verify'
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-rose-200 text-rose-900'
                      }`}>
                        {eligibility.isHighMatch 
                          ? (language === 'fr' ? 'Profil Idéal 100%' : 'مطابقة تامة') 
                          : eligibility.isEligible 
                          ? (language === 'fr' ? 'Éligible' : 'مؤهل') 
                          : eligibility.verdict === 'verify'
                          ? (language === 'fr' ? 'À vérifier' : 'يُتحقق منه')
                          : (language === 'fr' ? 'Non éligible' : 'غير مؤهل')}
                      </span>
                    </div>

                    <div className="text-xs text-[#242126] space-y-1.5 mb-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          <strong>{language === 'fr' ? 'Niveau :' : 'المستوى :'}</strong> {profile.degreeLevel} ({eligibility.degreeMatch ? '✅' : '❌'})
                        </span>
                        <span>•</span>
                        <span>
                          <strong>{language === 'fr' ? 'Âge :' : 'السن :'}</strong> {profile.age} {language === 'fr' ? 'ans' : 'سنة'} ({eligibility.ageMatch ? '✅' : '❌'})
                        </span>
                        <span>•</span>
                        <span>
                          <strong>{language === 'fr' ? 'Spécialité :' : 'التخصص :'}</strong> {profile.specialty || (language === 'fr' ? 'Non renseignée' : 'غير محدد')} ({eligibility.specialtyStatus === 'match' ? '✅ Conforme' : eligibility.specialtyStatus === 'different' ? '❌ Non conforme' : '❔ Non confirmée'})
                        </span>
                      </div>
                      {eligibility.reasons.map((r, i) => (
                        <p key={i} className="text-[11px] text-[#6E6773] flex items-center gap-1.5">
                          <span className={eligibility.isEligible ? 'text-emerald-600' : 'text-rose-600'}>•</span>
                          <span>{r[language]}</span>
                        </p>
                      ))}

                      {/* Statutaire Maroc : Alerte sur-qualification (Ingénieur vs Technicien) */}
                      {profile.degreeLevel && (profile.degreeLevel.includes('Master') || profile.degreeLevel.includes('Ingénieur') || profile.degreeLevel.includes('Bac+5')) && (contest.degreeLevel?.includes('Bac+2') || contest.degreeLevel?.includes('Technicien') || (contest.degreeLevel?.toLowerCase().includes('bac') && !contest.degreeLevel?.includes('Bac+5'))) && (
                        <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong>{language === 'fr' ? 'Règle de la fonction publique marocaine :' : 'قاعدة الوظيفة العمومية المغربية :'}</strong>{' '}
                            {language === 'fr'
                              ? `Votre profil indique un diplôme supérieur (${profile.degreeLevel} / Bac+5), alors que ce concours recrute au grade de ${contest.grade_fr || 'Technicien'} (${contest.degreeLevel}). Au Maroc, un diplôme d'Ingénieur ne remplace pas le diplôme de Technicien (DTS/DUT/BTS) : chaque grade exige son diplôme statutaire propre.`
                              : `ملفك يشير إلى دبلوم باك+5 بينما المباراة مخصصة لإطار ${contest.grade_fr || 'التقنيين'} (${contest.degreeLevel}). يشترط دبلوم التقني المتخصص حصراً.`}
                          </div>
                        </div>
                      )}

                      {/* Statutaire Maroc : Alerte limite d'âge spécifique */}
                      {profile.age > 40 && (contest.grade_fr?.toLowerCase().includes('technicien') || contest.title?.fr?.toLowerCase().includes('technicien')) && (
                        <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <strong>{language === 'fr' ? 'Limite d’âge statutaire (40 ans) :' : 'الحد الأقصى للسن (40 سنة) :'}</strong>{' '}
                            {language === 'fr'
                              ? `Le statut des techniciens limite l'accès à 40 ans au 1er janvier. À ${profile.age} ans, vérifiez l'arrêté pour d'éventuelles dérogations d'ancienneté.`
                              : `النظام الأساسي للتقنيين يحدد السن الأقصى في 40 سنة.`}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Candidate Interactive Dossier Checklist (Saved in LocalStorage) */}
                <div className="p-4 sm:p-5 rounded-2xl border border-[#F1E5EC] bg-[#FFFDFE] shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-[#8D174B]" />
                      <h4 className="text-xs sm:text-sm font-bold text-[#242126]">
                        {language === 'fr' ? 'Mon dossier de pièces pour ce concours' : 'وثائق ترشيحي لهذه المباراة'}
                      </h4>
                    </div>
                    <span className="text-[10px] text-[#6E6773] bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                      {language === 'fr' ? 'Stocké sur votre navigateur' : 'محفوظ بمتصفحك'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { key: 'cinCertified', fr: 'Copie certifiée C.I.N.', ar: 'نسخة مصادق عليها من ب.ت.و' },
                      { key: 'diplomaCertified', fr: 'Copie certifiée du diplôme', ar: 'نسخة مصادق عليها من الدبلوم' },
                      { key: 'policeRecord', fr: 'Casier / Fiche anthropométrique', ar: 'السجل العدلي / بطاقة السوابق' },
                      { key: 'cvUpdated', fr: 'Curriculum Vitae actualisé', ar: 'السيرة الذاتية محينة' },
                      { key: 'motivationLetter', fr: 'Demande manuscrite signée', ar: 'طلب خطي موقع' },
                      { key: 'officialForm', fr: 'Récépissé portail officiel', ar: 'وصل التسجيل الإلكتروني' },
                    ].map((item) => {
                      const isChecked = !!tracking.checklist[item.key as keyof CandidateTrackingItem['checklist']];
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleToggleChecklist(item.key as keyof CandidateTrackingItem['checklist'])}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-start transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-[#8D174B]/30'
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          )}
                          <span className="text-[11px]">{item[language]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#242126] mb-3">{t.details.eligibilityConditions}</h3>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-[#F1E5EC] bg-white">
                    <span className="text-xs font-bold text-[#8D174B] block mb-1">{t.details.nationality}</span>
                    <p className="text-xs sm:text-sm text-[#242126]">{contest.criteria.nationality[language]}</p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#F1E5EC] bg-white">
                    <span className="text-xs font-bold text-[#8D174B] block mb-1">{t.details.ageCondition}</span>
                    <p className="text-xs sm:text-sm text-[#242126]">{contest.criteria.ageLimit[language]}</p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#F1E5EC] bg-white">
                    <span className="text-xs font-bold text-[#8D174B] block mb-1">{t.details.acceptedDiplomas}</span>
                    <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-[#242126] mt-2">
                      {contest.criteria.diplomas.map((dip, idx) => (
                        <li key={idx}>{dip[language]}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-[#F1E5EC] bg-white">
                    <span className="text-xs font-bold text-[#8D174B] block mb-1">{t.details.experience}</span>
                    <p className="text-xs sm:text-sm text-[#242126]">{contest.criteria.experience[language]}</p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#F1E5EC] bg-white">
                    <span className="text-xs font-bold text-[#8D174B] block mb-2">{t.contests.targetSpecialty}</span>
                    <div className="flex flex-wrap gap-2">
                      {contest.criteria.specialties.map((spec, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-[#FDF2F7] text-[#8D174B] text-xs font-semibold">
                          {spec[language]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. ÉPREUVES */}
            {activeSubTab === 'exams' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-[#8D174B] flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4" />
                    <span>{t.details.writtenExam}</span>
                  </h3>
                  <div className="space-y-2.5">
                    {contest.exams.written.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-[#F1E5EC] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs sm:text-sm font-medium text-[#242126]">
                          {item.title[language]}
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-[#6E6773] shrink-0">
                          <span className="px-2.5 py-1 rounded bg-[#F8F2F5]">
                            {t.details.coefficient} : <strong className="text-[#8D174B]">{item.coefficient}</strong>
                          </span>
                          <span className="px-2.5 py-1 rounded bg-[#F8F2F5]">
                            {t.details.duration} : <strong className="text-[#242126]">{item.duration}</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#8D174B] flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4" />
                    <span>{t.details.oralExam}</span>
                  </h3>
                  <div className="space-y-2.5">
                    {contest.exams.oral.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-[#F1E5EC] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs sm:text-sm font-medium text-[#242126]">
                          {item.title[language]}
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-[#6E6773] shrink-0">
                          <span className="px-2.5 py-1 rounded bg-[#F8F2F5]">
                            {t.details.coefficient} : <strong className="text-[#8D174B]">{item.coefficient}</strong>
                          </span>
                          <span className="px-2.5 py-1 rounded bg-[#F8F2F5]">
                            {t.details.duration} : <strong className="text-[#242126]">{item.duration}</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. DOCUMENTS & LISTES OFFICIELLES PUBLIÉES */}
            {activeSubTab === 'documents' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-[#8D174B] flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-[#8D174B]" />
                    <span>{t.details.officialDocuments}</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {((contest.documents && contest.documents.length > 0)
                      ? contest.documents
                      : [
                          {
                            id: `arrete-${contest.id}`,
                            title: {
                              fr: "Arrêté d'ouverture du concours (قرار فتح وإجراء المباراة)",
                              ar: 'قرار فتح وإجراء المباراة الرسمي (PDF)'
                            },
                            fileType: 'PDF',
                            fileSize: 'Document officiel',
                            date: contest.publicationDate || '2026',
                            url: officialArreteUrl || contest.officialSourceUrl || contest.administration?.officialWebsite || '#'
                          }
                        ]
                    ).map((doc) => (
                      <div 
                        key={doc.id}
                        className="p-4 rounded-2xl border border-[#F1E5EC] bg-white hover:border-[#8D174B]/30 transition-all flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#FDF2F7] text-[#8D174B] flex items-center justify-center font-bold text-xs shrink-0 border border-[#8D174B]/15">
                            PDF
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-[#242126]">
                              {doc.title[language]}
                            </h4>
                            <span className="text-[11px] text-[#6E6773]">
                              {doc.fileSize} • {t.details.documentDate} {doc.date}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setActivePdfUrl(doc.url);
                              setActivePdfTitle(doc.title[language]);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF0F5] hover:bg-[#F3E2EC] text-[#8D174B] text-xs font-bold transition-all border border-[#8D174B]/20 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{language === 'fr' ? 'Visualiser' : 'معاينة'}</span>
                          </button>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#8D174B] hover:bg-[#70113B] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                            title={t.details.downloadBtn}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{language === 'fr' ? 'Télécharger' : 'تحميل'}</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Published Candidate Lists Section */}
                <div className="pt-2">
                  <h3 className="text-sm font-bold text-[#8D174B] flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-[#8D174B]" />
                    <span>{language === 'fr' ? 'Listes Officielles des Candidats Publiées' : 'لوائح المرشحين الرسمية المنشورة'}</span>
                  </h3>

                  <div className="space-y-3">
                    {/* Convoqués écrit */}
                    <div className="p-4 rounded-2xl border border-[#F1E5EC] bg-[#FFFDFE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF4F7] text-[#8D174B] flex items-center justify-center font-bold text-xs shrink-0 border border-[#8D174B]/20">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-[#242126]">
                              {language === 'fr' ? 'Liste des candidats convoqués à l’épreuve écrite' : 'لائحة المترشحين المدعوين للاختبار الكتابي'}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDF2F7] text-[#8D174B]">
                              PDF Officiel
                            </span>
                          </div>
                          <span className="text-[11px] text-[#6E6773]">
                            {language === 'fr' ? 'Publication officielle emploi-public.ma' : 'نشر رسمي عبر بوابة التشغيل العمومي'}
                          </span>
                        </div>
                      </div>

                      {contest.convoquesUrl ? (
                        <a
                          href={contest.convoquesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8D174B] hover:bg-[#70113B] text-white text-xs font-bold transition-all shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{language === 'fr' ? 'Télécharger la liste (PDF)' : 'تحميل اللائحة (PDF)'}</span>
                        </a>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl bg-[#FAF7F9] border border-[#F1E5EC] text-gray-500 font-medium text-xs">
                          {language === 'fr' ? 'Non encore publiée (dépôt en cours)' : 'لم تنشر بعد (الترشيحات جارية)'}
                        </span>
                      )}
                    </div>

                    {/* Convoqués oral */}
                    {(contest.stage === 'oral' || contest.status === 'in_progress' || contest.status === 'results') && (
                      <div className="p-4 rounded-2xl border border-[#F1E5EC] bg-[#FFFDFE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-[#242126]">
                                {language === 'fr' ? 'Liste des admissibles convoqués à l’entretien oral' : 'لائحة المؤهلين لاجتياز الاختبار الشفوي'}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                                Étape Orale
                              </span>
                            </div>
                            <span className="text-[11px] text-[#6E6773]">
                              {language === 'fr' ? 'Résultats d’admissibilité après l’écrit' : 'نتائج الاختبار الكتابي والتأهيل للشفوي'}
                            </span>
                          </div>
                        </div>

                        <span className="px-3 py-1.5 rounded-xl bg-[#FAF7F9] border border-[#F1E5EC] text-gray-500 font-medium text-xs">
                          {language === 'fr' ? 'Non encore disponible' : 'غير متاحة بعد'}
                        </span>
                      </div>
                    )}

                    {/* Admis définitifs */}
                    {(contest.status === 'results' || contest.stage === 'resultat') && (
                      <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-300">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                                {language === 'fr' ? 'Liste des admis définitifs et liste d’attente' : 'لائحة الناجحين بصفة نهائية ولائحة الانتظار'}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                                Résultats finaux
                              </span>
                            </div>
                            <span className="text-[11px] text-emerald-800">
                              {language === 'fr' ? 'Décision finale du jury de concours' : 'القرار النهائي للجنة المباراة'}
                            </span>
                          </div>
                        </div>

                        {epId ? (
                          <a
                            href={`https://www.emploi-public.ma/fr/concours/download/resultats/${epId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{language === 'fr' ? 'Télécharger les admis (PDF)' : 'تحميل قائمة الناجحين (PDF)'}</span>
                          </a>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-semibold text-xs">
                            {language === 'fr' ? 'Consulter le portail' : 'راجع البوابة'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Official Links */}
                <div className="pt-4 border-t border-[#F1E5EC]">
                  <h4 className="text-xs font-bold text-[#6E6773] uppercase mb-2">{t.details.usefulLinks}</h4>
                  <a
                    href={contest.administration.officialWebsite || contest.officialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#8D174B] hover:underline"
                  >
                    <span>{t.contests.officialSite} ({contest.administration.name[language]})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* 5. DISCUSSIONS */}
            {activeSubTab === 'discussions' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-[#FDF2F7] border border-[#8D174B]/15 text-center">
                  <MessageCircle className="w-8 h-8 text-[#8D174B] mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-[#242126] mb-1">{t.details.askCommunity}</h4>
                  <p className="text-xs text-[#6E6773] mb-4">
                    {language === 'fr' 
                      ? 'Rejoignez la discussion avec les autres candidats préparant ce concours.' 
                      : 'انضم للنقاش مع باقي المترشحين المهتمين بهذه المباراة.'}
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenCommunityTopic) onOpenCommunityTopic(contest.id);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#8D174B] text-white font-semibold text-xs shadow-xs hover:bg-[#75123E] cursor-pointer"
                  >
                    {language === 'fr' ? 'Accéder au fil communautaire' : 'الانتقال إلى منتدى النقاش'}
                  </button>
                </div>
              </div>
            )}

            {/* Official Legal Notice */}
            <div className="pt-4 border-t border-[#F1E5EC]">
              <div className="flex items-start gap-2.5 text-xs text-[#6E6773] bg-[#F8F2F5] p-3 rounded-xl border border-[#F1E5EC]">
                <AlertCircle className="w-4 h-4 text-[#8D174B] shrink-0 mt-0.5" />
                <span>{t.officialDisclaimerText}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer: Postuler Maintenant */}
        <div className="sticky bottom-0 z-20 bg-white border-t border-[#F1E5EC] p-4 sm:p-5 flex flex-wrap sm:flex-nowrap items-center gap-3">
          {applicationUrl ? (
            <a
              href={applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-5 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-[#8D174B]/15 transition-all cursor-pointer"
            >
              <span>{t.contests.postuler}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <div className="flex-1 py-3 px-5 rounded-xl bg-gray-100 text-gray-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 text-center">
              <span>{language === 'fr' ? 'Dépôt du dossier selon modalité de l’arrêté' : 'إيداع الملف وفق الكيفيات المحددة بالقرار'}</span>
            </div>
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
