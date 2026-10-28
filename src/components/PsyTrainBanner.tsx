import React from 'react';
import { ArrowLeft, ArrowRight, Brain } from 'lucide-react';
import type { Language } from '../types';
import { PSY_TRAIN_PATH } from '../psy/content';

// Accès à l'entraînement interactif (matrices, dominos, cubes, mécanique, barrage, suites).
export const PsyTrainBanner: React.FC<{ language: Language; onOpen: () => void; className?: string }> = ({ language, onOpen, className }) => {
  const fr = language === 'fr';
  const Next = fr ? ArrowRight : ArrowLeft;
  return (
    <a
      href={PSY_TRAIN_PATH}
      onClick={(e) => {
        e.preventDefault();
        onOpen();
        window.scrollTo({ top: 0 });
      }}
      className={`group flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white p-3.5 sm:p-4 shadow-md shadow-[#8D174B]/20 hover:shadow-lg hover-scale active:scale-95 transition-all cursor-pointer animate-fade-in ${className || ''}`}
    >
      <span className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 animate-cta-bounce">
        <Brain className="w-6 h-6" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] sm:text-[15px] font-extrabold leading-snug">{fr ? 'Tests psychotechniques interactifs' : 'اختبارات نفسية تقنية تفاعلية'}</span>
        <span className="block text-[11.5px] sm:text-[12.5px] text-white/85 leading-snug">
          {fr ? 'Matrices, dominos, cubes 3D, engrenages, barrage, suites · chronomètre et corrigés' : 'مصفوفات، دومينو، مكعبات، تروس، انتباه، متتاليات (بالفرنسية)'}
        </span>
      </span>
      <Next className="w-5 h-5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </a>
  );
};
