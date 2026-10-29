import React, { useEffect, useState } from 'react';
import { Bell, BellRing, Check, Download, Loader2, X } from 'lucide-react';
import type { Language } from '../types';
import {
  canFollowHere,
  canPromptInstall,
  followOnThisDevice,
  followState,
  isIOS,
  isStandalone,
  onFollowChange,
  onPwaChange,
  promptInstall,
  pushSupported,
  unfollowOnThisDevice,
} from '../lib/pwa';
import type { FollowState } from '../data/matchPrefsApi';
import { IosInstallSteps } from './NotificationsToggle';
import { gaEvent } from '../lib/analytics';

// Alertes en un clic, sans inscription : la notification est le premier pas (l'inscription
// vient ensuite, quand le candidat veut un tri par profil).

function useFollow() {
  const [state, setState] = useState<FollowState | null>(null);
  const [installable, setInstallable] = useState(canPromptInstall());
  useEffect(() => {
    let alive = true;
    followState().then((s) => alive && setState(s));
    const off1 = onFollowChange((s) => setState(s));
    const off2 = onPwaChange(() => setInstallable(canPromptInstall()));
    return () => {
      alive = false;
      off1();
      off2();
    };
  }, []);
  return { state, installable };
}

const iosNeedsInstall = () => isIOS() && !isStandalone();

/** Après l'activation sur Android / ordinateur : proposer l'app (icône sur l'écran d'accueil). */
const InstallNudge: React.FC<{ fr: boolean; where: string }> = ({ fr, where }) => (
  <button
    type="button"
    onClick={() => {
      gaEvent('install_prompt', { where });
      promptInstall();
    }}
    className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-extrabold text-[#8D174B] underline underline-offset-2 cursor-pointer"
  >
    <Download className="w-3.5 h-3.5" />
    {fr ? 'Ajouter KounKour à l’écran d’accueil' : 'أضف KounKour إلى الشاشة الرئيسية'}
  </button>
);

/** Fiche concours : « M'alerter » (convocations, résultats, date limite). */
// Navigateurs intégrés (Facebook, Instagram, WhatsApp…) : pas de notifications possibles.
const inAppBrowser = () => typeof navigator !== 'undefined' && /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|Snapchat|TikTok/i.test(navigator.userAgent);
const REMIND_DAYS = 3; // même délai que le rappel envoyé (api/_lib/follows.ts)

// Date du rappel (JJ/MM) = date limite − 3 jours, comme l'envoi serveur ; null si c'est déjà passé.
function reminderDay(deadlineISO?: string): string | null {
  if (!deadlineISO || !/^\d{4}-\d{2}-\d{2}/.test(deadlineISO)) return null;
  const d = new Date(`${deadlineISO.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - REMIND_DAYS);
  const iso = d.toISOString().slice(0, 10);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Casablanca' });
  if (iso < today) return null;
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

export const ContestAlertButton: React.FC<{ contestId: string; language: Language; closed?: boolean; deadlineISO?: string; onCalendar?: () => void }> = ({
  contestId,
  language,
  closed,
  deadlineISO,
  onCalendar,
}) => {
  const fr = language === 'fr';
  const { state, installable } = useFollow();
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const [steps, setSteps] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const remind = closed ? null : reminderDay(deadlineISO);
  if (inAppBrowser() || (!pushSupported() && !isIOS())) {
    // Ouvert depuis Facebook / WhatsApp : expliquer comment activer le rappel, ou l'ajouter à l'agenda.
    if (!inAppBrowser() && !onCalendar) return null;
    return (
      <div className="rounded-2xl border border-[#8D174B]/25 bg-white p-3.5 shadow-sm animate-fade-in">
        <p className="text-[13px] font-extrabold text-[#242126] flex items-center gap-2">
          <BellRing className="w-5 h-5 text-[#8D174B] shrink-0" />
          {remind ? (fr ? `Ne ratez pas la date limite : rappel le ${remind}` : `لا تفوّت آخر أجل: تذكير يوم ${remind}`) : fr ? 'Être prévenu des convoqués et des résultats' : 'توصل بلوائح المدعوين والنتائج'}
        </p>
        {inAppBrowser() && (
          <p className="mt-1.5 text-[12px] text-[#4A4250] leading-snug">
            {fr
              ? 'Les alertes ne marchent pas dans le navigateur de Facebook ou WhatsApp : ouvrez cette page dans Chrome (menu ⋮ → « Ouvrir dans le navigateur »), puis touchez « M’alerter ».'
              : 'التنبيهات لا تعمل داخل متصفح فيسبوك أو واتساب: افتح الصفحة في Chrome (القائمة ⋮ ← «فتح في المتصفح») ثم اضغط «نبّهني».'}
          </p>
        )}
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {inAppBrowser() && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true)).catch(() => {});
                gaEvent('push_inapp_copy', { where: 'concours' });
              }}
              className="rounded-xl bg-[#8D174B] text-white px-3 py-2.5 text-[12.5px] font-extrabold active:scale-95 cursor-pointer"
            >
              {copied ? (fr ? 'Lien copié ✓' : 'تم النسخ ✓') : fr ? 'Copier le lien' : 'نسخ الرابط'}
            </button>
          )}
          {onCalendar && !closed && (
            <button type="button" onClick={onCalendar} className={`rounded-xl bg-[#FDF2F7] text-[#8D174B] px-3 py-2.5 text-[12.5px] font-extrabold active:scale-95 cursor-pointer ${inAppBrowser() ? '' : 'col-span-2'}`}>
              {fr ? 'Ajouter à mon agenda' : 'أضف إلى المفكرة'}
            </button>
          )}
        </div>
      </div>
    );
  }
  const on = !!state?.follows?.includes(contestId);

  const enable = async () => {
    if (iosNeedsInstall()) {
      setSteps((v) => !v);
      gaEvent('push_ios_steps', { where: 'concours' });
      return;
    }
    setBusy(true);
    setErr('');
    setDenied(false);
    const r = await followOnThisDevice({ contestId, lang: fr ? 'fr' : 'ar' });
    setBusy(false);
    if (r.ok) gaEvent('push_optin', { where: 'concours' });
    else if (r.denied) setDenied(true);
    else setErr(fr ? 'Activation impossible sur ce navigateur.' : 'تعذر التفعيل على هذا المتصفح.');
  };

  if (on)
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 animate-fade-in">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[13px] font-extrabold text-emerald-900">
            <Check className="w-5 h-5 shrink-0" />
            {remind ? (fr ? `Rappel prévu le ${remind}, puis convoqués et résultats` : `تذكير يوم ${remind} ثم المدعوون والنتائج`) : fr ? 'Alertes activées pour ce concours' : 'التنبيهات مفعّلة لهذه المباراة'}
          </span>
          <button type="button" onClick={() => unfollowOnThisDevice({ contestId })} className="text-[11px] font-bold text-emerald-800 underline cursor-pointer shrink-0">
            {fr ? 'Arrêter' : 'إيقاف'}
          </button>
        </div>
        {installable && !isStandalone() && <InstallNudge fr={fr} where="concours" />}
      </div>
    );

  return (
    <div className="rounded-2xl border border-[#8D174B]/25 bg-white p-3.5 shadow-sm animate-fade-in">
      <button
        type="button"
        onClick={enable}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#8D174B] hover:bg-[#75123E] disabled:opacity-60 text-white px-4 py-3 text-[14px] font-extrabold shadow-md active:scale-95 transition-all cursor-pointer animate-selected-glow"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <BellRing className="w-5 h-5" />}
        {remind ? (fr ? `Me rappeler le ${remind} (3 jours avant)` : `ذكّرني يوم ${remind} (قبل 3 أيام)`) : fr ? 'M’alerter pour ce concours' : 'نبّهني بخصوص هذه المباراة'}
      </button>
      <p className="mt-2 text-[11.5px] text-[#6E6773] text-center leading-snug">
        {closed
          ? fr
            ? 'Notification dès la publication des convoqués et des résultats. Gratuit, sans inscription.'
            : 'إشعار فور نشر لوائح المدعوين والنتائج. مجاناً وبدون تسجيل.'
          : fr
            ? 'Un rappel sur votre téléphone avant la clôture, puis les convoqués et les résultats dès leur publication. Gratuit, sans inscription, en un clic.'
            : 'تذكير قبل آخر أجل، ثم لوائح المدعوين والنتائج فور نشرها. مجاناً وبدون تسجيل.'}
      </p>
      {denied && (
        <p className="mt-2 text-[11.5px] font-bold text-amber-800 text-center">
          {fr ? 'Notifications bloquées : autorisez-les dans les réglages du navigateur (icône 🔒 à côté de l’adresse).' : 'الإشعارات محظورة: اسمح بها من إعدادات المتصفح (أيقونة 🔒 بجانب العنوان).'}
        </p>
      )}
      {err && <p className="mt-2 text-[11.5px] text-rose-700 text-center">{err}</p>}
      {steps && (
        <div className="mt-3 rounded-xl bg-[#FAF7F9] p-3">
          <p className="text-[12px] font-bold text-[#8D174B]">{fr ? 'Sur iPhone, les alertes passent par l’app :' : 'على iPhone، تمر التنبيهات عبر التطبيق:'}</p>
          <IosInstallSteps fr={fr} />
        </div>
      )}
    </div>
  );
};

const DISMISS_NEW = 'kk:new-contests-card';

/** Accueil / liste : « Les nouveaux concours chaque jour, sans inscription ». */
export const NewContestsAlertCard: React.FC<{ language: Language; where: string }> = ({ language, where }) => {
  const fr = language === 'fr';
  const { state, installable } = useFollow();
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const [steps, setSteps] = useState(false);
  const [done, setDone] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      const t = Number(localStorage.getItem(DISMISS_NEW) || 0);
      return Date.now() - t < 5 * 86400000; // masquée 5 jours après fermeture
    } catch {
      return false;
    }
  });
  if (hidden || (!pushSupported() && !isIOS())) return null;
  if (state?.new_contests && !done) return null;

  const close = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_NEW, String(Date.now()));
    } catch {
      /* stockage indisponible */
    }
  };
  const enable = async () => {
    if (!canFollowHere()) {
      setSteps((v) => !v);
      gaEvent('push_ios_steps', { where });
      return;
    }
    setBusy(true);
    setDenied(false);
    const r = await followOnThisDevice({ newContests: true, lang: fr ? 'fr' : 'ar' });
    setBusy(false);
    if (r.ok) {
      setDone(true);
      gaEvent('push_optin', { where });
    } else if (r.denied) setDenied(true);
  };

  return (
    <div className="px-4 animate-fade-in" dir={fr ? 'ltr' : 'rtl'}>
      <div className="relative max-w-3xl mx-auto rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#B0245F] text-white p-4 shadow-md animate-card-breathe">
        <button type="button" onClick={close} aria-label={fr ? 'Fermer' : 'إغلاق'} className={`absolute top-2 ${fr ? 'right-2' : 'left-2'} p-1.5 rounded-full hover:bg-white/15 cursor-pointer`}>
          <X className="w-4 h-4" />
        </button>
        {done ? (
          <div className="flex items-start gap-3 pe-6">
            <Check className="w-6 h-6 shrink-0" />
            <div>
              <p className="text-sm font-extrabold">{fr ? 'C’est activé !' : 'تم التفعيل!'}</p>
              <p className="text-[12px] text-white/90">{fr ? 'Vous recevrez une notification quand de nouveaux concours sont publiés.' : 'ستتوصل بإشعار عند نشر مباريات جديدة.'}</p>
              {installable && !isStandalone() && (
                <button type="button" onClick={() => { gaEvent('install_prompt', { where }); promptInstall(); }} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-white text-[#8D174B] px-3 py-2 text-[12px] font-extrabold active:scale-95 cursor-pointer">
                  <Download className="w-4 h-4" />
                  {fr ? 'Installer l’app (gratuit)' : 'ثبّت التطبيق (مجاناً)'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 pe-6">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold">{fr ? 'Ne ratez plus aucun concours' : 'لا تفوت أي مباراة بعد اليوم'}</p>
                <p className="text-[12px] text-white/90 leading-snug">
                  {fr ? 'Une notification quand de nouveaux concours sont publiés. Gratuit, sans inscription, désactivable à tout moment.' : 'إشعار عند نشر مباريات جديدة. مجاناً، بدون تسجيل، ويمكن إيقافه في أي وقت.'}
                </p>
              </div>
            </div>
            {steps ? (
              <div className="mt-3 rounded-xl bg-white p-3">
                <IosInstallSteps fr={fr} />
              </div>
            ) : (
              <button
                type="button"
                onClick={enable}
                disabled={busy}
                className="mt-3 w-full py-2.5 rounded-xl bg-white text-[#8D174B] text-[13px] font-extrabold active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-70"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
                {denied
                  ? fr
                    ? 'Notifications bloquées dans le navigateur'
                    : 'الإشعارات محظورة في المتصفح'
                  : fr
                    ? 'Activer les alertes'
                    : 'فعّل التنبيهات'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
