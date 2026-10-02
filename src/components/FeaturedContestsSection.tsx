import React from 'react';
import { Contest, Language } from '../types';
import { translations } from '../i18n/translations';
import { 
  FileText, GraduationCap, Bookmark, ArrowRight, ArrowLeft, 
  Calendar, ChevronRight, ChevronLeft, Sparkles, Target,
  Users, MapPin, Tag, Briefcase
} from 'lucide-react';
import { resolveAdministrationLogo } from '../utils/radarStorage';

interface FeaturedContestsSectionProps {
  language: Language;
  contests: Contest[];
  onSelectContest: (contest: Contest) => void;
  onNavigateTab: (tab: string) => void;
  savedCount: number;
}

export const FeaturedContestsSection: React.FC<FeaturedContestsSectionProps> = ({
  language,
  contests,
  onSelectContest,
  onNavigateTab,
  savedCount,
}) => {
  const t = translations[language];
  const isRTL = language === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  // Curate top featured contests (open or high post count)
  const featuredContests = contests
    .filter((c) => c.status === 'open' || c.status === 'closing_soon' || !c.status)
    .slice(0, 6);

  // Fallback default sample image for Moroccan visual realism if no specific image exists
  const getContestHeroImage = (contest: Contest) => {
    if (contest.image && contest.image.trim().length > 0) return contest.image;
    const cat = (contest.administration?.category as string) || '';
    if (cat === 'education') return '/images/classroom_prep.jpg';
    if (cat === 'justice') return '/images/moroccan_court.jpg';
    if (cat === 'interieur' || cat === 'securite') return '/images/moroccan_palace.jpg';
    if (cat === 'finances') return '/images/hassan_palace.jpg';
    return '/images/morocco_hero.jpg';
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 space-y-8 animate-fade-in">
      
      {/* 1. THREE MAIN ACTION SHORTCUTS (Matching Reference Image 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        
        {/* Shortcut 1: Tous les concours */}
        <div
          onClick={() => onNavigateTab('contests')}
          className="bg-white rounded-3xl p-5 border border-[#F1E5EC] hover:border-[#8D174B]/30 hover:shadow-lg shadow-xs transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF2F7] text-[#8D174B] border border-[#8D174B]/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="w-8 h-8 rounded-full bg-[#FAF4F7] flex items-center justify-center text-[#8D174B] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
              <ArrowIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#242126] group-hover:text-[#8D174B] transition-colors">
              {language === 'fr' ? 'Tous les concours' : 'كافة المباريات'}
            </h3>
            <p className="text-xs text-[#6E6773] mt-0.5 font-medium">
              {language === 'fr' ? 'Explorez tous les recrutements d’État' : 'استكشف كافة عروض التوظيف العمومي'}
            </p>
          </div>
        </div>

        {/* Shortcut 2: Préparation */}
        <div
          onClick={() => onNavigateTab('preparation')}
          className="bg-white rounded-3xl p-5 border border-[#F1E5EC] hover:border-[#8D174B]/30 hover:shadow-lg shadow-xs transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF2F7] text-[#8D174B] border border-[#8D174B]/15 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="w-8 h-8 rounded-full bg-[#FAF4F7] flex items-center justify-center text-[#8D174B] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
              <ArrowIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#242126] group-hover:text-[#8D174B] transition-colors">
              {language === 'fr' ? 'Préparation' : 'الاستعداد'}
            </h3>
            <p className="text-xs text-[#6E6773] mt-0.5 font-medium">
              {language === 'fr' ? 'QCM, annales et résumés officiels' : 'اختبارات QCM، نماذج سابقة ومراجع'}
            </p>
          </div>
        </div>

        {/* Shortcut 3: Mes concours */}
        <div
          onClick={() => onNavigateTab('profile')}
          className="bg-white rounded-3xl p-5 border border-[#F1E5EC] hover:border-[#8D174B]/30 hover:shadow-lg shadow-xs transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF2F7] text-[#8D174B] border border-[#8D174B]/15 flex items-center justify-center group-hover:scale-110 transition-transform relative">
              <Bookmark className="w-6 h-6 stroke-[2]" />
              {savedCount > 0 && (
                <span className="absolute -top-1 -end-1 w-5 h-5 bg-[#8D174B] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {savedCount}
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-[#FAF4F7] flex items-center justify-center text-[#8D174B] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
              <ArrowIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#242126] group-hover:text-[#8D174B] transition-colors">
              {language === 'fr' ? 'Mes concours' : 'مبارياتي المفضلة'}
            </h3>
            <p className="text-xs text-[#6E6773] mt-0.5 font-medium">
              {language === 'fr' ? 'Concours sauvegardés et suivis' : 'المباريات المحفوظة وتتبع التواريخ'}
            </p>
          </div>
        </div>

      </div>

      {/* 2. CONCOURS À LA UNE (FEATURED CONCOURS VISUAL CARDS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#242126] tracking-tight">
              {language === 'fr' ? 'Concours à la une' : 'أبرز مباريات التوظيف'}
            </h2>
            <p className="text-xs text-[#6E6773] mt-0.5">
              {language === 'fr' ? 'Sélection des opportunités ouvertes récemment' : 'مختارات من أحدث المباريات المفتوحة للترشيح'}
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('contests')}
            className="text-xs sm:text-sm font-bold text-[#8D174B] hover:text-[#70113B] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{language === 'fr' ? 'Voir tout' : 'عرض الكل'}</span>
            <ArrowIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Featured Visual Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {featuredContests.map((contest) => {
            const contestImageSrc = contest.image || contest.administration?.logo || resolveAdministrationLogo(contest.administration?.name?.fr, contest.administration?.category, contest.title?.fr);

            return (
              <div
                key={contest.id}
                onClick={() => onSelectContest(contest)}
                className="bg-white rounded-3xl border border-[#F1E5EC] hover:border-[#8D174B]/35 overflow-hidden shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
              >
                {/* White Canvas Header with Moroccan Burgundy Pattern Blended at the Borders/Corners and Centered Uncropped Image */}
                <div className="relative h-36 sm:h-40 overflow-hidden bg-gradient-to-b from-white via-white to-[#FDF7FA] border-b border-[#F1E5EC] flex flex-col justify-between p-3">
                  {/* Moroccan Geometric Pattern with Edge-Blend Effect (Faded at Center, Visible along Borders & Corners) */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='44' height='44' viewBox='0 0 44 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%238D174B' stroke-width='0.95'%3E%3Cpath d='M22 0 L27 17 L44 22 L27 27 L22 44 L17 27 L0 22 L17 17 Z'/%3E%3Cpath d='M22 7 L30 22 L22 37 L14 22 Z' stroke-dasharray='1 2'/%3E%3Ccircle cx='22' cy='22' r='3.5'/%3E%3C/g%3E%3C/svg%3E")`,
                      backgroundSize: '32px 32px',
                      opacity: 0.22,
                      WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.45) 72%, black 100%)',
                      maskImage: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.45) 72%, black 100%)',
                    }}
                  />

                  {/* Delicate Burgundy Corner Vignette */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0) 38%, rgba(141, 23, 75, 0.03) 75%, rgba(141, 23, 75, 0.10) 100%)'
                    }}
                  />
                  <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-b from-[#8D174B]/5 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-[#8D174B]/6 to-transparent pointer-events-none" />

                  {/* Floating Top Badges: Posts count on left, Status on right */}
                  <div className="relative z-20 flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#8D174B] text-white text-[10px] font-extrabold shadow-xs">
                      {contest.postsCount} {t.contests.posts}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-emerald-800 text-[10px] font-extrabold shadow-xs border border-emerald-100 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      <span>
                        {contest.status === 'closing_soon' 
                          ? (language === 'fr' ? 'Bientôt clos' : 'قريب الإغلاق') 
                          : (language === 'fr' ? 'Ouvert' : 'مفتوح')}
                      </span>
                    </span>
                  </div>

                  {/* Centered Image - Uncropped, Fit Pil-Poil with Object-Contain */}
                  <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-1">
                    <div className="transition-transform duration-300 group-hover:scale-105 flex items-center justify-center w-full h-full">
                      <img
                        src={contestImageSrc}
                        alt={contest.administration?.name?.[language] || 'Administration'}
                        referrerPolicy="no-referrer"
                        className="max-h-20 sm:max-h-22 max-w-[180px] sm:max-w-[200px] w-auto h-auto object-contain drop-shadow-xs"
                        onError={(e) => {
                          (e.target as any).src = resolveAdministrationLogo(contest.administration?.name?.fr, contest.administration?.category, contest.title?.fr);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-2.5">
                    {/* Administration name & Logo */}
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-white border border-gray-200 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                        <img
                          src={resolveAdministrationLogo(contest.administration?.name?.fr, contest.administration?.category, contest.title?.fr)}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[#8D174B] uppercase tracking-wider block truncate">
                        {contest.administration?.name?.[language] || contest.administration?.name?.fr}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm sm:text-base font-extrabold text-[#242126] group-hover:text-[#8D174B] transition-colors leading-snug line-clamp-2">
                      {contest.title[language] || contest.title.fr}
                    </h3>

                    {/* Detailed Metadata Badges: Diplôme • Spécialité • Nombre de postes */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {/* Diploma level */}
                      {contest.degreeLevel && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF0F5] text-[#8D174B] text-[11px] font-bold border border-[#8D174B]/15">
                          <GraduationCap className="w-3 h-3 text-[#8D174B]" />
                          <span>{contest.degreeLevel}</span>
                        </span>
                      )}

                      {/* Specialty */}
                      {(contest.specialty?.fr || contest.specialty?.ar) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF7F9] text-[#4A4250] text-[11px] font-semibold border border-[#F1E5EC]" title={contest.specialty[language] || contest.specialty.fr}>
                          <Tag className="w-3 h-3 text-[#8D174B] shrink-0" />
                          <span className="whitespace-normal break-words">{contest.specialty[language] || contest.specialty.fr}</span>
                        </span>
                      )}

                      {/* Posts count */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                        <Users className="w-3 h-3 text-emerald-700" />
                        <span>{contest.postsCount} {t.contests.posts}</span>
                      </span>

                      {/* Region / Location */}
                      {(contest.region?.fr || contest.location?.fr) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-gray-50 text-gray-700 text-[10px] font-medium border border-gray-200">
                          <MapPin className="w-3 h-3 text-gray-500" />
                          <span className="truncate max-w-[120px]">
                            {contest.region?.[language] || contest.location?.[language] || contest.region?.fr || contest.location?.fr}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer with deadline and arrow */}
                  <div className="pt-3 border-t border-[#FAF4F7] flex items-center justify-between text-xs text-[#6E6773]">
                    <div className="flex items-center gap-1.5 font-semibold text-[#8D174B]">
                      <Calendar className="w-3.5 h-3.5 text-[#8D174B]" />
                      <span>{contest.deadlineDate || (language === 'fr' ? 'À vérifier' : 'غير مؤكد')}</span>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-[#FAF4F7] flex items-center justify-center text-[#8D174B] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      <ChevronIcon className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SMART MATCH DISCREET ENTRY POINT (As specified in Section 19) */}
      <div className="bg-gradient-to-r from-[#FDF2F7] via-[#FFFDFE] to-[#FDF2F7] rounded-3xl border border-[#8D174B]/20 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center shrink-0 shadow-md">
            <Target className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#242126]">
              {language === 'fr' 
                ? 'Trouvez les concours qui vous correspondent.' 
                : 'اعثر على المباريات المناسبة لمؤهلاتك'}
            </h3>
            <p className="text-xs text-[#6E6773] mt-0.5 font-medium">
              {language === 'fr' 
                ? 'Complétez votre profil : Diplôme • Spécialité • Région...' 
                : 'أكمل بيانات ملفك: الدبلوم • التخصص • الجهة...'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('profile')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#8D174B] hover:bg-[#70113B] text-white text-xs font-extrabold shadow-md shadow-[#8D174B]/20 transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
        >
          <span>{language === 'fr' ? 'Compléter mon profil' : 'إكمال ملفي الشخصي'}</span>
          <ArrowIcon className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
