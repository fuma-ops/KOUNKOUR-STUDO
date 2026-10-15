import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Contest, Language } from '../types';
import { 
  X, Download, ExternalLink, Maximize2, Minimize2, 
  FileText, ShieldCheck, Eye, Image as ImageIcon, AlertCircle,
  Building2, RefreshCw
} from 'lucide-react';
import { PdfReader } from './PdfReader';

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
      if (contest?.image && (!pdfUrl || pdfUrl === '#' || !pdfUrl.startsWith('http'))) {
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

  if (!isOpen || !contest) return null;

  const adminName = contest.administration?.name?.[language] || contest.administration?.name?.fr || (language === 'fr' ? 'Administration Publique' : 'الإدارة العمومية');
  const hasScannedPoster = !!(contest.image && contest.image.startsWith('http'));
  const hasValidPdf = !!(pdfUrl && pdfUrl !== '#' && pdfUrl.startsWith('http'));

  const rawPdfUrl = pdfUrl || contest.officialSourceUrl || '';

  // Rendu à la racine du document : un parent animé (transform) casserait le plein écran.
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div 
        className={`bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#F1E5EC] transition-all duration-300 w-full ${
          isFullscreen 
            ? 'fixed inset-0 rounded-none h-screen max-w-none z-50' 
            : 'max-w-5xl h-[92vh] max-h-[960px]'
        }`}
      >
        {/* Top Moroccan Header Bar */}
        <div className="bg-[#FAF4F7] border-b border-[#F1E5EC] px-4 py-3 sm:px-6 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#8D174B] text-white flex items-center justify-center shrink-0 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-[#242126] truncate">
                  {title || (language === 'fr' ? 'Document officiel du concours' : 'الوثيقة الرسمية للمباراة')}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{language === 'fr' ? 'Fichier Officiel Authentique' : 'وثيقة رسمية معتمدة'}</span>
                </span>
              </div>
              <span className="text-[11px] text-[#8D174B] font-bold truncate block">
                {adminName} {contest.referenceCode ? `• Réf : ${contest.referenceCode}` : ''}
              </span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Download Button for the REAL file */}
            {rawPdfUrl && (
              <a
                href={rawPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="px-3 py-1.5 rounded-xl bg-[#8D174B] hover:bg-[#70113B] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title={language === 'fr' ? 'Télécharger le fichier original' : 'تحميل الملف الأصلي'}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'fr' ? 'Télécharger' : 'تحميل'}</span>
              </a>
            )}

            {/* Open Raw in New Tab */}
            {rawPdfUrl && (
              <a
                href={rawPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white border border-[#F1E5EC] text-[#6E6773] hover:text-[#8D174B] transition-colors"
                title={language === 'fr' ? 'Ouvrir l’URL officielle dans un nouvel onglet' : 'فتح الرابط في نافذة جديدة'}
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

        {/* View Mode Navigation Tabs */}
        <div className="bg-[#FAF7F9] border-b border-[#F1E5EC] px-4 sm:px-6 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`py-2.5 px-3.5 border-b-2 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pdf'
                  ? 'border-[#8D174B] text-[#8D174B] bg-white rounded-t-xl shadow-2xs'
                  : 'border-transparent text-[#6E6773] hover:text-[#242126]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#8D174B]" />
              <span>{language === 'fr' ? 'Arrêté Officiel (PDF)' : 'ملف القرار الرسمي (PDF)'}</span>
            </button>

            {hasScannedPoster && (
              <button
                type="button"
                onClick={() => setActiveTab('poster')}
                className={`py-2.5 px-3.5 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'poster'
                    ? 'border-[#8D174B] text-[#8D174B] bg-white rounded-t-xl shadow-2xs'
                    : 'border-transparent text-[#6E6773] hover:text-[#242126]'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Affiche Scannée' : 'الإعلان المصور'}</span>
              </button>
            )}
          </div>

        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 w-full bg-[#2E2A32] overflow-hidden flex flex-col relative">
          
          {/* TAB 1: REAL PDF EMBED */}
          {activeTab === 'pdf' && (
            <div className="flex-1 w-full flex flex-col h-full bg-[#2A262E] relative">
              {rawPdfUrl ? (
                <div className="flex-1 w-full h-full relative bg-[#343038] flex flex-col">
                  {/* Lecteur du site (pdf.js) : le PDF officiel est lu par morceaux via /api/pdf */}
                  <PdfReader key={rawPdfUrl} url={rawPdfUrl} language={language} title={title} />

                  {/* Fallback Notice Bar at bottom */}
                  <div className="bg-[#1C1820] text-gray-300 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 border-t border-white/10 shrink-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-white">Source officielle :</span>
                      <span className="font-mono text-[11px] text-gray-400 truncate max-w-sm sm:max-w-md">
                        {rawPdfUrl}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={rawPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold flex items-center gap-1 text-[11px] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{language === 'fr' ? 'Ouvrir en plein écran' : 'فتح في نافذة مستقلة'}</span>
                      </a>

                      <a
                        href={rawPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="px-3 py-1 bg-[#8D174B] hover:bg-[#70113B] text-white rounded-lg font-bold flex items-center gap-1 text-[11px] transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>{language === 'fr' ? 'Télécharger' : 'تحميل'}</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white space-y-3">
                  <FileText className="w-12 h-12 text-gray-400" />
                  <p className="text-sm font-bold text-gray-200">
                    {language === 'fr' 
                      ? 'Le lien de l’arrêté officiel sera publié par l’administration.' 
                      : 'رابط القرار الرسمي سيتم توفيره من طرف الإدارة.'}
                  </p>
                  {contest.officialSourceUrl && (
                    <a
                      href={contest.officialSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#8D174B] text-white font-bold text-xs"
                    >
                      {language === 'fr' ? 'Consulter sur le portail officiel' : 'الاطلاع عبر البوابة الرسمية'}
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REAL SCRAPED POSTER */}
          {activeTab === 'poster' && hasScannedPoster && (
            <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center bg-[#252229]">
              <img
                src={contest.image}
                alt={title}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
              <div className="mt-3 flex items-center gap-3">
                <a
                  href={contest.image}
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

        </div>
      </div>
    </div>,
    document.body
  );
};
