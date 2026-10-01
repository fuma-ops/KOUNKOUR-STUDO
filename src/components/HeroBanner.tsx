import React from 'react';
import { Language, ContestCategory } from '../types';
import { translations } from '../i18n/translations';
import { Search, ArrowRight, ArrowLeft, FileText, BookOpen, Users, Sparkles } from 'lucide-react';

interface HeroBannerProps {
  language: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSector: string;
  setSelectedSector: (sector: string) => void;
  onSearchSubmit: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  language,
  searchQuery,
  setSearchQuery,
  selectedSector,
  setSelectedSector,
  onSearchSubmit,
}) => {
  const t = translations[language];
  const isRTL = language === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const sectors: { id: string; label: string }[] = [
    { id: 'all', label: t.sectors.all },
    { id: 'administration', label: t.sectors.administration },
    { id: 'education', label: t.sectors.education },
    { id: 'sante', label: t.sectors.sante },
    { id: 'finances', label: t.sectors.finances },
    { id: 'securite', label: t.sectors.securite },
    { id: 'collectivites', label: t.sectors.collectivites },
    { id: 'autres', label: t.sectors.autres },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#FDF2F7] via-[#FFFDFE] to-white border-b border-[#F1E5EC] py-6 sm:py-10 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Real Moroccan Photographic Hero Card (matching Screenshot 02) */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-[#8D174B]/20 mb-8 min-h-[360px] sm:min-h-[420px] flex items-center">
          {/* Real Photo Background */}
          <img
            src="/images/morocco_hero.jpg"
            alt="Moroccan architecture palace at sunrise"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Warm Moroccan Sunrise Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#8D174B]/95 via-[#8D174B]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#4A0E2E]/90 via-transparent to-transparent" />

          {/* Hero Content on top of real photograph */}
          <div className="relative z-10 p-6 sm:p-10 md:p-12 max-w-2xl text-white">
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-3 drop-shadow-sm">
              {language === 'fr' ? (
                <>
                  Trouvez les <span className="text-rose-300 underline decoration-rose-400/60 decoration-wavy decoration-2">concours</span> qui vous correspondent
                </>
              ) : (
                <>
                  اعثر على <span className="text-rose-300">المباريات</span> التي تناسب مؤهلاتك
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-base text-rose-100/90 font-medium mb-8 leading-relaxed max-w-xl drop-shadow-xs">
              {t.heroSubtitle}
            </p>

            {/* Central Search Bar */}
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl p-1.5 max-w-xl text-[#242126] border-2 border-white/40 focus-within:border-[#8D174B] transition-all">
              <div className="ps-3 pe-2 text-[#8D174B]">
                <Search className="w-5 h-5 text-[#8D174B]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.searchPlaceholder}
                className="flex-1 bg-transparent py-2.5 px-2 text-xs sm:text-sm text-[#242126] placeholder-[#6E6773] focus:outline-none"
              />
              <button
                onClick={onSearchSubmit}
                className="bg-[#8D174B] hover:bg-[#75123E] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
              >
                <span className="hidden sm:inline">{t.searchButton}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Core Pillars in Hero Overlay */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/20 text-center">
              <div className="flex items-center gap-2 text-start">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/95 leading-tight">
                  {language === 'fr' ? 'Documents officiels' : 'الوثائق الرسمية'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-start">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/95 leading-tight">
                  {language === 'fr' ? 'Outils préparation' : 'أدوات الاستعداد'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-start">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/95 leading-tight">
                  {language === 'fr' ? 'Communauté active' : 'مجتمع المترشحين'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sector Shortcuts */}
        <div className="flex items-center justify-center flex-wrap gap-2 max-w-4xl mx-auto">
          {sectors.map((sec) => {
            const isSelected = selectedSector === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  setSelectedSector(sec.id);
                  onSearchSubmit();
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#8D174B] text-white shadow-md'
                    : 'bg-white text-[#6E6773] border border-[#F1E5EC] hover:border-[#8D174B]/40 hover:text-[#8D174B]'
                }`}
              >
                {sec.label}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
