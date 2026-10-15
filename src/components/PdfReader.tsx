import React, { useEffect, useRef, useState } from 'react';
import { Loader2, ZoomIn, ZoomOut, ExternalLink, AlertTriangle } from 'lucide-react';
import type { Language } from '../types';

// Lecteur PDF du site (pdf.js), utilisé pour les arrêtés et listes officielles.
// Les sites officiels interdisent l'affichage dans une autre page et la lecture depuis le
// navigateur : le fichier est lu par morceaux via /api/pdf (relais + cache), ce qui affiche
// la première page sans attendre tout le document. Les pages sont dessinées à l'approche
// (défilement), à la largeur de l'écran. pdf.js n'est chargé qu'à l'ouverture du lecteur.

type PdfLib = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
let libPromise: Promise<PdfLib> | null = null;
function loadPdfLib(): Promise<PdfLib> {
  return (libPromise ||= Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
  ]).then(([lib, worker]) => {
    lib.GlobalWorkerOptions.workerSrc = (worker as { default: string }).default;
    return lib;
  }));
}

const CHUNK = 256 * 1024; // morceau lu à la fois
const RELAY_MAX = 1024 * 1024; // plafond du relais par requête
const OFFICIAL = /^https:\/\/([a-z0-9-]+\.)*(emploi-public\.ma|gov\.ma|ac\.ma)\//i;

const relay = (u: string) => `/api/pdf?u=${encodeURIComponent(u)}`;

async function readRange(u: string, start: number, end: number): Promise<Uint8Array> {
  const parts: Uint8Array[] = [];
  for (let a = start; a <= end; a += RELAY_MAX) {
    const b = Math.min(end, a + RELAY_MAX - 1);
    const r = await fetch(`${relay(u)}&r=${a}-${b}`);
    if (!r.ok) throw new Error(`relais ${r.status}`);
    parts.push(new Uint8Array(await r.arrayBuffer()));
  }
  if (parts.length === 1) return parts[0];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

async function openDocument(lib: PdfLib, url: string) {
  const common = { isEvalSupported: false, disableAutoFetch: true, disableStream: true, rangeChunkSize: CHUNK };
  if (!OFFICIAL.test(url)) return lib.getDocument({ url, ...common }).promise;
  const meta = await fetch(`${relay(url)}&meta=1`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`meta ${r.status}`))));
  const length = Number(meta.length);
  const first = await readRange(url, 0, Math.min(CHUNK, length) - 1);
  const transport = new lib.PDFDataRangeTransport(length, first);
  transport.requestDataRange = (begin: number, end: number) => {
    readRange(url, begin, end - 1)
      .then((data) => transport.onDataRange(begin, data))
      .catch(() => undefined);
  };
  return lib.getDocument({ range: transport, length, ...common }).promise;
}

export const PdfReader: React.FC<{ url: string; language: Language; title?: string }> = ({ url, language, title }) => {
  const fr = language === 'fr';
  const [doc, setDoc] = useState<any>(null);
  const [ratio, setRatio] = useState(1.414); // hauteur / largeur de la première page
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    let loaded: any = null;
    setDoc(null);
    setError(false);
    loadPdfLib()
      .then((lib) => openDocument(lib, url))
      .then(async (d) => {
        loaded = d;
        const p1 = await d.getPage(1);
        const v = p1.getViewport({ scale: 1 });
        if (!alive) return;
        setRatio(v.height / v.width);
        setDoc(d);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
      loaded?.destroy?.();
    };
  }, [url]);

  if (error)
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white gap-3">
        <AlertTriangle className="w-10 h-10 text-amber-300" />
        <p className="text-sm font-bold">{fr ? 'Le site officiel ne répond pas pour le moment.' : 'الموقع الرسمي لا يستجيب حالياً.'}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-[#8D174B] text-white font-bold text-xs inline-flex items-center gap-1.5 active:scale-95">
          <ExternalLink className="w-3.5 h-3.5" />
          {fr ? 'Ouvrir le PDF sur le site officiel' : 'فتح الملف في الموقع الرسمي'}
        </a>
      </div>
    );

  if (!doc)
    return (
      <div className="flex-1 overflow-hidden p-3 sm:p-6 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-white/90 text-xs font-bold">
          <Loader2 className="w-4 h-4 animate-spin" />
          {fr ? 'Ouverture du document officiel…' : 'جارٍ فتح الوثيقة الرسمية…'}
        </div>
        <div className="w-full max-w-3xl aspect-[1/1.414] rounded-lg bg-white/90 animate-pulse" />
      </div>
    );

  return (
    <div className="flex-1 relative min-h-0 flex flex-col">
      <div ref={boxRef} className="flex-1 overflow-auto bg-[#3A363E] px-2 py-3 sm:px-6" aria-label={title}>
        <div className="mx-auto space-y-3" style={{ width: `${Math.round(zoom * 100)}%`, maxWidth: zoom === 1 ? '56rem' : undefined }}>
          {Array.from({ length: doc.numPages }, (_, i) => (
            <PdfPage key={`${i}-${zoom}`} doc={doc} n={i + 1} ratio={ratio} root={boxRef} />
          ))}
        </div>
      </div>
      <div className="absolute bottom-3 end-3 flex items-center gap-1 bg-black/60 backdrop-blur rounded-full p-1 shadow-lg">
        <button
          onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))}
          disabled={zoom <= 1}
          className="w-9 h-9 rounded-full text-white flex items-center justify-center hover:bg-white/15 disabled:opacity-40 active:scale-95"
          aria-label={fr ? 'Réduire' : 'تصغير'}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-bold text-white w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(3, +(z + 0.5).toFixed(1)))}
          disabled={zoom >= 3}
          className="w-9 h-9 rounded-full text-white flex items-center justify-center hover:bg-white/15 disabled:opacity-40 active:scale-95"
          aria-label={fr ? 'Agrandir' : 'تكبير'}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Une page : dessinée quand elle approche de l'écran, à la largeur disponible.
const PdfPage: React.FC<{ doc: any; n: number; ratio: number; root: React.RefObject<HTMLDivElement | null> }> = ({ doc, n, ratio, root }) => {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<'wait' | 'busy' | 'done' | 'fail'>('wait');

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    let task: any = null;
    let cancelled = false;
    const obs = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting || state !== 'wait') return;
        obs.disconnect();
        setState('busy');
        try {
          const page = await doc.getPage(n);
          if (cancelled || !canvas.current) return;
          const width = el.clientWidth;
          const base = page.getViewport({ scale: 1 });
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const vp = page.getViewport({ scale: (width / base.width) * dpr });
          const c = canvas.current;
          c.width = Math.floor(vp.width);
          c.height = Math.floor(vp.height);
          task = page.render({ canvasContext: c.getContext('2d')!, viewport: vp });
          await task.promise;
          if (!cancelled) setState('done');
        } catch {
          if (!cancelled) setState('fail');
        }
      },
      { root: root.current, rootMargin: '600px 0px' }
    );
    obs.observe(el);
    return () => {
      cancelled = true;
      obs.disconnect();
      task?.cancel?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, n]);

  return (
    <div ref={holder} className="relative w-full bg-white shadow-lg rounded-sm overflow-hidden" style={{ aspectRatio: `1 / ${ratio}` }}>
      <canvas ref={canvas} className="w-full h-full block" />
      {state !== 'done' && (
        <div className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#9A93A0] ${state === 'fail' ? '' : 'animate-pulse bg-[#F4EEF2]'}`}>
          {state === 'fail' ? `Page ${n} indisponible` : `Page ${n}`}
        </div>
      )}
    </div>
  );
};
