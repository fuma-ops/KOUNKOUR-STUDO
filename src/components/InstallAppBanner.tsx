import React, { useEffect, useState } from 'react';
import { Bell, Download, X } from 'lucide-react';
import type { Language } from '../types';
import { canPromptInstall, isIOS, isStandalone, onPwaChange, promptInstall } from '../lib/pwa';
import { IosInstallSteps } from './NotificationsToggle';

const DISMISS_KEY = 'kk:install-banner-dismissed';

// Invitation (mobile) à installer l'app pour recevoir les notifications des concours.
export const InstallAppBanner: React.FC<{ language: Language }> = ({ language }) => {
  const fr = language === 'fr';
  const [installable, setInstallable] = useState(canPromptInstall());
  const [showSteps, setShowSteps] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => onPwaChange(() => setInstallable(canPromptInstall())), []);

  const ios = isIOS();
  if (hidden || isStandalone() || (!installable && !ios)) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* stockage indisponible : masqué pour cette visite seulement */
    }
  };

  return (
    <div className="md:hidden px-4 animate-fade-in" dir={fr ? 'ltr' : 'rtl'}>
      <div className="relative rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#B0245F] text-white p-4 shadow-md animate-card-breathe">
        <button
          type="button"
          onClick={dismiss}
          aria-label={fr ? 'Fermer' : 'إغلاق'}
          className={`absolute top-2 ${fr ? 'right-2' : 'left-2'} p-1.5 rounded-full hover:bg-white/15 active:scale-95 cursor-pointer`}
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3 pe-6">
          <img src="/icons/icon-192.png" alt="" className="w-11 h-11 rounded-xl shrink-0 ring-2 ring-white/30" />
          <div className="min-w-0">
            <p className="text-sm font-extrabold">{fr ? 'Installez l’app KounKour' : 'ثبّت تطبيق KounKour'}</p>
            <p className="text-[11px] text-white/85 leading-snug flex items-center gap-1">
              <Bell className="w-3 h-3 shrink-0" />
              {fr ? 'Recevez une notification dès qu’un concours vous correspond.' : 'توصل بإشعار فور نشر مباراة تناسبك.'}
            </p>
          </div>
        </div>
        {showSteps && (
          <div className="mt-3 rounded-xl bg-white p-3">
            <IosInstallSteps fr={fr} />
          </div>
        )}
        {!showSteps && (
          <button
            type="button"
            onClick={() => (installable ? promptInstall() : setShowSteps(true))}
            className="mt-3 w-full py-2.5 rounded-xl bg-white text-[#8D174B] text-xs font-extrabold active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            {installable ? (fr ? 'Installer gratuitement' : 'تثبيت مجانا') : fr ? 'Comment installer ?' : 'كيف أثبّته؟'}
          </button>
        )}
      </div>
    </div>
  );
};
