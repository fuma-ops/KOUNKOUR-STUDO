import React from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { Search, ArrowRight, ArrowLeft } from 'lucide-react';

interface HeroBannerProps {
  language: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  language,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
}) => {
  const t = translations[language];
  const isRTL = language === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  return (
    <div className="relative w-full px-3 sm:px-6 pt-2 pb-4 sm:pt-4 sm:pb-6">
      <div className="max-w-6xl mx-auto">
        {/* Moroccan Architectural Hero Card matching Reference Image 1 */}
        <div className="relative rounded-3xl sm:rounded-[32px] overflow-hidden min-h-[380px] sm:min-h-[440px] flex flex-col justify-end p-5 sm:p-10 shadow-xl border border-[#8D174B]/15">
          
          {/* Real Moroccan Photo Backdrop (Palace & Minaret) */}
          <img
            src="/images/morocco_hero.jpg"
            alt="Moroccan architecture palace at sunrise"
            className="absolute inset-0 w-full h-full object-cover object-center scale-100"
          />

          {/* Warm Moroccan Sunrise & Deep Burgundy Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F0714]/95 via-[#1F0714]/60 to-[#1F0714]/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#8D174B]/40 via-transparent to-transparent pointer-events-none" />

          {/* Moroccan subtle geometric watermark */}
          <div 
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.9'%3E%3Cpath d='M24 0 L29 19 L48 24 L29 29 L24 48 L19 29 L0 24 L19 19 Z'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '36px 36px',
            }}
          />

          {/* Content Overlay */}
          <div className="relative z-10 max-w-xl text-white space-y-3 sm:space-y-4">
            
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.15] text-white drop-shadow-md">
              {language === 'fr' ? (
                <>
                  <span className="text-rose-300">Votre avenir</span> commence ici.
                </>
              ) : (
                <>
                  <span className="text-rose-300">مستقبلك المهني</span> يبدأ هنا.
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm md:text-base text-rose-100/90 font-medium leading-relaxed drop-shadow-xs max-w-lg">
              {language === 'fr'
                ? 'Tous les concours du Maroc au même endroit. Préparez-vous. Suivez vos opportunités.'
                : 'كافة مباريات التوظيف العمومي بالمغرب في مكان واحد. استعد وتابع فرصك.'}
            </p>

            {/* Search Card Pill */}
            <div className="pt-2">
              <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-full p-1.5 shadow-2xl border-2 border-white/80 focus-within:border-[#8D174B] focus-within:bg-white transition-all text-[#242126]">
                <div className="ps-3.5 pe-2 text-[#8D174B]">
                  <Search className="w-5 h-5 text-[#8D174B]" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    language === 'fr'
                      ? 'Rechercher un concours, une administration, un diplôme...'
                      : 'البحث عن مباراة، إدارة، دبلوم...'
                  }
                  className="flex-1 bg-transparent py-2.5 px-2 text-xs sm:text-sm text-[#242126] placeholder-[#6E6773] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={onSearchSubmit}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-full bg-[#8D174B] hover:bg-[#70113B] text-white flex items-center justify-center shadow-md shadow-[#8D174B]/30 transition-transform active:scale-95 cursor-pointer shrink-0"
                  title={t.searchButton}
                >
                  <ArrowIcon className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
