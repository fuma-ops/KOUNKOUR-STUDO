import React from 'react';
import { ShieldCheck, FileText } from 'lucide-react';
import type { Language } from '../types';
import { legalDoc, type LegalKind } from '../content/legal';

// Politique de confidentialité / conditions d'utilisation (même texte que le rendu serveur).
export const LegalPage: React.FC<{ kind: LegalKind; language: Language; onOpen: (kind: LegalKind) => void }> = ({ kind, language, onOpen }) => {
  const doc = legalDoc(kind, language);
  const other: LegalKind = kind === 'privacy' ? 'terms' : 'privacy';
  const otherTitle = legalDoc(other, language).title;
  const Icon = kind === 'privacy' ? ShieldCheck : FileText;
  return (
    <article className="max-w-3xl mx-auto px-4 py-6 sm:py-10 pb-28 md:pb-10 animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="mb-6 flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[#FDF2F7] text-[#8D174B] flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#242126]">{doc.title}</h1>
          <p className="text-xs sm:text-sm text-[#6E6773] mt-1 leading-relaxed">{doc.intro}</p>
        </div>
      </header>
      <div className="space-y-4">
        {doc.sections.map((s, i) => (
          <section
            key={s.title}
            className="rounded-2xl border border-[#F1E5EC] bg-white p-4 sm:p-5 animate-fade-in"
            style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
          >
            <h2 className="text-sm sm:text-base font-extrabold text-[#8D174B] mb-2">{s.title}</h2>
            {s.paragraphs.map((p, j) => (
              <p key={j} className="text-[13px] sm:text-sm text-[#4A4250] leading-relaxed mb-2 last:mb-0">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onOpen(other)}
        className="mt-6 text-sm font-bold text-[#8D174B] hover:underline cursor-pointer"
      >
        {otherTitle} →
      </button>
    </article>
  );
};
