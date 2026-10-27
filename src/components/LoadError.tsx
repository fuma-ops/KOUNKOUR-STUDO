import React from 'react';
import { RotateCcw, WifiOff } from 'lucide-react';
import type { Language } from '../types';

// Chargement impossible (réseau) : on le dit clairement et on propose de réessayer,
// au lieu d'afficher « aucun concours » ou un dossier vide.
export const LoadError: React.FC<{ language: Language; onRetry: () => void }> = ({ language, onRetry }) => {
  const fr = language === 'fr';
  return (
    <div className="bg-white border border-[#F1E5EC] rounded-3xl p-8 text-center max-w-md mx-auto my-8 shadow-xs animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-[#FDF2F7] text-[#8D174B] flex items-center justify-center mx-auto mb-3">
        <WifiOff className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-[#242126] mb-1.5">{fr ? 'Connexion interrompue' : 'انقطع الاتصال'}</h3>
      <p className="text-xs sm:text-sm text-[#6E6773] leading-relaxed mb-5">
        {fr
          ? 'Le contenu n’a pas pu être chargé (réseau lent ou coupé). Vérifiez votre connexion puis réessayez.'
          : 'تعذر تحميل المعطيات (شبكة بطيئة أو منقطعة). تحقق من الاتصال ثم أعد المحاولة.'}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 animate-cta-bounce"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        {fr ? 'Réessayer' : 'إعادة المحاولة'}
      </button>
    </div>
  );
};
