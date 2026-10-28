import React, { useEffect, useState } from 'react';
import { Bell, Download, X } from 'lucide-react';
import type { Language } from '../types';
import { canPromptInstall, isIOS, isStandalone, onPwaChange, promptInstall } from '../lib/pwa';
import { IosInstallSteps } from './NotificationsToggle';
import { gaEvent } from '../lib/analytics';

const DISMISS_KEY = 'kk:install-banner-dismissed';

// Invitation (mobile) à installer l'app pour recevoir les notifications des concours.
export const InstallAppBanner: React.FC<{ language: Language; compact?: boolean }> = ({ language, compact }) => {
  const fr = language === 'fr';
  const [installable, setInstallable] = useState(canPromptInstall());
  const [showSteps, setShowSteps] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      // Réaffichée 7 jours après une fermeture (ancienne valeur « 1 » = fermée avant le 28/10).
      const v = localStorage.getItem(DISMISS_KEY);
      return !!v && Date.now() - (v === '1' ? 0 : Number(v)) < 7 * 86400000;
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
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* stockage indisponible : masqué pour cette visite seulement */
    }
  };

  // Barre fine au-dessus de la navigation (pages autres que l'accueil).
  if (compact && !showSteps)
    return (
      <div className="md:hidden fixed inset-x-0 bottom-16 z-30 px-3 pb-2 animate-fade-in" dir={fr ? 'ltr' : 'rtl'}>
        <div className="flex items-center gap-2.5 rounded-2xl bg-[#242126] text-white ps-3 pe-1.5 py-1.5 shadow-lg">
          <img src="/icons/icon-192.png" alt="" className="w-8 h-8 rounded-lg shrink-0" />
          <p className="flex-1 min-w-0 text-[12px] font-bold leading-tight">{fr ? 'L’app KounKour : alertes des concours' : 'تطبيق KounKour: تنبيهات المباريات'}</p>
          <button
            type="button"
            onClick={() => {
              gaEvent('install_prompt', { where: 'barre' });
              if (installable) promptInstall();
              else setShowSteps(true);
            }}
            className="shrink-0 rounded-xl bg-white text-[#8D174B] px-3 py-2 text-[12px] font-extrabold active:scale-95 cursor-pointer"
          >
            {installable ? (fr ? 'Installer' : 'تثبيت') : fr ? 'Comment ?' : 'كيف؟'}
          </button>
          <button type="button" onClick={dismiss} aria-label={fr ? 'Fermer' : 'إغلاق'} className="shrink-0 p-1.5 rounded-full hover:bg-white/15 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );

  return (
    <div className={`md:hidden px-4 animate-fade-in ${compact ? 'fixed inset-x-0 bottom-16 z-30 pb-2' : ''}`} dir={fr ? 'ltr' : 'rtl'}>
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
            onClick={() => {
              gaEvent('install_prompt', { where: 'banniere' });
              if (installable) promptInstall();
              else setShowSteps(true);
            }}
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
