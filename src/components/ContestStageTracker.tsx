import React from 'react';
import { CheckCircle2, Circle, FileText, Download, Bell } from 'lucide-react';
import type { Contest, ContestDocument, Language } from '../types';

// Suivi du concours après la clôture : dépôt → convoqués à l'écrit → convoqués à l'oral →
// résultats. Chaque étape franchie renvoie vers la liste officielle publiée sur
// emploi-public.ma (lue chaque matin par le robot, jamais devinée).

type StepKey = 'depot' | 'ecrit' | 'oral' | 'resultat';
const ORDER: StepKey[] = ['depot', 'ecrit', 'oral', 'resultat'];
const DOC_OF: Record<Exclude<StepKey, 'depot'>, ContestDocument['docType']> = {
  ecrit: 'convoques_ecrit',
  oral: 'convoques_oral',
  resultat: 'resultats',
};
const LABEL: Record<StepKey, { fr: string; ar: string }> = {
  depot: { fr: 'Dépôt des candidatures', ar: 'إيداع الترشيحات' },
  ecrit: { fr: 'Convoqués à l’écrit', ar: 'المدعوون للكتابي' },
  oral: { fr: 'Convoqués à l’oral', ar: 'المدعوون للشفوي' },
  resultat: { fr: 'Résultats', ar: 'النتائج' },
};

export const ContestStageTracker: React.FC<{ contest: Contest; language: Language }> = ({ contest, language }) => {
  const fr = language === 'fr';
  const closed = contest.daysRemaining <= 0 || ['closed', 'in_progress', 'results'].includes(contest.status);
  const stage = (contest.stage && contest.stage !== 'depot' ? contest.stage : null) as StepKey | null;
  // Suivi automatique : fiches emploi-public.ma uniquement (même identifiant de l'annonce aux résultats).
  const tracked = /emploi-public\.ma\/fr\/concours\/details\//.test(contest.officialSourceUrl || '');
  if (!stage && (!closed || !tracked)) return null;

  const docs = contest.documents || [];
  const reached = stage ? ORDER.indexOf(stage) : 0; // dépôt toujours franchi une fois clos
  const nextLabel = ORDER[reached + 1] ? LABEL[ORDER[reached + 1]][language] : null;

  return (
    <section className="bg-white rounded-2xl p-4 border border-[#F1E5EC] shadow-2xs animate-fade-in">
      <h3 className="text-sm font-extrabold text-[#242126] mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-[#8D174B]" />
        {fr ? 'Suivi du concours' : 'تتبع المباراة'}
      </h3>
      <ol className="relative space-y-3">
        {ORDER.map((k, idx) => {
          const done = idx <= reached;
          const doc = k === 'depot' ? null : docs.find((d) => d.docType === DOC_OF[k]);
          // Une liste intermédiaire peut ne pas être publiée en ligne (résultats directs).
          if (!done && idx > reached + 1) return null;
          return (
            <li key={k} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
              {done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-[#D9C9D2] shrink-0 mt-0.5 animate-pulse" />
              )}
              <div className="min-w-0 flex-1">
                <div className={`text-xs sm:text-sm font-bold ${done ? 'text-[#242126]' : 'text-[#9A93A0]'}`}>
                  {LABEL[k][language]}
                  {k === 'depot' && contest.deadlineDate && (
                    <span className="font-medium text-[#6E6773]"> · {fr ? `clos le ${contest.deadlineDate}` : `أغلق في ${contest.deadlineDate}`}</span>
                  )}
                </div>
                {doc && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8D174B] text-white text-[11px] font-bold hover:bg-[#70113B] hover:shadow-md active:scale-95 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {fr ? 'Voir la liste officielle (PDF)' : 'اللائحة الرسمية (PDF)'}
                  </a>
                )}
                {!done && (
                  <div className="text-[11px] text-[#9A93A0]">{fr ? 'Pas encore publiée' : 'لم تُنشر بعد'}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {nextLabel && (
        <p className="mt-3 text-[11px] text-[#6E6773] flex items-start gap-1.5">
          <Bell className="w-3.5 h-3.5 text-[#8D174B] shrink-0 mt-0.5" />
          {fr
            ? `KounKour vérifie chaque matin la publication de l’étape « ${nextLabel} ». Ajoutez ce concours à vos favoris pour être prévenu.`
            : `يتحقق KounKour كل صباح من نشر مرحلة « ${nextLabel} ». أضف هذه المباراة إلى المفضلة ليصلك إشعار.`}
        </p>
      )}
      <p className="mt-2 text-[10px] text-[#9A93A0]">
        {fr ? 'Source : emploi-public.ma. Seule la liste officielle fait foi.' : 'المصدر: emploi-public.ma. اللائحة الرسمية وحدها المعتمدة.'}
      </p>
    </section>
  );
};
