import React from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import type { Language } from '../types';
import { GUIDES, findGuide, guidePath } from '../content/guides';

// Guides de préparation (même texte que le rendu serveur). Contenu en français.
const ArNote: React.FC<{ language: Language }> = ({ language }) =>
  language === 'ar' ? <p className="text-xs text-[#6E6773] mb-4" dir="rtl">هذا الدليل متوفر حاليا باللغة الفرنسية فقط.</p> : null;

export const GuidesStrip: React.FC<{ language: Language; onOpen: (slug: string | null) => void }> = ({ language, onOpen }) => (
  <section className="max-w-6xl mx-auto px-4 pt-5 animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
    <div className="rounded-2xl border border-[#F1E5EC] bg-white p-4 sm:p-5">
      <button type="button" onClick={() => onOpen(null)} className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-[#8D174B] hover:underline cursor-pointer">
        <BookOpen className="w-5 h-5" />
        {language === 'ar' ? 'أدلة التحضير' : 'Guides de préparation'}
      </button>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        {GUIDES.map((g, i) => (
          <a
            key={g.slug}
            href={guidePath(g.slug)}
            onClick={(e) => { e.preventDefault(); onOpen(g.slug); }}
            className="group rounded-xl border border-[#F1E5EC] bg-[#FFFAFC] p-3 hover:scale-[1.02] hover:shadow-md active:scale-95 transition-all duration-150 animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="block text-[13px] font-bold text-[#242126] leading-snug">{g.title}</span>
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#8D174B]">
              {language === 'ar' ? 'قراءة الدليل' : 'Lire le guide'} <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </a>
        ))}
      </div>
    </div>
  </section>
);

export const GuidePage: React.FC<{ slug: string | null; language: Language; onOpen: (slug: string | null) => void }> = ({ slug, language, onOpen }) => {
  const g = findGuide(slug);
  if (!g) {
    return (
      <article className="max-w-3xl mx-auto px-4 py-6 sm:py-10 pb-28 md:pb-10 animate-fade-in">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#242126]">Guides de préparation aux concours</h1>
        <p className="text-sm text-[#6E6773] mt-1 mb-5">Des guides pratiques pour comprendre les concours de la fonction publique marocaine, préparer son dossier et réussir les épreuves.</p>
        <ArNote language={language} />
        <div className="space-y-3">
          {GUIDES.map((x, i) => (
            <a key={x.slug} href={guidePath(x.slug)} onClick={(e) => { e.preventDefault(); onOpen(x.slug); window.scrollTo({ top: 0 }); }}
              className="block rounded-2xl border border-[#F1E5EC] bg-white p-4 hover:scale-[1.01] hover:shadow-md active:scale-95 transition-all duration-150 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <h2 className="text-base font-extrabold text-[#8D174B]">{x.title}</h2>
              <p className="text-[13px] text-[#4A4250] mt-1 leading-relaxed">{x.description}</p>
            </a>
          ))}
        </div>
      </article>
    );
  }
  return (
    <article className="max-w-3xl mx-auto px-4 py-6 sm:py-10 pb-28 md:pb-10 animate-fade-in" lang="fr" dir="ltr">
      <button type="button" onClick={() => { onOpen(null); window.scrollTo({ top: 0 }); }} className="text-xs font-bold text-[#8D174B] hover:underline cursor-pointer mb-3">
        ← Guides de préparation
      </button>
      <h1 className="text-xl sm:text-2xl font-extrabold text-[#242126]">{g.title}</h1>
      <p className="text-sm text-[#6E6773] mt-1 mb-2 leading-relaxed">{g.description}</p>
      <p className="text-[11px] text-[#6E6773] mb-5">Mis à jour le {g.updatedAt.split('-').reverse().join('/')} · Rédaction KounKour</p>
      <ArNote language={language} />
      <div className="space-y-4">
        {g.sections.map((s, i) => (
          <section key={s.title} className="rounded-2xl border border-[#F1E5EC] bg-white p-4 sm:p-5 animate-fade-in" style={{ animationDelay: `${Math.min(i, 8) * 80}ms` }}>
            <h2 className="text-sm sm:text-base font-extrabold text-[#8D174B] mb-2">{s.title}</h2>
            {(s.paragraphs || []).map((p, j) => (
              <p key={j} className="text-[13px] sm:text-sm text-[#4A4250] leading-relaxed mb-2 last:mb-0">{p}</p>
            ))}
            {s.bullets && (
              <ul className="list-disc ps-5 space-y-1.5">
                {s.bullets.map((b, j) => (
                  <li key={j} className="text-[13px] sm:text-sm text-[#4A4250] leading-relaxed">{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
      <nav className="mt-6 flex flex-col gap-2">
        {g.links.map((l) => (
          <a key={l.href} href={l.href} className="text-sm font-bold text-[#8D174B] hover:underline">{l.text} →</a>
        ))}
      </nav>
    </article>
  );
};
