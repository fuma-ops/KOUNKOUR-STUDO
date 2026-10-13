import React, { useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';

// Logo OFFICIEL de l'organisme (administrations.logo_url → /api/logo, image
// reprise de sa page emploi-public). Jamais d'image « devinée » par mots-clés :
// sans logo connu, on affiche un emblème neutre + le sigle réel s'il figure
// dans le nom, rien d'autre.
//
// Beaucoup de logos du portail sont faits pour un bandeau sombre (texte blanc).
// On mesure la clarté du logo une fois chargé et on le pose sur une plaque
// contrastée seulement quand il serait illisible sur le fond où il s'affiche.

type Tone = 'light' | 'dark' | 'unknown';
const toneCache = new Map<string, Tone>();

function measureTone(img: HTMLImageElement): Tone {
  try {
    const w = 48;
    const h = Math.max(1, Math.round((img.naturalHeight / Math.max(1, img.naturalWidth)) * w));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 'unknown';
    ctx.drawImage(img, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h).data;
    let sum = 0;
    let n = 0;
    let darkPx = 0;
    for (let i = 0; i < px.length; i += 4) {
      const a = px[i + 3] / 255;
      if (a < 0.4) continue;
      const l = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
      sum += l;
      if (l < 0.4) darkPx++;
      n++;
    }
    // Pas de transparence : le logo a son propre fond, il se suffit à lui-même.
    if (!n || n > w * h * 0.97) return 'unknown';
    // Logo « pour bandeau sombre » (ex. HCP : texte blanc, aucun trait foncé).
    // Calibré sur les 80 logos réels : seuls ceux-là ont < 5 % de pixels foncés et une clarté moyenne > 0,65.
    return darkPx / n < 0.05 && sum / n > 0.65 ? 'light' : 'dark';
  } catch {
    return 'unknown';
  }
}

// Sigle réel présent dans le nom, ex. « Agence Nationale des Ports (ANP) » → ANP.
export function orgAcronym(name = ''): string {
  const m = /\(([A-Z][A-Z0-9&.\- ]{1,11})\)/.exec(name);
  return m ? m[1].replace(/\s+/g, '') : '';
}

// Une URL de logo n'est retenue que si elle vient de l'organisme lui-même.
export function isOfficialLogo(src?: string | null): src is string {
  if (!src || /default-image/i.test(src)) return false;
  return src.startsWith('/api/logo?') || /^https?:\/\//.test(src) || src.startsWith('data:image/');
}

interface Props {
  src?: string | null;
  name: string;
  // Fond sur lequel le logo est posé.
  surface?: 'light' | 'dark';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const IMG: Record<NonNullable<Props['size']>, string> = {
  xs: 'max-h-full max-w-full',
  sm: 'max-h-10 max-w-[140px]',
  md: 'max-h-16 sm:max-h-20 max-w-[180px] sm:max-w-[200px]',
  lg: 'max-h-20 sm:max-h-24 max-w-[210px]',
};

export const OrgLogo: React.FC<Props> = ({ src, name, surface = 'light', size = 'md', className = '' }) => {
  const official = isOfficialLogo(src) ? src : '';
  const [failed, setFailed] = useState(false);
  const [tone, setTone] = useState<Tone>(() => (official ? toneCache.get(official) || 'unknown' : 'unknown'));

  useEffect(() => {
    setFailed(false);
    setTone(official ? toneCache.get(official) || 'unknown' : 'unknown');
  }, [official]);

  if (!official || failed) {
    const acr = orgAcronym(name);
    const box = size === 'xs' ? 'w-full h-full' : size === 'sm' ? 'h-10 px-2.5' : 'h-14 sm:h-16 px-4';
    return (
      <div
        title={name}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl ${
          surface === 'dark' ? 'bg-white/12 text-white border border-white/25' : 'bg-[#FAF0F5] text-[#8D174B] border border-[#8D174B]/15'
        } ${box} ${className}`}
      >
        <Landmark className={size === 'xs' ? 'w-3/5 h-3/5' : size === 'sm' ? 'w-5 h-5' : 'w-7 h-7'} />
        {acr && size !== 'xs' && <span className={`font-extrabold tracking-wide ${size === 'sm' ? 'text-xs' : 'text-base'}`}>{acr}</span>}
      </div>
    );
  }

  // Plaque seulement si le logo se confond avec le fond.
  const plaque =
    surface === 'light' && tone === 'light'
      ? 'bg-gradient-to-br from-[#5C0E31] to-[#8D174B] shadow-sm'
      : surface === 'dark' && tone !== 'light'
        ? 'bg-white shadow-sm'
        : '';
  const pad = plaque ? (size === 'xs' ? 'p-0.5' : size === 'sm' ? 'px-2 py-1' : 'px-3 py-2') : '';

  return (
    <span className={`inline-flex items-center justify-center rounded-xl transition-colors duration-300 ${plaque} ${pad} ${size === 'xs' ? 'w-full h-full' : ''} ${className}`}>
      <img
        src={official}
        alt={name}
        loading="lazy"
        decoding="async"
        className={`${IMG[size]} w-auto h-auto object-contain animate-fade-in`}
        onLoad={(e) => {
          if (toneCache.has(official)) return;
          const t = measureTone(e.currentTarget);
          toneCache.set(official, t);
          setTone(t);
        }}
        onError={() => setFailed(true)}
      />
    </span>
  );
};
