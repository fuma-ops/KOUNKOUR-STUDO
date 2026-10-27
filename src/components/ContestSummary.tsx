import React from 'react';
import { Award, CalendarDays, FileCheck2, GraduationCap, Info, ListChecks, Send, UserCheck } from 'lucide-react';

// Résumé d'un concours lu dans l'arrêté (texte en base : « Postes : … Diplôme : … Conditions : … »),
// présenté en rubriques titrées et en puces : plus de bloc de texte continu sur téléphone.
// Le texte n'est jamais modifié, seulement découpé. Sans rubrique reconnue, il reste un paragraphe.

const SECTIONS: { key: string; label: string; icon: React.ElementType }[] = [
  { key: 'Postes', label: 'Postes', icon: ListChecks },
  { key: 'Diplôme', label: 'Diplôme', icon: GraduationCap },
  { key: 'Conditions', label: 'Conditions', icon: UserCheck },
  { key: 'Âge', label: 'Âge', icon: UserCheck },
  { key: 'Épreuves', label: 'Épreuves', icon: Award },
  { key: 'Candidature', label: 'Candidature', icon: Send },
  { key: 'Pièces', label: 'Pièces du dossier', icon: FileCheck2 },
  { key: 'Date du concours', label: 'Date du concours', icon: CalendarDays },
];
const RE = new RegExp(`(?:^|\\.\\s+)(${SECTIONS.map((s) => s.key).join('|')}) : `, 'g');

export function splitSummary(text: string): { intro: string; parts: { key: string; body: string }[]; note: string } {
  const hits = [...text.matchAll(RE)];
  if (!hits.length) return { intro: text, parts: [], note: '' };
  const intro = text.slice(0, hits[0].index).trim();
  const parts = hits.map((m, i) => {
    const start = (m.index || 0) + m[0].length;
    const end = i + 1 < hits.length ? hits[i + 1].index || text.length : text.length;
    return { key: m[1], body: text.slice(start, end).trim().replace(/\.$/, '') };
  });
  // La dernière rubrique peut être suivie d'une note libre (« Date et lieu communiqués… ») : on la sépare
  // à la première fin de phrase suivie d'une majuscule.
  let note = '';
  const last = parts[parts.length - 1];
  const cut = /^(.+?)\.\s+(?=[A-ZÉÈÀÂÎÔ])([\s\S]+)$/.exec(last.body);
  if (cut) {
    last.body = cut[1];
    note = cut[2];
  }
  return { intro, parts, note };
}

// Une rubrique devient une liste quand elle énumère (« ; », ou beaucoup de virgules pour les pièces).
const items = (key: string, body: string) => {
  let list = body.split(/\s*;\s*/).filter(Boolean);
  if (list.length < 2 && key === 'Pièces' && (body.match(/,/g) || []).length >= 3) list = body.split(/,\s+(?![^()]*\))/);
  return list.map((x) => x.trim().replace(/\.$/, ''));
};

export const ContestSummary: React.FC<{ text: string; hidePostes?: boolean }> = ({ text, hidePostes }) => {
  const { intro, parts, note } = splitSummary(text);
  if (!parts.length) {
    return <p dir="auto" className="text-[13.5px] text-[#4A4250] leading-relaxed">{text}</p>;
  }
  return (
    <div className="space-y-3">
      {intro && !/ recrute : /.test(intro) && <p dir="auto" className="text-[13.5px] text-[#4A4250] leading-relaxed">{intro}</p>}
      {parts
        .filter((p) => !(hidePostes && p.key === 'Postes'))
        .map((p, i) => {
          const s = SECTIONS.find((x) => x.key === p.key)!;
          const Icon = s.icon;
          const list = items(p.key, p.body);
          return (
            <section key={i} className="rounded-2xl border border-[#F1E5EC] bg-[#FDFAFC] p-3 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <h4 className="flex items-center gap-2 text-[13px] font-extrabold text-[#8D174B] mb-1.5">
                <Icon className="w-4 h-4 shrink-0" />
                {s.label}
              </h4>
              {list.length > 1 ? (
                <ul className="space-y-1.5">
                  {list.map((x, k) => (
                    <li key={k} dir="auto" className="flex gap-2 text-[13.5px] leading-snug text-[#2E2833]">
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#8D174B] shrink-0" />
                      <span className="min-w-0">{x}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p dir="auto" className="text-[13.5px] leading-snug text-[#2E2833] font-semibold">{p.body}</p>
              )}
            </section>
          );
        })}
      {note && (
        <p dir="auto" className="flex gap-2 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-[13px] leading-snug text-amber-950">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{note}</span>
        </p>
      )}
    </div>
  );
};
