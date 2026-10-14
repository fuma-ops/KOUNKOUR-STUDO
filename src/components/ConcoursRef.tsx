import React from 'react';
import { CalendarDays, ShieldCheck, Sparkles } from 'lucide-react';
import type { Language, QcmSet } from '../types';
import { OrgLogo } from './OrgLogo';

// Concours d'origine d'une série : organisme (logo officiel), intitulé du
// concours et année de la session. Pour une annale ou un sujet, ce sont ceux de
// la copie réelle ; pour un entraînement, le concours visé (aucune année inventée).

export const ConcoursRef: React.FC<{ set: QcmSet; language: Language; variant?: 'card' | 'header' }> = ({ set, language, variant = 'card' }) => {
  const fr = language === 'fr';
  const real = set.kind === 'annales' || set.kind === 'sujet';
  const label = set.concoursLabel || set.orgName || '';
  if (!label) return null;
  const big = variant === 'header';
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border ${real ? 'border-emerald-200 bg-emerald-50/50' : 'border-[#F1E5EC] bg-[#FAF7F9]'} ${big ? 'p-3' : 'p-2'} mb-2`}>
      <div className={`${big ? 'w-14 h-14' : 'w-10 h-10'} shrink-0 rounded-lg bg-white border border-[#F1E5EC] flex items-center justify-center p-1 overflow-hidden`}>
        <OrgLogo src={set.orgLogo} name={set.orgName || label} size="xs" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`flex items-center gap-1 font-extrabold uppercase tracking-wide ${big ? 'text-[11px]' : 'text-[10px]'} ${real ? 'text-emerald-800' : 'text-[#6E6773]'}`}>
          {real ? <ShieldCheck className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
          {real ? (fr ? 'Concours réel' : 'مباراة حقيقية') : fr ? 'Préparation au concours' : 'تحضير لمباراة'}
        </p>
        <p dir="auto" className={`font-bold text-[#242126] leading-snug ${big ? 'text-sm' : 'text-[12px]'}`}>{label}</p>
      </div>
      {real && (
        <span
          className={`shrink-0 inline-flex items-center gap-1 rounded-lg font-extrabold ${big ? 'px-2.5 py-1.5 text-xs' : 'px-2 py-1 text-[11px]'} ${
            set.examYear ? 'bg-[#8D174B] text-white' : 'bg-white text-[#8E8694] border border-[#E9DCE4]'
          }`}
          title={set.examYear ? undefined : fr ? "L'année n'est pas indiquée sur la copie source" : 'السنة غير مذكورة في النسخة المصدر'}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          {set.examYear ? (fr ? `Session ${set.examYear}` : `دورة ${set.examYear}`) : fr ? 'Année non indiquée' : 'سنة غير مذكورة'}
        </span>
      )}
    </div>
  );
};

/** Organismes réels d'une liste de séries (logo officiel), sans doublon. */
export function setOrgs(sets: QcmSet[]): { name: string; logo: string | null }[] {
  const seen = new Map<string, { name: string; logo: string | null }>();
  for (const s of sets) if (s.orgName && !seen.has(s.orgName)) seen.set(s.orgName, { name: s.orgName, logo: s.orgLogo || null });
  return [...seen.values()];
}

/** Bandeau par défaut d'un dossier sans image d'en-tête : logos des organismes de ses concours. */
export const OrgLogosBand: React.FC<{ orgs: { name: string; logo: string | null }[]; className?: string }> = ({ orgs, className = '' }) => {
  if (!orgs.length) return null;
  return (
    <div className={`flex items-center justify-center gap-3 sm:gap-5 px-4 bg-gradient-to-br from-white via-[#FFFDFE] to-[#FAF0F5] ${className}`}>
      {orgs.slice(0, 3).map((o, i) => (
        <div key={o.name} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
          <OrgLogo src={o.logo} name={o.name} size={orgs.length <= 2 ? 'md' : 'sm'} />
        </div>
      ))}
      {orgs.length > 3 && <span className="text-xs font-extrabold text-[#8D174B]">+{orgs.length - 3}</span>}
    </div>
  );
};
