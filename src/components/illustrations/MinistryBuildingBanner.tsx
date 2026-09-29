import React from 'react';

interface MinistryBuildingBannerProps {
  className?: string;
  ministryName?: string;
}

export const MinistryBuildingBanner: React.FC<MinistryBuildingBannerProps> = ({
  className = 'w-full h-44 sm:h-56',
  ministryName,
}) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#8D174B] via-[#75123E] to-[#4A0E2E] ${className}`}>
      {/* Detailed SVG Governmental Palace Facade */}
      <svg className="w-full h-full object-cover" viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="skyGradB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="70%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#FDF2F7" />
          </linearGradient>

          <linearGradient id="facadeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="100%" stopColor="#F5D0A9" />
          </linearGradient>

          <linearGradient id="flagRed" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#C53030" />
            <stop offset="100%" stopColor="#E53E3E" />
          </linearGradient>
        </defs>

        {/* Sunny Blue Sky */}
        <rect width="800" height="240" fill="url(#skyGradB)" />

        {/* Moroccan Flag Pole & Flag on top of Ministry Building */}
        <line x1="400" y1="15" x2="400" y2="75" stroke="#4A5568" strokeWidth="3" />
        <circle cx="400" cy="14" r="3" fill="#D97706" />

        {/* Waving Red Moroccan Flag with Green Pentagram Star */}
        <g transform="translate(400, 20)">
          <path d="M0 0 Q25 6 50 0 Q70 6 80 2 V38 Q65 44 45 38 Q20 44 0 38 Z" fill="url(#flagRed)" />
          {/* Green Star in center of flag */}
          <polygon 
            points="38,12 40,16 45,16 41,19 43,24 38,21 34,24 36,19 32,16 37,16" 
            fill="#047857" 
            stroke="#065F46" 
            strokeWidth="0.8" 
          />
        </g>

        {/* Grand Governmental Palace Facade (Moorish Architecture) */}
        {/* Central Dome / Qubba */}
        <path d="M360 80 Q400 45 440 80 Z" fill="#047857" stroke="#065F46" strokeWidth="2" />
        <circle cx="400" cy="46" r="4" fill="#F59E0B" />

        {/* Main Central Pavilion */}
        <rect x="280" y="75" width="240" height="165" fill="url(#facadeGrad)" stroke="#B45309" strokeWidth="1.5" />
        {/* Decorative Zellij Frieze band */}
        <rect x="280" y="85" width="240" height="12" fill="#8D174B" />

        {/* Left Wing */}
        <rect x="60" y="95" width="220" height="145" fill="url(#facadeGrad)" stroke="#B45309" strokeWidth="1.5" />
        <rect x="60" y="105" width="220" height="8" fill="#8D174B" />

        {/* Right Wing */}
        <rect x="520" y="95" width="220" height="145" fill="url(#facadeGrad)" stroke="#B45309" strokeWidth="1.5" />
        <rect x="520" y="105" width="220" height="8" fill="#8D174B" />

        {/* Traditional Moroccan Keyhole Arches (Arc en fer à cheval) on Main Facade */}
        {/* Central Entrance Grand Arch */}
        <path d="M370 240 V150 Q400 120 430 150 V240 Z" fill="#8D174B" />
        {/* Arch Carved Framing */}
        <path d="M362 240 V146 Q400 112 438 146 V240" stroke="#F59E0B" strokeWidth="3" fill="none" />

        {/* Left Windows */}
        <path d="M120 180 V140 Q135 125 150 140 V180 Z" fill="#3E1528" stroke="#8D174B" strokeWidth="2" />
        <path d="M180 180 V140 Q195 125 210 140 V180 Z" fill="#3E1528" stroke="#8D174B" strokeWidth="2" />
        <path d="M240 180 V140 Q255 125 270 140 V180 Z" fill="#3E1528" stroke="#8D174B" strokeWidth="2" />

        {/* Right Windows */}
        <path d="M540 180 V140 Q555 125 570 140 V180 Z" fill="#3E1528" stroke="#8D174B" strokeWidth="2" />
        <path d="M600 180 V140 Q615 125 630 140 V180 Z" fill="#3E1528" stroke="#8D174B" strokeWidth="2" />
        <path d="M660 180 V140 Q675 125 690 140 V180 Z" fill="#3E1528" stroke="#8D174B" strokeWidth="2" />

        {/* Palm Trees flanking the Governmental Building */}
        <g>
          {/* Left Palm */}
          <path d="M30 240 Q45 160 55 120" stroke="#78350F" strokeWidth="7" strokeLinecap="round" />
          <path d="M55 120 Q80 100 100 115 M55 120 Q70 85 90 95 M55 120 Q50 80 60 70 M55 120 Q30 85 20 100 M55 120 Q30 120 10 135" stroke="#047857" strokeWidth="5" strokeLinecap="round" />

          {/* Right Palm */}
          <path d="M770 240 Q755 160 745 120" stroke="#78350F" strokeWidth="7" strokeLinecap="round" />
          <path d="M745 120 Q770 100 790 115 M745 120 Q760 85 780 95 M745 120 Q740 80 750 70 M745 120 Q720 85 710 100 M745 120 Q720 120 700 135" stroke="#047857" strokeWidth="5" strokeLinecap="round" />
        </g>
      </svg>

      {/* Subtle overlay gradient at bottom to seamlessly integrate text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-4 sm:p-6">
        <div>
          <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white shadow-xs inline-flex items-center gap-1 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            <span>Royaume du Maroc • Concours Publics</span>
          </span>
          {ministryName && (
            <h3 className="text-white text-base sm:text-lg font-bold drop-shadow-md">
              {ministryName}
            </h3>
          )}
        </div>
      </div>
    </div>
  );
};
