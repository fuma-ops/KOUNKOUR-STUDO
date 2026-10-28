import React from 'react';
import { Brain, ExternalLink, ArrowRight, ArrowLeft, BellRing, UserPlus, Globe2, BookOpen, Timer, CalendarDays } from 'lucide-react';
import type { Contest, Language } from '../types';
import {
  PSYCHO_FOLDER,
  PSYCHO_FOLDER_EN,
  PSYCHO_RECRUITERS,
  findPsychoRecruiter,
  psychoIndexDoc,
  psychoRecruiterDoc,
  psychoRecruiterFor,
} from '../content/psychoRecruiters';
import { gaEvent } from '../lib/analytics';
import { PsyTrainBanner } from './PsyTrainBanner';

interface Props {
  slug: string | null;
  language: Language;
  contests: Contest[];
  contestsLoaded: boolean;
  isAuthed: boolean;
  onOpenRecruiter: (slug: string | null) => void;
  onOpenFolder: (folder: string) => void;
  onOpenSet: (folder: string, set: string) => void;
  onOpenContest: (c: Contest) => void;
  onRequestLogin: () => void;
  onOpenProfile: () => void;
  onOpenTrainer?: () => void;
}

// Tests psychotechniques par recruteur (ONCF, RAM, Protection civile…) : la source, les concours
// ouverts du recruteur et l'accès direct à l'entraînement (même texte que le rendu serveur).
export const PsychoRecruiterPage: React.FC<Props> = ({ slug, language, contests, contestsLoaded, isAuthed, onOpenRecruiter, onOpenFolder, onOpenSet, onOpenContest, onRequestLogin, onOpenProfile, onOpenTrainer }) => {
  const lang = language === 'ar' ? 'ar' : 'fr';
  const fr = lang === 'fr';
  const rec = slug ? findPsychoRecruiter(slug) : null;
  const doc = rec ? psychoRecruiterDoc(rec, lang) : psychoIndexDoc(lang);
  const Next = fr ? ArrowRight : ArrowLeft;
  const open = rec
    ? contests
        .filter((c) => (c.status === 'open' || c.status === 'closing_soon') && c.daysRemaining >= 0)
        .filter((c) => psychoRecruiterFor(`${c.title.fr} ${c.administration.name.fr}`)?.slug === rec.slug)
        .sort((a, b) => a.daysRemaining - b.daysRemaining)
        .slice(0, 6)
    : [];
  const start = (what: string, fn: () => void) => () => {
    gaEvent('psycho_landing_cta', { recruiter: rec?.slug || 'index', what });
    fn();
    window.scrollTo({ top: 0 });
  };
  const sourceIsInternal = rec?.sourceUrl.startsWith('/');

  return (
    <article className="max-w-5xl mx-auto px-4 py-6 sm:py-10 pb-28 md:pb-10 animate-fade-in" dir={fr ? 'ltr' : 'rtl'}>
      {rec && (
        <button
          type="button"
          onClick={() => onOpenRecruiter(null)}
          className="mb-4 text-xs font-bold text-[#8D174B] bg-white border border-[#8D174B]/20 rounded-xl px-3 py-1.5 cursor-pointer active:scale-95"
        >
          {fr ? '← Tous les recruteurs' : 'كل المؤسسات →'}
        </button>
      )}
      <header className="rounded-3xl border border-[#F1E5EC] bg-gradient-to-r from-[#FAF0F5] via-[#FFFDFE] to-[#FDF2F7] p-5 sm:p-7 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#8D174B] leading-snug">{doc.h1}</h1>
            <p className="text-[13px] sm:text-sm text-[#4A4250] mt-2 leading-relaxed">{doc.intro}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={start('folder', () => onOpenFolder(PSYCHO_FOLDER))}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#8D174B] hover:bg-[#75123E] text-white px-5 py-3 text-sm font-extrabold shadow-md hover-scale active:scale-95 cursor-pointer animate-cta-bounce"
          >
            {fr ? "Commencer l'entraînement gratuit" : 'ابدأ التدريب المجاني'}
            <Next className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={start('blanc', () => onOpenSet(PSYCHO_FOLDER, 'test-psychotechnique-blanc-1-fr'))}
            className="inline-flex items-center gap-2 rounded-2xl bg-white border border-[#8D174B]/25 text-[#8D174B] px-4 py-3 text-sm font-bold hover:shadow-md hover-scale active:scale-95 cursor-pointer"
          >
            <Timer className="w-4 h-4" />
            {fr ? 'Test blanc chronométré' : 'اختبار تجريبي مؤقت'}
          </button>
          <button
            type="button"
            onClick={start('english', () => onOpenFolder(PSYCHO_FOLDER_EN))}
            className="inline-flex items-center gap-2 rounded-2xl bg-white border border-[#F1E5EC] text-[#4A4250] px-4 py-3 text-sm font-bold hover:shadow-md hover-scale active:scale-95 cursor-pointer"
          >
            <Globe2 className="w-4 h-4" />
            Practice in English
          </button>
        </div>
      </header>

      {onOpenTrainer && <PsyTrainBanner language={language} onOpen={start('interactif', onOpenTrainer)} className="mb-6" />}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-4">
          {rec ? (
            doc.sections.map((s, i) => (
              <section key={s.title} className="rounded-2xl border border-[#F1E5EC] bg-white p-4 sm:p-5 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <h2 className="text-sm sm:text-base font-extrabold text-[#242126] mb-2">{s.title}</h2>
                {s.paragraphs.map((p, j) => (
                  <p key={j} className="text-[13px] sm:text-sm text-[#4A4250] leading-relaxed mb-2 last:mb-0">{p}</p>
                ))}
                {s.bullets && (
                  <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {s.bullets.map((b) => (
                      <li key={b}>
                        <button type="button" onClick={start('famille', () => onOpenFolder(PSYCHO_FOLDER))} className="w-full text-start text-[13px] font-semibold text-[#8D174B] bg-[#FDF2F7] border border-[#8D174B]/10 rounded-xl px-3 py-2 cursor-pointer hover-scale active:scale-95">
                          {b}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {i === 0 && (
                  <p className="mt-3 text-[11.5px] text-[#6E6773] flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    {fr ? 'Source : ' : 'المصدر: '}
                    {sourceIsInternal && rec.realSet ? (
                      <button type="button" onClick={start('annale', () => onOpenSet('concours-srm-techniciens-agents', rec.realSet!.slug))} className="font-bold text-[#8D174B] hover:underline cursor-pointer">
                        {rec.realSet.label[lang]}
                      </button>
                    ) : (
                      <a href={rec.sourceUrl} target="_blank" rel="noreferrer" className="font-bold text-[#8D174B] hover:underline">{rec.sourceLabel}</a>
                    )}
                  </p>
                )}
              </section>
            ))
          ) : (
            <section className="space-y-3">
              {PSYCHO_RECRUITERS.map((r, i) => (
                <button
                  key={r.slug}
                  type="button"
                  onClick={() => onOpenRecruiter(r.slug)}
                  className="w-full text-start rounded-2xl border border-[#F1E5EC] bg-white p-4 hover:border-[#8D174B]/40 hover:shadow-md hover-scale active:scale-95 transition-all cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[15px] font-extrabold text-[#242126]">{fr ? `Tests psychotechniques ${r.name.fr}` : r.name.ar}</span>
                    <Next className="w-4 h-4 text-[#8D174B] shrink-0" />
                  </span>
                  <span className="block text-[12.5px] text-[#6E6773] mt-1 leading-snug line-clamp-2">{r.fact[lang]}</span>
                </button>
              ))}
              <p className="text-[11.5px] text-[#6E6773] leading-relaxed">
                {fr
                  ? "Seuls les recruteurs dont une source publique mentionne un test psychotechnique figurent ici. Pour les autres (Douane, Gendarmerie, DGSN…), nous n'avons pas trouvé de confirmation."
                  : 'تظهر هنا فقط المؤسسات التي يؤكد مصدر علني اعتمادها اختباراً نفسياً تقنياً.'}
              </p>
            </section>
          )}

          {rec && doc.faq.length > 0 && (
            <section className="rounded-2xl border border-[#F1E5EC] bg-[#FAF7F9] p-4 sm:p-5">
              <h2 className="text-sm sm:text-base font-extrabold text-[#242126] mb-3">{fr ? 'Questions fréquentes' : 'أسئلة متداولة'}</h2>
              {doc.faq.map((f) => (
                <div key={f.q} className="mb-3 last:mb-0">
                  <h3 className="text-[13px] font-bold text-[#242126]">{f.q}</h3>
                  <p className="text-[13px] text-[#4A4250] leading-relaxed mt-1">{f.a}</p>
                </div>
              ))}
            </section>
          )}
        </div>

        <aside className="lg:col-span-2 space-y-4 lg:sticky lg:top-4 self-start">
          <section className="rounded-2xl border border-[#F1E5EC] bg-white p-4">
            <h2 className="text-sm font-extrabold text-[#242126] mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#8D174B]" />
              {fr ? 'Par où commencer' : 'من أين تبدأ'}
            </h2>
            {[
              { set: 'test-psychotechnique-support-methode-fr', label: fr ? 'Fiche méthode (7 familles)' : 'البطاقة المنهجية' },
              { set: 'test-psychotechnique-suites-numeriques-fr', label: fr ? 'Suites numériques (15 questions)' : 'سلاسل الأعداد' },
              { set: 'test-psychotechnique-raisonnement-logique-fr', label: fr ? 'Raisonnement logique (15 questions)' : 'الاستدلال المنطقي' },
              { set: 'test-psychotechnique-blanc-1-fr', label: fr ? 'Test blanc : 30 questions en 20 min' : 'اختبار تجريبي: 30 سؤالاً في 20 دقيقة' },
            ].map((x) => (
              <button key={x.set} type="button" onClick={start(x.set, () => onOpenSet(PSYCHO_FOLDER, x.set))} className="w-full flex items-center justify-between gap-2 text-start text-[13px] font-semibold text-[#242126] border-b border-[#F1E5EC] last:border-0 py-2.5 cursor-pointer hover:text-[#8D174B]">
                {x.label}
                <Next className="w-3.5 h-3.5 shrink-0 text-[#8D174B]" />
              </button>
            ))}
          </section>

          {rec && (
            <section className="rounded-2xl border border-[#F1E5EC] bg-white p-4">
              <h2 className="text-sm font-extrabold text-[#242126] mb-2 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-[#8D174B]" />
                {fr ? `Concours ${rec.name.fr} ouverts` : 'المباريات المفتوحة'}
              </h2>
              {!contestsLoaded && !open.length ? (
                <div className="space-y-2" aria-hidden>
                  <div className="h-4 rounded bg-[#F1E5EC] animate-pulse" />
                  <div className="h-4 w-2/3 rounded bg-[#F1E5EC] animate-pulse" />
                </div>
              ) : open.length ? (
                open.map((c) => (
                  <button key={c.id} type="button" onClick={() => onOpenContest(c)} className="w-full text-start border-b border-[#F1E5EC] last:border-0 py-2.5 cursor-pointer group">
                    <span dir="auto" className="block text-[13px] font-bold text-[#242126] leading-snug line-clamp-2 group-hover:text-[#8D174B]">{c.title[lang] || c.title.fr}</span>
                    <span className="block text-[11.5px] text-[#6E6773] mt-0.5">
                      {fr ? `Date limite : ${c.deadlineDate}` : `آخر أجل: ${c.deadlineDate}`}
                      <span className="text-[#8D174B] whitespace-nowrap"> · {c.daysRemaining === 0 ? (fr ? 'dernier jour' : 'آخر يوم') : fr ? `J-${c.daysRemaining}` : `${c.daysRemaining} يوم`}</span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-[12.5px] text-[#6E6773] leading-relaxed">
                  {fr ? 'Aucun concours ouvert en ce moment. Créez votre profil pour être prévenu dès la publication du prochain avis.' : 'لا توجد مباراة مفتوحة حالياً. أنشئ ملفك لتتوصل بالإعلان القادم.'}
                </p>
              )}
            </section>
          )}

          <button
            type="button"
            onClick={() => (isAuthed ? onOpenProfile() : onRequestLogin())}
            className="w-full text-start rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white p-4 shadow-md hover:shadow-lg hover-scale active:scale-95 transition-all cursor-pointer animate-card-breathe"
          >
            <span className="flex items-center gap-2 text-[14px] font-extrabold">
              {isAuthed ? <BellRing className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {isAuthed ? (fr ? 'Mes alertes concours' : 'تنبيهاتي') : fr ? 'Créer mon profil gratuit' : 'أنشئ ملفك مجاناً'}
            </span>
            <span className="block text-[12px] text-white/90 mt-1 leading-snug">
              {fr ? 'Recevez les nouveaux concours, les listes de convoqués et les résultats.' : 'توصل بالمباريات الجديدة ولوائح المستدعين والنتائج.'}
            </span>
          </button>

          {rec && (
            <section className="rounded-2xl border border-[#F1E5EC] bg-white p-4">
              <h2 className="text-sm font-extrabold text-[#242126] mb-2">{fr ? 'Autres recruteurs' : 'مؤسسات أخرى'}</h2>
              <div className="flex flex-wrap gap-1.5">
                {PSYCHO_RECRUITERS.filter((r) => r.slug !== rec.slug).map((r) => (
                  <button key={r.slug} type="button" onClick={() => onOpenRecruiter(r.slug)} className="text-[12px] font-bold text-[#8D174B] bg-[#FDF2F7] border border-[#8D174B]/10 rounded-full px-3 py-1.5 cursor-pointer hover-scale active:scale-95">
                    {r.name[lang]}
                  </button>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </article>
  );
};
