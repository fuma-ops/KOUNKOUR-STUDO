import React, { useEffect, useState } from 'react';
import { BookOpenCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import type { Contest, Language } from '../types';
import { QcmFolder, fetchQcmFolders } from '../data/qcmApi';
import { prepFolderSlugsFor } from '../utils/prepMatch';

// Bloc « Se préparer » d'une fiche concours : dossiers d'annales et de corrigés du même
// métier ou du même grade (règles partagées avec le rendu serveur, src/utils/prepMatch.ts).

let foldersCache: Promise<QcmFolder[]> | null = null;

export const ContestPrepLinks: React.FC<{
  contest: Contest;
  language: Language;
  onOpenFolder?: (slug: string) => void;
  onOpenPrep?: () => void;
  onOpenPsy?: () => void;
}> = ({ contest, language, onOpenFolder, onOpenPrep, onOpenPsy }) => {
  const fr = language === 'fr';
  const [folders, setFolders] = useState<QcmFolder[]>([]);
  useEffect(() => {
    let alive = true;
    (foldersCache ||= fetchQcmFolders()).then((f) => alive && setFolders(f)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const slugs = prepFolderSlugsFor({
    title: contest.title.fr,
    grade: contest.grade_fr || contest.grade || '',
    admin: contest.administration?.name?.fr || '',
    specialty: [contest.specialty?.fr, ...(contest.specialtiesList || []), ...(contest.posts || []).map((p) => p.specialty || '')].filter(Boolean).join(' '),
  }, folders);
  const matched = slugs.map((s) => folders.find((f) => f.slug === s)).filter((f): f is QcmFolder => !!f);
  const Arrow = fr ? ArrowRight : ArrowLeft;
  const psyLink = onOpenPsy && (
    <button
      onClick={onOpenPsy}
      className="w-full text-start bg-white border border-[#F1E5EC] hover:border-[#8D174B]/40 hover:shadow-md rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 active:scale-95 transition-all"
    >
      <span className="min-w-0">
        <span className="block text-xs font-bold text-[#242126] truncate">{fr ? 'Tests psychotechniques interactifs' : 'اختبارات نفسية تقنية تفاعلية'}</span>
        <span className="block text-[11px] text-[#6E6773] truncate">{fr ? 'Matrices, dominos, cubes, logique : chronomètre et corrigés' : 'مصفوفات، دومينو، مكعبات (بالفرنسية)'}</span>
      </span>
      <Arrow className="w-4 h-4 text-[#8D174B] shrink-0" />
    </button>
  );
  if (!matched.length || !onOpenFolder) {
    // Pas encore de dossier pour ce métier : entraînement général gratuit plutôt qu'un bloc vide.
    if (!onOpenPrep && !onOpenPsy) return null;
    return (
      <section className="bg-gradient-to-r from-[#FAF0F5] to-[#FFFDFE] border border-[#F1E5EC] rounded-2xl p-4 animate-fade-in">
        <h3 className="text-sm font-extrabold text-[#242126] flex items-center gap-2 mb-1">
          <BookOpenCheck className="w-4 h-4 text-[#8D174B]" />
          {fr ? 'Se préparer gratuitement' : 'تحضّر مجاناً'}
        </h3>
        <p className="text-[11px] text-[#6E6773] mb-3">
          {fr ? 'Annales corrigées et QCM d’entraînement par métier, tests psychotechniques.' : 'نماذج مصححة وتمارين حسب المهنة، واختبارات نفسية تقنية.'}
        </p>
        <div className="flex flex-col gap-2">
          {onOpenPrep && (
            <button
              onClick={onOpenPrep}
              className="w-full text-start bg-white border border-[#F1E5EC] hover:border-[#8D174B]/40 hover:shadow-md rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 active:scale-95 transition-all"
            >
              <span className="min-w-0">
                <span className="block text-xs font-bold text-[#242126] truncate">{fr ? 'Toutes les préparations par métier' : 'كل التحضيرات حسب المهنة'}</span>
                <span className="block text-[11px] text-[#6E6773] truncate">{fr ? 'Recherche par métier, organisme ou concours' : 'البحث حسب المهنة أو المؤسسة'}</span>
              </span>
              <Arrow className="w-4 h-4 text-[#8D174B] shrink-0" />
            </button>
          )}
          {psyLink}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-r from-[#FAF0F5] to-[#FFFDFE] border border-[#F1E5EC] rounded-2xl p-4 animate-fade-in">
      <h3 className="text-sm font-extrabold text-[#242126] flex items-center gap-2 mb-1">
        <BookOpenCheck className="w-4 h-4 text-[#8D174B]" />
        {fr ? 'Se préparer à ce concours' : 'التحضير لهذه المباراة'}
      </h3>
      <p className="text-[11px] text-[#6E6773] mb-3">
        {fr ? 'Annales réelles du même métier, avec corrigés proposés par l’équipe KounKour.' : 'نماذج حقيقية لنفس المهنة مع تصحيحات مقترحة من فريق KounKour.'}
      </p>
      <div className="flex flex-col gap-2">
        {matched.map((f) => (
          <button
            key={f.slug}
            onClick={() => onOpenFolder(f.slug)}
            className="w-full text-start bg-white border border-[#F1E5EC] hover:border-[#8D174B]/40 hover:shadow-md rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 active:scale-95 transition-all"
          >
            <span className="min-w-0">
              <span dir="auto" className="block text-xs font-bold text-[#242126] truncate">{f.title[language] || f.title.fr}</span>
              {f.organization && <span className="block text-[11px] text-[#6E6773] truncate">{f.organization}</span>}
            </span>
            <Arrow className="w-4 h-4 text-[#8D174B] shrink-0" />
          </button>
        ))}
        {psyLink}
      </div>
    </section>
  );
};
