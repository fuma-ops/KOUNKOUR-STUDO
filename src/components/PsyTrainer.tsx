import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Brain, Check, ChevronRight, Clock, Flame, RotateCcw, Trophy, X, Zap } from 'lucide-react';
import type { Language } from '../types';
import { LEVELS, type PsyCategory, type PsyLevel, type PsyQuestion } from '../psy/core';
import { generate, generateMixed } from '../psy/generators';
import { PSY_CSS, optionHtml, questionHtml } from '../psy/render';
import { PSY_CATS, PSY_HUB, psyCatBySlug, psyCatDoc, type PsyCatDoc } from '../psy/content';
import { NewContestsAlertCard } from './AlertMe';
import { gaEvent } from '../lib/analytics';

interface Props {
  language: Language;
  slug: string | null; // famille ouverte (null = accueil des tests)
  onOpenCat: (slug: string | null) => void;
  onOpenRecruiters: () => void;
  onOpenFolder: () => void;
}

const LEVEL_FR: Record<PsyLevel, string> = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' };
const SESSION = 10;
const BEST_KEY = 'kk:psy-best';
const LEVEL_KEY = 'kk:psy-level';

type Best = Record<string, number>; // `${cat|mixte}:${niveau}` → meilleur score en %
const readBest = (): Best => {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) || '{}');
  } catch {
    return {};
  }
};

// Petites vignettes des familles (SVG, aucune image).
const CAT_ICON: Record<PsyCategory, string> = {
  matrices:
    '<svg viewBox="0 0 40 40"><g fill="none" stroke="currentColor" stroke-width="2.4"><rect x="4" y="4" width="32" height="32" rx="3"/><path d="M15 4v32M25 4v32M4 15h32M4 25h32"/></g><circle cx="9.5" cy="9.5" r="3" fill="currentColor"/><rect x="17" y="17" width="6" height="6" fill="currentColor"/><text x="30.5" y="34" font-size="9" font-weight="800" text-anchor="middle" fill="currentColor">?</text></svg>',
  dominos:
    '<svg viewBox="0 0 40 40"><g fill="none" stroke="currentColor" stroke-width="2.4"><rect x="5" y="4" width="13" height="32" rx="3"/><rect x="22" y="4" width="13" height="32" rx="3"/><path d="M5 20h13M22 20h13"/></g><g fill="currentColor"><circle cx="11.5" cy="12" r="2.2"/><circle cx="8.5" cy="25" r="2"/><circle cx="14.5" cy="31" r="2"/><circle cx="25.5" cy="9" r="2"/><circle cx="31.5" cy="15" r="2"/><circle cx="28.5" cy="28" r="2.2"/></g></svg>',
  cubes:
    '<svg viewBox="0 0 40 40"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M20 4 35 12v16L20 36 5 28V12z"/><path d="M5 12l15 8 15-8M20 20v16"/></g></svg>',
  mecanique:
    '<svg viewBox="0 0 40 40"><g fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="14" cy="22" r="8"/><circle cx="28" cy="12" r="6"/><circle cx="14" cy="22" r="2.5"/></g><path d="M14 10v-3M14 37v-3M2 22h3M23 22h3M28 3v2M28 19v2M19 12h2M35 12h2" stroke="currentColor" stroke-width="2.6"/></svg>',
  attention:
    '<svg viewBox="0 0 40 40" fill="currentColor"><rect x="5" y="5" width="8" height="8"/><path d="M9 5V1" stroke="currentColor" stroke-width="2.4"/><rect x="26" y="5" width="8" height="8"/><path d="M34 9h4" stroke="currentColor" stroke-width="2.4"/><rect x="5" y="27" width="8" height="8"/><path d="M13 35l3 3" stroke="currentColor" stroke-width="2.4"/><rect x="26" y="27" width="8" height="8"/><path d="M30 27v-4" stroke="currentColor" stroke-width="2.4"/><circle cx="30" cy="9" r="9" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".5"/></svg>',
  suites:
    '<svg viewBox="0 0 40 40"><g fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="13" width="10" height="14" rx="2.5"/><rect x="15" y="13" width="10" height="14" rx="2.5"/><rect x="28" y="13" width="10" height="14" rx="2.5" stroke-dasharray="3 2"/></g><g font-size="9" font-weight="800" text-anchor="middle" fill="currentColor" font-family="system-ui"><text x="7" y="23.5">2</text><text x="20" y="23.5">4</text><text x="33" y="23.5">?</text></g></svg>',
};
const Icon: React.FC<{ cat: PsyCategory; className?: string }> = ({ cat, className }) => (
  <span className={`inline-block ${className || ''}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: CAT_ICON[cat] }} />
);

interface Answer {
  chosen: string | null; // null = temps écoulé
  ok: boolean;
  ms: number;
}

export const PsyTrainer: React.FC<Props> = ({ language, slug, onOpenCat, onOpenRecruiters, onOpenFolder }) => {
  const doc = slug ? psyCatBySlug(slug) : null;
  const [level, setLevel] = useState<PsyLevel>(() => {
    try {
      const v = localStorage.getItem(LEVEL_KEY) as PsyLevel | null;
      return v && LEVELS.includes(v) ? v : 'facile';
    } catch {
      return 'facile';
    }
  });
  const [best, setBest] = useState<Best>(readBest);
  const [run, setRun] = useState<{ key: string; label: string; questions: PsyQuestion[] } | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem(LEVEL_KEY, level);
    } catch {
      /* stockage indisponible */
    }
  }, [level]);
  // Changer de page arrête la série en cours.
  useEffect(() => setRun(null), [slug]);

  const start = (cat: PsyCategory | 'mixte') => {
    const seed = `${Date.now()}-${Math.random()}`;
    const questions = cat === 'mixte' ? generateMixed(seed, level, 12) : Array.from({ length: SESSION }, (_, i) => generate(cat, `${seed}-${i}`, level));
    setRun({ key: `${cat}:${level}`, label: cat === 'mixte' ? 'Test complet' : psyCatDoc(cat).name, questions });
    gaEvent('psy_start', { cat, level });
    window.scrollTo({ top: 0 });
  };
  const finish = (pct: number) => {
    if (!run) return;
    const next = { ...readBest() };
    if ((next[run.key] ?? -1) < pct) next[run.key] = pct;
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(next));
    } catch {
      /* stockage indisponible */
    }
    setBest(next);
    gaEvent('psy_finish', { key: run.key, pct });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 sm:py-8 pb-28 md:pb-10" dir="ltr" lang="fr">
      <style>{PSY_CSS}</style>
      {language === 'ar' && !run && (
        <p className="mb-3 text-[12px] text-[#6E6773] bg-[#FAF4F7] rounded-xl px-3 py-2" dir="rtl">هذه التمارين متوفرة بالفرنسية فقط.</p>
      )}
      {run ? (
        <Player
          key={run.questions[0].id}
          label={run.label}
          level={level}
          questions={run.questions}
          onFinish={finish}
          onQuit={() => setRun(null)}
          onRestart={() => start(run.key.split(':')[0] as PsyCategory | 'mixte')}
          onHarder={
            level !== 'difficile'
              ? () => {
                  const nl = LEVELS[LEVELS.indexOf(level) + 1];
                  setLevel(nl);
                  setRun(null);
                }
              : undefined
          }
          language={language}
          onOpenCat={onOpenCat}
        />
      ) : doc ? (
        <CatPage doc={doc} level={level} setLevel={setLevel} best={best} onStart={() => start(doc.cat)} onOpenCat={onOpenCat} onOpenRecruiters={onOpenRecruiters} />
      ) : (
        <Hub level={level} setLevel={setLevel} best={best} onStart={start} onOpenCat={onOpenCat} onOpenRecruiters={onOpenRecruiters} onOpenFolder={onOpenFolder} />
      )}
    </div>
  );
};

const LevelChips: React.FC<{ level: PsyLevel; setLevel: (l: PsyLevel) => void }> = ({ level, setLevel }) => (
  <div className="inline-flex rounded-2xl bg-[#F6EEF2] p-1" role="radiogroup" aria-label="Niveau">
    {LEVELS.map((l) => (
      <button
        key={l}
        type="button"
        role="radio"
        aria-checked={level === l}
        onClick={() => setLevel(l)}
        className={`px-3.5 py-2 rounded-xl text-[13px] font-extrabold cursor-pointer active:scale-95 transition-all ${level === l ? 'bg-white text-[#8D174B] shadow-sm' : 'text-[#6E6773]'}`}
      >
        {LEVEL_FR[l]}
      </button>
    ))}
  </div>
);

const Faq: React.FC<{ items: { q: string; a: string }[] }> = ({ items }) => (
  <section className="mt-8">
    <h2 className="text-lg font-extrabold text-[#242126] mb-3">Questions fréquentes</h2>
    <div className="space-y-2">
      {items.map((f) => (
        <details key={f.q} className="group bg-white border border-[#F1E5EC] rounded-2xl px-4 py-3">
          <summary className="cursor-pointer list-none flex items-center justify-between gap-3 font-bold text-[14px] text-[#242126]">
            {f.q}
            <ChevronRight className="w-4 h-4 text-[#8D174B] shrink-0 transition-transform group-open:rotate-90" />
          </summary>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#4A4250]">{f.a}</p>
        </details>
      ))}
    </div>
  </section>
);

const Disclaimer = () => (
  <p className="mt-6 text-[11.5px] text-[#8E8694]">
    Exercices d'entraînement générés par KounKour sur les formats classiques des tests psychotechniques : ce ne sont pas les tests officiels des recruteurs.
  </p>
);

// ─── Accueil des tests ──────────────────────────────────────────────────────
const Hub: React.FC<{
  level: PsyLevel;
  setLevel: (l: PsyLevel) => void;
  best: Best;
  onStart: (c: PsyCategory | 'mixte') => void;
  onOpenCat: (slug: string | null) => void;
  onOpenRecruiters: () => void;
  onOpenFolder: () => void;
}> = ({ level, setLevel, best, onStart, onOpenCat, onOpenRecruiters, onOpenFolder }) => {
  // Aperçu vivant : une question d'exemple qui change toutes les 4 secondes.
  const [demo, setDemo] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDemo((d) => d + 1), 4000);
    return () => clearInterval(t);
  }, []);
  const demoQ = useMemo(() => generate(PSY_CATS[demo % 6].cat, `demo-${demo % 6}`, 'moyen'), [demo]);
  return (
    <>
      <div className="lg:grid lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          <header className="animate-fade-in">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#8D174B] flex items-center gap-1.5">
              <Brain className="w-4 h-4" /> Gratuit · sans inscription · illimité
            </p>
            <h1 className="mt-1 text-[22px] sm:text-3xl font-extrabold text-[#242126] leading-tight">{PSY_HUB.h1}</h1>
            <p className="mt-2 text-[13.5px] sm:text-[15px] text-[#4A4250] leading-relaxed">{PSY_HUB.intro}</p>
          </header>
          <div className="mt-4 flex flex-wrap items-center gap-3 animate-fade-in" style={{ animationDelay: '80ms' }}>
            <LevelChips level={level} setLevel={setLevel} />
            {best[`mixte:${level}`] !== undefined && <span className="text-[12px] font-bold text-[#6E6773]">Meilleur test complet : {best[`mixte:${level}`]} %</span>}
          </div>
          <button
            type="button"
            onClick={() => onStart('mixte')}
            className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#8D174B] text-white px-6 py-4 text-[15px] font-extrabold shadow-lg shadow-[#8D174B]/25 cursor-pointer active:scale-95 hover:shadow-xl transition-all animate-cta-bounce"
          >
            <Zap className="w-5 h-5" /> Test complet chronométré · 12 questions
          </button>

          <h2 className="mt-8 mb-3 text-lg font-extrabold text-[#242126]">Choisissez une famille d'exercices</h2>
          <div className="grid grid-cols-2 gap-3">
            {PSY_CATS.map((c, i) => {
              const b = best[`${c.cat}:${level}`];
              return (
                <a
                  key={c.cat}
                  href={`/tests-psychotechniques/en-ligne/${c.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenCat(c.slug);
                    window.scrollTo({ top: 0 });
                  }}
                  className="group bg-white border border-[#F1E5EC] rounded-2xl p-3.5 hover:border-[#8D174B]/40 hover:shadow-md hover-scale active:scale-95 transition-all cursor-pointer animate-fade-in flex flex-col"
                  style={{ animationDelay: `${120 + i * 80}ms` }}
                >
                  <span className="w-11 h-11 rounded-xl bg-[#FDF2F7] text-[#8D174B] flex items-center justify-center">
                    <Icon cat={c.cat} className="w-7 h-7" />
                  </span>
                  <span className="mt-2 text-[14px] font-extrabold text-[#242126] leading-snug">{c.name}</span>
                  <span className="mt-0.5 text-[11.5px] text-[#6E6773] leading-snug flex-1">{c.tagline}</span>
                  <span className="mt-2 flex items-center justify-between text-[11px] font-bold">
                    {b !== undefined ? <span className="text-emerald-700 flex items-center gap-1"><Trophy className="w-3.5 h-3.5" />{b} %</span> : <span className="text-[#8D174B]">Commencer</span>}
                    <ChevronRight className="w-4 h-4 text-[#8D174B] group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Panneau de droite : aperçu animé + liens utiles (tablette / ordinateur). */}
        <aside className="mt-8 lg:mt-0 lg:col-span-2 lg:sticky lg:top-4 self-start space-y-4">
          <div className="bg-white border border-[#F1E5EC] rounded-3xl p-4 shadow-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#8D174B]">Aperçu · {psyCatDoc(demoQ.category).name}</p>
            <div key={demo} className="mt-3 animate-fade-in pointer-events-none" style={{ maxHeight: 260, overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: questionHtml(demoQ, `demo${demo}`) }} />
          </div>
          <div className="bg-[#FDF2F7] rounded-3xl p-4">
            <p className="font-extrabold text-[14px] text-[#242126]">Préparez un recrutement précis</p>
            <p className="mt-1 text-[12.5px] text-[#4A4250]">ONCF, Royal Air Maroc, Protection civile, FAR, OCP… ce que chaque recruteur annonce, source à l'appui.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={onOpenRecruiters} className="rounded-xl bg-white px-3 py-2 text-[12.5px] font-bold text-[#8D174B] cursor-pointer active:scale-95 hover:shadow-md transition-all">
                Tests par recruteur
              </button>
              <button type="button" onClick={onOpenFolder} className="rounded-xl bg-white px-3 py-2 text-[12.5px] font-bold text-[#8D174B] cursor-pointer active:scale-95 hover:shadow-md transition-all">
                Séries QCM corrigées
              </button>
            </div>
          </div>
        </aside>
      </div>
      <Faq items={PSY_HUB.faq} />
      <Disclaimer />
    </>
  );
};

// ─── Page d'une famille ─────────────────────────────────────────────────────
const CatPage: React.FC<{
  doc: PsyCatDoc;
  level: PsyLevel;
  setLevel: (l: PsyLevel) => void;
  best: Best;
  onStart: () => void;
  onOpenCat: (slug: string | null) => void;
  onOpenRecruiters: () => void;
}> = ({ doc, level, setLevel, best, onStart, onOpenCat, onOpenRecruiters }) => {
  const example = useMemo(() => generate(doc.cat, `exemple-${doc.slug}`, 'facile'), [doc]);
  const b = best[`${doc.cat}:${level}`];
  return (
    <>
      <button type="button" onClick={() => onOpenCat(null)} className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-[#8D174B] bg-white border border-[#8D174B]/20 rounded-xl px-3 py-1.5 cursor-pointer active:scale-95">
        <ArrowLeft className="w-3.5 h-3.5" /> Tous les tests
      </button>
      <div className="lg:grid lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          <header className="animate-fade-in flex items-start gap-3">
            <span className="w-12 h-12 rounded-2xl bg-[#FDF2F7] text-[#8D174B] flex items-center justify-center shrink-0">
              <Icon cat={doc.cat} className="w-8 h-8" />
            </span>
            <div>
              <h1 className="text-[21px] sm:text-3xl font-extrabold text-[#242126] leading-tight">{doc.h1}</h1>
            </div>
          </header>
          <p className="mt-3 text-[13.5px] sm:text-[15px] text-[#4A4250] leading-relaxed animate-fade-in">{doc.intro}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <LevelChips level={level} setLevel={setLevel} />
            {b !== undefined && (
              <span className="text-[12px] font-bold text-emerald-700 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> Record : {b} %
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onStart}
            className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#8D174B] text-white px-6 py-4 text-[15px] font-extrabold shadow-lg shadow-[#8D174B]/25 cursor-pointer active:scale-95 hover:shadow-xl transition-all animate-cta-bounce"
          >
            <Flame className="w-5 h-5" /> Commencer · {SESSION} questions · {LEVEL_FR[level]}
          </button>

          <section className="mt-8">
            <h2 className="text-lg font-extrabold text-[#242126]">{doc.method.title}</h2>
            <ol className="mt-3 space-y-2">
              {doc.method.steps.map((s, i) => (
                <li key={i} className="flex gap-3 bg-white border border-[#F1E5EC] rounded-2xl p-3 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <span className="w-7 h-7 rounded-full bg-[#8D174B] text-white text-[13px] font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="text-[13.5px] text-[#3f3a43] leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="mt-8">
            <h2 className="text-lg font-extrabold text-[#242126]">Conseils</h2>
            <ul className="mt-2 space-y-1.5 list-disc ps-5 text-[13.5px] text-[#3f3a43] leading-relaxed">
              {doc.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="mt-8 lg:mt-0 lg:col-span-2 lg:sticky lg:top-4 self-start space-y-4">
          <div className="bg-white border border-[#F1E5EC] rounded-3xl p-4 shadow-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#8D174B]">Exemple corrigé</p>
            <p className="mt-1 text-[13.5px] font-bold text-[#242126]">{example.prompt}</p>
            <div className="mt-3" dangerouslySetInnerHTML={{ __html: questionHtml(example, `ex-${doc.slug}`, true) }} />
            <p className="mt-3 text-[12.5px] text-[#4A4250] leading-relaxed">{example.explanation}</p>
          </div>
          <div className="bg-[#FDF2F7] rounded-3xl p-4">
            <p className="font-extrabold text-[14px] text-[#242126]">Autres familles</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PSY_CATS.filter((c) => c.cat !== doc.cat).map((c) => (
                <a
                  key={c.slug}
                  href={`/tests-psychotechniques/en-ligne/${c.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenCat(c.slug);
                    window.scrollTo({ top: 0 });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#8D174B] cursor-pointer active:scale-95 hover:shadow-md transition-all"
                >
                  <Icon cat={c.cat} className="w-4 h-4" /> {c.name}
                </a>
              ))}
            </div>
            <button type="button" onClick={onOpenRecruiters} className="mt-3 text-[12.5px] font-bold text-[#8D174B] underline cursor-pointer">
              Tests psychotechniques par recruteur
            </button>
          </div>
        </aside>
      </div>
      <Faq items={doc.faq} />
      <Disclaimer />
    </>
  );
};

// ─── Lecteur d'une série ────────────────────────────────────────────────────
const Player: React.FC<{
  label: string;
  level: PsyLevel;
  questions: PsyQuestion[];
  language: Language;
  onFinish: (pct: number) => void;
  onQuit: () => void;
  onRestart: () => void;
  onHarder?: () => void;
  onOpenCat: (slug: string | null) => void;
}> = ({ label, level, questions, language, onFinish, onQuit, onRestart, onHarder, onOpenCat }) => {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [left, setLeft] = useState(questions[0].time_limit);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const started = useRef(Date.now());
  const answered = useRef(-1);
  const q = questions[Math.min(i, questions.length - 1)];
  const done = answers.length === questions.length;
  const current = answers[i];
  const uid = `${q.id}-${i}`;

  const answer = useCallback(
    (chosen: string | null) => {
      if (answers[i] || answered.current >= i) return;
      answered.current = i;
      setAnswers((a) => [...a, { chosen, ok: chosen === q.correct_option_id, ms: Date.now() - started.current }]);
    },
    [answers, i, q],
  );
  // Chronomètre de la question : à zéro, la question est comptée fausse.
  useEffect(() => {
    if (current || i >= questions.length) return;
    const t = setInterval(() => {
      const l = q.time_limit - Math.floor((Date.now() - started.current) / 1000);
      setLeft(Math.max(0, l));
      if (l <= 0) answer(null);
    }, 250);
    return () => clearInterval(t);
  }, [current, q, answer, i, questions.length]);
  const next = () => {
    if (i + 1 >= questions.length) {
      const ok = answers.filter((a) => a.ok).length;
      onFinish(Math.round((ok / questions.length) * 100));
      setI(questions.length);
    } else {
      setI(i + 1);
      setLeft(questions[i + 1].time_limit);
      setMarked(new Set());
      started.current = Date.now();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // Barrage : toucher une figure la barre (aide au comptage).
  const onFigureClick = (e: React.MouseEvent) => {
    if (q.category !== 'attention' || current) return;
    const g = (e.target as Element).closest('[data-i]');
    if (!g) return;
    const k = Number(g.getAttribute('data-i'));
    setMarked((m) => {
      const n = new Set(m);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  };

  if (i >= questions.length && done)
    return <Result label={label} level={level} questions={questions} answers={answers} language={language} onRestart={onRestart} onHarder={onHarder} onQuit={onQuit} onOpenCat={onOpenCat} />;

  const pct = (left / q.time_limit) * 100;
  const wide = q.category === 'mecanique' || q.category === 'suites' || q.category === 'attention';
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onQuit} aria-label="Quitter la série" className="p-2 -ms-2 rounded-xl hover:bg-[#FAF4F7] cursor-pointer active:scale-95">
          <X className="w-5 h-5 text-[#6E6773]" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#8D174B] truncate">
            {label} · {LEVEL_FR[level]}
          </p>
          <div className="mt-1 flex gap-1">
            {questions.map((_, k) => (
              <span key={k} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${answers[k] ? (answers[k].ok ? 'bg-emerald-500' : 'bg-rose-400') : k === i ? 'bg-[#8D174B]' : 'bg-[#F1E5EC]'}`} />
            ))}
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[13px] font-extrabold tabular-nums ${left <= 10 && !current ? 'bg-rose-50 text-rose-700 animate-pulse' : 'bg-[#F6EEF2] text-[#4A4250]'}`}>
          <Clock className="w-4 h-4" />
          {current ? '—' : `${left}s`}
        </span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-[#F1E5EC] overflow-hidden">
        <div className="h-full bg-[#8D174B] transition-[width] duration-300 ease-linear" style={{ width: `${current ? 0 : pct}%` }} />
      </div>

      <div key={uid} className="animate-fade-in">
        <p className="mt-4 text-[12px] font-bold text-[#8E8694]">
          Question {i + 1} / {questions.length}
          {questions.some((x) => x.category !== q.category) ? ` · ${psyCatDoc(q.category).name}` : ''}
        </p>
        <h2 className="mt-0.5 text-[16px] sm:text-lg font-extrabold text-[#242126] leading-snug">{q.prompt}</h2>
        {q.category === 'attention' && !current && <p className="mt-1 text-[12px] text-[#6E6773]">Astuce : touchez une figure pour la barrer.</p>}
        <div className="mt-4 bg-white border border-[#F1E5EC] rounded-3xl p-3 sm:p-5 shadow-sm" onClick={onFigureClick} dangerouslySetInnerHTML={{ __html: questionHtml(q, uid, !!current, marked) }} />

        <div className={`mt-4 grid gap-2.5 ${wide ? 'grid-cols-2' : q.options.length === 5 ? 'grid-cols-3' : 'grid-cols-2'}`} role="radiogroup" aria-label="Réponses">
          {q.options.map((o) => {
            const isRight = o.id === q.correct_option_id;
            const isChosen = current?.chosen === o.id;
            const state = !current ? 'idle' : isRight ? 'right' : isChosen ? 'wrong' : 'dim';
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={isChosen}
                disabled={!!current}
                onClick={() => answer(o.id)}
                className={`relative min-h-[76px] rounded-2xl border-2 p-2 flex items-center justify-center transition-all duration-150 ${
                  state === 'idle'
                    ? 'bg-white border-[#EDE6EF] hover:border-[#8D174B]/50 hover:shadow-md active:scale-95 cursor-pointer'
                    : state === 'right'
                      ? 'bg-emerald-50 border-emerald-500 animate-fade-in'
                      : state === 'wrong'
                        ? 'bg-rose-50 border-rose-400'
                        : 'bg-white border-[#EDE6EF] opacity-45'
                }`}
              >
                <span className="absolute top-1.5 start-2 text-[11px] font-extrabold text-[#8E8694] uppercase">{o.id}</span>
                {state === 'right' && <Check className="absolute top-1.5 end-1.5 w-4 h-4 text-emerald-600" />}
                {state === 'wrong' && <X className="absolute top-1.5 end-1.5 w-4 h-4 text-rose-500" />}
                <span className="w-full max-w-[112px] flex items-center justify-center" dangerouslySetInnerHTML={{ __html: optionHtml(q, o.value, `${uid}-${o.id}`) }} />
              </button>
            );
          })}
        </div>

        {current && (
          <div className={`mt-4 rounded-2xl p-4 animate-fade-in ${current.ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
            <p className={`font-extrabold text-[14px] ${current.ok ? 'text-emerald-800' : 'text-rose-800'}`}>
              {current.ok ? 'Bonne réponse !' : current.chosen ? `Raté : la bonne réponse est ${q.correct_option_id.toUpperCase()}` : `Temps écoulé : la bonne réponse est ${q.correct_option_id.toUpperCase()}`}
            </p>
            <p className="mt-1.5 text-[13.5px] text-[#3f3a43] leading-relaxed">{q.explanation}</p>
          </div>
        )}
      </div>

      {/* Bouton « Suivant » fixé en bas sur téléphone, toujours à portée du pouce. */}
      {current && (
        <div className="fixed md:static bottom-[72px] inset-x-0 z-30 px-4 md:px-0 md:mt-4 animate-fade-in">
          <button
            type="button"
            onClick={next}
            className="w-full max-w-2xl mx-auto flex items-center justify-center gap-2 rounded-2xl bg-[#8D174B] text-white py-4 text-[15px] font-extrabold shadow-xl shadow-[#8D174B]/30 cursor-pointer active:scale-95 animate-cta-bounce"
          >
            {i + 1 >= questions.length ? 'Voir mon résultat' : 'Question suivante'} <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
      <div className="h-24 md:hidden" />
    </div>
  );
};

const Result: React.FC<{
  label: string;
  level: PsyLevel;
  questions: PsyQuestion[];
  answers: Answer[];
  language: Language;
  onRestart: () => void;
  onHarder?: () => void;
  onQuit: () => void;
  onOpenCat: (slug: string | null) => void;
}> = ({ label, level, questions, answers, language, onRestart, onHarder, onQuit, onOpenCat }) => {
  const ok = answers.filter((a) => a.ok).length;
  const pct = Math.round((ok / questions.length) * 100);
  const avg = Math.round(answers.reduce((s, a) => s + a.ms, 0) / answers.length / 1000);
  const [shown, setShown] = useState(0);
  // Compteur animé du score.
  useEffect(() => {
    let v = 0;
    const t = setInterval(() => {
      v = Math.min(pct, v + 3);
      setShown(v);
      if (v >= pct) clearInterval(t);
    }, 24);
    return () => clearInterval(t);
  }, [pct]);
  const verdict = pct >= 80 ? 'Excellent niveau : passez au niveau supérieur.' : pct >= 60 ? 'Bon résultat : encore quelques séries pour être à l’aise.' : 'Relisez les corrections : la méthode fait vite progresser.';
  const byCat = new Map<PsyCategory, { ok: number; n: number }>();
  questions.forEach((q, k) => {
    const v = byCat.get(q.category) || { ok: 0, n: 0 };
    v.n++;
    if (answers[k]?.ok) v.ok++;
    byCat.set(q.category, v);
  });
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-white border border-[#F1E5EC] rounded-3xl p-5 text-center shadow-sm">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#8D174B]">
          {label} · {LEVEL_FR[level]}
        </p>
        <div className="mt-3 mx-auto w-32 h-32 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#8D174B ${shown * 3.6}deg, #F1E5EC 0)` }}>
          <div className="w-[104px] h-[104px] rounded-full bg-white flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-[#242126] tabular-nums">{shown}%</span>
            <span className="text-[11px] text-[#6E6773]">
              {ok} / {questions.length}
            </span>
          </div>
        </div>
        <p className="mt-3 font-bold text-[14px] text-[#242126]">{verdict}</p>
        <p className="mt-1 text-[12px] text-[#6E6773]">Temps moyen : {avg} s par question</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button type="button" onClick={onRestart} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#8D174B] text-white py-3.5 text-[14px] font-extrabold cursor-pointer active:scale-95 animate-cta-bounce">
            <RotateCcw className="w-4 h-4" /> Nouvelle série
          </button>
          {onHarder ? (
            <button type="button" onClick={onHarder} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FDF2F7] text-[#8D174B] py-3.5 text-[14px] font-extrabold cursor-pointer active:scale-95">
              <Zap className="w-4 h-4" /> Niveau supérieur
            </button>
          ) : (
            <button type="button" onClick={onQuit} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FDF2F7] text-[#8D174B] py-3.5 text-[14px] font-extrabold cursor-pointer active:scale-95">
              Retour
            </button>
          )}
        </div>
      </div>
      {byCat.size > 1 && (
        <div className="mt-4 bg-white border border-[#F1E5EC] rounded-3xl p-4">
          <p className="font-extrabold text-[14px] text-[#242126]">Par famille</p>
          <div className="mt-2 space-y-2">
            {[...byCat].map(([c, v]) => (
              <button key={c} type="button" onClick={() => onOpenCat(psyCatDoc(c).slug)} className="w-full flex items-center gap-3 text-start cursor-pointer active:scale-[.98]">
                <Icon cat={c} className="w-6 h-6 text-[#8D174B]" />
                <span className="flex-1 text-[13px] font-bold text-[#3f3a43]">{psyCatDoc(c).name}</span>
                <span className="w-24 h-1.5 rounded-full bg-[#F1E5EC] overflow-hidden">
                  <span className="block h-full bg-emerald-500 transition-all duration-700" style={{ width: `${(v.ok / v.n) * 100}%` }} />
                </span>
                <span className="text-[12px] font-extrabold tabular-nums w-9 text-end">
                  {v.ok}/{v.n}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 bg-white border border-[#F1E5EC] rounded-3xl p-4">
        <p className="font-extrabold text-[14px] text-[#242126]">Revoir les questions</p>
        <div className="mt-2 space-y-2">
          {questions.map((q, k) => (
            <details key={q.id + k} className="group rounded-2xl border border-[#F1E5EC] px-3 py-2.5">
              <summary className="cursor-pointer list-none flex items-center gap-2 text-[13px] font-bold text-[#3f3a43]">
                {answers[k]?.ok ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <X className="w-4 h-4 text-rose-500 shrink-0" />}
                <span className="flex-1">
                  {k + 1}. {psyCatDoc(q.category).name}
                </span>
                <ChevronRight className="w-4 h-4 text-[#8D174B] transition-transform group-open:rotate-90" />
              </summary>
              <div className="mt-2" dangerouslySetInnerHTML={{ __html: questionHtml(q, `rev-${k}`, true) }} />
              <p className="mt-2 text-[12.5px] text-[#4A4250] leading-relaxed">{q.explanation}</p>
            </details>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <NewContestsAlertCard language={language} where="fin_psy" />
      </div>
    </div>
  );
};
