import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Check, Download, Share, PlusSquare } from 'lucide-react';
import type { CandidateProfile, Language } from '../types';
import { loadPushAlerts, setPushAlerts } from '../data/matchPrefsApi';
import {
  canPromptInstall,
  currentPushSubscription,
  disablePushOnThisDevice,
  enablePushOnThisDevice,
  isIOS,
  isStandalone,
  onPwaChange,
  promptInstall,
  pushPermission,
  pushSupported,
} from '../lib/pwa';

/** Étapes iPhone : les notifications n'existent que dans l'app ajoutée à l'écran d'accueil. */
export const IosInstallSteps: React.FC<{ fr: boolean }> = ({ fr }) => (
  <ol className="mt-2 space-y-1 text-[11px] text-[#4A4250]">
    <li className="flex items-center gap-1.5">
      <span className="font-extrabold text-[#8D174B]">1.</span>
      {fr ? 'Touchez' : 'اضغط على'} <Share className="w-3.5 h-3.5 text-[#8D174B]" /> {fr ? '« Partager » dans Safari' : '« مشاركة » في Safari'}
    </li>
    <li className="flex items-center gap-1.5">
      <span className="font-extrabold text-[#8D174B]">2.</span>
      <PlusSquare className="w-3.5 h-3.5 text-[#8D174B]" /> {fr ? '« Sur l’écran d’accueil »' : '« إضافة إلى الشاشة الرئيسية »'}
    </li>
    <li className="flex items-center gap-1.5">
      <span className="font-extrabold text-[#8D174B]">3.</span>
      {fr ? 'Ouvrez KounKour depuis son icône, puis activez les notifications dans votre profil.' : 'افتح KounKour من أيقونته ثم فعّل الإشعارات في ملفك.'}
    </li>
  </ol>
);

// Notifications des nouveaux concours (opt-in, désactivables à tout moment).
export const NotificationsToggle: React.FC<{ language: Language; profile: CandidateProfile; compact?: boolean }> = ({ language, profile, compact }) => {
  const fr = language === 'fr';
  const [account, setAccount] = useState<boolean | null>(null); // push_alerts du compte, null = non connecté
  const [device, setDevice] = useState(false); // cet appareil est abonné
  const [installable, setInstallable] = useState(canPromptInstall());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [denied, setDenied] = useState(pushPermission() === 'denied');

  useEffect(() => {
    let alive = true;
    Promise.all([loadPushAlerts(), currentPushSubscription()]).then(([a, sub]) => {
      if (!alive) return;
      setAccount(a);
      setDevice(!!sub);
    });
    const off = onPwaChange(() => setInstallable(canPromptInstall()));
    return () => {
      alive = false;
      off();
    };
  }, []);

  if (account === null) return null; // non connecté : rien à proposer ici
  const on = account && device;
  if (compact && on) return null;

  const iosNeedsInstall = isIOS() && !isStandalone();
  const supported = pushSupported() && !iosNeedsInstall;

  const enable = async () => {
    setBusy(true);
    setMsg(null);
    const r = await enablePushOnThisDevice();
    if (!r.ok) {
      setBusy(false);
      if (r.denied) setDenied(true);
      else
        setMsg({ ok: false, text: r.error && r.error !== 'unsupported' ? r.error : fr ? 'Notifications non autorisées.' : 'لم يتم السماح بالإشعارات.' });
      return;
    }
    const s = await setPushAlerts(true, profile);
    setBusy(false);
    if (!s.ok) {
      setMsg({ ok: false, text: s.error || (fr ? 'Erreur' : 'خطأ') });
      return;
    }
    setAccount(true);
    setDevice(true);
    setMsg({ ok: true, text: fr ? 'Notifications activées sur cet appareil.' : 'تم تفعيل الإشعارات على هذا الجهاز.' });
  };

  const disable = async () => {
    setBusy(true);
    setMsg(null);
    await disablePushOnThisDevice();
    const s = await setPushAlerts(false, profile);
    setBusy(false);
    setDevice(false);
    if (s.ok) setAccount(false);
    setMsg({ ok: true, text: fr ? 'Notifications désactivées.' : 'تم إيقاف الإشعارات.' });
  };

  const install = async () => {
    const accepted = await promptInstall();
    if (accepted) setMsg({ ok: true, text: fr ? 'Application installée. Activez maintenant les notifications.' : 'تم تثبيت التطبيق. فعّل الإشعارات الآن.' });
  };

  const title = on
    ? fr
      ? 'Notifications activées'
      : 'الإشعارات مفعّلة'
    : fr
      ? 'Ne ratez aucun concours : activez les notifications'
      : 'لا تفوت أي مباراة: فعّل الإشعارات';
  const sub = on
    ? fr
      ? 'Vous serez prévenu ici dès qu’un nouveau concours correspond à votre profil, et 3 jours avant la clôture.'
      : 'ستتوصل بإشعار عند نشر مباراة تناسب ملفك، وقبل 3 أيام من انتهاء الأجل.'
    : fr
      ? 'Une notification quand un nouveau concours correspond à votre profil, et un rappel 3 jours avant la clôture.'
      : 'إشعار عند نشر مباراة تناسب ملفك، وتذكير قبل 3 أيام من انتهاء الأجل.';

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in ${
        on ? 'bg-emerald-50/70 border-emerald-200' : 'bg-white border-[#8D174B]/25'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${on ? 'bg-emerald-600 text-white' : 'bg-[#FDF2F7] text-[#8D174B]'}`}>
          {on ? <Check className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        </div>
        <div>
          <p className="text-sm font-extrabold text-[#242126]">{title}</p>
          <p className="text-[11px] text-[#6E6773]">{sub}</p>
          {!on && account && !device && supported && (
            <p className="text-[11px] text-[#6E6773] mt-1">
              {fr ? 'Activées sur un autre appareil : activez-les aussi sur celui-ci.' : 'مفعّلة على جهاز آخر: فعّلها أيضا على هذا الجهاز.'}
            </p>
          )}
          {!on && iosNeedsInstall && (
            <>
              <p className="text-[11px] font-bold text-[#8D174B] mt-1">
                {fr ? 'Sur iPhone, installez d’abord l’application (gratuit, 10 secondes) :' : 'على iPhone، ثبّت التطبيق أولا (مجانا، 10 ثوان):'}
              </p>
              <IosInstallSteps fr={fr} />
            </>
          )}
          {!on && !iosNeedsInstall && !pushSupported() && (
            <p className="text-[11px] text-amber-800 mt-1">
              {fr ? 'Ce navigateur ne gère pas les notifications. Essayez Chrome, Edge ou Firefox.' : 'هذا المتصفح لا يدعم الإشعارات. جرّب Chrome أو Edge أو Firefox.'}
            </p>
          )}
          {!on && denied && supported && (
            <p className="text-[11px] text-amber-800 mt-1">
              {fr
                ? 'Notifications bloquées : autorisez-les pour ce site dans les réglages du navigateur, puis réessayez.'
                : 'الإشعارات محظورة: اسمح بها لهذا الموقع في إعدادات المتصفح ثم أعد المحاولة.'}
            </p>
          )}
          {msg && <p className={`text-[11px] font-bold mt-1 ${msg.ok ? 'text-emerald-800' : 'text-rose-700'}`}>{msg.text}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        {!on && installable && !isStandalone() && (
          <button
            type="button"
            onClick={install}
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-white border border-[#8D174B]/30 text-[#8D174B] hover:bg-[#FDF2F7] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            {fr ? 'Installer l’app' : 'تثبيت التطبيق'}
          </button>
        )}
        {on ? (
          <button
            type="button"
            onClick={disable}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-white border border-emerald-300 text-emerald-800 active:scale-95 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
          >
            <BellOff className="w-3.5 h-3.5" />
            {busy ? '…' : fr ? 'Désactiver' : 'إيقاف'}
          </button>
        ) : (
          supported && (
            <button
              type="button"
              onClick={enable}
              disabled={busy}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#8D174B] text-white hover:bg-[#70113B] animate-cta-bounce active:scale-95 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              {busy ? '…' : fr ? 'Activer les notifications' : 'تفعيل الإشعارات'}
            </button>
          )
        )}
      </div>
    </div>
  );
};
