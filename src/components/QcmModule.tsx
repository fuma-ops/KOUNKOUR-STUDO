import React, { useState, useEffect } from 'react';
import { QcmSet, Language } from '../types';
import { AnnaleImages } from './AnnaleImages';
import { ConcoursRef, OrgLogosBand, setOrgs } from './ConcoursRef';
import { AnnalePhotosAdmin } from './AnnalePhotosAdmin';
import { SujetView } from './SujetView';
import { useSession } from '../lib/useSession';
import { translations } from '../i18n/translations';
import { FALLBACK_FOLDERS, QcmCorrection, QcmFolder, QcmProgress, fetchQcmFolders, fetchQcmSets, loadQcmProgress, recordQcmProgress, answerIds, joinAnswer, seenCount, submitQcm, isWrittenSet, contentType, CONTENT_TYPES, ContentType } from '../data/qcmApi';
import { TYPE_META, TypeBadge } from './prepTypes';
import { PrepNextSteps } from './PrepNextSteps';
import { LoadError } from './LoadError';
import { gaEvent } from '../lib/analytics';
import type { Contest } from '../types';
import { 
  GraduationCap, Clock, Award, CheckCircle, XCircle, RotateCcw, 
  ArrowRight, ArrowLeft, HelpCircle, BookOpen, AlertCircle, ShieldCheck, FolderOpen, Eye, Trophy, FileText
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

interface QcmModuleProps {
  language: Language;
  onRecordScore?: (qcmId: string, score: number, total: number) => void;
  // Dossier / QCM ouverts, pilotés par l'adresse (/preparation/<dossier>, /preparation/qcm/<slug>).
  folderSlug?: string | null;
  setSlug?: string | null;
  onNavigate?: (folder: string | null, set: string | null) => void;
  // Bloc « Et maintenant ? » (fin de QCM / de sujet) : concours, profil, simulateur.
  contests?: Contest[];
  isAuthed?: boolean;
  onOpenContest?: (contest: Contest) => void;
  onRequestLogin?: () => void;
  onOpenProfile?: () => void;
  onOpenSalarySimulator?: (contest?: Contest) => void;
}

// Ordre dans un dossier : annales QCM, puis sujets écrits, puis entraînement.
const KIND_ORDER: Record<string, number> = { annales: 0, sujet: 1, entrainement: 2 };

// Lettre du choix (A, B, C…) en pastille : repère visuel net sur téléphone.
const OptionLetter: React.FC<{ i: number; tone: 'idle' | 'selected' | 'right' | 'wrong' }> = ({ i, tone }) => (
  <span
    className={`w-6 h-6 min-w-[24px] rounded-full border-2 text-[12px] font-black flex items-center justify-center ${
      tone === 'selected' ? 'border-[#8D174B] bg-[#8D174B] text-white'
        : tone === 'right' ? 'border-emerald-600 bg-emerald-600 text-white'
        : tone === 'wrong' ? 'border-rose-500 text-rose-600'
        : 'border-[#8D174B] text-[#8D174B]'
    }`}
  >
    {String.fromCharCode(65 + i)}
  </span>
);

// Clé d'URL d'un support : son slug en base.
// Libellés du lecteur et du dossier pour les séries en anglais (l'interface du site n'existe qu'en français et en arabe).
const EN_PLAYER = {
  question: 'Question', of: 'of', nextQuestion: 'Next question', prevQuestion: 'Previous question',
  minutes: 'minutes', questions: 'questions', startQcm: 'Start this test',
  finishQcm: 'Submit and see the answers', qcmResult: 'Test result', yourScore: 'Your score',
  congratulations: 'Excellent result! Keep practising.', goodEffort: 'Good work, review the detailed explanations below.',
  needsWork: 'Review the key ideas and try again to improve.', explanation: 'Explanation:', restart: 'Restart this test',
};

const urlKey = (set: QcmSet) => (set.serverGraded ? set.slug : set.id);

// Supports d'un dossier regroupés par thème (ordre d'apparition des thèmes, sans thème en dernier),
// et triés dans chaque thème : annales corrigées, puis sujets écrits, puis entraînements.
function themeGroups(sets: QcmSet[]): { theme: string | null; sets: QcmSet[] }[] {
  const byKind = [...sets].sort((x, y) => KIND_ORDER[x.kind || 'entrainement'] - KIND_ORDER[y.kind || 'entrainement']);
  if (!sets.some((x) => x.theme)) return [{ theme: null, sets: byKind }];
  const order: (string | null)[] = [];
  for (const x of [...sets].sort((a, b) => (a.themePosition ?? 999) - (b.themePosition ?? 999))) {
    const t = x.theme || null;
    if (!order.includes(t)) order.push(t);
  }
  order.sort((a, b) => (a === null ? 1 : 0) - (b === null ? 1 : 0));
  return order.map((t) => ({ theme: t ?? 'Autres supports', sets: byKind.filter((x) => (x.theme || null) === t) }));
}

export const QcmModule: React.FC<QcmModuleProps> = ({
  language,
  onRecordScore,
  folderSlug = null,
  setSlug = null,
  onNavigate,
  contests = [],
  isAuthed = false,
  onOpenContest,
  onRequestLogin,
  onOpenProfile,
  onOpenSalarySimulator,
}) => {
  const t = translations[language];
  const isRTL = language === 'ar';
  const NextIcon = isRTL ? ArrowLeft : ArrowRight;
  const PrevIcon = isRTL ? ArrowRight : ArrowLeft;

  const [selectedSet, setSelectedSet] = useState<QcmSet | null>(null);
  const { isStaff } = useSession();
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
  const selectedFolder = folderSlug;
  // Dossier ouvert : spécialité et nature de support choisies (filtres de l'écran 2).
  const [specFilter, setSpecFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<ContentType | null>(null);
  // Dossier en plusieurs langues (tests psychotechniques FR / AR / EN) : langue du contenu choisie.
  const [langFilter, setLangFilter] = useState<string | null>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    setSpecFilter(null);
    setTypeFilter(null);
    setLangFilter(null);
  }, [selectedFolder]);
  const navigate = (folder: string | null, set: string | null) => onNavigate?.(folder, set);
  // Nouveau chargement demandé après un échec réseau (bouton « Réessayer »).
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoadingSets(true);
    Promise.all([fetchQcmSets(), fetchQcmFolders(), loadQcmProgress().catch(() => ({}))])
      .then(([sets, fs, prog]) => {
        if (cancelled) return;
        setRealSets(sets);
        setFolders(fs);
        setProgress(prog);
      })
      .finally(() => { if (!cancelled) setLoadingSets(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);
  // Annales réelles et QCM d'entraînement : tous stockés en base, corrigés par le serveur.
  const allSets: QcmSet[] = realSets;
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

  const nextSteps = (set: QcmSet) => (
    <PrepNextSteps
      set={set}
      allSets={allSets}
      folders={folders}
      progress={progress}
      contests={contests}
      language={language}
      isAuthed={isAuthed}
      onOpenSet={(s) => {
        handleStartSet(s);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      onOpenContest={onOpenContest}
      onRequestLogin={onRequestLogin}
      onOpenProfile={onOpenProfile}
      onOpenSalarySimulator={onOpenSalarySimulator}
    />
  );

  // Une annale en arabe s'affiche de droite à gauche, même dans l'interface en français.
  const contentDir = (set: QcmSet | null) => (set?.contentLanguage === 'ar' ? 'rtl' : set?.contentLanguage === 'fr' || set?.contentLanguage === 'en' ? 'ltr' : undefined);

  // Timer effect when a set is active and not submitted
  useEffect(() => {
    let interval: any = null;
    if (selectedSet && !isWrittenSet(selectedSet) && !isSubmitted) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [selectedSet, isSubmitted]);

  const initQuiz = (set: QcmSet) => {
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
  const handleStartSet = (set: QcmSet) => {
    initQuiz(set);
    navigate(set.folderSlug || selectedFolder, urlKey(set));
  };

  // L'adresse décide du support ouvert (lien partagé, bouton retour du navigateur).
  useEffect(() => {
    if (loadingSets) return;
    if (!setSlug) {
      if (selectedSet) setSelectedSet(null);
      return;
    }
    const target = allSets.find((x) => urlKey(x) === setSlug || x.id === setSlug);
    if (!target) {
      // Ancienne adresse (avant les liens avec mots-clés) : on bascule vers la nouvelle.
      const moved = allSets.find((x) => x.oldSlugs?.includes(setSlug));
      navigate(moved ? moved.folderSlug || selectedFolder : selectedFolder, moved ? urlKey(moved) : null);
      return;
    }
    if (selectedSet?.id !== target.id) initQuiz(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSlug, loadingSets]);

  // Dossier renommé : l'ancienne adresse ouvre le dossier sous sa nouvelle adresse.
  useEffect(() => {
    if (loadingSets || !selectedFolder || setSlug || selectedFolder === '__autres') return;
    if (folders.some((f) => f.slug === selectedFolder)) return;
    const moved = folders.find((f) => f.oldSlugs?.includes(selectedFolder));
    if (moved) navigate(moved.slug, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolder, setSlug, loadingSets, folders]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => {
      const next = { ...prev };
      if (selectedSet?.multiAnswer) {
        // Plusieurs réponses justes possibles : chaque case se coche / se décoche.
        const ids = answerIds(prev[questionId]);
        const picked = ids.includes(optionId) ? ids.filter((x) => x !== optionId) : [...ids, optionId];
        if (picked.length) next[questionId] = joinAnswer(picked);
        else delete next[questionId];
      } else next[questionId] = optionId;
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
    gaEvent('qcm_complete', { set: selectedSet.slug, score, total: selectedSet.questions.length });
    saveProgress(selectedSet, { score });
    writeDraft(selectedSet.id, null);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fr = language === 'fr';
  // Série ou dossier entièrement en anglais : libellés en anglais (le site n'existe qu'en français et en arabe).
  const folderSets = selectedFolder ? setsOf(selectedFolder) : [];
  const en = selectedSet ? selectedSet.contentLanguage === 'en' : folderSets.length > 0 && folderSets.every((x) => x.contentLanguage === 'en');
  const L = (f: string, a: string, e: string) => (en ? e : fr ? f : a);
  const qp = en ? { ...t.preparation, ...EN_PLAYER } : t.preparation;
  const progressBar = (pct: number) => (
    <div className="w-full h-1.5 bg-[#F1E5EC] rounded-full overflow-hidden">
      <div className="h-full bg-[#8D174B] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );

  // Aucun support chargé (réseau) : message clair et nouvel essai, plutôt que des dossiers vides.
  if (!loadingSets && realSets.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadError language={language} onRetry={() => setReloadKey((k) => k + 1)} />
      </div>
    );
  }

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
              // Annales réelles = QCM transcrits + sujets écrits.
              const annales = sets.filter((x) => x.kind === 'annales' || x.kind === 'sujet').length;
              const specs = new Set(sets.map((x) => x.theme).filter(Boolean)).size;
              return (
                <button
                  key={f.slug}
                  onClick={() => navigate(f.slug, null)}
                  className="text-start flex flex-col justify-start bg-white border border-[#F1E5EC] hover:border-[#8D174B]/40 rounded-3xl p-5 shadow-xs hover:shadow-md hover-scale active:scale-95 transition-all cursor-pointer animate-fade-in overflow-hidden"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {f.coverImage ? (
                    <div className="-mx-5 -mt-5 mb-4 h-28 sm:h-32 relative">
                      <img src={f.coverImage} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/70 to-transparent" />
                    </div>
                  ) : (
                    // Par défaut : logo officiel de l'organisme des concours du dossier.
                    <OrgLogosBand orgs={setOrgs(sets)} className="-mx-5 -mt-5 mb-4 h-28 sm:h-32 border-b border-[#F1E5EC]" />
                  )}
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
                    {specs > 1 && (
                      <span className="px-2 py-0.5 rounded-md bg-[#FDF2F7] text-[#8D174B] border border-[#8D174B]/15 font-bold">
                        {specs} {fr ? 'spécialités' : 'تخصص'}
                      </span>
                    )}
                    {annales > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        {annales} {fr ? (annales > 1 ? 'annales réelles' : 'annale réelle') : 'نموذج حقيقي'}
                      </span>
                    )}
                    {st.total > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold">
                        {st.total} {fr ? 'questions' : 'سؤال'}
                      </span>
                    )}
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
    const renderSetCard = (set: QcmSet, i: number) => {
              if (isWrittenSet(set)) {
                return (
                  <div
                    key={set.id}
                    className="bg-white border border-[#F1E5EC] hover:border-[#8D174B]/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between animate-fade-in"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#6E6773] mb-3 gap-2">
                        <TypeBadge set={set} fr={fr} en={en} />
                        {set.examYear && <span className="font-bold text-[#8D174B]">{set.examYear}</span>}
                      </div>
                      <h3 dir="auto" className="text-base font-bold text-[#242126] mb-2">{set.title[language]}</h3>
                      <ConcoursRef set={set} language={language} />
                      {!!set.sourceImages?.length && (
                        <p className="text-[11px] font-bold text-emerald-800 mb-2 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {L(`Photo du sujet original incluse (${set.sourceImages.length} p.)`, `صورة الموضوع الأصلي مرفقة (${set.sourceImages.length} ص)`, `Photo of the original paper included (${set.sourceImages.length} p.)`)}
                        </p>
                      )}
                    </div>
                    <div className="pt-3 border-t border-[#F1E5EC] flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[#6E6773]">
                        {set.corrige
                          ? L('Énoncé complet + corrigé KounKour', 'نص كامل + تصحيح KounKour', 'Full paper + KounKour answers')
                          : L('Énoncé complet, sans corrigé officiel', 'نص كامل، بدون تصحيح رسمي', 'Full paper, no official answers')}
                      </span>
                      <button
                        onClick={() => handleStartSet(set)}
                        className="px-4 py-2 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                      >
                        {L('Lire le sujet', 'قراءة الموضوع', 'Read the paper')}
                        <NextIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }
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
                      <TypeBadge set={set} fr={fr} en={en} />
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{set.durationMinutes} {qp.minutes}</span>
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-[#242126] mb-2">{set.title[language]}</h3>
                    <ConcoursRef set={set} language={language} />
                    {!!set.sourceImages?.length && (
                      <p className="text-[11px] font-bold text-emerald-800 mb-2 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {L(`Photo du sujet original incluse (${set.sourceImages.length} p.)`, `صورة الموضوع الأصلي مرفقة (${set.sourceImages.length} ص)`, `Photo of the original paper included (${set.sourceImages.length} p.)`)}
                      </p>
                    )}
                    <p className="text-xs text-[#6E6773] leading-relaxed mb-4 line-clamp-3">{set.description[language]}</p>
                  </div>

                  <div className="space-y-2">
                    {progressBar(pct)}
                    <div className="flex items-center justify-between text-[11px] text-[#6E6773] gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-[#8D174B]" />
                        {seen === 0 ? L('Non consulté', 'لم تطلع عليه', 'Not started') : L(`${seen}/${total} questions vues (${pct} %)`, `${seen}/${total} (${pct}٪)`, `${seen}/${total} questions seen (${pct}%)`)}
                      </span>
                      {p?.bestScore !== null && p?.bestScore !== undefined && (
                        <span className="flex items-center gap-1 font-bold text-[#242126]">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          {L(`Meilleur score ${p.bestScore}/${total}`, `أفضل نتيجة ${p.bestScore}/${total}`, `Best score ${p.bestScore}/${total}`)}
                        </span>
                      )}
                    </div>
                    <div className="pt-2 border-t border-[#F1E5EC] flex items-center justify-between">
                      <span className="text-xs font-medium text-[#242126]">{total} {qp.questions}</span>
                      <button
                        onClick={() => handleStartSet(set)}
                        className="px-4 py-2 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>
                          {seen === 0 ? qp.startQcm : p?.attempts ? L('Refaire', 'إعادة', 'Retake') : L('Continuer', 'متابعة', 'Continue')}
                        </span>
                        <NextIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
    };
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <button
          onClick={() => navigate(null, null)}
          className="mb-4 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF4F7] text-[#8D174B] border border-[#8D174B]/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <PrevIcon className="w-4 h-4" />
          {L('Tous les concours', 'كل المباريات', 'All exams')}
        </button>

        {folder?.coverImage ? (
          <div className="relative h-36 sm:h-48 rounded-3xl overflow-hidden mb-3 animate-fade-in">
            <img src={folder.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
          </div>
        ) : (
          <OrgLogosBand orgs={setOrgs(sets)} className="h-32 sm:h-40 rounded-3xl border border-[#F1E5EC] mb-3 animate-fade-in" />
        )}
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
                  {L(`Progression du dossier : ${st.seen}/${st.total} questions vues (${st.pct} %)`, `تقدم الملف: ${st.seen}/${st.total} (${st.pct}٪)`, `Your progress: ${st.seen}/${st.total} questions seen (${st.pct}%)`)}
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
          (() => {
            // Écran du dossier : 1) la spécialité (cartes), 2) la nature du support (filtres),
            // 3) les supports de la spécialité rangés par nature, toujours dans le même ordre.
            // Langues présentes dans le dossier ; le filtre ne s'affiche que s'il y en a plusieurs.
            const langs = ['fr', 'ar', 'en'].filter((l) => sets.some((x) => (x.contentLanguage || 'fr') === l));
            const groups = themeGroups(langFilter ? sets.filter((x) => (x.contentLanguage || 'fr') === langFilter) : sets);
            const hasSpecs = groups.length > 1;
            const inSpec = groups.filter((g) => !specFilter || g.theme === specFilter);
            const pool = inSpec.flatMap((g) => g.sets);
            const countBy = (list: QcmSet[]) =>
              CONTENT_TYPES.map((ct) => [ct, list.filter((x) => contentType(x) === ct).length] as const).filter(([, n]) => n > 0);
            const types = countBy(pool);
            const pickSpec = (name: string | null) => {
              setSpecFilter(name);
              setTypeFilter(null);
              requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
            };
            const chip = (active: boolean, idle: string) =>
              `shrink-0 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-bold cursor-pointer transition-all active:scale-95 ${
                active ? 'bg-[#8D174B] text-white border-[#8D174B] shadow-sm' : idle
              }`;
            return (
              <div className="space-y-6">
                {langs.length > 1 && (
                  <div className="flex flex-wrap items-center gap-2 animate-fade-in" role="group" aria-label={fr ? 'Langue des exercices' : 'لغة التمارين'}>
                    <span className="text-[12px] font-bold text-[#6E6773]">{fr ? 'Langue :' : 'اللغة:'}</span>
                    {[null, ...langs].map((l) => (
                      <button
                        key={l || 'all'}
                        onClick={() => {
                          setLangFilter(l);
                          setSpecFilter(null);
                          setTypeFilter(null);
                        }}
                        className={chip(langFilter === l, 'bg-white text-[#6E6773] border-[#F1E5EC]')}
                      >
                        {l === null ? (fr ? 'Toutes' : 'الكل') : l === 'fr' ? 'Français' : l === 'ar' ? 'العربية' : 'English'}
                      </button>
                    ))}
                  </div>
                )}
                {hasSpecs && (
                  <section className="animate-fade-in">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h3 className="text-sm sm:text-base font-extrabold text-[#242126]">{L('Choisissez votre spécialité', 'اختر تخصصك', 'Choose a question type')}</h3>
                      <span className="text-[11px] text-[#6E6773]">{groups.length} {L('spécialités', 'تخصص', 'types')}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {groups.map((g, gi) => {
                        const on = specFilter === g.theme;
                        return (
                          <button
                            key={g.theme || '__all'}
                            onClick={() => pickSpec(on ? null : g.theme)}
                            aria-pressed={on}
                            className={`text-start rounded-2xl border p-3 transition-all cursor-pointer hover-scale hover:shadow-md active:scale-95 animate-fade-in ${
                              on ? 'border-[#8D174B] bg-[#FDF2F7] shadow-md ring-2 ring-[#8D174B]/20' : 'border-[#F1E5EC] bg-white'
                            }`}
                            style={{ animationDelay: `${gi * 60}ms` }}
                          >
                            <span dir="auto" className="flex items-start gap-1.5 text-[13px] font-extrabold text-[#242126] leading-snug">
                              <FolderOpen className="w-4 h-4 text-[#8D174B] shrink-0 mt-0.5" />
                              {g.theme}
                            </span>
                            <span className="mt-2 flex flex-wrap gap-1">
                              {countBy(g.sets).map(([ct, n]) => {
                                const M = TYPE_META[ct];
                                const I = M.icon;
                                return (
                                  <span key={ct} title={L(M.fr, M.ar, M.en)} className={`inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10.5px] font-bold ${M.cls}`}>
                                    <I className="w-3 h-3" />
                                    {n} {en ? M.enShort[n > 1 ? 1 : 0] : fr ? M.short[n > 1 ? 1 : 0] : M.short[2]}
                                  </span>
                                );
                              })}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                <div ref={resultsRef} className="scroll-mt-24">
                  {specFilter && (
                    <div className="flex items-center justify-between gap-2 mb-3 animate-fade-in">
                      <h3 dir="auto" className="flex items-center gap-2 text-base sm:text-lg font-extrabold text-[#8D174B] min-w-0">
                        <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#8D174B] to-[#C73578] shrink-0" />
                        {specFilter}
                      </h3>
                      <button
                        onClick={() => pickSpec(null)}
                        className="shrink-0 text-[11px] font-bold text-[#8D174B] bg-white border border-[#8D174B]/20 rounded-lg px-2.5 py-1 cursor-pointer active:scale-95"
                      >
                        {L('Toutes les spécialités', 'كل التخصصات', 'All types')}
                      </button>
                    </div>
                  )}
                  {types.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 mb-5">
                      <button onClick={() => setTypeFilter(null)} className={chip(!typeFilter, 'bg-white text-[#6E6773] border-[#F1E5EC]')}>
                        {L('Tout', 'الكل', 'All')} · {pool.length}
                      </button>
                      {types.map(([ct, n]) => {
                        const M = TYPE_META[ct];
                        const I = M.icon;
                        return (
                          <button key={ct} onClick={() => setTypeFilter(typeFilter === ct ? null : ct)} className={chip(typeFilter === ct, M.cls)}>
                            <I className="w-3.5 h-3.5" />
                            {L(M.fr, M.ar, M.en)} · {n}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="space-y-8">
                    {inSpec.map((g, gi) => {
                      const blocks = CONTENT_TYPES.filter((ct) => !typeFilter || ct === typeFilter)
                        .map((ct) => [ct, g.sets.filter((x) => contentType(x) === ct)] as const)
                        .filter(([, list]) => list.length > 0);
                      if (!blocks.length) return null;
                      return (
                        <section key={g.theme || '__all'} className="animate-fade-in" style={{ animationDelay: `${gi * 80}ms` }}>
                          {g.theme && !specFilter && (
                            <div className="flex items-center gap-2 mb-3">
                              <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#8D174B] to-[#C73578]" />
                              <h3 dir="auto" className="text-sm sm:text-base font-extrabold text-[#242126]">{g.theme}</h3>
                              <span className="text-[11px] font-bold text-[#8D174B] bg-[#FDF2F7] border border-[#8D174B]/15 px-2 py-0.5 rounded-full">{g.sets.length}</span>
                            </div>
                          )}
                          <div className="space-y-5">
                            {blocks.map(([ct, list]) => {
                              const M = TYPE_META[ct];
                              const I = M.icon;
                              return (
                                <div key={ct}>
                                  <p className={`inline-flex items-center gap-1.5 text-[12px] font-extrabold rounded-lg border px-2.5 py-1 mb-2.5 ${M.cls}`}>
                                    <I className="w-3.5 h-3.5" />
                                    {L(M.fr, M.ar, M.en)} · {list.length}
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{list.map((set, i) => renderSetCard(set, i))}</div>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    );
  }

  if (!selectedSet) return null;

  if (isWrittenSet(selectedSet)) {
    return (
      <SujetView
        set={selectedSet}
        language={language}
        isStaff={isStaff}
        onBack={() => navigate(selectedSet.folderSlug || selectedFolder, null)}
        footer={nextSteps(selectedSet)}
        onImages={(images) => {
          setSelectedSet((s) => (s ? { ...s, sourceImages: images } : s));
          setRealSets((all) => all.map((x) => (x.id === selectedSet.id ? { ...x, sourceImages: images } : x)));
        }}
      />
    );
  }

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
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
      {/* Top action bar: Back to catalog, timer, progress */}
      <div className="bg-white border border-[#F1E5EC] rounded-2xl px-3 py-2.5 sm:p-4 shadow-xs mb-3 sm:mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(selectedSet.folderSlug || selectedFolder, null)}
          className="text-xs font-semibold text-[#8D174B] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <PrevIcon className="w-4 h-4" />
          <span>{L('Retour au dossier', 'الرجوع إلى الملف', 'Back to the folder')}</span>
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

      {/* Concours d'origine : titre réel et année de la session */}
      {/* Sur téléphone : carte compacte, pour que la question et ses choix restent visibles sans défiler. */}
      <div className="bg-white border border-[#F1E5EC] rounded-2xl p-3 sm:p-4 shadow-xs mb-3 sm:mb-6 animate-fade-in">
        <h2 dir="auto" className="text-[13px] sm:text-base font-extrabold text-[#242126] leading-snug mb-2">{selectedSet.title[language] || selectedSet.title.fr}</h2>
        <div className="sm:hidden">
          <ConcoursRef set={selectedSet} language={language} variant="card" />
        </div>
        <div className="hidden sm:block">
          <ConcoursRef set={selectedSet} language={language} variant="header" />
        </div>
      </div>

      {/* Photos du sujet original (annales) : consultables pendant l'entraînement et la correction */}
      {(!!selectedSet.sourceImages?.length || (isStaff && selectedSet.kind === 'annales')) && (
        <div className="mb-6 space-y-2">
          <AnnaleImages images={selectedSet.sourceImages || []} language={language} sourceUrl={selectedSet.sourceUrl} sourceNote={selectedSet.sourceNote} />
          {isStaff && selectedSet.kind === 'annales' && (
            <AnnalePhotosAdmin
              setId={selectedSet.id}
              slug={selectedSet.slug}
              images={selectedSet.sourceImages || []}
              sourceUrl={selectedSet.sourceUrl}
              onChange={(images) => {
                setSelectedSet((s) => (s ? { ...s, sourceImages: images } : s));
                setRealSets((all) => all.map((x) => (x.id === selectedSet.id ? { ...x, sourceImages: images } : x)));
              }}
            />
          )}
        </div>
      )}

      {/* Result view if submitted */}
      {isSubmitted ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[#FFFDFE] border border-[#F1E5EC] rounded-3xl p-6 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#FDF2F7] text-[#8D174B] flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#242126] mb-1">{qp.qcmResult}</h3>
            <div className="text-3xl font-extrabold text-[#8D174B] mb-2">
              {score} / {selectedSet.questions.length}
            </div>
            <p className="text-xs sm:text-sm text-[#6E6773] max-w-md mx-auto mb-6">
              {score === selectedSet.questions.length
                ? qp.congratulations
                : score >= selectedSet.questions.length / 2
                ? qp.goodEffort
                : qp.needsWork}
            </p>

            <button
              onClick={() => initQuiz(selectedSet)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{qp.restart}</span>
            </button>
          </div>

          {nextSteps(selectedSet)}

          {/* Detailed corrections review */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-[#242126] uppercase tracking-wide">
              {en ? 'Detailed answers' : language === 'fr' ? 'Correction détaillée des questions' : 'التصحيح المفصل للأسئلة'}
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
            {selectedSet.kind !== 'annales' && selectedSet.sourceNote && (
              <p className="text-[11px] text-[#6E6773] bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl p-3 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8D174B] shrink-0" />
                <span dir={contentDir(selectedSet)}>{selectedSet.sourceNote}</span>
              </p>
            )}

            {selectedSet.questions.map((q, idx) => {
              const userChoice = userAnswers[q.id];
              const corr = correctionOf(q);
              const isCorrect = !!corr.correctOptionId && userChoice === corr.correctOptionId;
              const chosen = answerIds(userChoice);
              const rightIds = answerIds(corr.correctOptionId);

              return (
                <div key={q.id} dir={contentDir(selectedSet)} className="bg-white border border-[#F1E5EC] rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="flex items-center gap-2 text-xs font-bold text-[#8D174B]">
                      <span className="min-w-[28px] h-7 px-1.5 rounded-full bg-[#8D174B] text-white text-[13px] font-black flex items-center justify-center">{idx + 1}</span>
                      {selectedSet.kind === 'annales' && q.number ? (language === 'fr' ? `n° ${q.number} du sujet` : `رقم ${q.number} في الموضوع`) : ''}
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

                  <p className="text-[15px] font-bold text-[#242126] leading-snug mb-3 whitespace-pre-line">{q.text[language]}</p>

                  <div className="space-y-2 mb-4">
                    {q.options.map((opt, oi) => {
                      const isUserChoice = chosen.includes(opt.id);
                      const isRealCorrect = rightIds.includes(opt.id);

                      let style = 'bg-[#F8F2F5] text-[#242126] border-transparent';
                      if (isRealCorrect) {
                        style = 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold';
                      } else if (isUserChoice && !isRealCorrect) {
                        style = 'bg-rose-50 text-rose-900 border-rose-300 line-through';
                      }

                      return (
                        <div key={opt.id} className={`p-3 rounded-xl border text-[13.5px] leading-snug flex items-center justify-between gap-2 ${style}`}>
                          <span className="flex items-start gap-2.5 min-w-0">
                            <OptionLetter i={oi} tone={isRealCorrect ? 'right' : isUserChoice ? 'wrong' : 'idle'} />
                            <span className="pt-0.5">{opt.text[language]}</span>
                          </span>
                          {isRealCorrect && selectedSet.multiAnswer && !isUserChoice && (
                            <span className="text-[10px] font-bold text-emerald-700 shrink-0">{language === 'fr' ? 'à cocher' : 'كان يجب التأشير'}</span>
                          )}
                          {isRealCorrect && (!selectedSet.multiAnswer || isUserChoice) && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {isUserChoice && !isRealCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explication */}
                  <div className="p-3.5 rounded-xl bg-[#FDF2F7] border border-[#8D174B]/15 text-[13px] text-[#242126]">
                    <strong className="block text-[#8D174B] font-bold mb-1">
                      {qp.explanation}
                    </strong>
                    <p className="text-[#4A4350] leading-relaxed mb-1.5">{corr.explanation}</p>
                    {corr.source && <span className="text-[10px] text-[#6E6773] italic">Source : {corr.source}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Active Single Question View */
        <div className="bg-white border border-[#F1E5EC] rounded-3xl p-4 sm:p-8 shadow-sm">
          {/* Progress bar */}
          <div className="w-full bg-[#F1E5EC] h-1.5 rounded-full overflow-hidden mb-5">
            <div
              className="bg-[#8D174B] h-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / selectedSet.questions.length) * 100}%` }}
            />
          </div>

          <div className="mb-5 flex items-start gap-3" dir={contentDir(selectedSet)}>
            <span className="min-w-[34px] h-[34px] px-1.5 rounded-full bg-[#8D174B] text-white text-sm font-black flex items-center justify-center shrink-0 animate-scale-in" key={currentQuestionIndex}>
              {currentQuestionIndex + 1}
            </span>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-[#8D174B] uppercase tracking-wider mb-1 block">
                {qp.question} {currentQuestionIndex + 1} {qp.of} {selectedSet.questions.length}
              </span>
              <h3 className="text-[16px] sm:text-lg font-bold text-[#242126] leading-snug whitespace-pre-line">
                {currentQ.text[language]}
              </h3>
            </div>
          </div>

          {selectedSet.multiAnswer && (
            <p className="-mt-3 mb-4 text-[11px] font-semibold text-[#8D174B] bg-[#FDF2F7] border border-[#8D174B]/15 rounded-lg px-3 py-2">
              {language === 'fr'
                ? 'Cochez la ou les réponses justes : la question est juste seulement si toutes les bonnes cases sont cochées, et aucune fausse.'
                : 'أشّر على الجواب أو الأجوبة الصحيحة: يُحتسب السؤال صحيحا فقط إذا أشّرت على كل الأجوبة الصحيحة دون أي جواب خاطئ.'}
            </p>
          )}

          {/* Options */}
          <div className="space-y-3 mb-8" dir={contentDir(selectedSet)}>
            {currentQ.options.map((opt, oi) => {
              const isSelected = answerIds(userAnswers[currentQ.id]).includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(currentQ.id, opt.id)}
                  className={`w-full min-h-[52px] px-3.5 py-3 rounded-xl border text-[14.5px] sm:text-sm leading-snug font-medium text-start transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'border-[#8D174B] bg-[#FDF2F7] text-[#8D174B] font-bold shadow-xs'
                      : 'border-[#EADCE5] bg-[#FDFAFC] hover:bg-[#F8F2F5] text-[#242126]'
                  }`}
                >
                  <span className="flex items-start gap-3 min-w-0">
                    <OptionLetter i={oi} tone={isSelected ? 'selected' : 'idle'} />
                    <span className="pt-0.5">{opt.text[language]}</span>
                  </span>
                  <div className={`w-5 h-5 ${selectedSet.multiAnswer ? 'rounded-md' : 'rounded-full'} border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-[#8D174B] bg-[#8D174B] text-white' : 'border-[#F1E5EC]'
                  }`}>
                    {isSelected && (selectedSet.multiAnswer ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="w-2 h-2 rounded-full bg-white"></span>)}
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
              <span>{qp.prevQuestion}</span>
            </button>

            {currentQuestionIndex < selectedSet.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="px-5 py-2.5 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>{qp.nextQuestion}</span>
                <NextIcon className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleSubmit}
                  disabled={grading}
                  className="px-6 py-2.5 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  {grading ? (en ? 'Grading…' : fr ? 'Correction…' : 'جارٍ التصحيح…') : qp.finishQcm}
                </button>
                {gradeError && (
                  <span className="text-[11px] text-rose-700">
                    {en ? 'Grading unavailable (connection). Please try again.' : fr ? 'Correction indisponible (connexion). Réessayez.' : 'تعذر التصحيح (الاتصال). أعد المحاولة.'}
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
