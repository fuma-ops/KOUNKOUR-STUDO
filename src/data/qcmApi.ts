import { getSupabase } from '../lib/supabase';
import { QcmSet } from '../types';

// QCM stockés dans Supabase (annales réelles transcrites mot pour mot).
// Les RLS ne renvoient au public que les QCM publiés et les questions validées.

const CATEGORIES = new Set([
  'psychotechnique', 'droit_public', 'fonction_publique', 'finances_publiques',
  'informatique', 'culture_generale', 'education', 'francais', 'arabe',
]);

export async function fetchQcmSets(): Promise<QcmSet[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('qcm_sets')
    .select('id, slug, title_fr, title_ar, description_fr, description_ar, language, kind, category, concours_label, exam_year, source_note, duration_minutes, difficulty, position, qcm_questions(id, position, source_number, question, options, correct_index, explanation, explanation_source)')
    .eq('status', 'published')
    .order('position', { ascending: true });
  if (error || !data) return [];

  return data
    .map((s: any): QcmSet => {
      const questions = [...(s.qcm_questions || [])]
        .sort((a: any, b: any) => a.position - b.position)
        .map((q: any, idx: number) => {
          const options = (q.options as string[]).map((text, i) => ({ id: `${q.id}-${i}`, text: { fr: text, ar: text } }));
          return {
            id: q.id,
            number: q.source_number ?? idx + 1,
            text: { fr: q.question, ar: q.question },
            options,
            correctOptionId: `${q.id}-${q.correct_index}`,
            explanation: { fr: q.explanation || '', ar: q.explanation || '' },
            source: q.explanation_source || '',
          };
        });
      return {
        id: s.id,
        slug: s.slug,
        title: { fr: s.title_fr, ar: s.title_ar || s.title_fr },
        description: { fr: s.description_fr || '', ar: s.description_ar || s.description_fr || '' },
        category: CATEGORIES.has(s.category) ? s.category : 'culture_generale',
        durationMinutes: s.duration_minutes,
        difficulty: s.difficulty,
        questionsCount: questions.length,
        questions,
        isDemo: false,
        kind: s.kind,
        contentLanguage: s.language,
        concoursLabel: s.concours_label,
        examYear: s.exam_year,
        sourceNote: s.source_note,
      } as QcmSet;
    })
    .filter((s) => s.questions.length > 0);
}
