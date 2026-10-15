import React, { useCallback, useEffect, useState } from 'react';
import { Language } from '../types';
import { getSupabase } from '../lib/supabase';
import { Paperclip, ExternalLink, CheckCircle2, AlertTriangle, RefreshCw, XCircle, MessageSquare, Send } from 'lucide-react';

// Annonces qui demandent une intervention de l'admin : chacune porte un court
// commentaire « À traiter » (analysis.a_traiter, ou la raison de l'analyse)
// qui dit quoi faire. L'admin peut, sur chaque annonce : joindre l'annonce
// officielle (image ou PDF), la rejeter, ou écrire une consigne à Claude
// (analysis.consigne_admin, lue par l'analyse du matin). Les annonces
// réglées sortent de la liste.

interface Candidate {
  id: string;
  title_original: string;
  source_url: string;
  analysis_status: string;
  created_at: string;
  deadline_date: string | null;
  analysis: { a_traiter?: string; raison?: string; consigne_admin?: { texte: string; date: string } } & Record<string, unknown> | null;
}

const fmtDate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;

const MAX_SIDE = 2400; // assez pour lire un tableau d'arrêté, sans dépasser ~3 Mo
const MAX_BYTES = 3 * 1024 * 1024;

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function toBase64(buf: ArrayBuffer): string {
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

// Photo du téléphone → JPEG lisible et léger (redimensionné si très grand).
async function prepareImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const q of [0.9, 0.8, 0.7]) {
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', q));
    if (blob && blob.size <= MAX_BYTES) return blob;
  }
  throw new Error('image trop lourde même compressée');
}

export const RadarAttachDocs: React.FC<{ language: Language }> = ({ language }) => {
  const fr = language === 'fr';
  const [items, setItems] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, string>>({});
  const [error, setError] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    setLoading(true);
    const { data } = await sb
      .from('radar_candidates')
      .select('id, title_original, source_url, analysis_status, created_at, deadline_date, analysis')
      .eq('status', 'pending_review')
      .eq('analysis_status', 'a_verifier')
      .order('deadline_date', { ascending: true, nullsFirst: false })
      .limit(200);
    setItems((data as Candidate[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const attach = async (c: Candidate, files: FileList | null) => {
    if (!files || !files.length) return;
    const sb = getSupabase();
    if (!sb) return;
    setBusy(c.id);
    setError((e) => ({ ...e, [c.id]: '' }));
    try {
      let n = 0;
      for (const file of Array.from(files)) {
        const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
        if (!isPdf && !file.type.startsWith('image/')) throw new Error(`${file.name} : image ou PDF uniquement`);
        const blob = isPdf ? file : await prepareImage(file);
        if (blob.size > MAX_BYTES) throw new Error(`${file.name} : plus de 3 Mo`);
        const buf = await blob.arrayBuffer();
        const sha = await sha256Hex(buf);
        const { error: e } = await sb.from('radar_documents').upsert(
          {
            candidate_id: c.id,
            url: `ajout-admin://${sha.slice(0, 16)}/${file.name}`,
            kind: isPdf ? 'pdf' : 'image',
            mime: isPdf ? 'application/pdf' : 'image/jpeg',
            size_bytes: blob.size,
            sha256: sha,
            content_b64: toBase64(buf),
            fetch_error: null,
          },
          { onConflict: 'candidate_id,url' }
        );
        if (e) throw new Error(e.message);
        n++;
      }
      const { error: e2 } = await sb.from('radar_candidates').update({ analysis_status: 'a_analyser' }).eq('id', c.id);
      if (e2) throw new Error(e2.message);
      setDone((d) => ({ ...d, [c.id]: fr ? `${n} fichier(s) joint(s) — prêt pour l’analyse` : `${n} ملف — جاهز للتحليل` }));
    } catch (err: any) {
      setError((e) => ({ ...e, [c.id]: err?.message || String(err) }));
    } finally {
      setBusy(null);
    }
  };

  // Rejet définitif : l'annonce sort de « À traiter » et n'est jamais publiée.
  const reject = async (c: Candidate) => {
    const sb = getSupabase();
    if (!sb) return;
    setBusy(c.id);
    setError((e) => ({ ...e, [c.id]: '' }));
    const today = new Date().toLocaleDateString('fr-FR');
    const why = (notes[c.id] || '').trim();
    const { error: e } = await sb
      .from('radar_candidates')
      .update({
        analysis_status: 'rejete',
        reviewed_at: new Date().toISOString(),
        review_notes: `Rejeté par l'admin depuis « À traiter » le ${today}${why ? ` : ${why}` : ''}`,
      })
      .eq('id', c.id);
    setBusy(null);
    setConfirmReject(null);
    if (e) return setError((x) => ({ ...x, [c.id]: e.message }));
    setItems((list) => list.filter((x) => x.id !== c.id));
  };

  // Consigne écrite à Claude : enregistrée sur l'annonce, qui passe « à analyser »
  // pour que l'analyse du matin la lise et l'applique.
  const sendNote = async (c: Candidate) => {
    const texte = (notes[c.id] || '').trim();
    const sb = getSupabase();
    if (!sb || !texte) return;
    setBusy(c.id);
    setError((e) => ({ ...e, [c.id]: '' }));
    const analysis = { ...(c.analysis || {}), consigne_admin: { texte, date: new Date().toISOString() } };
    const { error: e } = await sb.from('radar_candidates').update({ analysis, analysis_status: 'a_analyser' }).eq('id', c.id);
    setBusy(null);
    if (e) return setError((x) => ({ ...x, [c.id]: e.message }));
    setOpenNote(null);
    setDone((d) => ({ ...d, [c.id]: fr ? 'Consigne envoyée à Claude (traitée à l’analyse du matin)' : 'أُرسلت التعليمات' }));
  };

  const shown = items.filter((c) => !query.trim() || c.title_original.toLowerCase().includes(query.trim().toLowerCase()));
  const ready = Object.keys(done).length;

  return (
    <section className="bg-white rounded-3xl border border-[#F1E5EC] p-4 sm:p-5 shadow-xs mb-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-[#242126] flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-[#8D174B]" />
            {fr ? 'À traiter' : 'للمعالجة'} <span className="text-xs font-bold text-[#8E8694]">({items.length})</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-[#6E6773] mt-1">
            {fr
              ? 'Seules les annonces qui demandent votre intervention. Lisez le commentaire, puis : joignez l’annonce officielle, rejetez-la, ou écrivez votre consigne à Claude (appliquée à l’analyse du matin).'
              : 'الإعلانات التي تحتاج تدخلكم فقط. اقرأ التعليق ثم أرفق الإعلان الرسمي.'}
          </p>
        </div>
        <button onClick={load} className="shrink-0 p-2 rounded-xl border border-[#F1E5EC] text-[#8D174B] active:scale-95" aria-label={fr ? 'Actualiser' : 'تحديث'}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {ready > 0 && (
        <p className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 mb-3 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          {fr ? `${ready} annonce(s) envoyée(s) à Claude : traitée(s) à l’analyse du matin.` : `${ready} جاهزة للتحليل.`}
        </p>
      )}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={fr ? 'Filtrer (ex. SRM, ONDA…)' : 'بحث'}
        className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs mb-3 focus:outline-none focus:border-[#8D174B]"
      />
      {loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-[#FAF4F7] animate-pulse" />)}</div>
      ) : (
        <ul className="divide-y divide-[#F1E5EC] max-h-[28rem] overflow-y-auto">
          {shown.map((c) => (
            <li key={c.id} className="py-2.5">
              <div className="min-w-0">
                <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#242126] hover:text-[#8D174B] flex items-start gap-1">
                  <span className="line-clamp-2">{c.title_original}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 text-[#8E8694]" />
                </a>
                <p className="text-[11px] text-[#6E6773] mt-0.5">
                  {c.deadline_date ? (fr ? `Date limite : ${fmtDate(c.deadline_date)}` : `آخر أجل: ${fmtDate(c.deadline_date)}`) : fr ? 'Date limite inconnue' : 'آخر أجل غير معروف'}
                </p>
                {(c.analysis?.a_traiter || c.analysis?.raison) && (
                  <p className="text-[11px] text-[#8D174B] bg-[#FAF4F7] border border-[#F1E5EC] rounded-lg px-2 py-1 mt-1">
                    <span className="font-bold">{fr ? 'À traiter : ' : 'للمعالجة: '}</span>
                    {c.analysis?.a_traiter || c.analysis?.raison}
                  </p>
                )}
                {c.analysis?.consigne_admin?.texte && !done[c.id] && (
                  <p className="text-[11px] text-[#242126] bg-white border border-dashed border-[#E2CFDA] rounded-lg px-2 py-1 mt-1">
                    <span className="font-bold">{fr ? 'Votre consigne : ' : 'تعليماتك: '}</span>
                    {c.analysis.consigne_admin.texte}
                  </p>
                )}
                {done[c.id] && <p className="text-[11px] text-emerald-700 font-bold mt-0.5">✅ {done[c.id]}</p>}
                {error[c.id] && (
                  <p className="text-[11px] text-rose-700 mt-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{error[c.id]}</p>
                )}
              </div>
              {openNote === c.id && (
                <div className="mt-2 animate-fade-in">
                  <textarea
                    value={notes[c.id] || ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))}
                    rows={3}
                    autoFocus
                    placeholder={fr ? 'Ex. : « C’est ouvert jusqu’au 30/10 sur le site officiel, publie-le » ou « déjà fermé ».' : 'اكتب تعليماتك لـ Claude'}
                    className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#8D174B]"
                  />
                  <div className="flex justify-end gap-2 mt-1.5">
                    <button onClick={() => setOpenNote(null)} className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#6E6773] border border-[#F1E5EC] active:scale-95">
                      {fr ? 'Annuler' : 'إلغاء'}
                    </button>
                    <button
                      onClick={() => sendNote(c)}
                      disabled={!(notes[c.id] || '').trim() || busy === c.id}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#8D174B] text-white flex items-center gap-1 active:scale-95 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {fr ? 'Envoyer à Claude' : 'إرسال'}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap justify-end gap-2 mt-2">
                {confirmReject === c.id ? (
                  <>
                    <span className="self-center text-[11px] font-bold text-rose-700">{fr ? 'Rejeter définitivement ?' : 'رفض نهائي؟'}</span>
                    <button onClick={() => setConfirmReject(null)} className="px-3 py-2 rounded-xl text-[11px] font-bold text-[#6E6773] border border-[#F1E5EC] active:scale-95">
                      {fr ? 'Non' : 'لا'}
                    </button>
                    <button
                      onClick={() => reject(c)}
                      disabled={busy === c.id}
                      className="px-3 py-2 rounded-xl text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-700 active:scale-95 disabled:opacity-60"
                    >
                      {fr ? 'Oui, rejeter' : 'نعم'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmReject(c.id)}
                    className="px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-95 transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {fr ? 'Rejeter' : 'رفض'}
                  </button>
                )}
                <button
                  onClick={() => setOpenNote(openNote === c.id ? null : c.id)}
                  className="px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1 border border-[#F1E5EC] text-[#8D174B] bg-white hover:bg-[#FAF4F7] active:scale-95 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {fr ? 'Écrire à Claude' : 'اكتب لـ Claude'}
                </button>
              <label
                className={`shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all ${
                  done[c.id] ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-[#8D174B] text-white hover:bg-[#70113B]'
                } ${busy === c.id ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                {busy === c.id ? (fr ? 'Envoi…' : '...') : done[c.id] ? (fr ? 'Ajouter' : 'إضافة') : fr ? 'Joindre' : 'إرفاق'}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    attach(c, e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
              </div>
            </li>
          ))}
          {!shown.length && <li className="py-6 text-center text-xs text-[#6E6773]">{fr ? 'Rien à traiter : tout est à jour.' : 'لا شيء.'}</li>}
        </ul>
      )}
    </section>
  );
};
