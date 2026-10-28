import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Brain, Briefcase, Building2, CalendarClock, Cpu, FolderOpen, GraduationCap, HardHat, HeartPulse, PlayCircle, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { Contest, Language, QcmSet } from '../types';
import type { QcmFolder } from '../data/qcmApi';
import { prepFolderSlugsFor } from '../utils/prepMatch';
import { gaEvent } from '../lib/analytics';

// Accueil de la préparation : un candidat doit trouver SON concours en quelques secondes,
// sans parcourir de grandes cartes : recherche (métier, organisme, concours ouvert),
// familles de métiers, « Reprendre » et, sur ordinateur, les concours ouverts à préparer.

type Fam = 'securite' | 'sante' | 'technicien' | 'ingenieur' | 'administration' | 'entreprises' | 'tests' | 'autres';
const FAMILIES: { id: Fam; fr: string; ar: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'securite', fr: 'Police et sécurité', ar: 'الأمن والشرطة', Icon: ShieldCheck },
  { id: 'sante', fr: 'Santé', ar: 'الصحة', Icon: HeartPulse },
  { id: 'technicien', fr: 'Techniciens', ar: 'التقنيون', Icon: HardHat },
  { id: 'ingenieur', fr: 'Ingénieurs et informatique', ar: 'المهندسون والمعلوميات', Icon: Cpu },
  { id: 'administration', fr: 'Administration et gestion', ar: 'الإدارة والتدبير', Icon: Briefcase },
  { id: 'entreprises', fr: 'Offices et entreprises publiques', ar: 'المكاتب والمقاولات العمومية', Icon: Building2 },
  { id: 'tests', fr: 'Tests psychotechniques', ar: 'الاختبارات النفسية التقنية', Icon: Brain },
  { id: 'autres', fr: 'Autres', ar: 'أخرى', Icon: FolderOpen },
];

export function familyOf(slug: string): Fam {
  if (/psycho|psychometric/.test(slug)) return 'tests';
  if (/dgsn|police|gendarm|protection-civile|far-/.test(slug)) return 'securite';
  if (/sante|infirm|chu|residanat|medecin/.test(slug)) return 'sante';
  if (/srm|onee|agences-urbaines|teleconseiller|oncf|ocp/.test(slug)) return 'entreprises';
  if (/ingenieur|informatique/.test(slug)) return 'ingenieur';
  if (/technicien|mecanique|genie-civil/.test(slug)) return 'technicien';
  if (/administrat|comptab|cadres|gestion/.test(slug)) return 'administration';
  return 'autres';
}

const norm = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9؀-ۿ]+/g, ' ')
    .trim();

export interface PrepFolderRow {
  f: QcmFolder;
  sets: QcmSet[];
  stats: { total: number; seen: number; pct: number };
}

interface Props {
  rows: PrepFolderRow[];
  language: Language;
  loading: boolean;
  contests: Contest[];
  folders: QcmFolder[];
  onOpen: (slug: string) => void;
}

export const PrepHome: React.FC<Props> = ({ rows, language, loading, contests, folders, onOpen }) => {
  const fr = language === 'fr';
  const Next = fr ? ArrowRight : ArrowLeft;
  const [q, setQ] = useState('');
  const [fam, setFam] = useState<Fam | null>(null);

  // Concours ouverts reliés à un dossier (mêmes règles que les fiches concours).
  const openWithPrep = useMemo(() => {
    const terms = folders.map((f) => ({ slug: f.slug, matchTerms: f.matchTerms }));
    const has = new Set(rows.map((r) => r.f.slug));
    return contests
      .filter((c) => (c.status === 'open' || c.status === 'closing_soon') && c.daysRemaining >= 0)
      .map((c) => ({
        c,
        slugs: prepFolderSlugsFor(
          {
            title: c.title.fr,
            grade: c.grade_fr || c.grade || '',
            admin: c.administration?.name?.fr || '',
            specialty: [c.specialty?.fr, ...(c.specialtiesList || []), ...(c.posts || []).map((p) => p.specialty || '')].filter(Boolean).join(' '),
          },
          terms,
        ).filter((s) => has.has(s) && familyOf(s) !== 'tests'),
      }))
      .filter((x) => x.slugs.length);
  }, [contests, folders, rows]);

  const nq = norm(q);
  const words = nq.split(' ').filter((w) => w.length >= 2);
  const hay = (r: PrepFolderRow) =>
    norm([r.f.title.fr, r.f.title.ar, r.f.organization, r.f.description.fr, ...(r.f.matchTerms || []), ...r.sets.flatMap((s) => [s.title.fr, s.concoursLabel || '', s.orgName || ''])].join(' '));
  const matchesQ = (r: PrepFolderRow) => !words.length || words.every((w) => hay(r).includes(w));
  const contestHits = words.length
    ? openWithPrep.filter((x) => words.every((w) => norm(`${x.c.title.fr} ${x.c.administration?.name?.fr || ''}`).includes(w))).slice(0, 5)
    : [];
  // Un concours ouvert trouvé fait aussi apparaître son dossier.
  const viaContests = new Set(contestHits.flatMap((x) => x.slugs));
  const shown = rows.filter((r) => (matchesQ(r) || viaContests.has(r.f.slug)) && (!fam || familyOf(r.f.slug) === fam));
  const counts = FAMILIES.map((x) => ({ ...x, n: rows.filter((r) => familyOf(r.f.slug) === x.id && matchesQ(r)).length })).filter((x) => x.n > 0);
  const started = rows.filter((r) => r.stats.seen > 0).sort((a, b) => b.stats.pct - a.stats.pct).slice(0, 3);
  const openCount = (slug: string) => openWithPrep.filter((x) => x.slugs.includes(slug)).length;
  const topOpen = [...openWithPrep].sort((a, b) => (b.c.postsCount || 0) - (a.c.postsCount || 0)).slice(0, 6);

  const open = (slug: string, where: string) => {
    gaEvent('prep_open_folder', { folder: slug, where });
    onOpen(slug);
  };

  const card = (r: PrepFolderRow, i: number) => {
    const annales = r.sets.filter((x) => x.kind === 'annales' || x.kind === 'sujet').length;
    const n = openCount(r.f.slug);
    return (
      <button
        key={r.f.slug}
        type="button"
        onClick={() => open(r.f.slug, 'liste')}
        className="w-full text-start flex items-center gap-3 bg-white border border-[#F1E5EC] hover:border-[#8D174B]/40 rounded-2xl p-3 hover:shadow-md hover-scale active:scale-95 transition-all cursor-pointer animate-fade-in"
        style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}
      >
        {r.f.coverImage ? (
          <img src={r.f.coverImage} alt="" loading="lazy" className="w-14 h-14 rounded-xl object-cover shrink-0" />
        ) : (
          <span className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center shrink-0">
            {React.createElement(FAMILIES.find((x) => x.id === familyOf(r.f.slug))!.Icon, { className: 'w-6 h-6' })}
          </span>
        )}
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-extrabold text-[#242126] leading-snug line-clamp-2">{r.f.title[language] || r.f.title.fr}</span>
          <span className="block text-[11px] text-[#8E8694] truncate">{r.f.organization}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1 text-[10.5px] font-bold">
            {annales > 0 && <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800">{annales} {fr ? (annales > 1 ? 'annales réelles' : 'annale réelle') : 'نموذج حقيقي'}</span>}
            {r.stats.total > 0 ? (
              <span className="px-1.5 py-0.5 rounded bg-[#FDF2F7] text-[#8D174B]">{r.stats.total} {fr ? 'questions' : 'سؤال'}</span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-[#FDF2F7] text-[#8D174B]">{r.sets.length} {fr ? (r.sets.length > 1 ? 'sujets' : 'sujet') : 'موضوع'}</span>
            )}
            {n > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">{n} {fr ? (n > 1 ? 'concours ouverts' : 'concours ouvert') : 'مباراة مفتوحة'}</span>}
          </span>
          {r.stats.seen > 0 && (
            <span className="mt-1.5 block h-1 rounded-full bg-[#F1E5EC] overflow-hidden">
              <span className="block h-full bg-[#8D174B] transition-all duration-700" style={{ width: `${r.stats.pct}%` }} />
            </span>
          )}
        </span>
        <Next className="w-4 h-4 text-[#8D174B] shrink-0" />
      </button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-5 animate-fade-in">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#242126] flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-[#8D174B]" />
          {fr ? 'Préparer mon concours' : 'التحضير لمباراتي'}
        </h2>
        <p className="text-xs sm:text-sm text-[#6E6773] mt-1">
          {fr ? 'Annales réelles, QCM corrigés et votre progression, par métier.' : 'نماذج حقيقية وتمارين مصححة وتقدمك، حسب المهنة.'}
        </p>
      </div>

      {/* Recherche : métier, organisme ou concours ouvert */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-[#FFFDFE]/95 backdrop-blur-sm">
        <label className="relative block">
          <Search className={`absolute top-1/2 -translate-y-1/2 ${fr ? 'left-4' : 'right-4'} w-5 h-5 text-[#8D174B]`} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={fr ? 'Quel concours ? ex. infirmier, gardien de la paix, ONCF, comptable…' : 'أي مباراة؟ مثلا: ممرض، حارس الأمن، تقني…'}
            className={`w-full rounded-2xl border-2 border-[#8D174B]/20 focus:border-[#8D174B] bg-white py-3.5 ${fr ? 'pl-12 pr-10' : 'pr-12 pl-10'} text-[14px] outline-none shadow-sm`}
          />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label={fr ? 'Effacer' : 'مسح'} className={`absolute top-1/2 -translate-y-1/2 ${fr ? 'right-3' : 'left-3'} p-1 rounded-full hover:bg-[#FAF4F7] cursor-pointer`}>
              <X className="w-4 h-4 text-[#6E6773]" />
            </button>
          )}
        </label>
        {/* Familles de métiers */}
        <div className="mt-2.5 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button type="button" onClick={() => setFam(null)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-bold cursor-pointer active:scale-95 ${!fam ? 'bg-[#8D174B] text-white border-[#8D174B]' : 'bg-white text-[#4A4250] border-[#F1E5EC]'}`}>
            {fr ? 'Tous' : 'الكل'}
          </button>
          {counts.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setFam(fam === x.id ? null : x.id)}
              className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-bold cursor-pointer active:scale-95 ${fam === x.id ? 'bg-[#8D174B] text-white border-[#8D174B]' : 'bg-white text-[#4A4250] border-[#F1E5EC]'}`}
            >
              <x.Icon className="w-3.5 h-3.5" />
              {fr ? x.fr : x.ar}
              <span className={`text-[10px] ${fam === x.id ? 'text-white/80' : 'text-[#8E8694]'}`}>{x.n}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-4">
        <div className="lg:col-span-3 space-y-5">
          {/* Reprendre */}
          {!q && !fam && started.length > 0 && (
            <section className="animate-fade-in">
              <h3 className="text-[13px] font-extrabold text-[#242126] mb-2 flex items-center gap-1.5">
                <PlayCircle className="w-4 h-4 text-[#8D174B]" />
                {fr ? 'Reprendre' : 'متابعة'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {started.map((r) => (
                  <button key={r.f.slug} type="button" onClick={() => open(r.f.slug, 'reprendre')} className="text-start rounded-2xl bg-[#FDF2F7] border border-[#8D174B]/15 p-3 hover-scale active:scale-95 cursor-pointer">
                    <span className="block text-[13px] font-extrabold text-[#8D174B] line-clamp-1">{r.f.title[language] || r.f.title.fr}</span>
                    <span className="mt-1.5 block h-1.5 rounded-full bg-white overflow-hidden">
                      <span className="block h-full bg-[#8D174B]" style={{ width: `${r.stats.pct}%` }} />
                    </span>
                    <span className="block text-[11px] text-[#6E6773] mt-1">{r.stats.pct} % · {r.stats.seen}/{r.stats.total} {fr ? 'questions vues' : 'سؤال'}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Concours ouverts trouvés par la recherche */}
          {contestHits.length > 0 && (
            <section className="animate-fade-in">
              <h3 className="text-[13px] font-extrabold text-[#242126] mb-2 flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-[#8D174B]" />
                {fr ? 'Concours ouverts correspondants' : 'مباريات مفتوحة مطابقة'}
              </h3>
              <div className="space-y-2">
                {contestHits.map(({ c, slugs }) => (
                  <button key={c.id} type="button" onClick={() => open(slugs[0], 'recherche_concours')} className="w-full text-start flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-3 hover-scale active:scale-95 cursor-pointer">
                    <span className="flex-1 min-w-0">
                      <span dir="auto" className="block text-[13px] font-bold text-[#242126] line-clamp-2">{c.title[language] || c.title.fr}</span>
                      <span className="block text-[11px] text-[#6E6773] mt-0.5">
                        {fr ? 'Se préparer : ' : 'التحضير: '}
                        <b className="text-[#8D174B]">{rows.find((r) => r.f.slug === slugs[0])?.f.title[language] || slugs[0]}</b>
                        {' · '}
                        {fr ? `J-${c.daysRemaining}` : `${c.daysRemaining} يوم`}
                      </span>
                    </span>
                    <Next className="w-4 h-4 text-[#8D174B] shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Tous les dossiers, en liste compacte */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[13px] font-extrabold text-[#242126]">
                {fam ? (fr ? FAMILIES.find((x) => x.id === fam)!.fr : FAMILIES.find((x) => x.id === fam)!.ar) : fr ? 'Tous les métiers' : 'كل المهن'}
              </h3>
              <span className="text-[11px] text-[#8E8694]">{shown.length} {fr ? (shown.length > 1 ? 'dossiers' : 'dossier') : 'ملف'}</span>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 rounded-2xl bg-[#FAF4F7] animate-pulse" />)}
              </div>
            ) : shown.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{shown.map(card)}</div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#8D174B]/25 bg-[#FAF7F9] p-5 text-center">
                <p className="text-[13px] font-bold text-[#242126]">{fr ? 'Aucun dossier pour cette recherche.' : 'لا يوجد ملف لهذا البحث.'}</p>
                <p className="text-[12px] text-[#6E6773] mt-1">
                  {fr ? 'Essayez le nom du métier (infirmier, technicien, administrateur…) ou commencez par les tests psychotechniques, utiles pour presque tous les concours.' : 'جرب اسم المهنة أو ابدأ بالاختبارات النفسية التقنية، المفيدة لأغلب المباريات.'}
                </p>
                <button type="button" onClick={() => { setQ(''); setFam('tests'); }} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#8D174B] text-white px-4 py-2 text-[12px] font-extrabold active:scale-95 cursor-pointer">
                  <Brain className="w-4 h-4" />
                  {fr ? 'Tests psychotechniques' : 'الاختبارات النفسية التقنية'}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Panneau de droite : concours ouverts à préparer maintenant */}
        <aside className="lg:col-span-2 lg:sticky lg:top-24 self-start space-y-4">
          {topOpen.length > 0 && (
            <section className="rounded-2xl border border-[#F1E5EC] bg-white p-4 animate-fade-in">
              <h3 className="text-[13px] font-extrabold text-[#242126] mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#8D174B]" />
                {fr ? 'Concours ouverts : préparez-vous' : 'مباريات مفتوحة: استعد الآن'}
              </h3>
              <p className="text-[11px] text-[#6E6773] mb-2">{fr ? 'Les plus gros recrutements en cours, avec leur dossier de préparation.' : 'أكبر التوظيفات الجارية مع ملف التحضير.'}</p>
              {topOpen.map(({ c, slugs }) => (
                <button key={c.id} type="button" onClick={() => open(slugs[0], 'panneau')} className="w-full text-start border-t border-[#F1E5EC] py-2.5 cursor-pointer group">
                  <span dir="auto" className="block text-[12.5px] font-bold text-[#242126] leading-snug line-clamp-2 group-hover:text-[#8D174B]">{c.title[language] || c.title.fr}</span>
                  <span className="block text-[11px] text-[#6E6773] mt-0.5">
                    {c.postsCount ? `${c.postsCount} ${fr ? 'postes' : 'منصب'} · ` : ''}
                    {fr ? `J-${c.daysRemaining}` : `${c.daysRemaining} يوم`}
                    {' · '}
                    <span className="text-[#8D174B] font-bold">{fr ? 'Se préparer' : 'استعد'} →</span>
                  </span>
                </button>
              ))}
            </section>
          )}
          <section className="rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#B0245F] text-white p-4">
            <p className="text-[13px] font-extrabold flex items-center gap-1.5">
              <Brain className="w-4 h-4" />
              {fr ? 'Presque tous les concours' : 'لأغلب المباريات'}
            </p>
            <p className="text-[12px] text-white/90 mt-1">{fr ? 'Les tests psychotechniques reviennent dans de nombreux recrutements : commencez par là si vous hésitez.' : 'تتكرر الاختبارات النفسية التقنية في كثير من التوظيفات: ابدأ بها إن كنت مترددا.'}</p>
            <button type="button" onClick={() => open('tests-psychotechniques', 'panneau_psycho')} className="mt-3 w-full rounded-xl bg-white text-[#8D174B] py-2 text-[12px] font-extrabold active:scale-95 cursor-pointer animate-cta-bounce">
              {fr ? 'Commencer les tests' : 'ابدأ الاختبارات'}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
};
