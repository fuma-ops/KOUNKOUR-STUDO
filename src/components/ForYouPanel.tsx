import React, { useEffect, useMemo, useState } from 'react';
import { CandidateProfile, Contest, Language } from '../types';
import { Sparkles, Check, Search, X, Clock, ChevronDown, ChevronUp, Edit3, MapPin, BellRing } from 'lucide-react';
import { buildMatchFeed, deadlineBadge, markMatchesSeen, type MatchItem } from '../utils/matchFeed';
import { MATCH_DISCLAIMER, profileSpecialties, type CriterionCheck } from '../utils/smartMatch';

// « Pour vous » : les concours ouverts qui correspondent au profil, puis ceux à
// vérifier (« ne les ratez pas »). Chaque carte explique critère par critère.

interface Props {
  language: Language;
  contests: Contest[];
  profile: CandidateProfile;
  onSelectContest: (c: Contest) => void;
  onEditProfile: () => void;
}

const CRIT_LABEL: Record<CriterionCheck['key'], { fr: string; ar: string }> = {
  status: { fr: 'Délai', ar: 'الأجل' },
  diploma: { fr: 'Diplôme', ar: 'الدبلوم' },
  specialty: { fr: 'Spécialité', ar: 'التخصص' },
  age: { fr: 'Âge', ar: 'السن' },
};

export const CriteriaChips: React.FC<{ checks: CriterionCheck[]; language: Language }> = ({ checks, language }) => (
  <div className="flex flex-wrap gap-1">
    {checks
      .filter((c) => c.key !== 'status')
      .map((c) => (
        <span
          key={c.key}
          title={c[language]}
          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            c.status === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : c.status === 'verify'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {c.status === 'ok' ? <Check className="w-3 h-3" /> : c.status === 'verify' ? <Search className="w-3 h-3" /> : <X className="w-3 h-3" />}
          {CRIT_LABEL[c.key][language]}
        </span>
      ))}
  </div>
);

const MatchCard: React.FC<{ item: MatchItem; language: Language; onSelect: () => void; delay: number }> = ({ item, language, onSelect, delay }) => {
  const { contest: c, elig } = item;
  const fr = language === 'fr';
  const days = c.daysRemaining;
  const urgent = days <= 3;
  const firstIssue = elig.checks.find((k) => k.status !== 'ok' && k.key !== 'status');
  const places = [...new Set(elig.matchedPosts.map((p) => p.province).filter(Boolean))] as string[];
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-fade-in text-start w-full bg-white rounded-2xl p-4 border shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all cursor-pointer flex flex-col gap-2 ${
        elig.verdict === 'eligible' ? 'border-emerald-200 hover:border-emerald-400' : 'border-amber-200 hover:border-amber-400'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-[#8D174B] uppercase truncate">{c.administration.name[language]}</span>
        <div className="flex items-center gap-1 shrink-0">
          {item.isNew && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#8D174B] text-white">{fr ? 'Nouveau' : 'جديد'}</span>
          )}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              urgent ? 'bg-rose-600 text-white animate-pulse' : 'bg-[#FAF4F7] text-[#6E6773]'
            }`}
          >
            <Clock className="w-3 h-3" />
            {deadlineBadge(days, language)}
          </span>
        </div>
      </div>
      <h4 className="text-sm font-bold text-[#242126] line-clamp-2">{c.title[language] || c.title.fr}</h4>
      {elig.matchedPosts.length > 0 && elig.matchedPostsCount > 0 && (
        <p className="text-[11px] font-semibold text-emerald-800 flex items-start gap-1">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>
            {fr
              ? `${elig.matchedPostsCount} poste${elig.matchedPostsCount > 1 ? 's' : ''} pour votre profil`
              : `${elig.matchedPostsCount} منصب مناسب لملفك`}
            {places.length > 0 && ` — ${places.slice(0, 4).join(', ')}${places.length > 4 ? '…' : ''}`}
          </span>
        </p>
      )}
      <CriteriaChips checks={elig.checks} language={language} />
      {firstIssue && <p className="text-[11px] text-amber-900 bg-amber-50/70 rounded-lg px-2 py-1">{firstIssue[language]}</p>}
      <div className="pt-2 mt-auto border-t border-[#F1E5EC] flex items-center justify-between text-[11px] text-[#6E6773]">
        <span>{c.degreeLevel ? c.degreeLevel.slice(0, 48) + (c.degreeLevel.length > 48 ? '…' : '') : fr ? 'Diplôme : voir l’annonce' : 'الدبلوم: انظر الإعلان'}</span>
        <span className="font-bold text-[#8D174B] shrink-0">{c.deadlineDate}</span>
      </div>
    </button>
  );
};

export const ForYouPanel: React.FC<Props> = ({ language, contests, profile, onSelectContest, onEditProfile }) => {
  const fr = language === 'fr';
  const feed = useMemo(() => buildMatchFeed(contests, profile), [contests, profile]);
  const [showExcluded, setShowExcluded] = useState(false);
  const specs = profileSpecialties(profile);

  // Les concours affichés ici sont « vus » : ils ne seront plus signalés comme nouveaux.
  useEffect(() => {
    if (!feed.ready) return;
    const t = setTimeout(() => markMatchesSeen([...feed.eligible, ...feed.verify].map((i) => i.contest.id)), 4000);
    return () => clearTimeout(t);
  }, [feed]);

  if (!feed.ready) {
    return (
      <div className="bg-white border border-[#F1E5EC] rounded-3xl p-8 text-center space-y-4 shadow-xs animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-[#FAF0F5] text-[#8D174B] flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7" />
        </div>
        <h4 className="text-base font-extrabold text-[#242126]">
          {fr ? 'Deux informations suffisent pour ne plus rater un concours' : 'معلومتان تكفيان لكي لا تفوتك أي مباراة'}
        </h4>
        <p className="text-xs text-[#6E6773] max-w-md mx-auto">
          {fr
            ? 'Indiquez votre niveau de diplôme et votre spécialité : KounKour compare chaque concours ouvert, poste par poste, avec votre profil.'
            : 'حدد مستواك الدراسي وتخصصك: يقارن كونكور كل مباراة مفتوحة، منصباً منصباً، مع ملفك.'}
        </p>
        <button
          onClick={onEditProfile}
          className="px-5 py-2.5 rounded-2xl bg-[#8D174B] text-white font-extrabold text-xs hover:bg-[#70113B] active:scale-95 transition-all cursor-pointer animate-cta-bounce"
        >
          {fr ? 'Compléter mon profil' : 'إكمال ملفي'}
        </button>
      </div>
    );
  }

  const total = feed.eligible.length + feed.verify.length;
  return (
    <div className="space-y-5">
      {/* Résumé */}
      <div className="bg-gradient-to-r from-[#FDF2F7] via-white to-[#FDF2F7] border border-[#8D174B]/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#8D174B] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-extrabold text-[#242126]">
              {fr ? `${total} concours ouverts pour vous` : `${total} مباراة مفتوحة لك`}
            </p>
            <p className="text-[11px] text-[#6E6773]">
              {profile.degreeLevel} • {specs.join(', ')} {profile.age ? `• ${profile.age} ${fr ? 'ans' : 'سنة'}` : ''}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {fr ? `${feed.eligible.length} correspondent` : `${feed.eligible.length} مطابقة`}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                {fr ? `${feed.verify.length} à vérifier` : `${feed.verify.length} للتحقق`}
              </span>
              {feed.closingSoon > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                  {fr ? `${feed.closingSoon} ferment dans 7 jours` : `${feed.closingSoon} تنتهي خلال 7 أيام`}
                </span>
              )}
              {feed.newCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8D174B] text-white inline-flex items-center gap-1">
                  <BellRing className="w-3 h-3" />
                  {fr ? `${feed.newCount} nouveau${feed.newCount > 1 ? 'x' : ''}` : `${feed.newCount} جديدة`}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onEditProfile}
          className="self-start sm:self-center text-xs font-bold text-[#8D174B] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
        >
          <Edit3 className="w-3.5 h-3.5" />
          {fr ? 'Modifier mon profil' : 'تعديل ملفي'}
        </button>
      </div>

      {/* 1. Correspondent */}
      <section>
        <h3 className="text-sm font-extrabold text-emerald-900 mb-2 flex items-center gap-1.5">
          <Check className="w-4 h-4" />
          {fr ? `Correspondent à votre profil (${feed.eligible.length})` : `مطابقة لملفك (${feed.eligible.length})`}
        </h3>
        {feed.eligible.length === 0 ? (
          <p className="text-xs text-[#6E6773] bg-white border border-dashed border-[#E9DCE4] rounded-2xl p-4">
            {fr
              ? 'Aucun concours ouvert ne correspond exactement à votre diplôme et votre spécialité pour le moment. Regardez ceux « à vérifier » ci-dessous.'
              : 'لا توجد حالياً مباراة مفتوحة تطابق تماماً دبلومك وتخصصك. اطلع على المباريات « للتحقق » أدناه.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {feed.eligible.map((it, i) => (
              <MatchCard key={it.contest.id} item={it} language={language} onSelect={() => onSelectContest(it.contest)} delay={Math.min(i, 8) * 80} />
            ))}
          </div>
        )}
      </section>

      {/* 2. À vérifier */}
      {feed.verify.length > 0 && (
        <section>
          <h3 className="text-sm font-extrabold text-amber-900 mb-1 flex items-center gap-1.5">
            <Search className="w-4 h-4" />
            {fr ? `À vérifier — ne les ratez pas (${feed.verify.length})` : `للتحقق — لا تفوتها (${feed.verify.length})`}
          </h3>
          <p className="text-[11px] text-[#6E6773] mb-2">
            {fr
              ? 'Spécialité voisine de la vôtre, ou information absente de l’annonce : lisez l’arrêté, vous pouvez être concerné.'
              : 'تخصص قريب من تخصصك أو معلومة غير واردة في الإعلان: اطلع على القرار، قد تكون معنياً.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {feed.verify.map((it, i) => (
              <MatchCard key={it.contest.id} item={it} language={language} onSelect={() => onSelectContest(it.contest)} delay={Math.min(i, 8) * 80} />
            ))}
          </div>
        </section>
      )}

      {/* 3. Hors profil (transparence) */}
      {feed.excluded.length > 0 && (
        <section className="bg-white border border-[#F1E5EC] rounded-2xl">
          <button
            onClick={() => setShowExcluded(!showExcluded)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-[#6E6773] cursor-pointer"
          >
            <span>
              {fr ? `${feed.excluded.length} concours ouverts hors de votre profil — voir pourquoi` : `${feed.excluded.length} مباراة مفتوحة خارج ملفك — لماذا؟`}
            </span>
            {showExcluded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showExcluded && (
            <ul className="divide-y divide-[#F1E5EC] max-h-96 overflow-y-auto">
              {feed.excluded.map(({ contest: c, elig }) => (
                <li key={c.id}>
                  <button onClick={() => onSelectContest(c)} className="w-full text-start px-4 py-2 hover:bg-[#FAF7F9] cursor-pointer">
                    <span className="text-xs font-semibold text-[#242126] line-clamp-1">{c.title[language] || c.title.fr}</span>
                    <span className="text-[11px] text-rose-700 line-clamp-1">{elig.checks.find((k) => k.status === 'ko')?.[language]}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <p className="text-[10px] text-[#9A93A0] text-center">{MATCH_DISCLAIMER[language]}</p>
    </div>
  );
};
