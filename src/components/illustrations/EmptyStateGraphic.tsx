import React from 'react';

export const EmptyStateGraphic: React.FC<{ className?: string }> = ({ className = 'w-36 h-36 mx-auto' }) => {
  return (
    <svg className={className} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pinkBlob" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(80 80) rotate(90) scale(60)">
          <stop stopColor="#FDF2F7" />
          <stop offset="1" stopColor="#FCE7F3" stopOpacity="0.4" />
        </radialGradient>
      </defs>

      {/* Soft Pink Background Glow */}
      <circle cx="80" cy="80" r="60" fill="url(#pinkBlob)" />

      {/* Official Folded Document */}
      <g transform="translate(45, 35)">
        <path d="M0 8 C0 3.5 3.5 0 8 0 H48 L64 16 V82 C64 86.5 60.5 90 56 90 H8 C3.5 90 0 86.5 0 82 Z" fill="#FFFFFF" stroke="#F1E5EC" strokeWidth="2" />
        {/* Folded corner */}
        <polygon points="48,0 64,16 48,16" fill="#FDF2F7" stroke="#F1E5EC" strokeWidth="1" />
        {/* Document lines */}
        <line x1="12" y1="28" x2="40" y2="28" stroke="#8D174B" strokeWidth="3" strokeLinecap="round" />
        <line x1="12" y1="40" x2="52" y2="40" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12" y1="52" x2="48" y2="52" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12" y1="64" x2="36" y2="64" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
        {/* Moroccan seal stamp */}
        <circle cx="48" cy="74" r="7" fill="#FDF2F7" stroke="#8D174B" strokeWidth="1" />
        <polygon points="48,70 49,73 52,73 49.5,75 50.5,78 48,76 45.5,78 46.5,75 44,73 47,73" fill="#8D174B" />
      </g>

      {/* Big 3D-styled Magnifying Glass */}
      <g transform="translate(65, 55)">
        {/* Glass lens */}
        <circle cx="36" cy="36" r="30" fill="#FFFDFE" fillOpacity="0.85" stroke="#8D174B" strokeWidth="6" />
        <circle cx="36" cy="36" r="23" stroke="#F472B6" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.6" />
        {/* Handle */}
        <path d="M58 58 L82 82" stroke="#8D174B" strokeWidth="10" strokeLinecap="round" />
        <path d="M60 60 L80 80" stroke="#C73578" strokeWidth="4" strokeLinecap="round" />
        {/* Lens glare / highlight */}
        <path d="M22 24 A 18 18 0 0 1 44 18" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
      </g>
    </svg>
  );
};
