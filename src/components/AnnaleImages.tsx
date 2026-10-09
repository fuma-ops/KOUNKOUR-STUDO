import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, FileImage, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { Language } from '../types';

// Photos du sujet original d'une annale : le candidat s'entraîne sur les
// questions et peut à tout moment consulter la copie réelle, page par page.

interface Props {
  images: string[];
  language: Language;
  sourceUrl?: string | null;
  sourceNote?: string | null;
}

export const AnnaleImages: React.FC<Props> = ({ images, language, sourceUrl, sourceNote }) => {
  const fr = language === 'fr';
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') setPage((p) => Math.min(images.length - 1, p + 1));
      if (e.key === 'ArrowLeft') setPage((p) => Math.max(0, p - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, images.length]);

  if (!images.length) return null;

  return (
    <>
      <button
        onClick={() => { setOpen(true); setPage(0); setZoom(false); }}
        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#F1E5EC] hover:border-[#8D174B]/40 hover:shadow-md active:scale-[0.99] transition cursor-pointer text-start"
      >
        <img src={images[0]} alt="" loading="lazy" className="w-12 h-16 object-cover object-top rounded-lg border border-[#EEE6EB] shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold text-[#242126] flex items-center gap-1.5">
            <FileImage className="w-4 h-4 text-[#8D174B]" />
            {fr ? 'Voir le sujet original' : 'الاطلاع على الموضوع الأصلي'}
          </p>
          <p className="text-[11px] text-[#6E6773]">
            {fr ? `Photo de la copie réelle · ${images.length} page${images.length > 1 ? 's' : ''}` : `صورة الورقة الأصلية · ${images.length} صفحة`}
          </p>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] bg-black/90 flex flex-col animate-fade-in" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between gap-2 px-3 py-2 text-white">
            <span className="text-xs font-bold">
              {fr ? 'Sujet original' : 'الموضوع الأصلي'} · {page + 1}/{images.length}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom((z) => !z)} className="p-2 rounded-xl hover:bg-white/10 cursor-pointer" aria-label={fr ? 'Zoom' : 'تكبير'}>
                {zoom ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
              </button>
              <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-white/10 cursor-pointer" aria-label={fr ? 'Fermer' : 'إغلاق'}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className={`flex-1 ${zoom ? 'overflow-auto' : 'overflow-hidden flex items-center justify-center'} px-2`}>
            <img
              src={images[page]}
              alt={fr ? `Sujet original, page ${page + 1}` : `الموضوع الأصلي، الصفحة ${page + 1}`}
              onClick={() => setZoom((z) => !z)}
              className={zoom ? 'max-w-none w-[180%] sm:w-[140%] mx-auto cursor-zoom-out' : 'max-h-full max-w-full object-contain cursor-zoom-in'}
            />
          </div>

          <div className="px-3 py-2 flex items-center justify-between gap-2 text-white">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 cursor-pointer"
              aria-label={fr ? 'Page précédente' : 'الصفحة السابقة'}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <p className="text-[10px] text-white/70 text-center flex-1 line-clamp-2">
              {sourceNote}
              {sourceUrl && (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 ms-1 underline">
                  {fr ? 'source' : 'المصدر'} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </p>
            <button
              onClick={() => setPage((p) => Math.min(images.length - 1, p + 1))}
              disabled={page === images.length - 1}
              className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 cursor-pointer"
              aria-label={fr ? 'Page suivante' : 'الصفحة التالية'}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
