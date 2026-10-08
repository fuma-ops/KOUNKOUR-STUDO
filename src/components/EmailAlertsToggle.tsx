import React, { useEffect, useState } from 'react';
import { Mail, Check } from 'lucide-react';
import type { CandidateProfile, Language } from '../types';
import { loadEmailAlerts, setEmailAlerts } from '../data/matchPrefsApi';

// Interrupteur « recevoir mes concours par e-mail » (opt-in, désactivable à tout moment).
export const EmailAlertsToggle: React.FC<{ language: Language; profile: CandidateProfile; compact?: boolean }> = ({ language, profile, compact }) => {
  const fr = language === 'fr';
  const [on, setOn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadEmailAlerts().then((v) => alive && setOn(v));
    return () => {
      alive = false;
    };
  }, []);

  if (on === null) return null; // non connecté : rien à proposer ici
  if (compact && on) return null;

  const toggle = async () => {
    setBusy(true);
    setMsg(null);
    const r = await setEmailAlerts(!on, profile);
    setBusy(false);
    if (r.ok) {
      setOn(!on);
      setMsg(!on ? (fr ? 'Alertes activées : vous recevrez vos concours par e-mail.' : 'تم تفعيل التنبيهات بالبريد الإلكتروني.') : fr ? 'Alertes e-mail désactivées.' : 'تم إيقاف التنبيهات.');
    } else setMsg(r.error || (fr ? 'Erreur' : 'خطأ'));
  };

  return (
    <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in ${on ? 'bg-emerald-50/70 border-emerald-200' : 'bg-white border-[#8D174B]/25'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${on ? 'bg-emerald-600 text-white' : 'bg-[#FDF2F7] text-[#8D174B]'}`}>
          {on ? <Check className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
        </div>
        <div>
          <p className="text-sm font-extrabold text-[#242126]">
            {fr ? 'Ne ratez aucun concours : recevez-les par e-mail' : 'لا تفوت أي مباراة: توصل بها عبر البريد الإلكتروني'}
          </p>
          <p className="text-[11px] text-[#6E6773]">
            {fr
              ? 'Un e-mail quand un nouveau concours correspond à votre profil, et un rappel 3 jours avant la clôture. Désabonnement en un clic.'
              : 'رسالة عند نشر مباراة تناسب ملفك، وتذكير قبل 3 أيام من انتهاء الأجل. إلغاء الاشتراك بنقرة.'}
          </p>
          {msg && <p className="text-[11px] font-bold text-emerald-800 mt-1">{msg}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-extrabold active:scale-95 transition-all cursor-pointer disabled:opacity-60 ${
          on ? 'bg-white border border-emerald-300 text-emerald-800' : 'bg-[#8D174B] text-white hover:bg-[#70113B] animate-cta-bounce'
        }`}
      >
        {busy ? '…' : on ? (fr ? 'Désactiver' : 'إيقاف') : fr ? 'Activer les alertes e-mail' : 'تفعيل التنبيهات'}
      </button>
    </div>
  );
};
