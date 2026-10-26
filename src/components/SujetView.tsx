import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpenCheck, ExternalLink, FileText, Info } from 'lucide-react';
import type { Language, QcmSet } from '../types';
import { AnnaleImages } from './AnnaleImages';
import { AnnalePhotosAdmin } from './AnnalePhotosAdmin';
import { ConcoursRef } from './ConcoursRef';
import { isArabic, layoutStatement } from '../utils/statementLayout';

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

type Seg = ReturnType<typeof layoutStatement>[number][number];
// « 10 697 000 » ne doit jamais être coupé en fin de ligne : espace fine insécable entre les groupes de chiffres.
const nb = (t: string) => t.replace(/(\d) (?=\d{3}(?!\d))/g, '$1\u202F');
// Une carte = une question et tout ce qui la suit (choix, calculs, tableaux) jusqu'à la suivante.
type Item = { kind: 'seg'; seg: Seg } | { kind: 'card'; head: Extract<Seg, { kind: 'question' }>; body: Seg[] } | { kind: 'answers'; rows: Extract<Seg, { kind: 'answer' }>[] };

function group(blocks: Seg[][]): Item[] {
  const items: Item[] = [];
  let card: Extract<Item, { kind: 'card' }> | null = null;
  blocks.forEach((block) => {
    block.forEach((seg, j) => {
      if (seg.kind === 'question') {
        card = { kind: 'card', head: seg, body: [] };
        items.push(card);
      } else if (seg.kind === 'answer') {
        card = null;
        const last = items[items.length - 1];
        if (last?.kind === 'answers') last.rows.push(seg);
        else items.push({ kind: 'answers', rows: [seg] });
      } else if (seg.kind === 'h2' || seg.kind === 'h3' || seg.kind === 'header') {
        card = null;
        items.push({ kind: 'seg', seg });
      } else if (card && (j > 0 || seg.kind === 'option' || seg.kind === 'table' || seg.kind === 'calc')) {
        // Un paragraphe isolé après une ligne vide ouvre une nouvelle partie : il sort de la carte.
        card.body.push(seg);
      } else {
        card = null;
        items.push({ kind: 'seg', seg });
      }
    });
  });
  return items;
}

const Table: React.FC<{ rows: string[][] }> = ({ rows }) => (
  <div className="overflow-x-auto rounded-xl border border-[#E9DCE4]">
    <table className="min-w-full text-[13px] border-collapse">
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={i === 0 ? 'bg-[#8D174B]/[0.07]' : i % 2 ? 'bg-white' : 'bg-[#FAF7F9]'}>
            {r.map((c, k) => (
              <td key={k} dir="auto" className={`px-2.5 py-1.5 border-b border-[#F1E5EC] whitespace-nowrap ${i === 0 || k === 0 ? 'font-bold text-[#242126]' : 'text-[#36303A]'} ${c === '…' ? 'text-[#B5A9B1]' : ''}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Options: React.FC<{ opts: Extract<Seg, { kind: 'option' }>[] }> = ({ opts }) => {
  const short = opts.every((o) => o.text.length <= 48);
  return (
    <div dir={opts.some((o) => isArabic(o.text)) ? 'rtl' : undefined} className={`grid gap-2 ${short ? 'sm:grid-cols-2' : ''}`}>
      {opts.map((o, i) => (
        <div key={i} className="flex items-start gap-2.5 rounded-xl border border-[#EADCE5] bg-[#FDFAFC] px-3 py-2 hover:border-[#8D174B]/40 hover:shadow-xs transition-all">
          <span className="w-6 h-6 min-w-[24px] rounded-full border-2 border-[#8D174B] text-[#8D174B] text-[12px] font-black flex items-center justify-center mt-px">{o.letter}</span>
          <span dir="auto" className="text-[14.5px] leading-snug text-[#242126] pt-0.5">{inline(o.text)}</span>
        </div>
      ))}
    </div>
  );
};

function SegView({ seg }: { seg: Seg }) {
  switch (seg.kind) {
    case 'header':
      return (
        <div className="text-center rounded-2xl bg-gradient-to-br from-[#FDF2F7] to-white border border-[#F1E5EC] px-4 py-4 space-y-1">
          {seg.lines.map((l, i) => (
            <p key={i} dir="auto" className={i === 0 ? 'text-[15px] font-extrabold text-[#8D174B]' : i === 1 ? 'text-[15px] font-bold text-[#242126]' : 'text-[12.5px] text-[#6E6773] italic'}>
              {l}
            </p>
          ))}
        </div>
      );
    case 'h2': {
      const pts = /\s*\((\d+(?:[,.]\d+)?\s*pts?|\d+(?:[,.]\d+)?\s*points?)\)\s*$/i.exec(seg.text);
      const title = pts ? seg.text.slice(0, pts.index) : seg.text;
      return (
        <h3 dir="auto" className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl bg-[#8D174B] text-white px-4 py-2.5 text-[15px] sm:text-base font-extrabold shadow-sm">
          <span className="flex-1 min-w-0">{title}</span>
          {pts && <span className="shrink-0 rounded-lg bg-white/20 px-2 py-0.5 text-[12px] font-bold">{pts[1]}</span>}
        </h3>
      );
    }
    case 'h3':
      return (
        <h4 dir="auto" className="mt-4 text-[15px] font-extrabold text-[#8D174B] border-s-4 border-[#8D174B] ps-2.5">
          {seg.text}
        </h4>
      );
    case 'calc':
      return (
        <div dir="ltr" className="rounded-xl bg-[#FAF7F9] border border-[#F1E5EC] border-s-4 border-s-[#8D174B]/40 px-3 py-2 overflow-x-auto">
          {seg.label && <div className="text-[12px] font-extrabold text-[#6E6773] font-sans mb-0.5">{seg.label}</div>}
          <span className="text-[14.5px] leading-relaxed text-[#242126] whitespace-pre-wrap">{nb(seg.before)}</span>
          {seg.result && (
            <strong className="text-[14.5px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 whitespace-nowrap">{nb(seg.result)}</strong>
          )}
        </div>
      );
    case 'note':
      return (
        <p dir="auto" className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[14px] text-amber-950">
          <span className="font-extrabold">{seg.label} : </span>
          {inline(seg.text)}
        </p>
      );
    case 'table':
      return <Table rows={seg.rows} />;
    case 'option':
      return <Options opts={[seg]} />;
    case 'answer':
      return null;
    case 'bullet':
      return (
        <p dir="auto" className="flex gap-2">
          <span className="text-[#8D174B] font-black shrink-0">•</span>
          <span>{inline(seg.text)}</span>
        </p>
      );
    case 'question':
      return null;
    default:
      return (
        <p dir="auto" className="whitespace-pre-wrap">
          <Label text={seg.label} />
          {inline(seg.text)}
        </p>
      );
  }
}

// Suite de segments : les choix consécutifs sont regroupés dans une même grille.
const Segs: React.FC<{ segs: Seg[] }> = ({ segs }) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    if (seg.kind === 'option') {
      const opts: Extract<Seg, { kind: 'option' }>[] = [];
      while (i < segs.length && segs[i].kind === 'option') opts.push(segs[i++] as Extract<Seg, { kind: 'option' }>);
      i--;
      out.push(<Options key={i} opts={opts} />);
    } else out.push(<SegView key={i} seg={seg} />);
  }
  return <>{out}</>;
};

export const SujetStatement: React.FC<{ text: string; header?: boolean }> = ({ text, header }) => (
  <div className="space-y-3.5 text-[15px] leading-[1.65] text-[#36303A] [font-variant-numeric:lining-nums_tabular-nums]">
    {group(layoutStatement(text, { header })).map((item, i) => {
      const anim = { animationDelay: `${Math.min(i, 10) * 40}ms` };
      if (item.kind === 'card') {
        return (
          <section key={i} dir={isArabic(item.head.title) ? 'rtl' : undefined} className="rounded-2xl border border-[#EADCE5] bg-white shadow-xs p-3 sm:p-4 space-y-2.5 animate-fade-in" style={anim}>
            {item.head.title ? (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="min-w-[28px] h-7 px-1.5 rounded-full bg-[#8D174B] text-white text-[13px] font-black flex items-center justify-center shrink-0">{item.head.num}</span>
                  <p dir="auto" className={`text-[#242126] text-[15px] leading-snug pt-0.5 ${item.head.title.length > 110 ? 'font-semibold' : 'font-bold'}`}>
                    {inline(item.head.title)}
                  </p>
                </div>
                {item.body.length > 0 && (
                  <div className="space-y-2 sm:ps-[38px]">
                    <Segs segs={item.body} />
                  </div>
                )}
              </>
            ) : (
              // Question sans intitulé (ligne de corrigé, calcul) : le numéro reste à côté du contenu.
              <div className="flex items-start gap-2.5">
                <span className="min-w-[28px] h-7 px-1.5 rounded-full bg-[#8D174B] text-white text-[13px] font-black flex items-center justify-center shrink-0 mt-1">{item.head.num}</span>
                <div className="min-w-0 flex-1 space-y-2">
                  <Segs segs={item.body} />
                </div>
              </div>
            )}
          </section>
        );
      }
      if (item.kind === 'answers') {
        return (
          <section key={i} className="rounded-2xl border border-emerald-200 bg-white shadow-xs divide-y divide-emerald-100 animate-fade-in" style={anim}>
            {item.rows.map((a, k) => (
              <div key={k} dir={isArabic(a.text) ? 'rtl' : undefined} className="flex items-start gap-2.5 px-3.5 py-2.5">
                <span className="min-w-[2.4rem] font-mono text-[13px] font-bold text-[#6E6773] pt-1">{a.num}</span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-[14px] whitespace-nowrap shrink-0">{a.letters}</span>
                <div className="min-w-0 pt-0.5">
                  {a.text && <span dir="auto" className="text-[14.5px] text-[#242126]">{inline(a.text)}</span>}
                  {a.src && <span className="ms-1.5 inline-block rounded-md bg-[#F4EEF2] px-1.5 text-[11px] font-semibold text-[#6E6773]">{a.src}</span>}
                </div>
              </div>
            ))}
          </section>
        );
      }
      return (
        <div key={i} className="animate-fade-in" style={anim}>
          <SegView seg={item.seg} />
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

      <article className="bg-[#FCF8FA] border border-[#F1E5EC] rounded-3xl p-3.5 sm:p-6 shadow-xs">
        <SujetStatement text={set.statement || ''} header />
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
            {set.kind !== 'sujet'
              ? fr
                ? 'Sujet d’entraînement rédigé par l’équipe KounKour, ce n’est pas un sujet de concours réel. Traitez-le dans les conditions de l’examen, puis comparez avec le corrigé.'
                : 'موضوع تدريبي من إعداد فريق KounKour، وليس موضوع مباراة حقيقياً.'
              : fr
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
