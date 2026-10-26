import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpenCheck, ExternalLink, FileText, Info } from 'lucide-react';
import type { Language, QcmSet } from '../types';
import { AnnaleImages } from './AnnaleImages';
import { AnnalePhotosAdmin } from './AnnalePhotosAdmin';
import { ConcoursRef } from './ConcoursRef';
import { layoutStatement } from '../utils/statementLayout';

// Texte d'un sujet écrit ou d'un corrigé (texte brut en base), mis en forme pour la lecture
// sur téléphone par src/utils/statementLayout.ts : questions numérotées, calculs ligne par
// ligne avec le résultat en valeur, libellés en gras, remarques encadrées. Le contenu n'est
// jamais modifié. Chaque ligne prend la direction de sa langue (sujets arabe / français).
const inline = (t: string) =>
  t.split(/(Non tranché|\[…\]|\[\.\.\.\])/g).map((part, i) =>
    /^(Non tranché|\[…\]|\[\.\.\.\])$/.test(part) ? (
      <span key={i} className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[0.85em] font-bold whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    )
  );

const Label: React.FC<{ text?: string }> = ({ text }) =>
  text ? <span className="font-extrabold text-[#242126]">{text} : </span> : null;

export const SujetStatement: React.FC<{ text: string }> = ({ text }) => (
  <div className="space-y-4 text-[15px] leading-[1.65] text-[#36303A] [font-variant-numeric:lining-nums_tabular-nums]">
    {layoutStatement(text).map((block, i) => {
      let inQuestion = false;
      return (
        <div key={i} className="space-y-2 animate-fade-in" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
          {block.map((seg, j) => {
            const indent = inQuestion ? 'sm:ps-9' : '';
            switch (seg.kind) {
              case 'h2':
                inQuestion = false;
                return (
                  <h3 key={j} dir="auto" className="text-base sm:text-lg font-extrabold text-[#8D174B] mt-5 mb-1 pb-1.5 border-b-2 border-[#F1E5EC]">
                    {seg.text}
                  </h3>
                );
              case 'h3':
                inQuestion = false;
                return (
                  <h4 key={j} dir="auto" className="text-[15px] font-extrabold text-[#242126] mt-4">
                    {seg.text}
                  </h4>
                );
              case 'question':
                inQuestion = true;
                return (
                  <div key={j} className="flex items-start gap-2.5 pt-3 first:pt-0">
                    <span className="w-6.5 h-6.5 min-w-[26px] min-h-[26px] rounded-full bg-[#8D174B] text-white text-xs font-black flex items-center justify-center mt-0.5">
                      {seg.num}
                    </span>
                    {seg.title && (
                      <span dir="auto" className="font-extrabold text-[#242126] leading-snug pt-0.5">
                        {seg.title}
                      </span>
                    )}
                  </div>
                );
              case 'calc':
                return (
                  <div key={j} className={indent}>
                    <div dir="ltr" className="rounded-xl bg-[#FAF7F9] border border-[#F1E5EC] border-s-4 border-s-[#8D174B]/40 px-3 py-2 overflow-x-auto">
                      {seg.label && <div className="text-[12px] font-extrabold text-[#6E6773] font-sans mb-0.5">{seg.label}</div>}
                      <span className="font-mono text-[14px] leading-relaxed text-[#242126] whitespace-pre-wrap break-words">{seg.before}</span>
                      {seg.result && (
                        <strong className="font-mono text-[14px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 whitespace-nowrap">
                          {seg.result}
                        </strong>
                      )}
                    </div>
                  </div>
                );
              case 'note':
                return (
                  <div key={j} className={indent}>
                    <p dir="auto" className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[14px] text-amber-950">
                      <span className="font-extrabold">{seg.label} : </span>
                      {inline(seg.text)}
                    </p>
                  </div>
                );
              case 'answer':
                return (
                  <p key={j} dir="ltr" className={`${indent} flex items-start gap-2 py-0.5`}>
                    <span className="font-mono text-[13px] font-bold text-[#6E6773] min-w-[2.6rem] pt-0.5">{seg.num}</span>
                    <span className="px-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-[14px] whitespace-nowrap">
                      {seg.letters}
                    </span>
                    {seg.text && <span className="min-w-0">{inline(seg.text)}</span>}
                  </p>
                );
              case 'bullet':
                return (
                  <p key={j} dir="auto" className={`${indent} flex gap-2`}>
                    <span className="text-[#8D174B] font-black shrink-0">•</span>
                    <span>{inline(seg.text)}</span>
                  </p>
                );
              default:
                return (
                  <p key={j} dir="auto" className={`${indent} whitespace-pre-wrap`}>
                    <Label text={seg.label} />
                    {inline(seg.text)}
                  </p>
                );
            }
          })}
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
  const [showCorrige, setShowCorrige] = useState(false);
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
          {set.kind === 'sujet'
            ? fr ? 'Sujet d’examen écrit (réel)' : 'موضوع امتحان كتابي (حقيقي)'
            : fr ? 'Sujet d’entraînement rédigé par KounKour (pas un sujet réel)' : 'موضوع تدريبي من إعداد KounKour (ليس موضوعاً حقيقياً)'}
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

      {set.corrige && (
        <section className="mt-4">
          {!showCorrige ? (
            <button
              onClick={() => setShowCorrige(true)}
              className="w-full py-3 px-4 rounded-2xl bg-[#8D174B] hover:bg-[#70113B] text-white shadow-sm active:scale-95 transition-all animate-card-breathe"
            >
              <span className="flex items-center justify-center gap-2 text-sm font-extrabold">
                <BookOpenCheck className="w-4 h-4 shrink-0" />
                {fr ? 'Voir le corrigé proposé' : 'عرض التصحيح المقترح'}
              </span>
              <span className="block text-[11px] font-semibold text-white/80 mt-0.5">
                {fr ? 'Traitez d’abord le sujet, puis comparez' : 'عالج الموضوع أولاً ثم قارن'}
              </span>
            </button>
          ) : (
            <article className="bg-white border-2 border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-xs animate-scale-in">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                  <BookOpenCheck className="w-3.5 h-3.5" />
                  {fr ? 'Corrigé proposé par l’équipe KounKour' : 'تصحيح مقترح من فريق KounKour'}
                </span>
                <button onClick={() => setShowCorrige(false)} className="text-[11px] font-bold text-[#8D174B] hover:underline">
                  {fr ? 'Masquer' : 'إخفاء'}
                </button>
              </div>
              <p className="text-[11px] text-[#6E6773] mb-3">
                {fr
                  ? 'Ce n’est pas un corrigé officiel : il a été rédigé par les administrateurs KounKour. Les points que la copie ne permet pas de trancher sont signalés.'
                  : 'ليس تصحيحاً رسمياً: حرره مشرفو KounKour.'}
              </p>
              <SujetStatement text={set.corrige} />
            </article>
          )}
        </section>
      )}

      <div className="mt-4 rounded-2xl bg-[#FAF7F9] border border-[#F1E5EC] p-4 text-[11px] text-[#6E6773] space-y-2">
        <p className="flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#8D174B] shrink-0 mt-0.5" />
          <span>
            {fr
              ? set.corrige
                ? 'Sujet transcrit mot pour mot depuis la copie publiée. Aucun corrigé officiel : le corrigé ci-dessus est proposé par l’équipe KounKour. Traitez d’abord le sujet dans les conditions de l’examen.'
                : 'Sujet transcrit mot pour mot depuis la copie publiée. Aucun corrigé officiel : entraînez-vous dans les conditions de l’examen.'
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
