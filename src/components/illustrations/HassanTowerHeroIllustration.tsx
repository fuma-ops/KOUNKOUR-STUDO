import React from 'react';

export const HassanTowerHeroIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-auto' }) => {
  return (
    <div className={`relative overflow-hidden rounded-3xl shadow-lg border border-[#8D174B]/15 bg-gradient-to-r from-[#8D174B] via-[#A8235C] to-[#D94F8A] text-white ${className}`}>
      {/* Background SVG Canvas */}
      <svg className="w-full h-full min-h-[220px] sm:min-h-[280px] md:min-h-[320px] object-cover" viewBox="0 0 1200 450" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="450" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4A0E2E" />
            <stop offset="40%" stopColor="#8D174B" />
            <stop offset="75%" stopColor="#C73578" />
            <stop offset="100%" stopColor="#FDE2EC" />
          </linearGradient>

          <linearGradient id="sunGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#F472B6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8D174B" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="towerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5D0A9" />
            <stop offset="100%" stopColor="#9C4148" />
          </linearGradient>

          <linearGradient id="marbleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF5F7" />
            <stop offset="100%" stopColor="#E2CFD9" />
          </linearGradient>
        </defs>

        {/* Dawn Sky */}
        <rect width="1200" height="450" fill="url(#skyGrad)" />

        {/* Golden Moroccan Sunrise Glow */}
        <circle cx="850" cy="220" r="160" fill="url(#sunGlow)" />

        {/* Soft Moroccan Islamic Zellij Star Grid Pattern */}
        <g opacity="0.08" stroke="#FFFFFF" strokeWidth="1">
          {Array.from({ length: 15 }).map((_, i) => (
            <polygon 
              key={i} 
              points={`${i * 90},30 ${i * 90 + 20},60 ${i * 90 + 60},60 ${i * 90 + 30},80 ${i * 90 + 40},110 ${i * 90},90 ${i * 90 - 40},110 ${i * 90 - 30},80 ${i * 90 - 60},60 ${i * 90 - 20},60`} 
              fill="none" 
            />
          ))}
        </g>

        {/* Rabat Skyline & White Medina Silhouette in distance */}
        <path d="M600 320 H1200 V380 H600 Z" fill="#6B153A" opacity="0.6" />
        <rect x="680" y="270" width="40" height="50" rx="3" fill="#8A234E" opacity="0.7" />
        <rect x="730" y="250" width="70" height="70" rx="4" fill="#6B153A" opacity="0.8" />
        {/* Minaret of Medina */}
        <rect x="745" y="190" width="16" height="60" fill="#7A1D43" />
        <polygon points="745,190 753,170 761,190" fill="#7A1D43" />
        <rect x="820" y="280" width="90" height="40" fill="#6B153A" opacity="0.7" />
        <rect x="930" y="260" width="60" height="60" fill="#8A234E" opacity="0.7" />

        {/* Iconic Hassan Tower (Tour Hassan de Rabat) */}
        <g transform="translate(180, 110)">
          {/* Main Tower Body */}
          <rect x="0" y="40" width="110" height="240" fill="url(#towerGrad)" rx="2" />
          {/* Tower Top Crenellations (Méranlons) */}
          <rect x="-4" y="25" width="118" height="16" fill="#8C3540" />
          <rect x="4" y="14" width="14" height="12" fill="#D97706" />
          <rect x="28" y="14" width="14" height="12" fill="#D97706" />
          <rect x="52" y="14" width="14" height="12" fill="#D97706" />
          <rect x="76" y="14" width="14" height="12" fill="#D97706" />
          <rect x="96" y="14" width="14" height="12" fill="#D97706" />

          {/* Intricate Sebka / Moorish Diamond Arches carving on the Tower */}
          <g stroke="#7F2332" strokeWidth="2.5" fill="none">
            {/* Upper Windows */}
            <path d="M25 80 Q35 60 45 80 V110 H25 Z" fill="#4A0E18" />
            <path d="M65 80 Q75 60 85 80 V110 H65 Z" fill="#4A0E18" />
            {/* Lobed Arches */}
            <path d="M15 130 C25 120 35 125 45 130 V170 H15 Z" fill="#5E1624" />
            <path d="M65 130 C75 120 85 125 95 130 V170 H65 Z" fill="#5E1624" />
            {/* Polylobed blind arcade */}
            <path d="M10 200 H100 M10 230 H100" strokeWidth="3" />
            <line x1="30" y1="200" x2="30" y2="270" strokeWidth="2" />
            <line x1="55" y1="200" x2="55" y2="270" strokeWidth="2" />
            <line x1="80" y1="200" x2="80" y2="270" strokeWidth="2" />
          </g>
        </g>

        {/* Famous Hassan Mosque Columns Field (Esplanade des piliers) */}
        <g fill="#A85764">
          <rect x="330" y="270" width="16" height="80" rx="2" />
          <rect x="380" y="260" width="18" height="90" rx="2" />
          <rect x="430" y="275" width="16" height="75" rx="2" />
          <rect x="490" y="265" width="17" height="85" rx="2" />
          <rect x="550" y="280" width="15" height="70" rx="2" />
          <rect x="620" y="270" width="18" height="80" rx="2" />
        </g>

        {/* Palm Trees & Moroccan Gardens */}
        <g>
          {/* Palm 1 Left */}
          <path d="M80 390 Q100 280 120 230" stroke="#5E1624" strokeWidth="8" strokeLinecap="round" />
          <path d="M120 230 Q160 210 180 230 M120 230 Q140 190 160 200 M120 230 Q110 180 130 170 M120 230 Q80 190 70 210 M120 230 Q80 230 60 250" stroke="#047857" strokeWidth="5" strokeLinecap="round" />

          {/* Palm 2 Right */}
          <path d="M1050 410 Q1030 290 1010 240" stroke="#5E1624" strokeWidth="9" strokeLinecap="round" />
          <path d="M1010 240 Q1060 220 1080 240 M1010 240 Q1040 190 1070 205 M1010 240 Q1000 180 1030 170 M1010 240 Q960 190 940 215 M1010 240 Q950 240 920 260" stroke="#047857" strokeWidth="6" strokeLinecap="round" />
        </g>

        {/* Elegant Moroccan Arched Terraces in Foreground */}
        <path d="M0 350 Q300 330 600 350 Q900 370 1200 350 V450 H0 Z" fill="url(#marbleGrad)" />

        {/* Foreground Balustrade with Moroccan Mashrabiya / Zellij carved rail */}
        <rect x="0" y="380" width="1200" height="70" fill="#FFFDFE" opacity="0.95" />
        <line x1="0" y1="380" x2="1200" y2="380" stroke="#8D174B" strokeWidth="4" />
        <line x1="0" y1="410" x2="1200" y2="410" stroke="#C73578" strokeWidth="1" strokeDasharray="6 6" />

        {/* Vibrant Magenta & Pink Bougainvillea Flowers (fleurs de bougainvillier) */}
        <g fill="#DB2777">
          <circle cx="40" cy="380" r="14" />
          <circle cx="65" cy="370" r="12" fill="#E11D48" />
          <circle cx="50" cy="395" r="15" fill="#BE123C" />
          <circle cx="85" cy="385" r="11" />
          <circle cx="1120" cy="375" r="16" fill="#BE123C" />
          <circle cx="1145" cy="390" r="14" fill="#E11D48" />
          <circle cx="1100" cy="395" r="12" />
        </g>
      </svg>

      {/* Floating Inspirational Moroccan Banner Text & Badges */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10 pointer-events-none">
        <div className="flex items-center justify-between">
          <div className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Royaume du Maroc • Concours Publics 2026</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold border border-white/20">
            <span>📚 QCM & Préparation</span>
          </div>
        </div>

        <div className="max-w-xl bg-black/25 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-white/15">
          <span className="text-xs uppercase tracking-widest text-rose-200 font-bold block mb-1">
            Plateforme Officielle d'Entraide
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight drop-shadow-sm text-white">
            Votre réussite aux concours de l'État commence ici
          </h2>
          <p className="text-xs sm:text-sm text-white/90 mt-2 font-medium line-clamp-2">
            Centralisation des arrêtés ministériels, sujets corrigés, fiches méthodologiques et calendrier des épreuves.
          </p>
        </div>
      </div>
    </div>
  );
};
