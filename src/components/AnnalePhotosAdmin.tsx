import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { addAnnaleImages, setAnnaleImages } from '../data/qcmApi';

// Équipe KounKour : joindre (ou retirer) les photos du sujet original d'une série.
// Les droits sont re-vérifiés côté serveur (bucket « annales » et table qcm_sets).

interface Props {
  setId: string;
  slug: string;
  images: string[];
  onChange: (images: string[]) => void;
}

export const AnnalePhotosAdmin: React.FC<Props> = ({ setId, slug, images, onChange }) => {
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

  return (
    <div className="rounded-2xl border border-dashed border-[#8D174B]/30 bg-[#FAF7F9] p-3 space-y-2">
      <p className="text-[11px] font-extrabold text-[#8D174B]">Équipe · Photos du sujet original ({images.length})</p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => input.current?.click()}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#8D174B] text-white text-xs font-bold disabled:opacity-50 active:scale-95 transition cursor-pointer"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          Ajouter des photos (dans l'ordre des pages)
        </button>
        {images.length > 0 && (
          <button
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
