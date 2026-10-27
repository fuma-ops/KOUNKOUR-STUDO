import React from 'react';
import { ArrowRight, ArrowLeft, CalendarClock, BellRing, Calculator, Sparkles, UserPlus } from 'lucide-react';
import type { Contest, Language, QcmSet } from '../types';
import { QcmFolder, QcmProgress, contentType, CONTENT_TYPES, themeIn } from '../data/qcmApi';
import { prepFolderSlugsFor } from '../utils/prepMatch';
import { TYPE_META } from './prepTypes';
import { gaEvent } from '../lib/analytics';

// Bloc « Et maintenant ? » en fin de QCM ou de sujet : la suite dans la même spécialité,
// les concours ouverts du même métier, le profil (alertes) et le simulateur de salaire.
// Objectif : chaque visite mène à une autre page utile au lieu de s'arrêter là.

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ');

// Mots d'une spécialité assez précis pour reconnaître le métier dans un intitulé de concours.
const GENERIC = new Set(['gestion', 'controle', 'relation', 'client', 'clientele', 'ressources', 'analyses', 'industriel']);
const themeWords = (theme: string | null | undefined) =>
  norm(theme || '')
    .split(' ')
    .filter((w) => w.length >= 5 && !GENERIC.has(w));

// Base commune du sujet et du QCM d'un même concours blanc (…-concours-blanc-sujet / …-qcm).
const pairKey = (slug: string) => slug.replace(/-(sujet|qcm)$/, '');

// Jours restants avant la date limite (null = non communiquée).
const daysLeft = (c: Contest) => (typeof c.daysRemaining === 'number' ? c.daysRemaining : null);

interface Props {
  set: QcmSet;
  allSets: QcmSet[];
  folders: QcmFolder[];
  progress: Record<string, QcmProgress>;
  contests: Contest[];
  language: Language;
  isAuthed: boolean;
  onOpenSet: (set: QcmSet) => void;
  onOpenContest?: (contest: Contest) => void;
  onRequestLogin?: () => void;
  onOpenProfile?: () => void;
  onOpenSalarySimulator?: (contest?: Contest) => void;
}

export const PrepNextSteps: React.FC<Props> = ({
  set,
  allSets,
  folders,
  progress,
  contests,
  language,
  isAuthed,
  onOpenSet,
  onOpenContest,
  onRequestLogin,
  onOpenProfile,
  onOpenSalarySimulator,
}) => {
  const fr = language === 'fr';
  const Arrow = fr ? ArrowRight : ArrowLeft;
  const current = contentType(set);
  const done = (s: QcmSet) => !!progress[s.id]?.attempts || (progress[s.id]?.seen?.length || 0) > 0;

  // 1) La suite : d'abord l'autre moitié du même concours blanc, puis la même spécialité,
  // en préférant ce qui n'a pas encore été fait et un autre type de support.
  // Une série dans une autre langue passe après tout le reste (banque psychotechnique FR / AR / EN).
  const next = allSets
    .filter((s) => s.id !== set.id && s.folderSlug === set.folderSlug)
    .map((s) => ({
      s,
      rank:
        (pairKey(s.slug) === pairKey(set.slug) && /concours-blanc/.test(s.slug) ? -20 : 0) +
        ((s.theme || null) === (set.theme || null) ? 0 : 10) +
        (s.contentLanguage && set.contentLanguage && s.contentLanguage !== set.contentLanguage ? 30 : 0) +
        (done(s) ? 6 : 0) +
        (contentType(s) === current ? 2 : 0) +
        CONTENT_TYPES.indexOf(contentType(s)) * 0.1,
    }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3)
    .map((x) => x.s);

  // 2) Concours ouverts reliés au dossier (mêmes règles que les fiches), le métier de la
  // spécialité en premier, puis la date limite la plus proche.
  const words = themeWords(set.theme);
  const open = set.folderSlug
    ? contests
        .filter((c) => (c.status === 'open' || c.status === 'closing_soon') && (daysLeft(c) === null || (daysLeft(c) as number) >= 0))
        .filter((c) =>
          prepFolderSlugsFor(
            {
              title: c.title.fr,
              grade: c.grade_fr || c.grade || '',
              admin: c.administration?.name?.fr || '',
              specialty: [c.specialty?.fr, ...(c.specialtiesList || []), ...(c.posts || []).map((p) => p.specialty || '')].filter(Boolean).join(' '),
            },
            folders,
          ).includes(set.folderSlug as string),
        )
        .map((c) => {
          const hay = norm([c.title.fr, c.specialty?.fr, ...(c.specialtiesList || []), ...(c.posts || []).map((p) => `${p.category || ''} ${p.specialty || ''}`)].join(' '));
          return { c, hits: words.filter((w) => hay.includes(w)).length };
        })
        .sort((a, b) => b.hits - a.hits || (daysLeft(a.c) ?? 9999) - (daysLeft(b.c) ?? 9999))
        .slice(0, 3)
        .map((x) => x.c)
    : [];

  const row = 'w-full text-start flex items-center gap-3 rounded-xl border border-[#F1E5EC] bg-white px-3 py-2.5 hover:border-[#8D174B]/40 hover:shadow-md hover-scale active:scale-95 transition-all cursor-pointer';

  return (
    <section className="rounded-3xl border border-[#F1E5EC] bg-gradient-to-b from-[#FDF2F7] to-[#FFFDFE] p-4 sm:p-5 space-y-5 animate-fade-in">
      <h3 className="flex items-center gap-2 text-base font-extrabold text-[#8D174B]">
        <Sparkles className="w-5 h-5" />
        {fr ? 'Et maintenant ?' : 'وماذا بعد؟'}
      </h3>

      {next.length > 0 && (
        <div>
          <p dir="auto" className="text-[12px] font-extrabold text-[#242126] mb-2">
            {fr ? `Continuer${set.theme ? ` en ${themeIn(set.theme, set.contentLanguage)}` : ''}` : 'تابع في نفس التخصص'}
          </p>
          <div className="space-y-2">
            {next.map((s, i) => {
              const M = TYPE_META[contentType(s)];
              const I = M.icon;
              return (
                <button key={s.id} onClick={() => { gaEvent('next_step', { kind: 'support', target: s.slug }); onOpenSet(s); }} className={`${row} animate-fade-in`} style={{ animationDelay: `${i * 80}ms` }}>
                  <span className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${M.cls}`}>
                    <I className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10.5px] font-bold text-[#6E6773]">{fr ? M.frOne : M.ar}</span>
                    <span dir="auto" className="block text-[13px] font-bold text-[#242126] leading-snug line-clamp-2">{s.title[language] || s.title.fr}</span>
                  </span>
                  <Arrow className="w-4 h-4 text-[#8D174B] shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {open.length > 0 && onOpenContest && (
        <div>
          <p className="text-[12px] font-extrabold text-[#242126] mb-2">{fr ? 'Concours ouverts pour ce métier' : 'مباريات مفتوحة لهذا التخصص'}</p>
          <div className="space-y-2">
            {open.map((c, i) => (
              <button key={c.id} onClick={() => { gaEvent('next_step', { kind: 'concours', target: c.slug }); onOpenContest(c); }} className={`${row} animate-fade-in`} style={{ animationDelay: `${i * 80}ms` }}>
                <span className="w-9 h-9 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-4 h-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span dir="auto" className="block text-[13px] font-bold text-[#242126] leading-snug line-clamp-2">{c.title[language] || c.title.fr}</span>
                  {c.deadlineDate && (
                    <span className="block text-[11px] font-bold text-emerald-800">
                      {fr ? `Date limite : ${c.deadlineDate}` : `آخر أجل: ${c.deadlineDate}`}
                      {daysLeft(c) !== null && (
                        <span className="text-[#8D174B] whitespace-nowrap"> · {daysLeft(c) === 0 ? (fr ? 'dernier jour' : 'آخر يوم') : fr ? `J-${daysLeft(c)}` : `${daysLeft(c)} يوم`}</span>
                      )}
                    </span>
                  )}
                </span>
                <Arrow className="w-4 h-4 text-[#8D174B] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {(isAuthed ? onOpenProfile : onRequestLogin) && (
          <button
            onClick={() => {
              gaEvent('next_step', { kind: isAuthed ? 'alertes' : 'profil' });
              if (isAuthed) onOpenProfile?.();
              else onRequestLogin?.();
            }}
            className="text-start rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white p-4 shadow-md hover:shadow-lg hover-scale active:scale-95 transition-all cursor-pointer animate-cta-bounce"
          >
            <span className="flex items-center gap-2 text-[14px] font-extrabold">
              {isAuthed ? <BellRing className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {isAuthed ? (fr ? 'Mes alertes concours' : 'تنبيهاتي') : fr ? 'Créer mon profil gratuit' : 'أنشئ ملفك مجاناً'}
            </span>
            <span className="block text-[12px] text-white/90 mt-1 leading-snug">
              {isAuthed
                ? fr
                  ? 'Choisissez vos spécialités : nouveaux concours, convocations et résultats rien que pour vous.'
                  : 'اختر تخصصاتك لتصلك المباريات والاستدعاءات والنتائج.'
                : fr
                ? 'Gardez votre progression et recevez les nouveaux concours, convocations et résultats de votre spécialité.'
                : 'احفظ تقدمك وتوصل بالمباريات والاستدعاءات والنتائج.'}
            </span>
          </button>
        )}
        {onOpenSalarySimulator && (
          <button
            onClick={() => {
              gaEvent('next_step', { kind: 'salaire' });
              onOpenSalarySimulator(open[0]);
            }}
            className="text-start rounded-2xl border border-[#F1E5EC] bg-white p-4 hover:border-[#8D174B]/40 hover:shadow-md hover-scale active:scale-95 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2 text-[14px] font-extrabold text-[#242126]">
              <Calculator className="w-5 h-5 text-[#8D174B]" />
              {fr ? 'Combien vais-je gagner ?' : 'كم سأتقاضى؟'}
            </span>
            <span className="block text-[12px] text-[#6E6773] mt-1 leading-snug">
              {fr ? 'Simulateur de salaire : estimez la rémunération selon le grade et l’échelle.' : 'محاكي الأجر حسب الدرجة والسلم.'}
            </span>
          </button>
        )}
      </div>
    </section>
  );
};
