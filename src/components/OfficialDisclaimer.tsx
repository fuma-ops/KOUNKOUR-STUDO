import React from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { AlertCircle, ShieldCheck } from 'lucide-react';

interface OfficialDisclaimerProps {
  language: Language;
  compact?: boolean;
}

export const OfficialDisclaimer: React.FC<OfficialDisclaimerProps> = ({ language, compact = false }) => {
  const t = translations[language];

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F8F2F5] border border-[#F1E5EC] text-xs text-[#6E6773]">
        <ShieldCheck className="w-4 h-4 text-[#8D174B] shrink-0" />
        <span className="leading-snug">{t.officialDisclaimerText}</span>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFDFE] border border-[#F1E5EC] rounded-xl p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[#FDF2F7] text-[#8D174B] shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#8D174B] uppercase tracking-wider mb-1 flex items-center gap-2">
            <span>{t.officialDisclaimerTitle}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
              {t.demoNotice}
            </span>
          </h4>
          <p className="text-xs text-[#6E6773] leading-relaxed">
            {t.officialDisclaimerText}
          </p>
        </div>
      </div>
    </div>
  );
};
