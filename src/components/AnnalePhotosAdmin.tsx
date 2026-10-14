import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, ImagePlus, Loader2, Trash2, X } from 'lucide-react';
import { addAnnaleImages, setAnnaleImages } from '../data/qcmApi';

// Équipe KounKour : joindre, réordonner ou retirer les photos du sujet original
// d'une série. Les droits sont re-vérifiés côté serveur (bucket « annales » et table qcm_sets).

interface Props {
  setId: string;
  slug: string;
  images: string[];
  onChange: (images: string[]) => void;
  compact?: boolean;
  /** Page où le sujet a été trouvé : ouverte à côté du bouton pour y récupérer les photos réelles. */
  sourceUrl?: string | null;
}

export const AnnalePhotosAdmin: React.FC<Props> = ({ setId, slug, images, onChange, compact, sourceUrl }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const run = async (fn: () => Promise<string[]>, ok: string) => {
    setBusy(true);
    setMsg(null);
    try {
      onChange(await fn());
      setMsg(ok);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Action impossible.');
    } finally {
      setBusy(false);
    }
  };

  const move = (i: number, d: -1 | 1) => {
    const next = [...images];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    run(() => setAnnaleImages(setId, next), 'Ordre des pages enregistré.');
  };

  return (
    <div className={`rounded-2xl border border-dashed border-[#8D174B]/30 bg-[#FAF7F9] space-y-2 ${compact ? 'p-2.5' : 'p-3'}`}>
      {!compact && <p className="text-[11px] font-extrabold text-[#8D174B]">Équipe · Photos du sujet original ({images.length})</p>}
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <div key={url} className="relative shrink-0 w-20 animate-fade-in">
              <a href={url} target="_blank" rel="noreferrer" className="block">
                <img src={url} alt={`Page ${i + 1}`} loading="lazy" className="w-20 h-28 object-cover rounded-lg border border-[#E9DCE4] bg-white" />
              </a>
              <span className="absolute top-1 start-1 px-1.5 rounded bg-black/60 text-white text-[10px] font-bold">p.{i + 1}</span>
              <button
                type="button"
                title="Retirer cette page"
                disabled={busy}
                onClick={() => window.confirm(`Retirer la page ${i + 1} ?`) && run(() => setAnnaleImages(setId, images.filter((_, j) => j !== i)), 'Page retirée.')}
                className="absolute top-1 end-1 w-5 h-5 rounded-full bg-white/90 text-red-700 flex items-center justify-center shadow cursor-pointer disabled:opacity-50"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="flex justify-between mt-1">
                <button
                  type="button"
                  title="Page précédente"
                  disabled={busy || i === 0}
                  onClick={() => move(i, -1)}
                  className="p-0.5 rounded bg-white border border-[#E9DCE4] text-[#8D174B] disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Page suivante"
                  disabled={busy || i === images.length - 1}
                  onClick={() => move(i, 1)}
                  className="p-0.5 rounded bg-white border border-[#E9DCE4] text-[#8D174B] disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#8D174B] text-white text-xs font-bold disabled:opacity-50 hover:bg-[#70113B] active:scale-95 transition cursor-pointer"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          {images.length ? 'Ajouter des pages' : "Ajouter des photos (dans l'ordre des pages)"}
        </button>
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            title={sourceUrl}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#8D174B]/25 bg-white text-[#8D174B] text-xs font-bold hover:bg-[#FAF4F7] active:scale-95 transition"
          >
            <ExternalLink className="w-4 h-4" />
            Page source du sujet
          </a>
        )}
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => window.confirm('Retirer toutes les photos de cette série ?') && run(() => setAnnaleImages(setId, []), 'Photos retirées.')}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-700 text-xs font-bold disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Tout retirer
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          e.target.value = '';
          if (files.length) run(() => addAnnaleImages(setId, slug, images, files), `${files.length} photo(s) ajoutée(s).`);
        }}
      />
      {msg && <p className="text-[11px] font-bold text-[#6E6773]">{msg}</p>}
    </div>
  );
};
