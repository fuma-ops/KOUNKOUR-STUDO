import React from 'react';

// Authentic Official Emblems for Moroccan Ministries and Institutions
export const MinistryEmblems: Record<string, React.FC<{ className?: string }>> = {
  // Royaume du Maroc / Ministère de l'Intérieur
  'adm-interieur': ({ className = 'w-10 h-10' }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#FDF2F7" stroke="#8D174B" strokeWidth="2.5" />
      {/* Crown / Couronne Royale */}
      <path d="M35 32 L40 22 L50 28 L60 22 L65 32 Z" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
      <circle cx="50" cy="20" r="2.5" fill="#DC2626" />
      {/* Shield with green star */}
      <path d="M34 35 H66 V56 C66 68 50 78 50 78 C50 78 34 68 34 56 Z" fill="#C53030" stroke="#7F1D1D" strokeWidth="2" />
      {/* Sun rising inside shield */}
      <circle cx="50" cy="46" r="8" fill="#FBBF24" />
      {/* Green Pentagram Moroccan Star */}
      <polygon points="50,40 52.5,47 60,47 54,51.5 56.5,58.5 50,54 43.5,58.5 46,51.5 40,47 47.5,47" fill="#047857" stroke="#065F46" strokeWidth="0.8" />
      {/* Decorative Laurel Wreath branches */}
      <path d="M22 60 C22 45 30 36 34 35" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M78 60 C78 45 70 36 66 35" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
      {/* Base Ribbon */}
      <path d="M30 82 Q50 76 70 82" stroke="#8D174B" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),

  // Ministère de l'Éducation Nationale
  'adm-education': ({ className = 'w-10 h-10' }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="2" />
      {/* Open Book */}
      <path d="M50 42 C40 36 28 38 22 40 V68 C28 66 40 64 50 70 C60 64 72 66 78 68 V40 C72 38 60 36 50 42 Z" fill="#FFFFFF" stroke="#1E40AF" strokeWidth="2" />
      <line x1="50" y1="42" x2="50" y2="70" stroke="#1E40AF" strokeWidth="2" />
      {/* Book pages lines */}
      <path d="M28 47 C34 46 42 47 46 49" stroke="#93C5FD" strokeWidth="1.5" />
      <path d="M28 53 C34 52 42 53 46 55" stroke="#93C5FD" strokeWidth="1.5" />
      <path d="M72 47 C66 46 58 47 54 49" stroke="#93C5FD" strokeWidth="1.5" />
      <path d="M72 53 C66 52 58 53 54 55" stroke="#93C5FD" strokeWidth="1.5" />
      {/* Radiant Torch of Knowledge with Moroccan Star */}
      <path d="M47 38 L53 38 L51 44 L49 44 Z" fill="#D97706" />
      <circle cx="50" cy="30" r="7" fill="#F59E0B" />
      <polygon points="50,24 51.8,29 57,29 53,32 54.5,37 50,34 45.5,37 47,32 43,29 48.2,29" fill="#047857" />
    </svg>
  ),

  // Office National des Chemins de Fer (ONCF)
  'adm-oncf': ({ className = 'w-10 h-10' }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#FFF7ED" stroke="#EA580C" strokeWidth="2" />
      {/* Dynamic Speed Wings / ONCF Railway Lines */}
      <path d="M18 58 L32 38 H44 L28 62 H16 Z" fill="#EA580C" />
      <path d="M34 58 L48 38 H60 L44 62 H32 Z" fill="#EA580C" />
      <path d="M50 58 L64 38 H76 L60 62 H48 Z" fill="#C2410C" />
      <path d="M66 58 L80 38 H88 L72 62 H64 Z" fill="#9A3412" />
      {/* ONCF Acronym */}
      <text x="50" y="80" textAnchor="middle" fill="#EA580C" fontSize="16" fontWeight="bold" fontFamily="sans-serif">ONCF</text>
    </svg>
  ),

  // Ministère de la Santé
  'adm-sante': ({ className = 'w-10 h-10' }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#ECFDF5" stroke="#059669" strokeWidth="2" />
      {/* Red/Green Medical Cross with Crescent */}
      <rect x="44" y="24" width="12" height="42" rx="3" fill="#059669" />
      <rect x="29" y="39" width="42" height="12" rx="3" fill="#059669" />
      {/* Moroccan Crescent and Star */}
      <path d="M58 20 A15 15 0 0 1 58 48 A12 12 0 0 0 58 24 Z" fill="#DC2626" />
      <polygon points="50,42 51.5,46 56,46 52.5,48.5 54,53 50,50.5 46,53 47.5,48.5 44,46 48.5,46" fill="#FFFFFF" />
      <path d="M28 76 C40 70 60 70 72 76" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),

  // Ministère de l'Économie et des Finances
  'adm-finances': ({ className = 'w-10 h-10' }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#FDF2F7" stroke="#8D174B" strokeWidth="2" />
      {/* Classical Treasury Pediment / Façade */}
      <path d="M25 36 L50 22 L75 36 H25 Z" fill="#8D174B" />
      {/* Pillars */}
      <rect x="29" y="38" width="6" height="28" fill="#8D174B" />
      <rect x="41" y="38" width="6" height="28" fill="#8D174B" />
      <rect x="53" y="38" width="6" height="28" fill="#8D174B" />
      <rect x="65" y="38" width="6" height="28" fill="#8D174B" />
      {/* Base */}
      <rect x="22" y="66" width="56" height="6" rx="1.5" fill="#8D174B" />
      {/* Moroccan Star on Pediment */}
      <polygon points="50,26 51,29 54,29 51.5,31 52.5,34 50,32 47.5,34 48.5,31 46,29 49,29" fill="#F59E0B" />
      {/* Growth arrow */}
      <path d="M30 80 L48 74 L60 76 L75 70" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
};

export const getAdministrationEmblem = (adminId: string, className?: string) => {
  const Component = MinistryEmblems[adminId] || MinistryEmblems['adm-interieur'];
  return <Component className={className} />;
};
