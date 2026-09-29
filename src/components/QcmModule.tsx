import React, { useState, useEffect } from 'react';
import { QcmSet, Language } from '../types';
import { translations } from '../i18n/translations';
import { mockQcmSets } from '../data/mockQcm';
import { 
  GraduationCap, Clock, Award, CheckCircle, XCircle, RotateCcw, 
  ArrowRight, ArrowLeft, HelpCircle, BookOpen, AlertCircle
} from 'lucide-react';

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
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setIsSubmitted(false);
    setTimerSeconds(0);
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    if (selectedSet && onRecordScore) {
      let score = 0;
      selectedSet.questions.forEach((q) => {
        if (userAnswers[q.id] === q.correctOptionId) {
          score += 1;
        }
      });
      onRecordScore(selectedSet.id, score, selectedSet.questions.length);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // If no set selected: show Catalog
  if (!selectedSet) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF2F7] text-[#8D174B] text-xs font-semibold mb-3 border border-[#8D174B]/15">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{language === 'fr' ? 'Entraînement aux concours' : 'تدريب للمباريات'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#242126] mb-2">{t.preparation.title}</h2>
          <p className="text-xs sm:text-sm text-[#6E6773] max-w-xl mx-auto">{t.preparation.subtitle}</p>
        </div>

        {/* Study preparation ambiance photo banner (Matching Screenshot 05) */}
        <div className="mb-8 relative rounded-3xl overflow-hidden shadow-md h-48 sm:h-56">
          <img
            src="/images/exam_prep.jpg"
            alt="Espace Préparation Concours"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#8D174B]/90 via-[#8D174B]/60 to-transparent" />
          <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end text-white max-w-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200 mb-1">
              {language === 'fr' ? 'QCM & Annales Corrigées' : 'أسئلة ونماذج مصححة'}
            </span>
            <h3 className="text-lg sm:text-xl font-bold">
              {language === 'fr' ? 'Optimisez votre préparation aux épreuves écrites et orales' : 'طور مهاراتك لاجتياز الاختبارات الكتابية والشفوية'}
            </h3>
            <p className="text-xs text-rose-100/90 mt-1 line-clamp-2">
              {language === 'fr' 
                ? 'Droit public, tests psychotechniques, culture générale et méthodologie.'
                : 'القانون العام المغربي، الاختبارات النفسية التقنية، الثقافة العامة والمنهجية.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockQcmSets.map((set) => (
            <div
              key={set.id}
              className="bg-white border border-[#F1E5EC] hover:border-[#8D174B]/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#6E6773] mb-3">
                  <span className="font-semibold text-[#8D174B] bg-[#FDF2F7] px-2.5 py-1 rounded-md">
                    {t.preparation.categories[set.category]}
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#6E6773]" />
                    <span>{set.durationMinutes} {t.preparation.minutes}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#242126] mb-2">{set.title[language]}</h3>
                <p className="text-xs text-[#6E6773] leading-relaxed mb-4">{set.description[language]}</p>
              </div>

              <div className="pt-3 border-t border-[#F1E5EC] flex items-center justify-between">
                <span className="text-xs font-medium text-[#242126]">
                  {set.questions.length} {t.preparation.questions}
                </span>

                <button
                  onClick={() => handleStartSet(set)}
                  className="px-4 py-2 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{t.preparation.startQcm}</span>
                  <NextIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
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
      if (userAnswers[q.id] === q.correctOptionId) score += 1;
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
          <span>{t.preparation.backToCatalog}</span>
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

            {selectedSet.questions.map((q, idx) => {
              const userChoice = userAnswers[q.id];
              const isCorrect = userChoice === q.correctOptionId;

              return (
                <div key={q.id} className="bg-white border border-[#F1E5EC] rounded-2xl p-5 shadow-xs">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-xs font-bold text-[#8D174B]">
                      {t.preparation.question} {idx + 1}
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
                      const isRealCorrect = opt.id === q.correctOptionId;

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
                    <p className="text-[#6E6773] leading-relaxed mb-1.5">{q.explanation[language]}</p>
                    <span className="text-[10px] text-[#6E6773] italic">Source : {q.source}</span>
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
            <h3 className="text-base sm:text-lg font-bold text-[#242126] leading-snug">
              {currentQ.text[language]}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
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
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {t.preparation.finishQcm}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
