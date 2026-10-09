import { getSupabase } from '../lib/supabase';
import { QcmSet } from '../types';

export interface QcmFolder {
  slug: string;
  title: { fr: string; ar: string };
  organization: string;
  description: { fr: string; ar: string };
  position: number;
}

// Repli si la base est injoignable (mêmes dossiers que dans Supabase).
export const FALLBACK_FOLDERS: QcmFolder[] = [
  { slug: 'dgsn-gardiens-de-la-paix', title: { fr: 'Gardiens de la paix', ar: 'حراس الأمن' }, organization: 'DGSN — Sûreté nationale', description: { fr: 'Annales et entraînement pour le concours des Gardiens de la paix.', ar: 'نماذج وتمارين لمباراة حراس الأمن.' }, position: 10 },
  { slug: 'dgsn-inspecteurs-de-police', title: { fr: 'Inspecteurs de police', ar: 'مفتشو الشرطة' }, organization: 'DGSN — Sûreté nationale', description: { fr: 'Annales et entraînement pour le concours des Inspecteurs de police.', ar: 'نماذج وتمارين لمباراة مفتشي الشرطة.' }, position: 20 },
  { slug: 'dgsn-officiers-de-police', title: { fr: 'Officiers de police', ar: 'ضباط الشرطة' }, organization: 'DGSN — Sûreté nationale', description: { fr: 'Annales et entraînement pour le concours des Officiers de police.', ar: 'نماذج وتمارين لمباراة ضباط الشرطة.' }, position: 30 },
  { slug: 'dgsn-commissaires-de-police', title: { fr: 'Commissaires de police', ar: 'عمداء الشرطة' }, organization: 'DGSN — Sûreté nationale', description: { fr: 'Annales et entraînement pour le concours des Commissaires de police.', ar: 'نماذج وتمارين لمباراة عمداء الشرطة.' }, position: 40 },
  { slug: 'dgsn-concours-non-precise', title: { fr: 'DGSN — sujets à identifier', ar: 'الأمن الوطني — مواضيع غير محددة' }, organization: 'DGSN — Sûreté nationale', description: { fr: 'Sujets réels de la DGSN dont le concours exact n’est pas indiqué sur la copie.', ar: 'مواضيع حقيقية للأمن الوطني لم يُحدَّد نوع مباراتها.' }, position: 90 },
];

export async function fetchQcmFolders(): Promise<QcmFolder[]> {
  const sb = getSupabase();
  if (!sb) return FALLBACK_FOLDERS;
  const { data, error } = await sb.from('qcm_folders').select('*').eq('status', 'published').order('position');
  if (error || !data || data.length === 0) return FALLBACK_FOLDERS;
  return data.map((f: any) => ({
    slug: f.slug,
    title: { fr: f.title_fr, ar: f.title_ar || f.title_fr },
    organization: f.organization || '',
    description: { fr: f.description_fr || '', ar: f.description_ar || f.description_fr || '' },
    position: f.position,
  }));
}

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
    .select('id, slug, folder_slug, title_fr, title_ar, description_fr, description_ar, language, kind, category, concours_label, exam_year, source_note, source_images, source_url, duration_minutes, difficulty, position, qcm_questions(id, position, source_number, question, options)')
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
            // Cahier §8 : la bonne réponse n'est pas envoyée avant soumission (voir submitQcm).
            correctOptionId: '',
            explanation: { fr: '', ar: '' },
            source: '',
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
        sourceImages: s.source_images || [],
        sourceUrl: s.source_url || null,
        folderSlug: s.folder_slug,
        serverGraded: true,
      } as QcmSet;
    })
    .filter((s) => s.questions.length > 0);
}

export interface QcmCorrection {
  correctOptionId: string;
  explanation: string;
  source: string;
}

// Soumet la copie : la correction est calculée et renvoyée par le serveur.
export async function submitQcm(setId: string, answers: Record<string, string>): Promise<Record<string, QcmCorrection> | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const payload: Record<string, number> = {};
  for (const [qid, optionId] of Object.entries(answers)) {
    const idx = Number(optionId.slice(optionId.lastIndexOf('-') + 1));
    if (Number.isInteger(idx)) payload[qid] = idx;
  }
  const { data, error } = await sb.rpc('qcm_submit', { p_set_id: setId, p_answers: payload });
  if (error || !data) return null;
  const out: Record<string, QcmCorrection> = {};
  for (const r of data as any[]) {
    out[r.question_id] = {
      correctOptionId: `${r.question_id}-${r.correct_index}`,
      explanation: r.explanation || '',
      source: r.explanation_source || '',
    };
  }
  return out;
}

// ─── Progression du candidat (par support) ───────────────────────────────────
// Connecté : table qcm_progress (synchronisée entre appareils). Sinon : navigateur.

export interface QcmProgress {
  setKey: string;
  seen: string[];
  total: number;
  bestScore: number | null;
  lastScore: number | null;
  attempts: number;
  updatedAt: string;
}

const LOCAL_KEY = 'kounkour_qcm_progress_v1';

function readLocal(): Record<string, QcmProgress> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocal(map: Record<string, QcmProgress>) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(map));
  } catch {
    /* stockage indisponible : la progression reste en mémoire pour la session */
  }
}

async function currentUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.user?.id ?? null;
}

function maxNullable(a: number | null, b: number | null): number | null {
  if (a === null) return b;
  if (b === null) return a;
  return Math.max(a, b);
}

export function mergeProgress(a: QcmProgress | undefined, b: QcmProgress | undefined): QcmProgress | undefined {
  if (!a) return b;
  if (!b) return a;
  const newer = a.updatedAt >= b.updatedAt ? a : b;
  return {
    setKey: a.setKey,
    seen: [...new Set([...a.seen, ...b.seen])],
    total: Math.max(a.total, b.total),
    bestScore: maxNullable(a.bestScore, b.bestScore),
    lastScore: newer.lastScore,
    attempts: Math.max(a.attempts, b.attempts),
    updatedAt: newer.updatedAt,
  };
}

function toRow(p: QcmProgress) {
  return {
    set_key: p.setKey,
    seen_keys: p.seen,
    total_questions: p.total,
    best_score: p.bestScore,
    last_score: p.lastScore,
    attempts: p.attempts,
    updated_at: p.updatedAt,
  };
}

export async function loadQcmProgress(): Promise<Record<string, QcmProgress>> {
  const local = readLocal();
  const uid = await currentUserId();
  const sb = getSupabase();
  if (!uid || !sb) return local;
  const { data, error } = await sb.from('qcm_progress').select('*').eq('user_id', uid);
  if (error) return local;
  const merged: Record<string, QcmProgress> = {};
  const remote: Record<string, QcmProgress> = {};
  for (const r of data || []) {
    remote[r.set_key] = {
      setKey: r.set_key,
      seen: r.seen_keys || [],
      total: r.total_questions,
      bestScore: r.best_score,
      lastScore: r.last_score,
      attempts: r.attempts,
      updatedAt: r.updated_at,
    };
  }
  for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    merged[key] = mergeProgress(local[key], remote[key]) as QcmProgress;
  }
  // Ce qui a été fait hors connexion est rattaché au compte.
  const toPush = Object.values(merged).filter((p) => {
    const r = remote[p.setKey];
    return !r || r.seen.length !== p.seen.length || r.bestScore !== p.bestScore || r.attempts !== p.attempts;
  });
  if (toPush.length) {
    await sb.from('qcm_progress').upsert(toPush.map((p) => ({ ...toRow(p), user_id: uid })), { onConflict: 'user_id,set_key' });
  }
  writeLocal(merged);
  return merged;
}

// Enregistre des questions vues et/ou un score ; renvoie la progression à jour.
export async function recordQcmProgress(
  prev: QcmProgress | undefined,
  setKey: string,
  total: number,
  update: { seen?: string[]; score?: number }
): Promise<QcmProgress> {
  // Base = fusion de l'état connu et du dernier état enregistré (évite d'écraser
  // une sauvegarde précédente quand le candidat enchaîne vite les questions).
  const local = readLocal();
  const base: QcmProgress = mergeProgress(prev, local[setKey]) || { setKey, seen: [], total, bestScore: null, lastScore: null, attempts: 0, updatedAt: new Date(0).toISOString() };
  const next: QcmProgress = {
    ...base,
    total,
    seen: update.seen ? [...new Set([...base.seen, ...update.seen])] : base.seen,
    bestScore: update.score !== undefined ? maxNullable(base.bestScore, update.score) : base.bestScore,
    lastScore: update.score !== undefined ? update.score : base.lastScore,
    attempts: update.score !== undefined ? base.attempts + 1 : base.attempts,
    updatedAt: new Date().toISOString(),
  };
  local[setKey] = next;
  writeLocal(local);
  const uid = await currentUserId();
  const sb = getSupabase();
  if (uid && sb) {
    await sb.from('qcm_progress').upsert({ ...toRow(next), user_id: uid }, { onConflict: 'user_id,set_key' });
  }
  return next;
}

// Questions réellement vues parmi celles du support actuel (ignore les questions retirées).
export function seenCount(p: QcmProgress | undefined, questionIds: string[]): number {
  if (!p) return 0;
  const seen = new Set(p.seen);
  return questionIds.filter((id) => seen.has(id)).length;
}

// ─── Photos du sujet original (équipe uniquement, re-vérifié par les RLS) ─────

// Réduit la photo (≤ 1600 px, JPEG) pour un chargement rapide sur mobile.
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('compression'))), 'image/jpeg', 0.85),
  );
}

// Envoie les photos (dans l'ordre choisi) et les ajoute à la série. Renvoie la liste complète.
export async function addAnnaleImages(setId: string, slug: string, current: string[], files: File[]): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Service indisponible.');
  const urls: string[] = [];
  for (const [i, file] of files.entries()) {
    const blob = await compressImage(file);
    const path = `${slug}/${Date.now()}-${i + 1}.jpg`;
    const { error } = await sb.storage.from('annales').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) throw new Error('Envoi refusé (compte équipe requis).');
    urls.push(sb.storage.from('annales').getPublicUrl(path).data.publicUrl);
  }
  return setAnnaleImages(setId, [...current, ...urls]);
}

export async function setAnnaleImages(setId: string, images: string[]): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Service indisponible.');
  const { data, error } = await sb.from('qcm_sets').update({ source_images: images }).eq('id', setId).select('source_images').single();
  if (error || !data) throw new Error('Mise à jour refusée (compte équipe requis).');
  return data.source_images as string[];
}
