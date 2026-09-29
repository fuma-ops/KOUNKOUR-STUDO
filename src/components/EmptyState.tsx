import React from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { RotateCcw } from 'lucide-react';
import { EmptyStateGraphic } from './illustrations/EmptyStateGraphic';

interface EmptyStateProps {
  language: Language;
  onResetFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ language, onResetFilters }) => {
  const t = translations[language];

  return (
    <div className="bg-white border border-[#F1E5EC] rounded-3xl p-8 sm:p-10 text-center max-w-md mx-auto my-8 shadow-xs">
      <div className="mb-4">
        <EmptyStateGraphic className="w-32 h-32 mx-auto" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-[#242126] mb-1.5">
        {t.emptyState.noContestsTitle}
      </h3>

      <p className="text-xs sm:text-sm text-[#6E6773] leading-relaxed mb-6">
        {t.emptyState.noContestsDesc}
      </p>

      <button
        onClick={onResetFilters}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>{t.emptyState.resetAllFilters}</span>
      </button>
    </div>
  );
};

