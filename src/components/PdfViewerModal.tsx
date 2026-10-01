import React, { useState, useEffect } from 'react';
import { Contest, Language } from '../types';
import { 
  X, Download, ExternalLink, Maximize2, Minimize2, 
  FileText, ShieldCheck, Eye, Image as ImageIcon, AlertCircle
} from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
  contest?: Contest | null;
  language: Language;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  title,
  contest,
  language,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pdf' | 'poster'>('pdf');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      if (contest?.image && contest.image.startsWith('http') && (!pdfUrl || pdfUrl === '#')) {
        setActiveTab('poster');
      } else {
        setActiveTab('pdf');
      }
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, contest, pdfUrl]);

  if (!isOpen || (!pdfUrl && !contest?.image)) return null;

  const adminName = contest?.administration?.name?.[language] || contest?.administration?.name?.fr || (language === 'fr' ? 'Administration Publique' : 'الإدارة العمومية');
  const hasScannedPoster = !!(contest?.image && contest.image.startsWith('http'));
  const isEmploiPublic = pdfUrl.includes('emploi-public.ma');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className={`bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#F1E5EC] transition-all duration-300 w-full ${
          isFullscreen 
            ? 'fixed inset-0 rounded-none h-screen max-w-none' 
            : 'max-w-5xl h-[90vh] max-h-[940px]'
        }`}
      >
        {/* Top Moroccan Header Bar */}
        <div className="bg-[#FAF4F7] border-b border-[#F1E5EC] px-4 py-3 sm:px-6 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#8D174B] text-white flex items-center justify-center shrink-0 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-[#242126] truncate">
                  {title || (language === 'fr' ? 'Arrêté officiel du concours' : 'القرار الرسمي للمباراة')}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{language === 'fr' ? 'Source Officielle' : 'مصدر رسمي'}</span>
                </span>
              </div>
              <span className="text-[11px] text-[#8D174B] font-medium truncate block">
                {adminName} {contest?.referenceCode ? `• Réf : ${contest.referenceCode}` : ''}
              </span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Direct Download Button for the Exact Scraped File */}
            {pdfUrl && pdfUrl !== '#' && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="px-3 py-1.5 rounded-xl bg-[#8D174B] hover:bg-[#70113B] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title={language === 'fr' ? 'Télécharger le fichier original' : 'تحميل الملف الأصلي'}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'fr' ? 'Télécharger l’arrêté' : 'تحميل القرار'}</span>
              </a>
            )}

            {/* Open Raw File In New Tab */}
            {pdfUrl && pdfUrl !== '#' && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white border border-[#F1E5EC] text-[#6E6773] hover:text-[#8D174B] transition-colors"
                title={language === 'fr' ? 'Ouvrir l’URL officielle dans un nouvel onglet' : 'فتح الرابط الرسمي في نافذة جديدة'}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-white border border-[#F1E5EC] text-[#6E6773] hover:text-[#8D174B] transition-colors cursor-pointer"
              title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#FAF0F5] text-[#8D174B] hover:bg-[#F3E2EC] transition-colors cursor-pointer"
              title={language === 'fr' ? 'Fermer' : 'إغلاق'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode Navigation Tabs (if poster available) */}
        {hasScannedPoster && pdfUrl && pdfUrl !== '#' && (
          <div className="bg-[#FAF7F9] border-b border-[#F1E5EC] px-4 sm:px-6 flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`py-2 px-3 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pdf'
                  ? 'border-[#8D174B] text-[#8D174B] bg-white rounded-t-xl'
                  : 'border-transparent text-[#6E6773] hover:text-[#242126]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Fichier PDF officiel (Arrêté)' : 'ملف الـ PDF الرسمي (القرار)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('poster')}
              className={`py-2 px-3 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'poster'
                  ? 'border-[#8D174B] text-[#8D174B] bg-white rounded-t-xl'
                  : 'border-transparent text-[#6E6773] hover:text-[#242126]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Affiche scannée originale' : 'الإعلان المصور الأصلي'}</span>
            </button>
          </div>
        )}

        {/* Content Viewer Body */}
        <div className="flex-1 w-full bg-[#2E2A32] overflow-hidden flex flex-col relative">
          
          {/* TAB: REAL SCRAPED POSTER */}
          {activeTab === 'poster' && hasScannedPoster && (
            <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center bg-[#252229]">
              <img
                src={contest?.image}
                alt={title}
                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10"
              />
              <div className="mt-3 flex items-center gap-3">
                <a
                  href={contest?.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Ouvrir l’image en haute définition' : 'فتح الصورة بالدقة الكاملة'}</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB: REAL PDF EMBED & DIRECT SOURCE */}
          {activeTab === 'pdf' && (
            <div className="flex-1 w-full flex flex-col h-full bg-[#3B383E]">
              
              {/* Official Source Banner */}
              <div className="bg-[#FAF4F7] border-b border-[#F1E5EC] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                <div className="flex items-center gap-2 text-[#242126] font-medium truncate">
                  <span className="font-bold text-[#8D174B]">
                    {language === 'fr' ? 'Lien officiel brut :' : 'الرابط الرسمي المباشر :'}
                  </span>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-[#8D174B] underline truncate max-w-md"
                  >
                    {pdfUrl}
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="px-3 py-1.5 rounded-lg bg-[#8D174B] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#70113B] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{language === 'fr' ? 'Télécharger directement' : 'تحميل مباشر'}</span>
                  </a>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#F1E5EC] text-[#242126] font-bold text-xs flex items-center gap-1.5 hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#8D174B]" />
                    <span>{language === 'fr' ? 'Ouvrir' : 'فتح'}</span>
                  </a>
                </div>
              </div>

              {/* Embedded Document Object / Frame */}
              <div className="flex-1 w-full relative bg-white">
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  className="w-full h-full border-0"
                >
                  <iframe
                    src={pdfUrl}
                    title={title}
                    className="w-full h-full border-0"
                  />
                </object>

                {/* Info Note for browsers blocking cross-domain downloads inside iframes */}
                {isEmploiPublic && (
                  <div className="absolute bottom-4 start-1/2 -translate-x-1/2 bg-[#242126]/90 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-white/10 flex items-center gap-3 text-xs max-w-lg z-10 pointer-events-auto">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-[11px] leading-tight">
                      {language === 'fr'
                        ? 'Le fichier officiel est servi par emploi-public.ma. Si votre navigateur bloque l’affichage interne, cliquez sur « Ouvrir » ou « Télécharger ».'
                        : 'الملف مقدم مباشرة من بوابة التشغيل العمومي. يمكنك الضغط على "تحميل" أو "فتح" للاطلاع الفوري.'}
                    </span>
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#8D174B] text-white font-bold text-[11px] shrink-0 hover:bg-[#70113B]"
                    >
                      {language === 'fr' ? 'Ouvrir' : 'فتح'}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
