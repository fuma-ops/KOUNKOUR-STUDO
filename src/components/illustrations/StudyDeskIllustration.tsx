import React from 'react';

export const StudyDeskIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-44 sm:h-52' }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FDF2F7] via-[#FFFDFE] to-[#FCE7F3] border border-[#F1E5EC] flex items-center justify-center p-4 ${className}`}>
      <svg className="w-full h-full max-h-52 object-contain" viewBox="0 0 600 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Warm Morning Sunlight Stream */}
        <polygon points="120,0 260,0 380,240 180,240" fill="#FEF08A" opacity="0.25" />

        {/* Arched Moroccan Window in Background */}
        <path d="M60 160 V50 Q100 15 140 50 V160 Z" fill="#F8F2F5" stroke="#E2CFD9" strokeWidth="2" />
        <path d="M60 100 H140 M100 25 V160" stroke="#E2CFD9" strokeWidth="1.5" />

        {/* Study Wooden Desk Surface */}
        <rect x="20" y="165" width="560" height="75" rx="4" fill="#EAD5C3" stroke="#D4B499" strokeWidth="2" />
        <line x1="20" y1="180" x2="580" y2="180" stroke="#C29F83" strokeWidth="1.5" />

        {/* Stack of Moroccan Exam Preparation Books (Right side) */}
        <g transform="translate(380, 50)">
          {/* Bottom Book: MÉTHODOLOGIE & DROIT */}
          <rect x="0" y="85" width="160" height="28" rx="3" fill="#8D174B" />
          <rect x="150" y="87" width="8" height="24" fill="#FFFFFF" opacity="0.8" />
          <text x="75" y="103" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">MÉTHODOLOGIE CONCOURS</text>

          {/* Middle Book 2: DROIT PUBLIC MAROCAIN */}
          <rect x="8" y="58" width="145" height="26" rx="3" fill="#C73578" />
          <rect x="143" y="60" width="8" height="22" fill="#FFFFFF" opacity="0.8" />
          <text x="75" y="74" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">DROIT PUBLIC MAROC</text>

          {/* Middle Book 3: ANNALES & SUJETS CORRIGÉS */}
          <rect x="14" y="32" width="132" height="25" rx="3" fill="#9D174D" />
          <rect x="136" y="34" width="8" height="21" fill="#FFFFFF" opacity="0.8" />
          <text x="75" y="48" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">ANNALES CORRIGÉES</text>

          {/* Top Book: QCM OFFICIELS */}
          <rect x="20" y="8" width="120" height="23" rx="3" fill="#BE185D" />
          <rect x="130" y="10" width="8" height="19" fill="#FFFFFF" opacity="0.8" />
          <text x="75" y="23" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">QCM D’ENTRAÎNEMENT</text>
        </g>

        {/* Open Study Laptop (Center) */}
        <g transform="translate(180, 80)">
          {/* Screen casing */}
          <rect x="15" y="5" width="150" height="95" rx="6" fill="#334155" />
          {/* Screen display */}
          <rect x="21" y="11" width="138" height="83" rx="3" fill="#FFFDFE" />
          {/* KounKour Logo & Quiz on screen */}
          <rect x="28" y="18" width="40" height="6" rx="2" fill="#8D174B" />
          <rect x="28" y="28" width="120" height="4" rx="1" fill="#E2CFD9" />
          <rect x="28" y="36" width="100" height="4" rx="1" fill="#E2CFD9" />
          {/* Radio choices */}
          <rect x="28" y="46" width="124" height="12" rx="3" fill="#FDF2F7" stroke="#8D174B" strokeWidth="0.8" />
          <rect x="28" y="62" width="124" height="12" rx="3" fill="#F8F2F5" />
          <circle cx="34" cy="52" r="3" fill="#8D174B" />
          <circle cx="34" cy="68" r="3" stroke="#94A3B8" fill="none" strokeWidth="0.8" />

          {/* Laptop Base Keyboard */}
          <polygon points="0,100 180,100 170,112 10,112" fill="#64748B" />
          <rect x="70" y="102" width="40" height="6" rx="1" fill="#475569" />
        </g>

        {/* Moroccan Coffee Mug with KounKour Star (Left) */}
        <g transform="translate(90, 130)">
          <rect x="10" y="10" width="32" height="38" rx="4" fill="#FFFFFF" stroke="#8D174B" strokeWidth="1.5" />
          {/* Mug handle */}
          <path d="M42 16 C52 16 52 38 42 38" stroke="#8D174B" strokeWidth="3" fill="none" />
          {/* Moroccan Star on mug */}
          <polygon points="26,20 27.5,24 32,24 28.5,26.5 30,31 26,28.5 22,31 23.5,26.5 20,24 24.5,24" fill="#8D174B" />
          {/* Hot Steam coils */}
          <path d="M22 6 Q24 0 20 -6 M28 6 Q30 0 26 -6" stroke="#C73578" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
};
