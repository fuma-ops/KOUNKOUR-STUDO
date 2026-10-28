import React from 'react';
import { PSY_CSS, dominoHtml, dominoRow } from '../psy/render';
import type { DominoV } from '../psy/generators';

// Anciennes séries QCM enregistrées en texte : les figures écrites « [2|1] [3|3] … » (dominos)
// et « Ligne 1 : a – b – c / Ligne 2 : … » (matrices de nombres) sont redessinées à l'affichage.
// Le texte enregistré ne change pas (rendu serveur, correction).

let cssDone = false;
const ensureCss = () => {
  if (cssDone || typeof document === 'undefined') return;
  cssDone = true;
  const el = document.createElement('style');
  el.setAttribute('data-psy', '');
  el.textContent = PSY_CSS + '.psy-dom.psy-dom-h{width:calc(var(--w)*1.7);aspect-ratio:2/1;grid-template-rows:none;grid-template-columns:1fr 2px 1fr}.psy-dom-h>b{margin:14% 0}.qcm-fig .psy-dom-row{justify-content:flex-start}.qcm-mat{display:inline-grid;grid-template-columns:repeat(3,minmax(48px,64px));gap:6px}.qcm-mat span{height:48px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:#fff;border:2px solid #e5e0e8;font-weight:800;font-size:19px;color:#242126}.qcm-mat .q{border:2px dashed #8D174B;background:#FBF2F6;color:#8D174B}';
  document.head.appendChild(el);
};

const DOM = /\[([0-6?])\|([0-6?])\]/g;
const val = (a: string, b: string): DominoV | null => (a === '?' || b === '?' ? null : [Number(a), Number(b)]);

export function parseDominoSeries(text: string): { lead: string; seq: (DominoV | null)[] } | null {
  const m = text.match(/^([\s\S]*?)((?:\[[0-6?]\|[0-6?]\]\s*){3,})\??\s*$/);
  if (!m) return null;
  const seq = [...m[2].matchAll(DOM)].map((x) => val(x[1], x[2]));
  return { lead: m[1].trim().replace(/\s*:$/, ' :'), seq };
}
export function parseNumberMatrix(text: string): { lead: string; rows: string[][] } | null {
  const m = text.match(/^([\s\S]*?)Ligne 1\s*:\s*(.+?)\s*\/\s*Ligne 2\s*:\s*(.+?)\s*\/\s*Ligne 3\s*:\s*(.+?)\s*$/);
  if (!m) return null;
  const rows = [m[2], m[3], m[4]].map((r) => r.split(/\s+[–-]\s+/).map((x) => x.trim()));
  if (rows.some((r) => r.length !== 3)) return null;
  return { lead: m[1].trim(), rows };
}
export const hasQcmFigure = (text: string) => !!(parseDominoSeries(text) || parseNumberMatrix(text));

// Énoncé : texte d'introduction puis la figure.
export const QcmQuestionText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const dom = parseDominoSeries(text);
  const mat = dom ? null : parseNumberMatrix(text);
  if (!dom && !mat) return <span className={className}>{text}</span>;
  ensureCss();
  return (
    <span className="block">
      <span className={className}>{(dom || mat)!.lead}</span>
      <span className="sr-only"> {text}</span>
      {dom ? (
        <span className="qcm-fig block mt-3" aria-hidden="true" dangerouslySetInnerHTML={{ __html: dominoRow(dom.seq) }} />
      ) : (
        <span className="qcm-mat mt-3" aria-hidden="true">
          {mat!.rows.flat().map((x, i) => (
            <span key={i} className={x === '?' ? 'q' : ''}>
              {x}
            </span>
          ))}
        </span>
      )}
    </span>
  );
};

// Réponse : un domino « [5|4] » est dessiné à l'horizontale.
export const QcmOptionText: React.FC<{ text: string }> = ({ text }) => {
  const m = text.trim().match(/^\[([0-6])\|([0-6])\]$/);
  if (!m) return <>{text}</>;
  ensureCss();
  return (
    <span className="inline-flex items-center gap-3">
      <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: dominoHtml([Number(m[1]), Number(m[2])], ' psy-dom-h') }} />
      <span className="text-[12px] font-semibold text-[#8E8694] tabular-nums">
        {m[1]} | {m[2]}
      </span>
    </span>
  );
};
