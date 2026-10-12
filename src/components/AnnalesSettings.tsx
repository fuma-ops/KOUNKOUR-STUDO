import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Camera, ChevronDown, ExternalLink, FolderOpen, ImageOff, ImagePlus, Loader2, ShieldCheck } from 'lucide-react';
import { AdminQcmSet, QcmFolder, fetchQcmFolders, fetchQcmSetsForAdmin, setFolderCover, uploadFolderCover } from '../data/qcmApi';
import { AnnalePhotosAdmin } from './AnnalePhotosAdmin';

// Réglages équipe : chiffres des annales, photos du sujet original de chaque
// série, et image d'en-tête de chaque dossier concours (page Préparation).

const FolderCover: React.FC<{ folder: QcmFolder; onChange: (url: string | null) => void }> = ({ folder, onChange }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const act = async (fn: () => Promise<string | null>, ok: string) => {
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
    <div className="relative h-32 sm:h-36 rounded-t-3xl overflow-hidden bg-gradient-to-br from-[#8D174B] to-[#C73578]">
      {folder.coverImage ? (
        <img src={folder.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover animate-fade-in" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/60 text-xs font-bold gap-1.5">
          <ImageOff className="w-4 h-4" /> Pas d'image d'en-tête
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute bottom-2 inset-x-3 flex items-end justify-between gap-2">
        <div className="min-w-0 text-white">
          <p className="text-sm sm:text-base font-extrabold leading-tight truncate">{folder.title.fr}</p>
          {folder.organization && <p className="text-[11px] text-white/80 truncate">{folder.organization}</p>}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-[#8D174B] text-[11px] font-extrabold shadow active:scale-95 transition cursor-pointer disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            {folder.coverImage ? 'Changer' : 'Ajouter une image'}
          </button>
          {folder.coverImage && (
            <button
              type="button"
              disabled={busy}
              onClick={() => window.confirm("Retirer l'image d'en-tête de ce dossier ?") && act(async () => (await setFolderCover(folder.slug, null), null), 'Image retirée.')}
              className="px-2.5 py-1.5 rounded-lg bg-black/40 text-white text-[11px] font-bold active:scale-95 transition cursor-pointer disabled:opacity-60"
            >
              Retirer
            </button>
          )}
        </div>
      </div>
      {msg && <p className="absolute top-2 start-3 px-2 py-0.5 rounded bg-white/90 text-[10px] font-bold text-[#4A4250]">{msg}</p>}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) act(() => uploadFolderCover(folder.slug, f), 'Image enregistrée.');
        }}
      />
    </div>
  );
};

const SetRow: React.FC<{ set: AdminQcmSet; onImages: (images: string[]) => void }> = ({ set, onImages }) => {
  const [open, setOpen] = useState(false);
  const n = set.sourceImages.length;
  return (
    <div className="rounded-2xl border border-[#F1E5EC] bg-white">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full text-start p-3 flex items-center gap-3 cursor-pointer">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-[#242126] leading-snug">{set.title}</p>
          <div className="flex flex-wrap gap-1.5 mt-1 text-[10px]">
            <span className={`px-1.5 py-0.5 rounded font-bold ${set.kind === 'sujet' ? 'bg-sky-50 text-sky-900' : 'bg-gray-100 text-gray-700'}`}>
              {set.kind === 'sujet' ? 'Sujet écrit' : 'QCM'}
            </span>
            {set.examYear && <span className="px-1.5 py-0.5 rounded bg-[#FDF2F7] text-[#8D174B] font-bold">{set.examYear}</span>}
            {set.status !== 'published' && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">non publiée</span>}
            <span className={`px-1.5 py-0.5 rounded font-bold ${n ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
              {n ? `${n} photo${n > 1 ? 's' : ''}` : 'sans photo'}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#8D174B] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {set.sourceUrl && n === 0 && (
        <a
          href={set.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mx-3 mb-2 -mt-1 flex items-center gap-1.5 text-[11px] font-bold text-[#8D174B] hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Page source (photos de la copie) : {set.sourceUrl.replace(/^https?:\/\//, '')}</span>
        </a>
      )}
      {open && (
        <div className="px-3 pb-3 space-y-2 animate-fade-in">
          {set.sourceUrl && n > 0 && (
            <a href={set.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] font-bold text-[#8D174B] hover:underline">
              <ExternalLink className="w-3.5 h-3.5" /> Page source
            </a>
          )}
          <AnnalePhotosAdmin setId={set.id} slug={set.slug} images={set.sourceImages} onChange={onImages} compact />
        </div>
      )}
    </div>
  );
};

export const AnnalesSettings: React.FC = () => {
  const [folders, setFolders] = useState<QcmFolder[] | null>(null);
  const [sets, setSets] = useState<AdminQcmSet[]>([]);
  const [onlyMissing, setOnlyMissing] = useState(false);

  useEffect(() => {
    Promise.all([fetchQcmFolders(), fetchQcmSetsForAdmin()]).then(([f, s]) => {
      setFolders(f);
      setSets(s);
    });
  }, []);

  if (!folders) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-[#FAF4F7] animate-pulse" />)}
      </div>
    );
  }

  // Annales réelles = QCM transcrits + sujets écrits (kind « sujet »).
  const isReal = (s: AdminQcmSet) => s.kind === 'annales' || s.kind === 'sujet';
  const annales = sets.filter(isReal);
  const training = sets.filter((s) => !isReal(s));
  const withPhoto = annales.filter((s) => s.sourceImages.length > 0).length;
  const foldersWith = (xs: AdminQcmSet[]) => new Set(xs.map((s) => s.folderSlug)).size;
  const stats = [
    { label: 'Annales réelles', value: annales.length, sub: `dans ${foldersWith(annales)} dossier${foldersWith(annales) > 1 ? 's' : ''}` },
    { label: "QCM d'entraînement", value: training.length, sub: 'rédigés par KounKour' },
    { label: 'Annales avec photo', value: `${withPhoto}/${annales.length}`, sub: 'sujet original joint' },
    { label: 'Dossiers', value: folders.length, sub: `${folders.filter((f) => f.coverImage).length} avec image` },
  ];
  const updateImages = (id: string, images: string[]) => setSets((all) => all.map((s) => (s.id === id ? { ...s, sourceImages: images } : s)));
  const groups = [
    ...folders.map((f) => ({ folder: f as QcmFolder | null, sets: sets.filter((s) => s.folderSlug === f.slug) })),
    { folder: null, sets: sets.filter((s) => !s.folderSlug || !folders.some((f) => f.slug === s.folderSlug)) },
  ].filter((g) => g.folder || g.sets.length);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={s.label} className="rounded-2xl border border-[#F1E5EC] bg-white p-4 hover:shadow-md transition-all animate-scale-in" style={{ animationDelay: `${i * 80}ms` }}>
            <p className="text-[11px] font-bold text-[#6E6773]">{s.label}</p>
            <p className="text-2xl font-extrabold text-[#8D174B]">{s.value}</p>
            <p className="text-[10px] text-[#8E8694]">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[#6E6773] max-w-2xl">
          Photos : ouvrez une série pour ajouter les pages du sujet (dans l'ordre), les réordonner ou en retirer une. Image d'en-tête : elle s'affiche en haut
          du dossier sur la page Préparation (format paysage conseillé).
        </p>
        <button
          type="button"
          onClick={() => setOnlyMissing((v) => !v)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border active:scale-95 transition cursor-pointer ${
            onlyMissing ? 'bg-[#8D174B] text-white border-[#8D174B]' : 'bg-white text-[#8D174B] border-[#8D174B]/25'
          }`}
        >
          {onlyMissing ? 'Afficher toutes les annales' : 'Seulement les annales sans photo'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {groups.map(({ folder, sets: gs }, i) => {
          const ann = gs.filter((s) => isReal(s) && (!onlyMissing || s.sourceImages.length === 0));
          const tr = gs.filter((s) => !isReal(s));
          return (
            <section
              key={folder?.slug || '__autres'}
              className="rounded-3xl border border-[#F1E5EC] bg-[#FFFDFE] shadow-xs animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {folder ? (
                <FolderCover folder={folder} onChange={(url) => setFolders((all) => all!.map((f) => (f.slug === folder.slug ? { ...f, coverImage: url } : f)))} />
              ) : (
                <div className="p-4 flex items-center gap-2 text-sm font-extrabold text-[#242126]">
                  <FolderOpen className="w-4 h-4 text-[#8D174B]" /> Séries sans dossier
                </div>
              )}
              <div className="p-4 space-y-2">
                <p className="text-[11px] font-extrabold text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Annales réelles ({gs.filter(isReal).length})
                </p>
                {ann.length === 0 ? (
                  <p className="text-[11px] text-[#8E8694] bg-white border border-dashed border-[#E9DCE4] rounded-xl p-3">
                    {onlyMissing ? 'Toutes les annales de ce dossier ont leur photo.' : 'Aucune annale dans ce dossier pour le moment.'}
                  </p>
                ) : (
                  ann.map((s) => <SetRow key={s.id} set={s} onImages={(imgs) => updateImages(s.id, imgs)} />)
                )}
                {tr.length > 0 && (
                  <p className="text-[11px] text-[#6E6773] flex items-center gap-1 pt-1">
                    <BookOpen className="w-3.5 h-3.5" /> + {tr.length} QCM d'entraînement
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {groups.length === 0 && (
        <p className="text-xs text-[#6E6773] flex items-center gap-1.5">
          <ImagePlus className="w-4 h-4" /> Aucun dossier.
        </p>
      )}
    </div>
  );
};
