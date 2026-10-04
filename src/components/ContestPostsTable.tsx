import React, { useMemo, useState } from 'react';
import { ContestPost, Language } from '../types';
import { MapPin, ChevronDown, AlertTriangle, Briefcase } from 'lucide-react';

// Postes d'un avis, regroupés par province, tels que lus dans l'arrêté.
// Un nombre illisible n'est jamais deviné : la note de l'analyse est affichée.
export const ContestPostsTable: React.FC<{ posts: ContestPost[]; language: Language }> = ({ posts, language }) => {
  const fr = language === 'fr';
  const groups = useMemo(() => {
    const map = new Map<string, ContestPost[]>();
    for (const p of posts) {
      const key = p.province || (fr ? 'Province non précisée' : 'إقليم غير محدد');
      map.set(key, [...(map.get(key) || []), p]);
    }
    return [...map.entries()];
  }, [posts, fr]);
  const [open, setOpen] = useState<string | null>(groups[0]?.[0] ?? null);
  if (!posts.length) return null;

  const total = posts.reduce((a, p) => a + (p.count || 0), 0);
  const unreadable = posts.filter((p) => p.count === null).length;

  return (
    <section className="bg-white rounded-2xl p-4 border border-[#F1E5EC] shadow-2xs animate-fade-in">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-extrabold text-[#242126] flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#8D174B]" />
          {fr ? 'Postes ouverts (détail de l’arrêté)' : 'المناصب المفتوحة (حسب القرار)'}
        </h3>
        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">
          {total} {fr ? 'postes lus' : 'منصب'}
        </span>
      </div>
      {unreadable > 0 && (
        <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {fr
            ? `${unreadable} ligne(s) au nombre illisible sur le document : vérifiez dans l’arrêté officiel.`
            : `${unreadable} سطر غير مقروء: راجع القرار الرسمي.`}
        </p>
      )}
      <div className="space-y-2">
        {groups.map(([province, rows]) => {
          const isOpen = open === province;
          const n = rows.reduce((a, p) => a + (p.count || 0), 0);
          return (
            <div key={province} className="border border-[#F1E5EC] rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : province)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-[#FAF7F9] hover:bg-[#FAF0F5] text-start active:scale-[0.99] transition-all cursor-pointer"
              >
                <span className="text-xs font-bold text-[#242126] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#8D174B]" />
                  {province}
                </span>
                <span className="flex items-center gap-2 text-[11px] text-[#6E6773]">
                  {n} {fr ? 'postes' : 'منصب'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {isOpen && (
                <ul className="divide-y divide-[#F1E5EC]">
                  {rows.map((p, i) => (
                    <li key={i} className="px-3 py-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0 text-xs">
                        {p.category && <div className="font-bold text-[#8D174B]">{p.category}</div>}
                        {p.specialty && <div className="text-[#242126]">{p.specialty}</div>}
                        {p.diploma && <div className="text-[11px] text-[#6E6773]">{p.diploma}</div>}
                      </div>
                      <div className="shrink-0 text-end">
                        {p.count !== null ? (
                          <span className="text-sm font-black text-emerald-800 font-mono">{p.count}</span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-1.5 py-0.5">
                            {p.note || (fr ? 'illisible' : 'غير مقروء')}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
