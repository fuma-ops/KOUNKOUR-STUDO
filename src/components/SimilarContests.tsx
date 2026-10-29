import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, Clock, Layers } from 'lucide-react';
import type { Contest, Language } from '../types';
import { OrgLogo } from './OrgLogo';

// « Concours similaires » en bas d'une fiche : concours encore ouverts du même organisme,
// du même grade ou du même domaine, pour ne pas quitter le site après une seule page.
const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ');
const STOP = new Set('de des du la le les et en au aux a l d un une pour poste postes grade echelle concours recrutement avis 1er 2e 3e 2eme 3eme 1 2 3 premier'.split(' '));
const words = (s: string) => new Set(norm(s).split(' ').filter((w) => w.length > 2 && !STOP.has(w)));

export function similarContests(c: Contest, all: Contest[], n = 4): Contest[] {
  const mine = words(`${c.title.fr} ${c.grade_fr || c.grade || ''} ${c.specialty?.fr || ''}`);
  const adm = c.administration?.id;
  return all
    .filter((x) => x.id !== c.id && (x.status === 'open' || x.status === 'closing_soon') && x.daysRemaining >= 0)
    .map((x) => {
      const w = words(`${x.title.fr} ${x.grade_fr || x.grade || ''} ${x.specialty?.fr || ''}`);
      let common = 0;
      for (const t of w) if (mine.has(t)) common++;
      const score = common * 2 + (adm && x.administration?.id === adm ? 3 : 0) + (x.region?.fr && x.region.fr === c.region?.fr ? 1 : 0);
      return { x, score };
    })
    .filter((r) => r.score >= 2)
    .sort((a, b) => b.score - a.score || a.x.daysRemaining - b.x.daysRemaining)
    .slice(0, n)
    .map((r) => r.x);
}

export const SimilarContests: React.FC<{ contest: Contest; all: Contest[]; language: Language; onOpen: (c: Contest) => void }> = ({ contest, all, language, onOpen }) => {
  const fr = language === 'fr';
  const list = useMemo(() => similarContests(contest, all), [contest, all]);
  if (!list.length) return null;
  const Arrow = fr ? ArrowRight : ArrowLeft;
  return (
    <section className="rounded-2xl border border-[#F1E5EC] bg-white p-4 animate-fade-in">
      <h3 className="text-sm font-extrabold text-[#242126] flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-[#8D174B]" />
        {fr ? 'Concours similaires encore ouverts' : 'مباريات مشابهة ما زالت مفتوحة'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {list.map((c, i) => (
          <a
            key={c.id}
            href={`/concours/${encodeURIComponent(c.slug)}`}
            onClick={(e) => {
              e.preventDefault();
              onOpen(c);
            }}
            className="flex items-center gap-2.5 rounded-xl border border-[#F1E5EC] hover:border-[#8D174B]/40 hover:shadow-md p-2.5 active:scale-95 transition-all animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="w-10 h-10 rounded-lg bg-[#FAF7F9] flex items-center justify-center shrink-0 overflow-hidden p-1">
              <OrgLogo src={c.administration?.logo || c.image} name={c.administration?.name?.[language] || c.administration?.name?.fr || ''} size="xs" />
            </span>
            <span className="flex-1 min-w-0">
              <span dir="auto" className="block text-[12.5px] font-bold text-[#242126] leading-snug line-clamp-2">
                {c.title[language] || c.title.fr}
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-[11px] text-[#6E6773]">
                <Clock className="w-3 h-3" />
                {c.daysRemaining === 0 ? (fr ? "Clôture aujourd'hui" : 'آخر أجل اليوم') : fr ? `${c.daysRemaining} j restants` : `${c.daysRemaining} يوم متبق`}
                {c.postsCount ? ` · ${c.postsCount} ${fr ? (c.postsCount > 1 ? 'postes' : 'poste') : 'منصب'}` : ''}
              </span>
            </span>
            <Arrow className="w-4 h-4 text-[#8D174B] shrink-0" />
          </a>
        ))}
      </div>
    </section>
  );
};
