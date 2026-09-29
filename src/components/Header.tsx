import React from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { Bell, Bookmark, Globe } from 'lucide-react';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  savedCount: number;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  activeTab,
  setActiveTab,
  savedCount,
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F1E5EC] transition-all">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8D174B] to-[#C73578] flex items-center justify-center text-white shadow-sm shadow-[#8D174B]/20 group-hover:scale-105 transition-transform">
            {/* Moroccan open book with star stylized SVG */}
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4.5l-1.12 2.27-2.5.36 1.81 1.77-.43 2.5 2.24-1.18 2.24 1.18-.43-2.5 1.81-1.77-2.5-.36L12 4.5z" />
              <path d="M19 8.5v11.2c-1.8-.75-4.1-.7-6 0v-11c1.9-.7 4.2-.75 6-.2zM11 8.7v11c-1.9-.7-4.2-.75-6 0v-11.2c1.8-.55 4.1-.5 6 .2z" fillOpacity="0.85" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-[#8D174B]">Koun<span className="text-[#C73578]">Kour</span></span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-[#FDF2F7] text-[#8D174B] font-semibold border border-[#8D174B]/15">Maroc</span>
            </div>
            <p className="text-[10px] text-[#6E6773] font-medium leading-tight hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { id: 'home', label: t.nav.home },
            { id: 'contests', label: t.nav.contests },
            { id: 'radar', label: (t.nav as any).radar || 'Radar', isRadar: true },
            { id: 'preparation', label: t.nav.preparation },
            { id: 'community', label: t.nav.community },
            { id: 'profile', label: t.nav.profile },
            { id: 'admin', label: language === 'fr' ? '👑 Admin' : '👑 الإدارة' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#FDF2F7] text-[#8D174B]'
                    : 'text-[#6E6773] hover:text-[#242126] hover:bg-gray-50'
                }`}
              >
                {item.isRadar && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right actions: Language Switcher, Saved, Notification, Profile */}
        <div className="flex items-center gap-2">
          {/* Language Toggle Button */}
          <button
            onClick={() => onLanguageChange(language === 'fr' ? 'ar' : 'fr')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#F1E5EC] bg-[#FFFDFE] hover:bg-[#F8F2F5] text-xs font-semibold text-[#8D174B] transition-colors"
            title={language === 'fr' ? 'Passer en Arabe (RTL)' : 'Changer vers le Français'}
          >
            <Globe className="w-3.5 h-3.5 text-[#C73578]" />
            <span>{language === 'fr' ? 'العربية' : 'Français'}</span>
          </button>

          {/* Quick Bookmarks badge */}
          <button
            onClick={() => setActiveTab('profile')}
            className="relative p-2 rounded-lg text-[#6E6773] hover:text-[#8D174B] hover:bg-[#FDF2F7] transition-colors"
            title={t.profile.savedContests}
          >
            <Bookmark className="w-4 h-4" />
            {savedCount > 0 && (
              <span className="absolute top-1 end-1 w-4 h-4 bg-[#8D174B] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </button>

          {/* Notifications bell */}
          <button
            onClick={() => setActiveTab('profile')}
            className="relative p-2 rounded-lg text-[#6E6773] hover:text-[#8D174B] hover:bg-[#FDF2F7] transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-[#C73578] rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
