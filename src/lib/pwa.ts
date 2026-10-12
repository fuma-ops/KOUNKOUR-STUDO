/**
 * Application installable (PWA) + notifications push.
 * - Android / ordinateur : le navigateur propose l'installation (beforeinstallprompt),
 *   et les notifications marchent aussi sans installer.
 * - iPhone / iPad : les notifications ne marchent que si l'app est ajoutée à
 *   l'écran d'accueil (iOS 16.4+) puis ouverte depuis son icône.
 */
import { removePushSubscription, savePushSubscription } from '../data/matchPrefsApi';

// Clé publique VAPID (la clé privée n'existe qu'en base, lue par api/alerts/daily.ts).
export const VAPID_PUBLIC_KEY = 'BHz26Z-VBX5oOX4BihJ2ME-70Z0qzO0rz8Rrvw4dVpE26IlM1PlapSu79qQcFxDN5m5nEH0QxPvwDhagY6DlRB0';

let deferredPrompt: any = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((cb) => cb());

/** À appeler une fois au démarrage (main.tsx). */
export function initPwa() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    emit();
  });
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

/** S'abonne aux changements (installation possible / faite). Renvoie la fonction de désabonnement. */
export function onPwaChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export const canPromptInstall = () => !!deferredPrompt;

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  const p = deferredPrompt;
  deferredPrompt = null;
  emit();
  p.prompt();
  const choice = await p.userChoice.catch(() => null);
  return choice?.outcome === 'accepted';
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function pushPermission(): NotificationPermission | 'unsupported' {
  return pushSupported() ? Notification.permission : 'unsupported';
}

function keyBytes(b64url: string): Uint8Array {
  const b64 = (b64url + '='.repeat((4 - (b64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;
  await navigator.serviceWorker.register('/sw.js');
  return navigator.serviceWorker.ready;
}

/** Abonnement push de cet appareil, s'il existe. */
export async function currentPushSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    return (await reg?.pushManager.getSubscription()) || null;
  } catch {
    return null;
  }
}

/** Demande la permission, abonne cet appareil et l'enregistre pour le compte connecté. */
export async function enablePushOnThisDevice(): Promise<{ ok: boolean; denied?: boolean; error?: string }> {
  if (!pushSupported()) return { ok: false, error: 'unsupported' };
  try {
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, denied: perm === 'denied' };
    const reg = await registration();
    const sub =
      (await reg.pushManager.getSubscription()) ||
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) as BufferSource }));
    return await savePushSubscription(sub);
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Erreur' };
  }
}

/** Désabonne cet appareil (navigateur + base). */
export async function disablePushOnThisDevice(): Promise<void> {
  const sub = await currentPushSubscription();
  if (!sub) return;
  await removePushSubscription(sub.endpoint).catch(() => {});
  await sub.unsubscribe().catch(() => false);
}
