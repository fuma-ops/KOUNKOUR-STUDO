import React from 'react';

export const CommunityCollabIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-44 sm:h-52' }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#F8F2F5] via-[#FFFDFE] to-[#FDF2F7] border border-[#F1E5EC] flex items-center justify-center p-4 ${className}`}>
      <svg className="w-full h-full max-h-52 object-contain" viewBox="0 0 600 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft Background Circles & Connections */}
        <circle cx="150" cy="120" r="85" fill="#FDF2F7" opacity="0.7" />
        <circle cx="300" cy="110" r="95" fill="#FCE7F3" opacity="0.6" />
        <circle cx="450" cy="120" r="85" fill="#FDF2F7" opacity="0.7" />

        {/* Floating Idea Lightbulb Bubble */}
        <g transform="translate(275, 20)">
          <circle cx="25" cy="25" r="24" fill="#8D174B" />
          <path d="M25 14 C19 14 15 18 15 23 C15 27 18 29 20 32 H30 C32 29 35 27 35 23 C35 18 31 14 25 14 Z" fill="#FDE047" />
          <rect x="22" y="33" width="6" height="3" fill="#D97706" rx="1" />
        </g>

        {/* Floating Chat Bubble Left */}
        <g transform="translate(100, 35)">
          <rect x="0" y="0" width="70" height="42" rx="12" fill="#FFFFFF" stroke="#8D174B" strokeWidth="1.5" />
          <polygon points="20,42 28,42 16,52" fill="#FFFFFF" stroke="#8D174B" strokeWidth="1.5" />
          <circle cx="20" cy="21" r="3" fill="#8D174B" />
          <circle cx="35" cy="21" r="3" fill="#8D174B" />
          <circle cx="50" cy="21" r="3" fill="#8D174B" />
        </g>

        {/* Floating Question Bubble Right */}
        <g transform="translate(430, 35)">
          <rect x="0" y="0" width="65" height="42" rx="12" fill="#FFFFFF" stroke="#C73578" strokeWidth="1.5" />
          <polygon points="45,42 53,42 57,52" fill="#FFFFFF" stroke="#C73578" strokeWidth="1.5" />
          <text x="32" y="27" textAnchor="middle" fill="#C73578" fontSize="20" fontWeight="bold" fontFamily="sans-serif">?</text>
        </g>

        {/* Student Avatars Silhouette Circle (Collaboration Table) */}
        {/* Student 1 (Left - Male Candidate) */}
        <g transform="translate(160, 100)">
          <circle cx="30" cy="25" r="20" fill="#3B82F6" />
          <path d="M10 75 C10 50 20 45 30 45 C40 45 50 50 50 75 Z" fill="#1D4ED8" />
          {/* Eyeglasses */}
          <rect x="22" y="22" width="7" height="6" rx="1" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
          <rect x="31" y="22" width="7" height="6" rx="1" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
          <line x1="29" y1="25" x2="31" y2="25" stroke="#FFFFFF" strokeWidth="1.2" />
        </g>

        {/* Student 2 (Center - Female Candidate with Hijab / Scarf) */}
        <g transform="translate(270, 85)">
          {/* Scarf / Hijab */}
          <ellipse cx="30" cy="30" r="22" fill="#BE185D" />
          <circle cx="30" cy="33" r="16" fill="#FBCFE8" />
          <ellipse cx="30" cy="40" r="14" fill="#FBCFE8" />
          <path d="M5 85 C5 55 18 50 30 50 C42 50 55 55 55 85 Z" fill="#8D174B" />
        </g>

        {/* Student 3 (Right - Female Candidate) */}
        <g transform="translate(380, 100)">
          <circle cx="30" cy="25" r="20" fill="#10B981" />
          <path d="M10 75 C10 50 20 45 30 45 C40 45 50 50 50 75 Z" fill="#047857" />
        </g>

        {/* Shared Work Table with Open Laptop & Moroccan Flag Notebook */}
        <ellipse cx="300" cy="180" rx="200" ry="40" fill="#FFFFFF" stroke="#E2CFD9" strokeWidth="2" />
        
        {/* Centered Laptop */}
        <rect x="270" y="155" width="60" height="35" rx="3" fill="#475569" />
        <rect x="274" y="158" width="52" height="27" rx="1" fill="#8D174B" />
        <polygon points="296,168 298,172 303,172 299,175 301,180 296,177 291,180 293,175 289,172 294,172" fill="#FFFFFF" />
        <polygon points="260,190 340,190 335,195 265,195" fill="#64748B" />
      </svg>
    </div>
  );
};
