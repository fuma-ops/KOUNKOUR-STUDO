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
import { FeaturedContestsSection } from './components/FeaturedContestsSection';
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
import { Route, parsePath, routePath, tabOf, withLang } from './lib/routes';
import { loadCandidateProfile, checkEligibility } from './utils/candidateStorage';
import { 
  Filter, SlidersHorizontal, Sparkles, AlertTriangle, 
  ArrowRight, ArrowLeft, Bookmark, CheckCircle2, Calendar, Radio,
  UserCheck, Check, Edit3, Target
} from 'lucide-react';

export default function App() {
  // L'adresse de la page (cahier §5/§15) détermine l'écran ouvert au chargement.
  const [language, setLanguage] = useState<Language>(() =>
    new URLSearchParams(window.location.search).get('lang') === 'ar' ? 'ar' : 'fr'
  );
  const [activeTab, setActiveTab] = useState<string>(() => tabOf(parsePath(window.location.pathname)));
  const [pendingContestSlug, setPendingContestSlug] = useState<string | null>(() => {
    const r = parsePath(window.location.pathname);
    return r.name === 'contest' ? r.slug : null;
  });
  const [qcmRoute, setQcmRoute] = useState<{ folder: string | null; set: string | null }>(() => {
    const r = parsePath(window.location.pathname);
    return { folder: r.name === 'folder' ? r.slug : null, set: r.name === 'qcm' ? r.slug : null };
  });
  const [contestsLoaded, setContestsLoaded] = useState(false);
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
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setContestsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [contestsVersion]);

  // Ouverture d'une fiche depuis son adresse /concours/<slug>.
  useEffect(() => {
    if (!pendingContestSlug) return;
    const found = allActiveContests.find((c) => c.slug === pendingContestSlug);
    if (found) {
      setSelectedContest(found);
      setPendingContestSlug(null);
    } else if (contestsLoaded) {
      setPendingContestSlug(null);
    }
  }, [pendingContestSlug, allActiveContests, contestsLoaded]);

  // Navigation par onglet : repart de la racine de l'onglet.
  const goTab = (tab: string) => {
    setPendingContestSlug(null);
    setQcmRoute({ folder: null, set: null });
    setActiveTab(tab);
  };

  // Barre d'adresse synchronisée avec l'écran (partage de lien, bouton retour).
  const currentPath = useMemo(() => {
    let r: Route;
    if (activeTab === 'admin') r = { name: 'admin' };
    else if (selectedContest?.slug) r = { name: 'contest', slug: selectedContest.slug };
    else if (pendingContestSlug) r = { name: 'contest', slug: pendingContestSlug };
    else if (activeTab === 'contests') r = { name: 'contests' };
    else if (activeTab === 'preparation')
      r = qcmRoute.set ? { name: 'qcm', slug: qcmRoute.set } : qcmRoute.folder ? { name: 'folder', slug: qcmRoute.folder } : { name: 'prep' };
    else if (activeTab === 'community') r = { name: 'community' };
    else if (activeTab === 'profile') r = { name: 'profile' };
    else r = { name: 'home' };
    return withLang(routePath(r), language);
  }, [activeTab, selectedContest, pendingContestSlug, qcmRoute, language]);
  const firstSync = React.useRef(true);
  useEffect(() => {
    const here = window.location.pathname + window.location.search;
    if (here === currentPath) {
      firstSync.current = false;
      return;
    }
    const samePage = window.location.pathname === currentPath.split('?')[0];
    if (firstSync.current || samePage) window.history.replaceState(null, '', currentPath);
    else window.history.pushState(null, '', currentPath);
    firstSync.current = false;
  }, [currentPath]);
  useEffect(() => {
    const onPop = () => {
      const r = parsePath(window.location.pathname);
      setLanguage(new URLSearchParams(window.location.search).get('lang') === 'ar' ? 'ar' : 'fr');
      setActiveTab(tabOf(r));
      setQcmRoute({ folder: r.name === 'folder' ? r.slug : null, set: r.name === 'qcm' ? r.slug : null });
      setSelectedContest(null);
      setPendingContestSlug(r.name === 'contest' ? r.slug : null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

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
        onNavigateToUserApp={() => goTab('home')}
        onNavigateTab={(tab) => goTab(tab)}
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
      {/* Bandeau bêta : les concours viennent des sources officielles ; l'arrêté fait foi. */}
      <div className="bg-[#8D174B] text-white py-1 px-4 text-center text-[11px] font-semibold flex items-center justify-center gap-2">
        <span className="px-1.5 py-0.2 rounded bg-amber-400 text-[#242126] font-bold text-[9px] uppercase">
          BÊTA
        </span>
        <span>
          {language === 'fr'
            ? 'Version bêta — Concours issus des sources officielles · seul l’arrêté officiel fait foi'
            : 'نسخة تجريبية — مباريات من المصادر الرسمية · القرار الرسمي هو المرجع'}
        </span>
      </div>

      {/* Main Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        activeTab={activeTab}
        setActiveTab={goTab}
        savedCount={bookmarkedIds.length}
        isAuthed={!!session.user}
        isStaff={session.isStaff}
        onAuthClick={() => setAuthOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Content Body Based on Tab */}
      <main className="flex-1 pb-20 md:pb-12">
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Hero Banner with Moroccan Architecture Backdrop & Search */}
            <HeroBanner
              language={language}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearchSubmit={() => {
                setActiveTab('contests');
              }}
            />

            {/* 3 Main Action Shortcuts, Concours à la une & Smart Match Entry */}
            <FeaturedContestsSection
              language={language}
              contests={allActiveContests}
              onSelectContest={setSelectedContest}
              onNavigateTab={(tab) => goTab(tab)}
              savedCount={bookmarkedIds.length}
            />

            {/* Official Legal Compliance Disclaimer */}
            <div className="max-w-6xl mx-auto px-4 pb-6">
              <OfficialDisclaimer language={language} />
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
            folderSlug={qcmRoute.folder}
            setSlug={qcmRoute.set}
            onNavigate={(folder, set) => setQcmRoute({ folder, set })}
          />
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <CommunityModule 
            language={language} 
            initialContestId={activeCommunityContestId}
            isAuthed={!!session.user}
            isStaff={session.isStaff}
            currentUserId={session.user?.id ?? null}
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
        setActiveTab={goTab}
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
