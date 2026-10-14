import React from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, FileText, Info } from 'lucide-react';
import type { Language, QcmSet } from '../types';
import { AnnaleImages } from './AnnaleImages';
import { AnnalePhotosAdmin } from './AnnalePhotosAdmin';
import { ConcoursRef } from './ConcoursRef';

// Texte d'un sujet écrit transcrit : « ## » / « ### » = titres, ligne vide = paragraphe.
// Chaque bloc prend la direction de sa langue (sujets bilingues arabe / français).
export const SujetStatement: React.FC<{ text: string }> = ({ text }) => (
  <div className="space-y-3">
    {text.split(/\n\s*\n/).map((block, i) => {
      const lines = block.trim().split('\n');
      const h = /^(#{2,3})\s+(.*)$/.exec(lines[0]);
      const body = (h ? lines.slice(1) : lines).join('\n').trim();
      return (
        <div key={i} className="animate-fade-in" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
          {h &&
            (h[1] === '##' ? (
              <h3 dir="auto" className="text-sm sm:text-base font-extrabold text-[#8D174B] mt-4 mb-1.5 pb-1 border-b border-[#F1E5EC]">
                {h[2]}
              </h3>
            ) : (
              <h4 dir="auto" className="text-[13px] sm:text-sm font-extrabold text-[#242126] mt-3 mb-1">
                {h[2]}
              </h4>
            ))}
          {body && (
            // Une ligne = une direction : les sujets mêlent arabe et français dans un même bloc.
            <div className="text-[13px] sm:text-sm text-[#36303A] leading-relaxed">
              {body.split('\n').map((line, j) => (
                <p key={j} dir="auto" className="whitespace-pre-wrap">
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

interface Props {
  set: QcmSet;
  language: Language;
  isStaff: boolean;
  onBack: () => void;
  onImages: (images: string[]) => void;
}

// Écran d'un sujet d'examen écrit (pas de QCM) : sujet transcrit + photos de la copie originale.
export const SujetView: React.FC<Props> = ({ set, language, isStaff, onBack, onImages }) => {
  const fr = language === 'fr';
  const PrevIcon = fr ? ArrowLeft : ArrowRight;
  const duration = set.durationMinutes
    ? set.durationMinutes % 60 === 0
      ? `${set.durationMinutes / 60} h`
      : `${set.durationMinutes} min`
    : null;
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28 md:pb-10 animate-fade-in">
      <button
        onClick={onBack}
        className="mb-4 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF4F7] text-[#8D174B] border border-[#8D174B]/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
      >
        <PrevIcon className="w-4 h-4" />
        {fr ? 'Retour au dossier' : 'الرجوع إلى الملف'}
      </button>

      <header className="bg-gradient-to-r from-[#FAF0F5] via-[#FFFDFE] to-[#FDF2F7] rounded-3xl border border-[#F1E5EC] p-5 mb-4">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-900 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-md mb-2">
          <FileText className="w-3.5 h-3.5" />
          {fr ? 'Sujet d’examen écrit (réel)' : 'موضوع امتحان كتابي (حقيقي)'}
        </span>
        <h2 dir="auto" className="text-lg sm:text-xl font-extrabold text-[#242126] leading-snug mb-3">{set.title[language] || set.title.fr}</h2>
        <ConcoursRef set={set} language={language} variant="header" />
        {duration && <p className="text-[11px] font-semibold text-[#8D174B]">{fr ? `Durée de l'épreuve : ${duration}` : `مدة الاختبار: ${duration}`}</p>}
      </header>

      {(!!set.sourceImages?.length || isStaff) && (
        <div className="mb-4 space-y-2">
          {!!set.sourceImages?.length && (
            <AnnaleImages images={set.sourceImages} language={language} sourceUrl={set.sourceUrl} sourceNote={set.sourceNote} />
          )}
          {isStaff && <AnnalePhotosAdmin setId={set.id} slug={set.slug} images={set.sourceImages || []} onChange={onImages} sourceUrl={set.sourceUrl} />}
        </div>
      )}

      <article className="bg-white border border-[#F1E5EC] rounded-3xl p-5 sm:p-6 shadow-xs">
        <SujetStatement text={set.statement || ''} />
      </article>

      <div className="mt-4 rounded-2xl bg-[#FAF7F9] border border-[#F1E5EC] p-4 text-[11px] text-[#6E6773] space-y-2">
        <p className="flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#8D174B] shrink-0 mt-0.5" />
          <span>
            {fr
              ? 'Sujet transcrit mot pour mot depuis la copie publiée. Aucun corrigé officiel : entraînez-vous dans les conditions de l’examen.'
              : 'موضوع منقول حرفياً من النسخة المنشورة. لا يوجد تصحيح رسمي: تدرب في ظروف الامتحان.'}
          </span>
        </p>
        {set.sourceNote && <p dir="auto">{set.sourceNote}</p>}
        {set.sourceUrl && (
          <a href={set.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[#8D174B] hover:underline">
            <ExternalLink className="w-3.5 h-3.5" />
            {fr ? 'Page d’origine du sujet' : 'الصفحة الأصلية للموضوع'}
          </a>
        )}
      </div>
    </div>
  );
};
