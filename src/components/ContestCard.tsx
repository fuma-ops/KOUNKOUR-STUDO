import React from 'react';
import { Contest, Language } from '../types';
import { translations } from '../i18n/translations';
import { Calendar, Users, GraduationCap, MapPin, Bookmark, CheckCircle2, AlertTriangle, Clock, Sparkles, Check } from 'lucide-react';
import { loadCandidateProfile, checkEligibility } from '../utils/candidateStorage';

interface ContestCardProps {
  contest: Contest;
  language: Language;
  isBookmarked: boolean;
  onToggleBookmark: (contestId: string, e: React.MouseEvent) => void;
  onSelectContest: (contest: Contest) => void;
}

export const ContestCard: React.FC<ContestCardProps> = ({
  contest,
  language,
  isBookmarked,
  onToggleBookmark,
  onSelectContest,
}) => {
  const t = translations[language];
  const profile = loadCandidateProfile();
  const eligibility = checkEligibility(contest, profile);

  // Helper for status formatting
  const getStatusBadge = () => {
    switch (contest.status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            {t.status.open}
          </span>
        );
      case 'closing_soon':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            {t.status.closing_soon}
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
            {contest.stage === 'oral' 
              ? (language === 'fr' ? 'Convoqués Oral' : 'المدعوون للشفوي')
              : (language === 'fr' ? 'Convoqués Écrit' : 'المدعوون للكتابي')}
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            {t.status.upcoming}
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            {t.status.closed}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            {t.status.results}
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onSelectContest(contest)}
      className="group relative bg-white border border-[#F1E5EC] hover:border-[#8D174B]/40 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-[#8D174B]/8 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* White Canvas Header with Moroccan Burgundy Pattern Blended at the Borders and Centered Scraped Image */}
        <div className="relative h-44 sm:h-48 overflow-hidden bg-gradient-to-b from-white via-white to-[#FDF7FA] border-b border-[#F1E5EC] flex flex-col justify-between">
          {/* Moroccan Geometric Pattern with Edge-Blend Effect (Faded at Center, Visible along Borders) */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='44' height='44' viewBox='0 0 44 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%238D174B' stroke-width='0.95'%3E%3Cpath d='M22 0 L27 17 L44 22 L27 27 L22 44 L17 27 L0 22 L17 17 Z'/%3E%3Cpath d='M22 7 L30 22 L22 37 L14 22 Z' stroke-dasharray='1 2'/%3E%3Ccircle cx='22' cy='22' r='3.5'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '34px 34px',
              opacity: 0.20,
              WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 42%, rgba(0, 0, 0, 0.4) 75%, black 100%)',
              maskImage: 'radial-gradient(ellipse at center, transparent 42%, rgba(0, 0, 0, 0.4) 75%, black 100%)',
            }}
          />

          {/* Delicate Burgundy Degradation / Edge Vignette */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0) 42%, rgba(141, 23, 75, 0.04) 78%, rgba(141, 23, 75, 0.12) 100%)'
            }}
          />
          <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-[#8D174B]/5 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-[#8D174B]/8 to-transparent pointer-events-none" />

          {/* Floating Status & Bookmark */}
          <div className="relative z-20 p-2.5 flex items-center justify-between">
            <span className="backdrop-blur-sm bg-white/95 rounded-full shadow-xs">
              {getStatusBadge()}
            </span>

            <button
              type="button"
              onClick={(e) => onToggleBookmark(contest.id, e)}
              className={`p-2 rounded-full border transition-all ${
                isBookmarked
                  ? 'bg-[#8D174B] text-white border-[#8D174B] shadow-sm'
                  : 'bg-white/90 hover:bg-white text-[#242126] hover:text-[#8D174B] border-[#F1E5EC] shadow-xs'
              }`}
              title={isBookmarked ? t.contests.bookmarked : t.contests.bookmark}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Centered Scraped Official Emblem / Logo - Enlarged and Prominent */}
          <div className="relative z-10 flex-1 flex items-center justify-center px-4 -mt-2">
            <div className="transition-transform duration-300 group-hover:scale-105 flex items-center justify-center">
              <img
                src={contest.administration.logo || contest.image || '/images/administrations/logo-013.png'}
                alt={contest.administration.name[language]}
                referrerPolicy="no-referrer"
                className="max-h-24 sm:max-h-28 max-w-[210px] w-auto h-auto object-contain drop-shadow-sm"
                onError={(e) => {
                  (e.target as any).src = '/images/administrations/logo-013.png';
                }}
              />
            </div>
          </div>

          {/* Administration Name cleanly styled at bottom */}
          <div className="relative z-20 pb-2 px-3 flex items-center justify-center">
            <span className="text-[11px] font-bold text-[#8D174B] bg-white/95 backdrop-blur-xs px-3 py-0.5 rounded-full border border-[#8D174B]/20 shadow-xs uppercase tracking-wider truncate max-w-full text-center">
              {contest.administration.name[language]}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5">
          {/* Candidate match badge with score */}
          <div className="mb-2 flex items-center justify-between gap-2">
            {eligibility.isHighMatch ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FDF2F7] text-[#8D174B] border border-[#8D174B]/25 shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#8D174B]" />
                <span>{language === 'fr' ? `🎯 ${eligibility.score}% Match Profil Idéal` : `🎯 ${eligibility.score}% مطابقة مثالية لملفك`}</span>
              </span>
            ) : eligibility.isEligible ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>{language === 'fr' ? `✅ ${eligibility.score}% Éligible` : `✅ ${eligibility.score}% مؤهل قانوناً`}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-gray-500 border border-gray-200">
                <span>{language === 'fr' ? '⚠️ Profil différent' : '⚠️ ملف غير مطابق'}</span>
              </span>
            )}

            <span className="text-[10px] font-mono text-gray-400">
              {contest.referenceCode}
            </span>
          </div>

          {/* Contest Title */}
          <h4 className="text-base font-bold text-[#242126] group-hover:text-[#8D174B] transition-colors line-clamp-2 mb-2 leading-snug">
            {contest.title[language]}
          </h4>

          {/* Official Specialty badge */}
          {contest.specialty && contest.specialty[language] && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#8D174B]/8 text-[#8D174B] border border-[#8D174B]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8D174B]"></span>
                <span className="truncate max-w-[280px]">
                  {language === 'fr' ? 'Spécialité : ' : 'التخصص : '}
                  {contest.specialty[language]}
                </span>
              </span>
            </div>
          )}

          {/* Key Requirements / Criteria row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#6E6773] mb-4">
            <div className="flex items-center gap-1 font-semibold text-[#242126] bg-[#FDF2F7] text-[#8D174B] px-2 py-0.5 rounded-md">
              <GraduationCap className="w-3.5 h-3.5 text-[#8D174B]" />
              <span>{contest.degreeLevel}</span>
            </div>

            <div className="flex items-center gap-1 font-medium text-[#242126]">
              <Users className="w-3.5 h-3.5 text-[#8D174B]" />
              <span>{contest.postsCount} {t.contests.posts}</span>
            </div>

            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#6E6773]" />
              <span className="truncate max-w-[130px]">{contest.region[language]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Deadline date & Days countdown badge */}
      <div className="p-4 pt-3 border-t border-[#F1E5EC] flex items-center justify-between text-xs bg-[#FFFDFE]">
        <div className="flex items-center gap-1.5 text-[#6E6773]">
          <Calendar className="w-3.5 h-3.5 text-[#8D174B]" />
          <span>
            {t.contests.deadline} : <strong className="text-[#242126] font-semibold">{contest.deadlineDate}</strong>
          </span>
        </div>

        {(contest.status === 'open' || contest.status === 'closing_soon') && contest.daysRemaining > 1 && (
          <span className="font-bold text-[#8D174B] bg-[#FDF2F7] px-2.5 py-0.5 rounded-full text-[11px]">
            {contest.daysRemaining} {t.contests.daysLeft}
          </span>
        )}
        {(contest.status === 'open' || contest.status === 'closing_soon') && contest.daysRemaining === 1 && (
          <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] animate-pulse">
            {t.contests.todayLastDay}
          </span>
        )}
        {contest.status === 'in_progress' && (
          <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full text-[11px]">
            {contest.stage === 'oral'
              ? (language === 'fr' ? 'Oral imminent' : 'الشفوي قريباً')
              : (language === 'fr' ? 'Écrit passé • Attente oral' : 'تم الكتابي • في انتظار الشفوي')}
          </span>
        )}
        {contest.status === 'upcoming' && (
          <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full text-[11px]">
            {contest.contestDate ? `Épreuves : ${contest.contestDate}` : t.contests.toBeAnnounced}
          </span>
        )}
      </div>
    </div>
  );
};
