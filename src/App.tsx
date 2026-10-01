/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Language, Contest, ContestStatus } from './types';
import { translations } from './i18n/translations';
import { mockContests } from './data/mockContests';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HeroBanner } from './components/HeroBanner';
import { ContestCard } from './components/ContestCard';
import { FilterDrawer } from './components/FilterDrawer';
import { ContestDetailModal } from './components/ContestDetailModal';
import { SalarySimulatorModal } from './components/SalarySimulatorModal';
import { AdminCvModal } from './components/AdminCvModal';
import { QcmModule } from './components/QcmModule';
import { CommunityModule } from './components/CommunityModule';
import { ProfileModule } from './components/ProfileModule';
import { AdminDashboard } from './components/AdminDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EmptyState } from './components/EmptyState';
import { OfficialDisclaimer } from './components/OfficialDisclaimer';
import { getAllActiveContests, loadImportedContests, getDeletedContestIds, deleteContestFromSystem, sanitizeContestFields } from './utils/radarStorage';
import { fetchPublishedContests } from './data/supabaseContests';
import { useSession } from './lib/useSession';
import { AuthModal } from './components/AuthModal';
import { loadCandidateProfile, checkEligibility } from './utils/candidateStorage';
import { 
  Filter, SlidersHorizontal, Sparkles, AlertTriangle, 
  ArrowRight, ArrowLeft, Bookmark, CheckCircle2, Calendar, Radio,
  UserCheck, Check, Edit3, Target
} from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('fr');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<ContestStatus | 'all'>('open');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedDegree, setSelectedDegree] = useState<string>('all');
  const [onlyMatchingProfile, setOnlyMatchingProfile] = useState<boolean>(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [salaryContestTarget, setSalaryContestTarget] = useState<Contest | null>(null);
  const [activeCommunityContestId, setActiveCommunityContestId] = useState<string | null>(null);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState<boolean>(false);
  const [isAdminCvModalOpen, setIsAdminCvModalOpen] = useState<boolean>(false);
  const [profileVersion, setProfileVersion] = useState(0);
  const [contestsVersion, setContestsVersion] = useState(0);
  const session = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kounkour_bookmarks');
      return saved ? JSON.parse(saved) : ['c-interieur-tech-2026'];
    } catch {
      return ['c-interieur-tech-2026'];
    }
  });

  const [completedQcmScores, setCompletedQcmScores] = useState<
    { qcmId: string; score: number; total: number; completedAt: string }[]
  >(() => {
    try {
      const saved = localStorage.getItem('kounkour_qcm_scores');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync document direction and lang attribute with selected language
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Persist bookmarks
  useEffect(() => {
    try {
      localStorage.setItem('kounkour_bookmarks', JSON.stringify(bookmarkedIds));
    } catch (e) {
      console.warn('LocalStorage bookmark save failed', e);
    }
  }, [bookmarkedIds]);

  // Persist QCM scores
  useEffect(() => {
    try {
      localStorage.setItem('kounkour_qcm_scores', JSON.stringify(completedQcmScores));
    } catch (e) {
      console.warn('LocalStorage qcm save failed', e);
    }
  }, [completedQcmScores]);

  const t = translations[language];
  const isRTL = language === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const handleToggleBookmark = (contestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds((prev) =>
      prev.includes(contestId) ? prev.filter((id) => id !== contestId) : [...prev, contestId]
    );
  };

  const handleRecordScore = (qcmId: string, score: number, total: number) => {
    const newEntry = {
      qcmId,
      score,
      total,
      completedAt: new Date().toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };
    setCompletedQcmScores((prev) => [newEntry, ...prev]);
  };

  // Concours chargés depuis Supabase + fusion transparente avec les imports Radar
  const [allActiveContests, setAllActiveContests] = useState<Contest[]>(() => getAllActiveContests());
  useEffect(() => {
    let cancelled = false;
    fetchPublishedContests()
      .then((rows) => {
        if (!cancelled) {
          const deletedIds = new Set(getDeletedContestIds());
          const imported = loadImportedContests().filter((c) => !deletedIds.has(c.id));
          const supabaseRows = (rows || []).filter((r) => !deletedIds.has(r.id));
          
          // Dédoublonnage strict par référence officielle, slug ou id
          const seenKeys = new Set<string>();
          const deduplicated: Contest[] = [];

          // 1. Priorité absolue aux concours officiels Supabase
          for (const s of supabaseRows) {
            const refKey = s.referenceCode ? `ref:${s.referenceCode.trim().toLowerCase()}` : '';
            const slugKey = s.slug ? `slug:${s.slug.trim().toLowerCase()}` : '';
            const idKey = `id:${s.id}`;
            if (refKey) seenKeys.add(refKey);
            if (slugKey) seenKeys.add(slugKey);
            seenKeys.add(idKey);
            deduplicated.push(s);
          }

          // 2. Ajout des imports locaux uniquement s'ils ne sont pas déjà en base
          for (const imp of imported) {
            const refKey = imp.referenceCode ? `ref:${imp.referenceCode.trim().toLowerCase()}` : '';
            const slugKey = imp.slug ? `slug:${imp.slug.trim().toLowerCase()}` : '';
            const normId = imp.id.replace(/^(?:c-|scrape-)/, '');
            const idKey = `id:${normId}`;

            const isDuplicate =
              (refKey && seenKeys.has(refKey)) ||
              (slugKey && seenKeys.has(slugKey)) ||
              seenKeys.has(idKey) ||
              seenKeys.has(`id:${imp.id}`);

            if (!isDuplicate) {
              if (refKey) seenKeys.add(refKey);
              if (slugKey) seenKeys.add(slugKey);
              seenKeys.add(idKey);
              deduplicated.push(imp);
            }
          }

          const combined = deduplicated.map(sanitizeContestFields).filter((c) => !deletedIds.has(c.id));
          if (combined.length > 0) {
            setAllActiveContests(combined);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [contestsVersion]);

  const handleDeleteContest = async (contestId: string) => {
    await deleteContestFromSystem(contestId);
    setAllActiveContests((prev) => prev.filter((c) => c.id !== contestId && c.id !== `c-${contestId}`));
    setContestsVersion((v) => v + 1);
    if (selectedContest?.id === contestId) {
      setSelectedContest(null);
    }
  };

  const handleSignOut = async () => {
    await session.signOut();
    setActiveTab('home');
  };

  const candidateProfile = useMemo(() => {
    return loadCandidateProfile();
  }, [profileVersion]);

  const eligibleContests = useMemo(() => {
    return allActiveContests.filter((c) => {
      const eligibility = checkEligibility(c, candidateProfile);
      return eligibility.isEligible;
    });
  }, [allActiveContests, candidateProfile]);

  // Filter contests based on active criteria
  const filteredContests = useMemo(() => {
    return allActiveContests.filter((c) => {
      // Matching profile toggle
      if (onlyMatchingProfile) {
        const eligibility = checkEligibility(c, candidateProfile);
        if (!eligibility.isEligible) {
          return false;
        }
      }
      // Status filter
      if (selectedStatus === 'open') {
        if (c.status !== 'open' && c.status !== 'closing_soon') {
          return false;
        }
      } else if (selectedStatus === 'in_progress') {
        if (c.status !== 'in_progress') {
          return false;
        }
      } else if (selectedStatus !== 'all' && c.status !== selectedStatus) {
        return false;
      }
      // Sector filter
      if (selectedSector !== 'all' && c.administration.category !== selectedSector) {
        return false;
      }
      // Degree filter
      if (selectedDegree !== 'all' && !c.degreeLevel.toLowerCase().includes(selectedDegree.toLowerCase())) {
        return false;
      }
      // Search query (matches title, administration, specialty in both languages)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inTitleFr = c.title.fr.toLowerCase().includes(query);
        const inTitleAr = c.title.ar.toLowerCase().includes(query);
        const inAdminFr = c.administration.name.fr.toLowerCase().includes(query);
        const inAdminAr = c.administration.name.ar.toLowerCase().includes(query);
        const inSpecFr = c.specialty.fr.toLowerCase().includes(query);
        const inSpecAr = c.specialty.ar.toLowerCase().includes(query);

        if (!inTitleFr && !inTitleAr && !inAdminFr && !inAdminAr && !inSpecFr && !inSpecAr) {
          return false;
        }
      }
      return true;
    });
  }, [allActiveContests, candidateProfile, onlyMatchingProfile, selectedStatus, selectedSector, selectedDegree, searchQuery]);

  // Contests closing soon (daysRemaining between 1 and 20)
  const closingSoonContests = useMemo(() => {
    return allActiveContests.filter((c) => c.status === 'open' && c.daysRemaining > 0 && c.daysRemaining <= 20);
  }, [allActiveContests]);

  const handleResetFilters = () => {
    setSelectedStatus('all');
    setSelectedSector('all');
    setSelectedDegree('all');
    setSearchQuery('');
  };

  const bookmarkedContests = useMemo(() => {
    return allActiveContests.filter((c) => bookmarkedIds.includes(c.id));
  }, [allActiveContests, bookmarkedIds]);

  if (activeTab === 'admin') {
    // Accès réservé au staff (vérifié par le rôle serveur + RLS). Un visiteur
    // non connecté ou non autorisé ne voit jamais le back-office.
    if (session.loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FFFDFE] text-[#6E6773] text-sm">
          {language === 'fr' ? 'Vérification de l’accès…' : 'جارٍ التحقق من الصلاحية…'}
        </div>
      );
    }
    if (!session.isStaff) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FFFDFE] px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#8D174B] text-white flex items-center justify-center text-2xl">👑</div>
          <h1 className="text-lg font-extrabold text-[#242126]">
            {language === 'fr' ? 'Espace administrateur' : 'فضاء الإدارة'}
          </h1>
          <p className="max-w-sm text-sm text-[#6E6773]">
            {language === 'fr'
              ? 'Cet espace est réservé à l’équipe. Connectez-vous avec un compte autorisé.'
              : 'هذا الفضاء مخصص للفريق. يرجى تسجيل الدخول بحساب مرخّص.'}
          </p>
          <div className="flex gap-2">
            {!session.user ? (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#8D174B] hover:bg-[#70113B] text-white text-sm font-bold"
              >
                {language === 'fr' ? 'Se connecter' : 'تسجيل الدخول'}
              </button>
            ) : (
              <span className="px-4 py-2 rounded-xl bg-[#FDF2F7] text-[#8D174B] text-xs font-semibold">
                {language === 'fr' ? 'Compte sans droits d’accès' : 'حساب بدون صلاحية'}
              </span>
            )}
            <button
              onClick={() => setActiveTab('home')}
              className="px-5 py-2.5 rounded-xl border border-[#F1E5EC] text-[#6E6773] text-sm font-semibold hover:bg-[#F8F2F5]"
            >
              {language === 'fr' ? 'Retour' : 'رجوع'}
            </button>
          </div>
          <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} language={language} />
        </div>
      );
    }
    return (
      <AdminDashboard
        language={language}
        onNavigateToUserApp={() => setActiveTab('home')}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onSelectContest={setSelectedContest}
        onContestImported={() => {
          setAllActiveContests(getAllActiveContests());
          setContestsVersion((v) => v + 1);
        }}
        onDeleteContest={handleDeleteContest}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDFE] flex flex-col justify-between text-[#242126]">
      {/* Top Demo Compliance Banner required by Section 0 */}
      <div className="bg-[#8D174B] text-white py-1 px-4 text-center text-[11px] font-semibold flex items-center justify-center gap-2">
        <span className="px-1.5 py-0.2 rounded bg-amber-400 text-[#242126] font-bold text-[9px] uppercase">
          DEMO
        </span>
        <span>
          {language === 'fr'
            ? 'Plateforme KounKour V1 — Données de démonstration et sources officielles étiquetées'
            : 'منصة كونكور النسخة الأولى — معطيات تجريبية ومصادر رسمية موثقة'}
        </span>
      </div>

      {/* Main Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={bookmarkedIds.length}
        isAuthed={!!session.user}
        isStaff={session.isStaff}
        onAuthClick={() => setAuthOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Content Body Based on Tab */}
      <main className="flex-1 pb-20 md:pb-12">
        {activeTab === 'home' && (
          <div>
            {/* Hero Banner */}
            <HeroBanner
              language={language}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedSector={selectedSector}
              setSelectedSector={setSelectedSector}
              onSearchSubmit={() => {
                setActiveTab('contests');
              }}
            />

            <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
              {/* Profile Match Highlights Card */}
              <div className="bg-gradient-to-r from-[#FFFDFE] via-[#FAF4F7] to-[#FDF2F7] border border-[#8D174B]/20 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#8D174B] text-white flex items-center justify-center shrink-0 shadow-md">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#8D174B] bg-white px-2.5 py-0.5 rounded-full border border-[#8D174B]/20">
                        {language === 'fr' ? 'Calculateur d’Éligibilité Légale' : 'حاسبة الأهلية والمطابقة القانونية'}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-900 font-extrabold px-2.5 py-0.5 rounded-full">
                        {language === 'fr' ? `${eligibleContests.length} concours compatibles` : `${eligibleContests.length} مباراة مطابقة لمؤهلاتك`}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[#242126]">
                      {!candidateProfile.degreeLevel || !candidateProfile.specialty || !candidateProfile.age
                        ? language === 'fr'
                          ? 'Complétez votre profil (diplôme, spécialité, âge) pour voir les concours auxquels vous êtes éligible.'
                          : 'أكمل ملفك (الدبلوم، التخصص، السن) لمعرفة المباريات التي تستوفي شروطها.'
                        : language === 'fr'
                        ? `Votre profil : ${candidateProfile.degreeLevel} en ${candidateProfile.specialty} (${candidateProfile.age} ans)`
                        : `ملفك الشخصي : ${candidateProfile.degreeLevel} في ${candidateProfile.specialty} (${candidateProfile.age} سنة)`}
                    </h3>
                    <p className="text-xs text-[#6E6773] mt-0.5">
                      {language === 'fr'
                        ? 'Contrôle automatique du diplôme, limite d’âge (18-45 ans) et spécialités exigées.'
                        : 'مقارنة آنية للدبلوم والسن والتخصصات مع الشروط الواردة في القرارات الرسمية.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setOnlyMatchingProfile(true);
                      setActiveTab('contests');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#8D174B] hover:bg-[#70113B] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <span>{language === 'fr' ? 'Voir mes concours' : 'عرض المباريات المطابقة'}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className="p-2.5 rounded-xl bg-white border border-[#F1E5EC] hover:border-[#8D174B]/40 text-[#6E6773] hover:text-[#8D174B] transition-all cursor-pointer shadow-xs"
                    title={language === 'fr' ? 'Modifier mon profil' : 'تعديل الملف'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Candidate Tracking Alerts (Browser Storage) */}
              {bookmarkedContests.length > 0 && (
                <div className="bg-gradient-to-r from-[#FDF2F7] to-white border border-[#8D174B]/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#8D174B] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#8D174B]">
                          {language === 'fr' ? 'Mon Espace Candidat' : 'فضاء المترشح'}
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                          {bookmarkedContests.length} {language === 'fr' ? 'suivis' : 'متابعة'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-[#242126] mt-0.5">
                        {language === 'fr' 
                          ? 'Suivez vos échéances et validez vos pièces justificatives avant la clôture.' 
                          : 'تابع مواعيد إيداع الملفات وتأكد من اكتمال وثائقك الرسمية.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <span>{language === 'fr' ? 'Ouvrir mon suivi' : 'لوحة التتبع'}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Radar Status Callout */}
              <div 
                onClick={() => setActiveTab('radar')}
                className="bg-[#1C1420] text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-emerald-500/50 border border-[#8D174B]/20 transition-all shadow-md group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                        {language === 'fr' ? 'Radar de Veille & Scraping Actif' : 'رادار الرصد الآلي نشط'}
                      </span>
                      <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                        6 {language === 'fr' ? 'portails scannés' : 'بوابات رسمية'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-gray-100 mt-0.5">
                      {language === 'fr' 
                        ? 'Consultez les annonces brutes détectées en continu sur emploi-public.ma et les ministères.' 
                        : 'استعرض أحدث المباريات والقرارات الملتقطة في الوقت الفعلي من المواقع الرسمية.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 shrink-0">
                  <span>{language === 'fr' ? 'Ouvrir le Radar' : 'فتح الرادار'}</span>
                  <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Official Disclaimer */}
              <OfficialDisclaimer language={language} />

              {/* Section 1: Dates limites proches (Closing Soon) */}
              {closingSoonContests.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                      <h2 className="text-lg sm:text-xl font-bold text-[#242126]">
                        {language === 'fr' ? 'Dates limites proches' : 'آخر أجل قريب'}
                      </h2>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStatus('open');
                        setActiveTab('contests');
                      }}
                      className="text-xs font-semibold text-[#8D174B] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{language === 'fr' ? 'Voir tout' : 'عرض الكل'}</span>
                      <ArrowIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {closingSoonContests.slice(0, 3).map((contest) => (
                      <ContestCard
                        key={`${contest.id}-${profileVersion}`}
                        contest={contest}
                        language={language}
                        isBookmarked={bookmarkedIds.includes(contest.id)}
                        onToggleBookmark={handleToggleBookmark}
                        onSelectContest={setSelectedContest}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Nouveaux concours récents */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#8D174B]" />
                    <h2 className="text-lg sm:text-xl font-bold text-[#242126]">
                      {language === 'fr' ? 'Nouveaux concours ouverts' : 'أحدث المباريات المفتوحة'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('contests')}
                    className="text-xs font-semibold text-[#8D174B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{language === 'fr' ? 'Consulter toutes les annonces' : 'تصفح جميع الإعلانات'}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allActiveContests
                    .filter((c) => c.status === 'open' || c.status === 'closing_soon')
                    .slice(0, 6)
                    .map((contest) => (
                      <ContestCard
                        key={`${contest.id}-${profileVersion}`}
                        contest={contest}
                        language={language}
                        isBookmarked={bookmarkedIds.includes(contest.id)}
                        onToggleBookmark={handleToggleBookmark}
                        onSelectContest={setSelectedContest}
                      />
                    ))}
                </div>
              </div>

              {/* Section 3: Quick Preparation & Community shortcuts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div 
                  onClick={() => setActiveTab('preparation')}
                  className="p-6 rounded-2xl bg-gradient-to-br from-[#FDF2F7] to-white border border-[#8D174B]/20 hover:border-[#8D174B]/40 transition-all cursor-pointer shadow-xs group"
                >
                  <span className="text-[10px] font-bold text-[#8D174B] uppercase tracking-wider block mb-1">
                    {language === 'fr' ? 'Module Révision' : 'فضاء المراجعة'}
                  </span>
                  <h3 className="text-base font-bold text-[#242126] group-hover:text-[#8D174B] transition-colors mb-2">
                    {t.preparation.title}
                  </h3>
                  <p className="text-xs text-[#6E6773] leading-relaxed mb-4">
                    {t.preparation.subtitle}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8D174B]">
                    <span>{language === 'fr' ? 'Lancer un test QCM' : 'بدء اختبار تجريبي'}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div 
                  onClick={() => setActiveTab('community')}
                  className="p-6 rounded-2xl bg-gradient-to-br from-[#F8F2F5] to-white border border-[#F1E5EC] hover:border-[#8D174B]/30 transition-all cursor-pointer shadow-xs group"
                >
                  <span className="text-[10px] font-bold text-[#C73578] uppercase tracking-wider block mb-1">
                    {language === 'fr' ? 'Entraide & Questions' : 'التعاون والمجتمع'}
                  </span>
                  <h3 className="text-base font-bold text-[#242126] group-hover:text-[#8D174B] transition-colors mb-2">
                    {t.community.title}
                  </h3>
                  <p className="text-xs text-[#6E6773] leading-relaxed mb-4">
                    {t.community.subtitle}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8D174B]">
                    <span>{language === 'fr' ? 'Rejoindre les discussions' : 'الانضمام للمناقشات'}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contests List Tab */}
        {activeTab === 'contests' && (
          <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-[#242126]">{t.contests.title}</h1>
                <p className="text-xs text-[#6E6773] mt-0.5">{t.contests.subtitle}</p>
              </div>

              {/* Filter drawer trigger button */}
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-[#F1E5EC] hover:border-[#8D174B]/40 text-[#242126] text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#8D174B]" />
                <span>{t.contests.filterButton}</span>
                {(selectedStatus !== 'all' || selectedSector !== 'all' || selectedDegree !== 'all') && (
                  <span className="w-2 h-2 rounded-full bg-[#8D174B]"></span>
                )}
              </button>
            </div>

            {/* Quick Filter Status Bar with Mon Profil Toggle */}
            {(() => {
              const openCount = allActiveContests.filter((c) => c.status === 'open' || c.status === 'closing_soon').length;
              const inProgressCount = allActiveContests.filter((c) => c.status === 'in_progress').length;
              const closedCount = allActiveContests.filter((c) => c.status === 'closed').length;
              return (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6 border-b border-[#F1E5EC]">
                  {/* Matching Profile Quick Filter */}
                  <button
                    onClick={() => setOnlyMatchingProfile(!onlyMatchingProfile)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      onlyMatchingProfile
                        ? 'bg-[#8D174B] text-white shadow-xs ring-2 ring-[#8D174B]/30'
                        : 'bg-[#FDF2F7] text-[#8D174B] border border-[#8D174B]/30 hover:bg-[#FAF4F7]'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>
                      {language === 'fr' 
                        ? `🎯 Adaptés à mon profil (${eligibleContests.length})` 
                        : `🎯 ملائم لملفي (${eligibleContests.length})`}
                    </span>
                  </button>

                  <div className="h-5 w-[1px] bg-[#E2D5DE] shrink-0 mx-1"></div>

                  {[
                    { id: 'open', label: `${language === 'fr' ? 'Dépôts en cours' : 'مفتوحة للترشيح'} (${openCount})` },
                    { id: 'in_progress', label: `${language === 'fr' ? 'Épreuves & Convocations' : 'الاختبارات الجارية'} (${inProgressCount})` },
                    { id: 'all', label: `${language === 'fr' ? 'Tous les concours' : 'جميع المباريات'} (${allActiveContests.length})` },
                    { id: 'closed', label: `${language === 'fr' ? 'Clôturés (Archives)' : 'منتهية الأجل'} (${closedCount})` },
                  ].map((st) => {
                    const isSelected = selectedStatus === st.id && !onlyMatchingProfile;
                    return (
                      <button
                        key={st.id}
                        onClick={() => {
                          setOnlyMatchingProfile(false);
                          setSelectedStatus(st.id as any);
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#8D174B] text-white shadow-xs'
                            : 'bg-white text-[#6E6773] border border-[#F1E5EC] hover:bg-[#F8F2F5]'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* Active search bar */}
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-white border border-[#F1E5EC] focus:border-[#8D174B] rounded-2xl py-3 px-4 text-xs sm:text-sm text-[#242126] shadow-xs focus:outline-none"
              />
            </div>

            {/* Contests Count & Grid */}
            {filteredContests.length === 0 ? (
              <EmptyState language={language} onResetFilters={handleResetFilters} />
            ) : (
              <div>
                <div className="text-xs text-[#6E6773] font-medium mb-4 flex items-center justify-between">
                  <span>{filteredContests.length} {t.contests.resultsCount}</span>
                  {(selectedStatus !== 'all' || selectedSector !== 'all' || selectedDegree !== 'all' || searchQuery) && (
                    <button
                      onClick={handleResetFilters}
                      className="text-xs font-semibold text-[#8D174B] hover:underline cursor-pointer"
                    >
                      {t.contests.resetFilters}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredContests.map((contest) => (
                    <ContestCard
                      key={`${contest.id}-${profileVersion}`}
                      contest={contest}
                      language={language}
                      isBookmarked={bookmarkedIds.includes(contest.id)}
                      onToggleBookmark={handleToggleBookmark}
                      onSelectContest={setSelectedContest}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preparation / QCM Tab */}
        {activeTab === 'preparation' && (
          <QcmModule
            language={language}
            onRecordScore={handleRecordScore}
          />
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <CommunityModule 
            language={language} 
            initialContestId={activeCommunityContestId}
            isAuthed={!!session.user}
            onAuthClick={() => setAuthOpen(true)}
            allContests={allActiveContests}
          />
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          session.user ? (
            <ProfileModule
              key={profileVersion}
              language={language}
              onLanguageChange={setLanguage}
              bookmarkedContests={bookmarkedContests}
              allContests={allActiveContests}
              completedQcmScores={completedQcmScores}
              onSelectContest={setSelectedContest}
              onRemoveBookmark={(id) => setBookmarkedIds((prev) => prev.filter((i) => i !== id))}
              onProfileUpdated={() => setProfileVersion((v) => v + 1)}
              onOpenSalarySimulator={(contest) => {
                setSalaryContestTarget(contest || null);
                setIsSalaryModalOpen(true);
              }}
              onOpenAdminCv={() => setIsAdminCvModalOpen(true)}
            />
          ) : (
            <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-[#F1E5EC] text-center shadow-lg animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center mx-auto mb-4 shadow-md">
                <Bookmark className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-[#242126] mb-2">
                {language === 'fr' ? 'Connexion requise pour votre espace' : 'تسجيل الدخول مطلوب'}
              </h2>
              <p className="text-xs text-[#6E6773] mb-6 leading-relaxed">
                {language === 'fr' 
                  ? 'Connectez-vous pour consulter vos concours favoris, votre profil de candidature et vos scores de préparation.' 
                  : 'يرجى تسجيل الدخول للاطلاع على مبارياتك المفضلة، ملفك الشخصي ونتائج الاختبارات.'}
              </p>
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="w-full py-3 rounded-xl bg-[#8D174B] hover:bg-[#70113B] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                {language === 'fr' ? 'Se connecter / Créer un compte' : 'تسجيل الدخول / إنشاء حساب'}
              </button>
            </div>
          )
        )}
      </main>

      {/* Filter Drawer / Modal */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        language={language}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedSector={selectedSector}
        setSelectedSector={setSelectedSector}
        selectedDegree={selectedDegree}
        setSelectedDegree={setSelectedDegree}
        onReset={handleResetFilters}
        totalFilteredCount={filteredContests.length}
      />

      {/* Contest Detailed Modal */}
      <ContestDetailModal
        contest={selectedContest}
        isOpen={!!selectedContest}
        onClose={() => setSelectedContest(null)}
        language={language}
        isBookmarked={selectedContest ? bookmarkedIds.includes(selectedContest.id) : false}
        onToggleBookmark={handleToggleBookmark}
        onOpenCommunityTopic={(contestId) => {
          setActiveCommunityContestId(contestId);
          setActiveTab('community');
          setSelectedContest(null);
        }}
        onOpenSalarySimulator={(contest) => {
          setSalaryContestTarget(contest);
          setIsSalaryModalOpen(true);
        }}
      />

      {/* Official Salary Simulator Modal */}
      <SalarySimulatorModal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        language={language}
        initialContest={salaryContestTarget}
      />

      {/* Official Moroccan Administrative CV Builder Modal */}
      <AdminCvModal
        isOpen={isAdminCvModalOpen}
        onClose={() => setIsAdminCvModalOpen(false)}
        language={language}
      />

      {/* Modal d'authentification (Supabase) */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} language={language} />

      {/* Persistent Mobile Bottom Navigation */}
      <BottomNav
        language={language}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAuthed={!!session.user}
        onAuthClick={() => setAuthOpen(true)}
      />

      {/* Footer */}
      <footer className="hidden md:block bg-white border-t border-[#F1E5EC] py-6 px-4 text-center text-xs text-[#6E6773]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#8D174B]">KounKour</span>
            <span>—</span>
            <span>{t.tagline}</span>
          </div>
          <div className="text-[11px] text-[#6E6773]">
            {language === 'fr' 
              ? 'Conforme aux normes de protection des données (Loi 09-08) • Plateforme d’information indépendante' 
              : 'مطابق لمقتضيات حماية المعطيات ذات الطابع الشخصي (القانون 09-08) • منصة إخبارية مستقلة'}
          </div>
        </div>
      </footer>
    </div>
  );
}
