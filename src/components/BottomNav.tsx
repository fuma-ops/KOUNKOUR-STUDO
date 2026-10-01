import React from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { Home, Briefcase, GraduationCap, Users, User, LogIn } from 'lucide-react';

interface BottomNavProps {
  language: Language;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAuthed?: boolean;
  onAuthClick?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  language,
  activeTab,
  setActiveTab,
  isAuthed = false,
  onAuthClick,
}) => {
  const t = translations[language];

  const navItems = [
    { id: 'home', label: t.nav.home, icon: Home },
    { id: 'contests', label: t.nav.contests, icon: Briefcase },
    { id: 'preparation', label: t.nav.preparation, icon: GraduationCap },
    { id: 'community', label: t.nav.community, icon: Users },
    isAuthed
      ? { id: 'profile', label: t.nav.profile, icon: User }
      : { id: 'auth', label: language === 'fr' ? 'Connexion' : 'دخول', icon: LogIn, onClick: onAuthClick },
  ];

  return (
    <nav 
      aria-label="Navigation mobile"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#F1E5EC] px-2 py-1 safe-area-bottom shadow-lg"
    >
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
                isActive ? 'text-[#8D174B]' : 'text-[#6E6773] hover:text-[#242126]'
              }`}
            >
              <div className={`p-1 rounded-xl transition-transform ${isActive ? 'scale-110 bg-[#FDF2F7]' : ''}`}>
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
