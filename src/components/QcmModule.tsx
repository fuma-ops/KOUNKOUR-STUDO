import React, { useState, useEffect } from 'react';
import { QcmSet, Language } from '../types';
import { translations } from '../i18n/translations';
import { mockQcmSets } from '../data/mockQcm';
import { FALLBACK_FOLDERS, QcmCorrection, QcmFolder, QcmProgress, fetchQcmFolders, fetchQcmSets, loadQcmProgress, recordQcmProgress, seenCount, submitQcm } from '../data/qcmApi';
import { 
  GraduationCap, Clock, Award, CheckCircle, XCircle, RotateCcw, 
  ArrowRight, ArrowLeft, HelpCircle, BookOpen, AlertCircle, ShieldCheck, FolderOpen, Eye, Trophy
} from 'lucide-react';

// Réponses en cours d'un QCM non terminé (sur cet appareil), pour « Continuer ».
const draftKey = (setId: string) => `kounkour_qcm_draft_${setId}`;
function readDraft(setId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(draftKey(setId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writeDraft(setId: string, answers: Record<string, string> | null) {
  try {
    if (answers) localStorage.setItem(draftKey(setId), JSON.stringify(answers));
    else localStorage.removeItem(draftKey(setId));
  } catch {
    /* stockage indisponible */
  }
}

// Supports d'entraînement KounKour → dossier du concours correspondant.
const TRAINING_FOLDER: Record<string, string> = {
  'qcm-dgsn-gardiens-paix-annales': 'dgsn-gardiens-de-la-paix',
  'qcm-dgsn-inspecteurs-police-fr': 'dgsn-inspecteurs-de-police',
  'qcm-dgsn-inspecteurs-arabe': 'dgsn-inspecteurs-de-police',
  'qcm-dgsn-officiers-police-droit': 'dgsn-officiers-de-police',
  'qcm-dgsn-commissaires-police': 'dgsn-commissaires-de-police',
};

interface QcmModuleProps {
  language: Language;
  onRecordScore?: (qcmId: string, score: number, total: number) => void;
}

export const QcmModule: React.FC<QcmModuleProps> = ({ language, onRecordScore }) => {
  const t = translations[language];
  const isRTL = language === 'ar';
  const NextIcon = isRTL ? ArrowLeft : ArrowRight;
  const PrevIcon = isRTL ? ArrowRight : ArrowLeft;

  const [selectedSet, setSelectedSet] = useState<QcmSet | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  // Correction renvoyée par le serveur après soumission (annales stockées en base).
  const [corrections, setCorrections] = useState<Record<string, QcmCorrection> | null>(null);
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState(false);

  // Supports : annales réelles (Supabase) puis entraînement KounKour, rangés par dossier.
  const [realSets, setRealSets] = useState<QcmSet[]>([]);
  const [folders, setFolders] = useState<QcmFolder[]>(FALLBACK_FOLDERS);
  const [loadingSets, setLoadingSets] = useState(true);
  const [progress, setProgress] = useState<Record<string, QcmProgress>>({});
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchQcmSets(), fetchQcmFolders(), loadQcmProgress()])
      .then(([sets, fs, prog]) => {
        if (cancelled) return;
        setRealSets(sets);
        setFolders(fs);
        setProgress(prog);
      })
      .finally(() => { if (!cancelled) setLoadingSets(false); });
    return () => { cancelled = true; };
  }, []);
  const allSets: QcmSet[] = [
    ...realSets,
    ...mockQcmSets.map((m) => ({ ...m, kind: 'entrainement' as const, folderSlug: TRAINING_FOLDER[m.id] || null })),
  ];
  const setsOf = (slug: string) => allSets.filter((x) => x.folderSlug === slug);
  const statsOf = (sets: QcmSet[]) => {
    const total = sets.reduce((a, x) => a + x.questions.length, 0);
    const seen = sets.reduce((a, x) => a + seenCount(progress[x.id], x.questions.map((q) => q.id)), 0);
    return { total, seen, pct: total ? Math.round((seen / total) * 100) : 0 };
  };

  // Mémorise la progression (questions vues, score) sans bloquer l'écran.
  const saveProgress = (set: QcmSet, update: { seen?: string[]; score?: number }) => {
    recordQcmProgress(progress[set.id], set.id, set.questions.length, update)
      .then((p) => setProgress((prev) => ({ ...prev, [set.id]: p })))
      .catch(() => undefined);
  };
  const seenRef = React.useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!selectedSet) return;
    const ids = isSubmitted ? selectedSet.questions.map((q) => q.id) : [selectedSet.questions[currentQuestionIndex]?.id].filter(Boolean) as string[];
    const fresh = ids.filter((id) => !seenRef.current.has(`${selectedSet.id}:${id}`) && !(progress[selectedSet.id]?.seen || []).includes(id));
    if (fresh.length === 0) return;
    fresh.forEach((id) => seenRef.current.add(`${selectedSet.id}:${id}`));
    saveProgress(selectedSet, { seen: fresh });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSet, currentQuestionIndex, isSubmitted]);

  // Une annale en arabe s'affiche de droite à gauche, même dans l'interface en français.
  const contentDir = (set: QcmSet | null) => (set?.contentLanguage === 'ar' ? 'rtl' : set?.contentLanguage === 'fr' ? 'ltr' : undefined);

  // Timer effect when a set is active and not submitted
  useEffect(() => {
    let interval: any = null;
    if (selectedSet && !isSubmitted) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [selectedSet, isSubmitted]);

  const handleStartSet = (set: QcmSet) => {
    setSelectedSet(set);
    // « Continuer » : reprend à la première question pas encore vue.
    const p = progress[set.id];
    const resuming = !!p && !p.attempts && p.seen.length > 0;
    const firstUnseen = resuming ? set.questions.findIndex((q) => !p!.seen.includes(q.id)) : -1;
    setCurrentQuestionIndex(firstUnseen > 0 ? firstUnseen : 0);
    setUserAnswers(resuming ? readDraft(set.id) : {});
    setIsSubmitted(false);
    setTimerSeconds(0);
    setCorrections(null);
    setGradeError(false);
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => {
      const next = { ...prev, [questionId]: optionId };
      if (selectedSet) writeDraft(selectedSet.id, next);
      return next;
    });
  };

  const correctionOf = (q: QcmSet['questions'][number]): QcmCorrection => {
    if (selectedSet?.serverGraded) return corrections?.[q.id] ?? { correctOptionId: '', explanation: '', source: '' };
    return { correctOptionId: q.correctOptionId, explanation: q.explanation[language], source: q.source || '' };
  };

  const handleSubmit = async () => {
    if (!selectedSet || grading) return;
    let corr: Record<string, QcmCorrection> | null = null;
    if (selectedSet.serverGraded) {
      setGrading(true);
      setGradeError(false);
      corr = await submitQcm(selectedSet.id, userAnswers);
      setGrading(false);
      if (!corr) {
        setGradeError(true);
        return;
      }
    }
    setCorrections(corr);
    const score = selectedSet.questions.filter((q) => {
      const right = selectedSet.serverGraded ? corr?.[q.id]?.correctOptionId : q.correctOptionId;
      return !!right && userAnswers[q.id] === right;
    }).length;
    setIsSubmitted(true);
    onRecordScore?.(selectedSet.id, score, selectedSet.questions.length);
    saveProgress(selectedSet, { score });
    writeDraft(selectedSet.id, null);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fr = language === 'fr';
  const progressBar = (pct: number) => (
    <div className="w-full h-1.5 bg-[#F1E5EC] rounded-full overflow-hidden">
      <div className="h-full bg-[#8D174B] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );

  // ─── Écran 1 : les dossiers (un par concours) ───────────────────────────────
  if (!selectedSet && !selectedFolder) {
    const visibleFolders = folders.filter((f) => setsOf(f.slug).length > 0);
    const orphans = allSets.filter((x) => !x.folderSlug || !folders.some((f) => f.slug === x.folderSlug));
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF2F7] text-[#8D174B] text-xs font-semibold mb-3 border border-[#8D174B]/15">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{fr ? 'Préparation par concours' : 'التحضير حسب المباراة'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#242126] mb-2">{t.preparation.title}</h2>
          <p className="text-xs sm:text-sm text-[#6E6773] max-w-xl mx-auto">
            {fr ? 'Choisissez le concours que vous préparez : chaque dossier regroupe ses annales réelles et ses QCM d’entraînement, avec votre progression.' : 'اختر المباراة التي تستعد لها: كل ملف يضم النماذج الحقيقية وتمارين التدريب مع تقدمك.'}
          </p>
        </div>

        {loadingSets ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-40 rounded-3xl bg-[#FAF4F7] animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...visibleFolders.map((f) => ({ f, sets: setsOf(f.slug) })), ...(orphans.length ? [{ f: { slug: '__autres', title: { fr: 'Autres supports', ar: 'دعامات أخرى' }, organization: '', description: { fr: '', ar: '' }, position: 999 } as QcmFolder, sets: orphans }] : [])].map(({ f, sets }, i) => {
              const st = statsOf(sets);
              const annales = sets.filter((x) => x.kind === 'annales').length;
              return (
                <button
                  key={f.slug}
                  onClick={() => setSelectedFolder(f.slug)}
                  className="text-start bg-white border border-[#F1E5EC] hover:border-[#8D174B]/40 rounded-3xl p-5 shadow-xs hover:shadow-md hover-scale active:scale-95 transition-all cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-[#242126] leading-snug">{f.title[language] || f.title.fr}</h3>
                      {f.organization && <p className="text-[11px] text-[#8E8694] mt-0.5">{f.organization}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-[#FDF2F7] text-[#8D174B] font-bold">
                      {sets.length} {fr ? (sets.length > 1 ? 'supports' : 'support') : 'دعامة'}
                    </span>
                    {annales > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        {annales} {fr ? (annales > 1 ? 'annales réelles' : 'annale réelle') : 'نموذج حقيقي'}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold">
                      {st.total} {fr ? 'questions' : 'سؤال'}
                    </span>
                  </div>
                  {progressBar(st.pct)}
                  <p className="text-[11px] text-[#6E6773] mt-1.5 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-[#8D174B]" />
                    {st.seen === 0
                      ? (fr ? 'Pas encore commencé' : 'لم تبدأ بعد')
                      : fr ? `${st.seen}/${st.total} questions vues (${st.pct} %)` : `${st.seen}/${st.total} سؤال (${st.pct}٪)`}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── Écran 2 : les supports d'un dossier, avec la progression ───────────────
  if (!selectedSet && selectedFolder) {
    const folder = folders.find((f) => f.slug === selectedFolder);
    const sets = selectedFolder === '__autres'
      ? allSets.filter((x) => !x.folderSlug || !folders.some((f) => f.slug === x.folderSlug))
      : setsOf(selectedFolder);
    const st = statsOf(sets);
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <button
          onClick={() => setSelectedFolder(null)}
          className="mb-4 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF4F7] text-[#8D174B] border border-[#8D174B]/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <PrevIcon className="w-4 h-4" />
          {fr ? 'Tous les concours' : 'كل المباريات'}
        </button>

        <div className="bg-gradient-to-r from-[#FAF0F5] via-[#FFFDFE] to-[#FDF2F7] rounded-3xl border border-[#F1E5EC] p-5 sm:p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center shrink-0">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#8D174B]">{folder ? folder.title[language] || folder.title.fr : (fr ? 'Autres supports' : 'دعامات أخرى')}</h2>
              {folder?.organization && <p className="text-xs text-[#6E6773]">{folder.organization}</p>}
              {folder?.description.fr && <p className="text-xs text-[#6E6773] mt-1">{folder.description[language] || folder.description.fr}</p>}
              <div className="mt-3 max-w-sm">
                {progressBar(st.pct)}
                <p className="text-[11px] text-[#6E6773] mt-1">
                  {fr ? `Progression du dossier : ${st.seen}/${st.total} questions vues (${st.pct} %)` : `تقدم الملف: ${st.seen}/${st.total} (${st.pct}٪)`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {sets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-[#F1E5EC] p-6">
            <BookOpen className="w-10 h-10 text-[#6E6773]/30 mx-auto mb-2" />
            <p className="text-xs text-[#6E6773]">{fr ? 'Aucun support pour ce concours pour l’instant.' : 'لا توجد دعامات لهذه المباراة حالياً.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...sets].sort((x, y) => (x.kind === y.kind ? 0 : x.kind === 'annales' ? -1 : 1)).map((set, i) => {
              const p = progress[set.id];
              const seen = seenCount(p, set.questions.map((q) => q.id));
              const total = set.questions.length;
              const pct = total ? Math.round((seen / total) * 100) : 0;
              return (
                <div
                  key={set.id}
                  className="bg-white border border-[#F1E5EC] hover:border-[#8D174B]/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#6E6773] mb-3 gap-2">
                      {set.kind === 'annales' ? (
                        <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {fr ? 'Annales réelles' : 'نماذج حقيقية'}
                        </span>
                      ) : (
                        <span className="font-semibold text-[#6E6773] bg-gray-100 px-2.5 py-1 rounded-md">{fr ? 'Entraînement' : 'تدريب'}</span>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{set.durationMinutes} {t.preparation.minutes}</span>
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-[#242126] mb-1">{set.title[language]}</h3>
                    {set.kind === 'annales' && set.concoursLabel && (
                      <p className="text-[11px] font-semibold text-[#8D174B] mb-2">{set.concoursLabel}{set.examYear ? ` • ${set.examYear}` : ''}</p>
                    )}
                    <p className="text-xs text-[#6E6773] leading-relaxed mb-4 line-clamp-3">{set.description[language]}</p>
                  </div>

                  <div className="space-y-2">
                    {progressBar(pct)}
                    <div className="flex items-center justify-between text-[11px] text-[#6E6773] gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-[#8D174B]" />
                        {seen === 0 ? (fr ? 'Non consulté' : 'لم تطلع عليه') : fr ? `${seen}/${total} questions vues (${pct} %)` : `${seen}/${total} (${pct}٪)`}
                      </span>
                      {p?.bestScore !== null && p?.bestScore !== undefined && (
                        <span className="flex items-center gap-1 font-bold text-[#242126]">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          {fr ? `Meilleur score ${p.bestScore}/${total}` : `أفضل نتيجة ${p.bestScore}/${total}`}
                        </span>
                      )}
                    </div>
                    <div className="pt-2 border-t border-[#F1E5EC] flex items-center justify-between">
                      <span className="text-xs font-medium text-[#242126]">{total} {t.preparation.questions}</span>
                      <button
                        onClick={() => handleStartSet(set)}
                        className="px-4 py-2 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>
                          {seen === 0 ? t.preparation.startQcm : (p?.attempts ? (fr ? 'Refaire' : 'إعادة') : (fr ? 'Continuer' : 'متابعة'))}
                        </span>
                        <NextIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (!selectedSet) return null;

  // Active QCM Passage or Result view
  const currentQ = selectedSet.questions[currentQuestionIndex];
  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = Math.round((answeredCount / selectedSet.questions.length) * 100);

  // If submitted, calculate score
  let score = 0;
  if (isSubmitted) {
    selectedSet.questions.forEach((q) => {
      const right = correctionOf(q).correctOptionId;
      if (right && userAnswers[q.id] === right) score += 1;
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Top action bar: Back to catalog, timer, progress */}
      <div className="bg-white border border-[#F1E5EC] rounded-2xl p-4 shadow-xs mb-6 flex items-center justify-between">
        <button
          onClick={() => setSelectedSet(null)}
          className="text-xs font-semibold text-[#8D174B] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <PrevIcon className="w-4 h-4" />
          <span>{language === 'fr' ? 'Retour au dossier' : 'الرجوع إلى الملف'}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#242126] bg-[#F8F2F5] px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-[#8D174B]" />
            <span>{formatTime(timerSeconds)}</span>
          </div>

          <span className="text-xs font-semibold text-[#6E6773]">
            {currentQuestionIndex + 1} / {selectedSet.questions.length}
          </span>
        </div>
      </div>

      {/* Result view if submitted */}
      {isSubmitted ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[#FFFDFE] border border-[#F1E5EC] rounded-3xl p-6 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#FDF2F7] text-[#8D174B] flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#242126] mb-1">{t.preparation.qcmResult}</h3>
            <div className="text-3xl font-extrabold text-[#8D174B] mb-2">
              {score} / {selectedSet.questions.length}
            </div>
            <p className="text-xs sm:text-sm text-[#6E6773] max-w-md mx-auto mb-6">
              {score === selectedSet.questions.length
                ? t.preparation.congratulations
                : score >= selectedSet.questions.length / 2
                ? t.preparation.goodEffort
                : t.preparation.needsWork}
            </p>

            <button
              onClick={() => handleStartSet(selectedSet)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.preparation.restart}</span>
            </button>
          </div>

          {/* Detailed corrections review */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-[#242126] uppercase tracking-wide">
              {language === 'fr' ? 'Correction détaillée des questions' : 'التصحيح المفصل للأسئلة'}
            </h4>
            {selectedSet.kind === 'annales' && (
              <p className="text-[11px] text-[#6E6773] bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl p-3 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {language === 'fr'
                    ? `Questions réelles transcrites mot pour mot${selectedSet.concoursLabel ? ` (${selectedSet.concoursLabel}${selectedSet.examYear ? ' ' + selectedSet.examYear : ''})` : ''}. Corrigé établi par KounKour avec sa source.`
                    : 'أسئلة حقيقية منقولة حرفيا. التصحيح من إعداد كونكور مع ذكر المصدر.'}
                </span>
              </p>
            )}

            {selectedSet.questions.map((q, idx) => {
              const userChoice = userAnswers[q.id];
              const corr = correctionOf(q);
              const isCorrect = !!corr.correctOptionId && userChoice === corr.correctOptionId;

              return (
                <div key={q.id} dir={contentDir(selectedSet)} className="bg-white border border-[#F1E5EC] rounded-2xl p-5 shadow-xs">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-xs font-bold text-[#8D174B]">
                      {t.preparation.question} {idx + 1}
                      {selectedSet.kind === 'annales' && q.number ? (language === 'fr' ? ` · n° ${q.number} du sujet` : ` · رقم ${q.number} في الموضوع`) : ''}
                    </span>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {language === 'fr' ? 'Correct' : 'صحيح'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                        <XCircle className="w-3.5 h-3.5" />
                        {language === 'fr' ? 'Incorrect' : 'غير صحيح'}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-[#242126] mb-3">{q.text[language]}</p>

                  <div className="space-y-2 mb-4">
                    {q.options.map((opt) => {
                      const isUserChoice = userChoice === opt.id;
                      const isRealCorrect = opt.id === corr.correctOptionId;

                      let style = 'bg-[#F8F2F5] text-[#242126] border-transparent';
                      if (isRealCorrect) {
                        style = 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold';
                      } else if (isUserChoice && !isRealCorrect) {
                        style = 'bg-rose-50 text-rose-900 border-rose-300 line-through';
                      }

                      return (
                        <div key={opt.id} className={`p-3 rounded-xl border text-xs flex items-center justify-between ${style}`}>
                          <span>{opt.text[language]}</span>
                          {isRealCorrect && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {isUserChoice && !isRealCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pedagogical explanation */}
                  <div className="p-3.5 rounded-xl bg-[#FDF2F7] border border-[#8D174B]/15 text-xs text-[#242126]">
                    <strong className="block text-[#8D174B] font-bold mb-1">
                      {t.preparation.explanation}
                    </strong>
                    <p className="text-[#6E6773] leading-relaxed mb-1.5">{corr.explanation}</p>
                    {corr.source && <span className="text-[10px] text-[#6E6773] italic">Source : {corr.source}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Active Single Question View */
        <div className="bg-white border border-[#F1E5EC] rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* Progress bar */}
          <div className="w-full bg-[#F1E5EC] h-1.5 rounded-full overflow-hidden mb-6">
            <div 
              className="bg-[#8D174B] h-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / selectedSet.questions.length) * 100}%` }}
            />
          </div>

          <div className="mb-6">
            <span className="text-xs font-bold text-[#8D174B] uppercase tracking-wider mb-2 block">
              {t.preparation.question} {currentQuestionIndex + 1} {t.preparation.of} {selectedSet.questions.length}
            </span>
            <h3 dir={contentDir(selectedSet)} className="text-base sm:text-lg font-bold text-[#242126] leading-snug">
              {currentQ.text[language]}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8" dir={contentDir(selectedSet)}>
            {currentQ.options.map((opt) => {
              const isSelected = userAnswers[currentQ.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(currentQ.id, opt.id)}
                  className={`w-full p-4 rounded-xl border text-xs sm:text-sm font-medium text-start transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-[#8D174B] bg-[#FDF2F7] text-[#8D174B] font-bold shadow-xs'
                      : 'border-[#F1E5EC] hover:bg-[#F8F2F5] text-[#242126]'
                  }`}
                >
                  <span>{opt.text[language]}</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-[#8D174B] bg-[#8D174B] text-white' : 'border-[#F1E5EC]'
                  }`}>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Question Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[#F1E5EC]">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              className="px-4 py-2 rounded-xl border border-[#F1E5EC] text-xs font-semibold text-[#6E6773] hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
            >
              <PrevIcon className="w-4 h-4" />
              <span>{t.preparation.prevQuestion}</span>
            </button>

            {currentQuestionIndex < selectedSet.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="px-5 py-2.5 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>{t.preparation.nextQuestion}</span>
                <NextIcon className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleSubmit}
                  disabled={grading}
                  className="px-6 py-2.5 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  {grading ? (fr ? 'Correction…' : 'جارٍ التصحيح…') : t.preparation.finishQcm}
                </button>
                {gradeError && (
                  <span className="text-[11px] text-rose-700">
                    {fr ? 'Correction indisponible (connexion). Réessayez.' : 'تعذر التصحيح (الاتصال). أعد المحاولة.'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
