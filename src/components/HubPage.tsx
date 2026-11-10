import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Building2, CalendarDays, GraduationCap, MapPin, BellRing } from 'lucide-react';
import type { Contest, Language } from '../types';
import {
  HUB_INDEX,
  buildHubs,
  hubDate,
  hubIndexView,
  hubLinksOf,
  hubPrepSlugs,
  hubShortTitle,
  hubView,
  toHubContest,
  type HubContest,
  type HubKind,
} from '../content/hubs';
import { prepFolderSlugsFor } from '../utils/prepMatch';
import { fetchQcmFolders, type QcmFolder } from '../data/qcmApi';
import { gaEvent } from '../lib/analytics';

interface Props {
  kind: HubKind;
  slug: string | null;
  language: Language;
  contests: Contest[];
  contestsLoaded: boolean;
  onOpenHub: (kind: HubKind, slug: string | null) => void;
  onOpenContest: (c: Contest) => void;
  onOpenFolder: (folder: string) => void;
  onOpenAlerts: () => void;
}

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca' }).format(new Date());

const KIND_ICON: Record<HubKind, React.ComponentType<{ className?: string }>> = { organisme: Building2, region: MapPin, grade: GraduationCap };
const INDEX_LABEL: Record<HubKind, { fr: string; ar: string }> = {
  organisme: { fr: 'Concours par organisme', ar: 'المباريات حسب الإدارة' },
  region: { fr: 'Concours par région', ar: 'المباريات حسب الجهة' },
  grade: { fr: 'Concours par grade', ar: 'المباريات حسب الدرجة' },
};
const STATE: Record<HubContest['state'], { fr: string; ar: string; cls: string }> = {
  open: { fr: 'Ouvert', ar: 'مفتوح', cls: 'bg-emerald-50 text-emerald-700' },
  published: { fr: 'Publié', ar: 'منشور', cls: 'bg-emerald-50 text-emerald-700' },
  closed: { fr: 'Clôturé', ar: 'منتهي', cls: 'bg-gray-100 text-gray-600' },
  results: { fr: 'Résultats', ar: 'النتائج', cls: 'bg-indigo-50 text-indigo-700' },
  cancelled: { fr: 'Annulé', ar: 'ملغى', cls: 'bg-red-50 text-red-600' },
};

// Pages de regroupement (organisme, région, grade) : mêmes chiffres et mêmes textes que le rendu
// serveur (src/content/hubs.ts), à partir des concours déjà chargés par l'application.
export const HubPage: React.FC<Props> = ({ kind, slug, language, contests, contestsLoaded, onOpenHub, onOpenContest, onOpenFolder, onOpenAlerts }) => {
  const lang = language === 'ar' ? 'ar' : 'fr';
  const fr = lang === 'fr';
  const Next = fr ? ArrowRight : ArrowLeft;
  const day = today();
  const hubs = useMemo(
    () => buildHubs(contests.map((c) => (c.hubRaw ? toHubContest(c.hubRaw, day) : null)).filter((x): x is HubContest => !!x)),
    [contests, day],
  );
  const [folders, setFolders] = useState<QcmFolder[]>([]);
  useEffect(() => {
    let alive = true;
    fetchQcmFolders().then((f) => alive && setFolders(f));
    return () => {
      alive = false;
    };
  }, []);

  const bySlug = useMemo(() => new Map(contests.map((c) => [c.slug, c])), [contests]);
  const open = (c: HubContest) => {
    const full = bySlug.get(c.slug);
    if (full) {
      gaEvent('hub_open_contest', { kind, hub: slug || 'index' });
      onOpenContest(full);
    }
  };
  const go = (k: HubKind, s: string | null) => {
    onOpenHub(k, s);
    window.scrollTo({ top: 0 });
  };

  const Icon = KIND_ICON[kind];
  const indexLinks = (
    <nav className="flex flex-wrap gap-2">
      {(['organisme', 'region', 'grade'] as HubKind[]).map((k) => {
        const I = KIND_ICON[k];
        return (
          <a
            key={k}
            href={HUB_INDEX[k] + (fr ? '' : '?lang=ar')}
            onClick={(e) => {
              e.preventDefault();
              go(k, null);
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold border hover-scale active:scale-95 transition-all ${k === kind && !slug ? 'bg-[#8D174B] text-white border-[#8D174B]' : 'bg-white text-[#8D174B] border-[#8D174B]/20 hover:shadow-md'}`}
          >
            <I className="w-3.5 h-3.5" />
            {INDEX_LABEL[k][lang]}
          </a>
        );
      })}
    </nav>
  );

  if (!contestsLoaded && contests.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-[#F4EEF2] animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Page d'index : liste des regroupements ──
  if (!slug) {
    const v = hubIndexView(kind, hubs, lang, day);
    return (
      <article className="max-w-5xl mx-auto px-4 py-6 sm:py-10 pb-28 md:pb-10 animate-fade-in" dir={fr ? 'ltr' : 'rtl'}>
        <header className="rounded-3xl border border-[#F1E5EC] bg-gradient-to-r from-[#FAF0F5] via-[#FFFDFE] to-[#FDF2F7] p-5 sm:p-7 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#8D174B] leading-snug">{v.h1}</h1>
              <p className="text-[13px] sm:text-sm text-[#4A4250] mt-2 leading-relaxed">{v.description}</p>
            </div>
          </div>
          <div className="mt-4">{indexLinks}</div>
        </header>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {v.list.map((h, i) => (
            <li key={h.slug} className="animate-fade-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
              <a
                href={`/${kind}/${encodeURIComponent(h.slug)}${fr ? '' : '?lang=ar'}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(kind, h.slug);
                }}
                className="flex items-center justify-between gap-3 h-full rounded-2xl border border-[#F1E5EC] bg-white p-4 hover:border-[#8D174B]/40 hover:shadow-md hover-scale active:scale-95 transition-all"
              >
                <span className="min-w-0">
                  <span className="block text-[14px] font-extrabold text-[#242126] leading-snug line-clamp-2">{h.name}</span>
                  <span className="block text-[12px] text-[#6E6773] mt-1">
                    {fr ? `${h.count} concours` : `${h.count} مباراة`}
                    {h.open ? <b className="text-emerald-700">{fr ? ` · ${h.open} ouvert${h.open > 1 ? 's' : ''}` : ` · ${h.open} مفتوحة`}</b> : null}
                  </span>
                </span>
                <Next className="w-4 h-4 text-[#8D174B] shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </article>
    );
  }

  const hub = hubs[kind].get(slug);
  if (!hub) {
    return (
      <article className="max-w-3xl mx-auto px-4 py-10 text-center" dir={fr ? 'ltr' : 'rtl'}>
        <p className="text-sm text-[#4A4250] mb-4">{fr ? 'Aucun concours publié pour cette page.' : 'لا توجد مباريات منشورة لهذه الصفحة.'}</p>
        {indexLinks}
      </article>
    );
  }
  const v = hubView(hub, hubs, lang, day);
  const terms = folders.map((f) => ({ slug: f.slug, matchTerms: f.matchTerms }));
  const prep = hubPrepSlugs(hub, (c) => prepFolderSlugsFor({ title: c.titleFr, grade: c.grade, admin: c.adminFr }, terms), 6)
    .map((s) => folders.find((f) => f.slug === s))
    .filter((f): f is QcmFolder => !!f)
    .slice(0, 4);
  const showAdmin = kind !== 'organisme';

  const Row = ({ c, i }: { c: HubContest; i: number }) => (
    <li className="animate-fade-in" style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}>
      <a
        href={`/concours/${encodeURIComponent(c.slug)}${fr ? '' : '?lang=ar'}`}
        onClick={(e) => {
          e.preventDefault();
          open(c);
        }}
        className="block rounded-2xl border border-[#F1E5EC] bg-white p-3.5 hover:border-[#8D174B]/40 hover:shadow-md hover-scale active:scale-95 transition-all"
      >
        <span className="block text-[13.5px] font-bold text-[#242126] leading-snug line-clamp-2">{hubShortTitle(c, lang)}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-[#6E6773]">
          <span className={`rounded-md px-1.5 py-0.5 font-bold ${STATE[c.state].cls}`}>{STATE[c.state][lang]}</span>
          {showAdmin && <span className="line-clamp-1">{fr ? c.adminFr : c.adminAr}</span>}
          {c.deadline && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {v.labels.deadline} : {hubDate(c.deadline, lang)}
            </span>
          )}
          {c.positions > 0 && <span>{fr ? `${c.positions} poste${c.positions > 1 ? 's' : ''}` : `${c.positions} ${c.positions > 1 ? 'مناصب' : 'منصب'}`}</span>}
        </span>
      </a>
    </li>
  );

  return (
    <article className="max-w-6xl mx-auto px-4 py-6 sm:py-10 pb-28 md:pb-10 animate-fade-in" dir={fr ? 'ltr' : 'rtl'}>
      <nav className="text-[12px] text-[#6E6773] mb-3 flex flex-wrap gap-1 items-center">
        <a
          href={HUB_INDEX[kind] + (fr ? '' : '?lang=ar')}
          onClick={(e) => {
            e.preventDefault();
            go(kind, null);
          }}
          className="font-bold text-[#8D174B] hover:underline"
        >
          {INDEX_LABEL[kind][lang]}
        </a>
        <span>{fr ? '›' : '‹'}</span>
        <span className="line-clamp-1">{hub.name[lang] || hub.name.fr}</span>
      </nav>
      <header className="rounded-3xl border border-[#F1E5EC] bg-gradient-to-r from-[#FAF0F5] via-[#FFFDFE] to-[#FDF2F7] p-5 sm:p-7 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#8D174B] leading-snug">{v.h1}</h1>
            {v.intro.map((p, i) => (
              <p key={i} className="text-[13px] sm:text-sm text-[#4A4250] mt-2 leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </div>
        {(() => {
          const nums = v.facts.filter((f) => /^\d+$/.test(f.value));
          const lists = v.facts.filter((f) => !/^\d+$/.test(f.value));
          return (
            <>
              <dl className={`mt-4 grid gap-2 ${nums.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                {nums.map((f, i) => (
                  <div key={f.label} className="rounded-2xl bg-white border border-[#F1E5EC] p-3 animate-scale-in" style={{ animationDelay: `${i * 80}ms` }}>
                    <dt className="text-[11px] text-[#6E6773] font-semibold leading-tight">{f.label}</dt>
                    <dd className="text-lg font-extrabold text-[#242126] leading-snug mt-0.5">{f.value}</dd>
                  </div>
                ))}
              </dl>
              {lists.map((f) => (
                <dl key={f.label} className="mt-2 rounded-2xl bg-white border border-[#F1E5EC] p-3 animate-fade-in">
                  <dt className="text-[11px] text-[#6E6773] font-semibold">{f.label}</dt>
                  <dd className="text-[13px] font-bold text-[#242126] leading-snug mt-0.5">{f.value}</dd>
                </dl>
              ))}
            </>
          );
        })()}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-5">
          <section>
            <h2 className="text-base font-extrabold text-[#242126] mb-2.5">
              {v.labels.open} ({v.open.length})
            </h2>
            {v.open.length ? (
              <ul className="space-y-2">
                {v.open.map((c, i) => (
                  <Row key={c.slug} c={c} i={i} />
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#E7D9E1] bg-[#FAF7F9] p-4 text-[13px] text-[#4A4250]">{v.labels.none}</div>
            )}
          </section>
          {v.recent.length > 0 && (
            <section>
              <h2 className="text-base font-extrabold text-[#242126] mb-2.5">{v.labels.recent}</h2>
              <ul className="space-y-2">
                {v.recent.map((c, i) => (
                  <Row key={c.slug} c={c} i={i} />
                ))}
              </ul>
            </section>
          )}
          <section className="rounded-2xl border border-[#F1E5EC] bg-[#FAF7F9] p-4 sm:p-5">
            <h2 className="text-sm sm:text-base font-extrabold text-[#242126] mb-3">{v.labels.faq}</h2>
            {v.faq.map((f) => (
              <div key={f.q} className="mb-3 last:mb-0">
                <h3 className="text-[13px] font-bold text-[#242126]">{f.q}</h3>
                <p className="text-[13px] text-[#4A4250] leading-relaxed mt-1">{f.a}</p>
              </div>
            ))}
          </section>
        </div>

        <aside className="lg:col-span-2 space-y-4 lg:sticky lg:top-4 self-start">
          <button
            type="button"
            onClick={() => {
              gaEvent('hub_alerts', { kind, hub: slug });
              onOpenAlerts();
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#8D174B] hover:bg-[#75123E] text-white px-5 py-3.5 text-sm font-extrabold shadow-md hover-scale active:scale-95 cursor-pointer animate-cta-bounce"
          >
            <BellRing className="w-4 h-4" />
            {fr ? 'Recevoir les nouveaux concours' : 'توصل بالمباريات الجديدة'}
          </button>
          <section className="rounded-2xl border border-[#F1E5EC] bg-white p-4">
            <h2 className="text-sm font-extrabold text-[#242126] mb-2.5 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#8D174B]" />
              {v.labels.prep}
            </h2>
            {prep.length ? (
              <ul className="space-y-1.5">
                {prep.map((f) => (
                  <li key={f.slug}>
                    <a
                      href={`/preparation/${encodeURIComponent(f.slug)}${fr ? '' : '?lang=ar'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        gaEvent('hub_open_folder', { kind, hub: slug, folder: f.slug });
                        onOpenFolder(f.slug);
                      }}
                      className="flex items-center justify-between gap-2 text-[13px] font-semibold text-[#8D174B] bg-[#FDF2F7] border border-[#8D174B]/10 rounded-xl px-3 py-2 hover-scale active:scale-95"
                    >
                      <span className="line-clamp-2">{f.title[lang] || f.title.fr}</span>
                      <Next className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : folders.length === 0 ? (
              <div className="h-16 rounded-xl bg-[#F4EEF2] animate-pulse" />
            ) : (
              <a
                href={`/preparation${fr ? '' : '?lang=ar'}`}
                onClick={(e) => {
                  e.preventDefault();
                  onOpenFolder('');
                }}
                className="text-[13px] font-bold text-[#8D174B] hover:underline"
              >
                {fr ? 'Tous les dossiers de préparation' : 'كل ملفات التحضير'}
              </a>
            )}
          </section>
          {v.related.length > 0 && (
            <section className="rounded-2xl border border-[#F1E5EC] bg-white p-4">
              <h2 className="text-sm font-extrabold text-[#242126] mb-2.5">{v.labels.related}</h2>
              <ul className="flex flex-wrap gap-1.5">
                {v.related.map((r) => (
                  <li key={`${r.kind}-${r.slug}`}>
                    <a
                      href={`/${r.kind}/${encodeURIComponent(r.slug)}${fr ? '' : '?lang=ar'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        go(r.kind, r.slug);
                      }}
                      className="inline-block text-[12px] font-semibold text-[#4A4250] bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-2.5 py-1.5 hover:border-[#8D174B]/30 hover:text-[#8D174B] hover-scale active:scale-95"
                    >
                      {r.name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="rounded-2xl border border-[#F1E5EC] bg-white p-4">{indexLinks}</div>
        </aside>
      </div>
    </article>
  );
};

/** Fiche concours : liens vers ses pages de regroupement (même règle que le rendu serveur). */
export const ContestHubLinks: React.FC<{ contest: Contest; all: Contest[]; language: Language; onOpenHub: (kind: HubKind, slug: string) => void }> = ({ contest, all, language, onOpenHub }) => {
  const lang = language === 'ar' ? 'ar' : 'fr';
  const day = today();
  const hubs = useMemo(() => buildHubs(all.map((c) => (c.hubRaw ? toHubContest(c.hubRaw, day) : null)).filter((x): x is HubContest => !!x)), [all, day]);
  const hc = contest.hubRaw ? toHubContest(contest.hubRaw, day) : null;
  const links = hc ? hubLinksOf(hc, hubs, lang) : [];
  if (!links.length) return null;
  return (
    <section className="rounded-2xl border border-[#F1E5EC] bg-white p-4">
      <h3 className="text-sm font-extrabold text-[#242126] mb-2.5">{lang === 'fr' ? 'Concours similaires' : 'مباريات مشابهة'}</h3>
      <ul className="flex flex-wrap gap-1.5">
        {links.map((l) => {
          const I = KIND_ICON[l.kind];
          return (
            <li key={l.href}>
              <a
                href={l.href + (lang === 'fr' ? '' : '?lang=ar')}
                onClick={(e) => {
                  e.preventDefault();
                  gaEvent('contest_open_hub', { kind: l.kind, hub: l.slug });
                  onOpenHub(l.kind, l.slug);
                }}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#8D174B] bg-[#FDF2F7] border border-[#8D174B]/10 rounded-xl px-2.5 py-1.5 hover-scale active:scale-95"
              >
                <I className="w-3.5 h-3.5" />
                {l.text}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
