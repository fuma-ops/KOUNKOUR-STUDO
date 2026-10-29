import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, ExternalLink, MessageCircle, MessagesSquare, X } from 'lucide-react';
import type { Language } from '../types';
import { fetchStaffActivity, markStaffSeen, type StaffActivity, type StaffActivityItem } from '../data/staffActivity';

const POLL_MS = 45000;

const ago = (iso: string, fr: boolean) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return fr ? "à l'instant" : 'الآن';
  if (s < 3600) return fr ? `il y a ${Math.floor(s / 60)} min` : `منذ ${Math.floor(s / 60)} د`;
  if (s < 86400) return fr ? `il y a ${Math.floor(s / 3600)} h` : `منذ ${Math.floor(s / 3600)} س`;
  return new Date(iso).toLocaleDateString(fr ? 'fr-MA' : 'ar-MA', { day: 'numeric', month: 'short', timeZone: 'Africa/Casablanca' });
};
const whereOf = (it: StaffActivityItem) => it.contest_title || it.room || 'Communauté';
const linkOf = (it: StaffActivityItem) => (it.contest_slug ? `/concours/${encodeURIComponent(it.contest_slug)}` : '/communaute');

const Item: React.FC<{ it: StaffActivityItem; fr: boolean; i: number }> = ({ it, fr, i }) => (
  <a
    href={linkOf(it)}
    target="_blank"
    rel="noopener"
    className={`block rounded-2xl border p-3 transition-all hover:shadow-md active:scale-[.98] animate-fade-in ${it.unread ? 'border-[#8D174B]/30 bg-[#FDF2F7]' : 'border-[#F1E5EC] bg-white'}`}
    style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
  >
    <div className="flex items-start gap-2.5">
      <span className="w-8 h-8 rounded-full bg-[#8D174B] text-white text-[13px] font-extrabold flex items-center justify-center shrink-0">{(it.author || '?').charAt(0).toUpperCase()}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] text-[#242126] leading-snug">
          <b>{it.author}</b>{' '}
          {it.kind === 'comment' ? (fr ? 'a commenté' : 'علّق على') : fr ? 'a publié' : 'نشر'}
          {it.title ? <> « {it.title} »</> : null}
        </p>
        <p className="mt-1 text-[13px] text-[#3f3a43] leading-relaxed whitespace-pre-line line-clamp-4">{it.content}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#8E8694]">
          {it.kind === 'comment' ? <MessageCircle className="w-3.5 h-3.5" /> : <MessagesSquare className="w-3.5 h-3.5" />}
          <span className="truncate">{whereOf(it)}</span>
          <span>·</span>
          <span className="shrink-0">{ago(it.created_at, fr)}</span>
          <ExternalLink className="w-3 h-3 shrink-0 ms-auto text-[#8D174B]" />
        </p>
      </div>
      {it.unread && <span className="w-2 h-2 rounded-full bg-[#8D174B] mt-1.5 shrink-0" aria-label={fr ? 'non lu' : 'غير مقروء'} />}
    </div>
  </a>
);

// Cloche du tableau de bord admin : nombre de nouveaux messages / commentaires,
// liste avec l'auteur, le texte et l'endroit ; vérification toutes les 45 s.
export const AdminNotifications: React.FC<{ language: Language }> = ({ language }) => {
  const fr = language !== 'ar';
  const [data, setData] = useState<StaffActivity | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<StaffActivityItem | null>(null);
  const lastTop = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await fetchStaffActivity();
      if (!d) return;
      const top = d.items[0];
      // Nouveau message arrivé pendant que le tableau de bord est ouvert : bandeau + notification du navigateur.
      if (top && lastTop.current && top.id !== lastTop.current && top.unread) {
        setToast(top);
        setTimeout(() => setToast(null), 8000);
        try {
          if ('Notification' in window && Notification.permission === 'granted' && document.hidden)
            new Notification(`${top.author} ${top.kind === 'comment' ? 'a commenté' : 'a publié'}`, { body: top.content.slice(0, 140), icon: '/icons/icon-192.png' });
        } catch {
          /* notifications du navigateur indisponibles */
        }
      }
      lastTop.current = top?.id ?? '';
      setData(d);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  const unread = data?.unread ?? 0;
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, '');
    document.title = unread ? `(${unread}) ${base}` : base;
  }, [unread]);

  const openPanel = () => {
    setOpen(true);
    setToast(null);
    try {
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    } catch {
      /* rien */
    }
  };
  const closePanel = async () => {
    setOpen(false);
    if (unread > 0) {
      try {
        await markStaffSeen();
        await load();
      } catch {
        /* sera marqué la prochaine fois */
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className={`relative px-3 py-2 rounded-2xl border text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 hover:shadow-md ${
          unread ? 'bg-[#8D174B] text-white border-[#8D174B] animate-cta-bounce' : 'bg-white text-[#8D174B] border-[#F1E5EC]'
        }`}
        title={fr ? 'Nouveaux messages et commentaires' : 'الرسائل والتعليقات الجديدة'}
      >
        <Bell className="w-4 h-4" />
        <span>{fr ? 'Notifications' : 'الإشعارات'}</span>
        {unread > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[#8D174B] text-[10px] font-black flex items-center justify-center">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {toast && !open && (
        <button type="button" onClick={openPanel} className="fixed bottom-4 end-4 z-[70] max-w-sm text-start bg-white border border-[#8D174B]/30 shadow-xl rounded-2xl p-3.5 animate-fade-in cursor-pointer">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#8D174B] flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" /> {fr ? 'Nouveau' : 'جديد'} {toast.kind === 'comment' ? (fr ? 'commentaire' : 'تعليق') : fr ? 'message' : 'رسالة'}
          </p>
          <p className="mt-1 text-[13px] text-[#242126]">
            <b>{toast.author}</b> · {whereOf(toast)}
          </p>
          <p className="mt-0.5 text-[12.5px] text-[#4A4250] line-clamp-2">{toast.content}</p>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-black/30 animate-fade-in" onClick={closePanel}>
          <aside className="w-full max-w-md h-full bg-[#FFFDFE] shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()} dir={fr ? 'ltr' : 'rtl'}>
            <header className="px-4 py-3 border-b border-[#F1E5EC] flex items-center justify-between">
              <div>
                <p className="text-[15px] font-extrabold text-[#242126]">{fr ? 'Messages et commentaires' : 'الرسائل والتعليقات'}</p>
                <p className="text-[11px] text-[#8E8694]">{unread ? (fr ? `${unread} nouveau${unread > 1 ? 'x' : ''}` : `${unread} جديد`) : fr ? 'Tout est lu' : 'تمت قراءة الكل'}</p>
              </div>
              <button type="button" onClick={closePanel} aria-label={fr ? 'Fermer' : 'إغلاق'} className="p-2 rounded-xl hover:bg-[#FAF4F7] cursor-pointer active:scale-95">
                <X className="w-5 h-5 text-[#6E6773]" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {failed && !data ? (
                <p className="text-[13px] text-[#6E6773] p-4 text-center">{fr ? 'Notifications indisponibles pour le moment.' : 'الإشعارات غير متاحة حالياً.'}</p>
              ) : !data ? (
                [0, 1, 2].map((k) => <div key={k} className="h-20 rounded-2xl bg-[#F6EEF2] animate-pulse" />)
              ) : data.items.length === 0 ? (
                <p className="text-[13px] text-[#6E6773] p-6 text-center">{fr ? 'Aucun message ni commentaire pour l’instant.' : 'لا توجد رسائل أو تعليقات بعد.'}</p>
              ) : (
                data.items.map((it, i) => <Item key={`${it.kind}-${it.id}`} it={it} fr={fr} i={i} />)
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
