import React, { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT } from '../lib/adsPolicy';
import { useAdsOn } from '../lib/ads';

// Bloc publicitaire AdSense manuel (annonce display responsive). Rendu seulement si un
// identifiant de bloc (data-ad-slot) est configuré dans src/lib/adsPolicy.ts et si la page
// est autorisée (src/lib/ads.ts : <html data-ads="on">). Une nouvelle clé (`key`) à chaque
// question du QCM = une nouvelle demande d'annonce, déclenchée par l'action du candidat.
// Règles AdSense respectées : libellé « Publicité », espace autour, jamais collé à un bouton.
declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const AdUnit: React.FC<{ slot: string; label: string; className?: string }> = ({ slot, label, className = '' }) => {
  const ref = useRef<HTMLModElement>(null);
  const adsOn = useAdsOn();
  const enabled = !!slot && adsOn;
  useEffect(() => {
    if (!enabled || !ref.current || ref.current.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* bloqueur de publicité : rien */
    }
  }, [enabled]);
  if (!enabled) return null;
  return (
    <aside className={`mt-10 mb-2 ${className}`} aria-label={label}>
      <p className="text-center text-[10px] uppercase tracking-wider text-[#9A929F] mb-1">{label}</p>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block', minHeight: 100 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
};
