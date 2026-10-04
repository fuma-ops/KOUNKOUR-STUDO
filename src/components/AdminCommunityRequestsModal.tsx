import React, { useCallback, useEffect, useState } from 'react';
import { Language } from '../types';
import {
  AccessRequest, CommunityError, Report, Room, decideAccessRequest, listAccessRequests,
  listProposedRooms, listReports, resolveReport, setRoomStatus, timeAgo,
} from '../data/communityApi';
import { X, Check, Lock, ShieldCheck, Clock, CheckCircle2, XCircle, Search, Flag, Users, AlertCircle, ExternalLink } from 'lucide-react';

// Centre de modération de la Communauté (staff). Données réelles Supabase ;
// chaque action est re-vérifiée côté serveur par les RLS (rôle staff).
interface AdminCommunityRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onRequestUpdated?: () => void;
  onOpenPost?: (roomId: string | null, postId: string | null) => void;
}

type Tab = 'requests' | 'rooms' | 'reports';

export const AdminCommunityRequestsModal: React.FC<AdminCommunityRequestsModalProps> = ({
  isOpen,
  onClose,
  language,
  onRequestUpdated,
  onOpenPost,
}) => {
  const fr = language === 'fr';
  const [tab, setTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [proposed, setProposed] = useState<Room[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'member' | 'rejected' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p, s] = await Promise.all([listAccessRequests(), listProposedRooms(), listReports()]);
      setRequests(r);
      setProposed(p);
      setReports(s);
    } catch (e) {
      setFeedback({ ok: false, text: e instanceof CommunityError ? e.message : 'Chargement impossible.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) reload();
  }, [isOpen, reload]);

  if (!isOpen) return null;

  const act = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      setFeedback({ ok: true, text: ok });
      await reload();
      onRequestUpdated?.();
    } catch (e) {
      setFeedback({ ok: false, text: e instanceof CommunityError ? e.message : 'Action impossible.' });
    }
    window.setTimeout(() => setFeedback(null), 3500);
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const openReports = reports.filter((r) => r.status === 'open').length;
  const q = search.trim().toLowerCase();
  const shownRequests = requests.filter(
    (r) =>
      (statusFilter === 'all' || r.status === statusFilter) &&
      (!q || `${r.pseudo || ''} ${r.roomName} ${r.reason || ''}`.toLowerCase().includes(q))
  );

  const tabBtn = (id: Tab, label: string, count: number) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
        tab === id ? 'bg-[#8D174B] text-white' : 'bg-white text-[#6E6773] border border-[#F1E5EC] hover:bg-gray-50'
      }`}
    >
      {label}
      {count > 0 && <span className={`px-1.5 rounded-full text-[10px] ${tab === id ? 'bg-white/25' : 'bg-amber-100 text-amber-900'}`}>{count}</span>}
    </button>
  );

  const okBtn = 'px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95';
  const noBtn = 'px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95';

  return (
    <div className="fixed inset-0 z-[105] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#F1E5EC] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        <div className="bg-[#8D174B] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">{fr ? 'Modération de la Communauté' : 'الإشراف على المجتمع'}</h3>
              <span className="text-[11px] text-rose-200">
                {fr
                  ? `${pendingCount} demande(s) • ${proposed.length} proposition(s) • ${openReports} signalement(s)`
                  : `${pendingCount} طلب • ${proposed.length} اقتراح • ${openReports} تبليغ`}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer" aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {feedback && (
          <div className={`px-5 py-2.5 text-xs font-bold flex items-center gap-2 shrink-0 border-b ${feedback.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
            {feedback.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            {feedback.text}
          </div>
        )}

        <div className="p-4 border-b border-[#F1E5EC] bg-[#FAF7F9] space-y-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            {tabBtn('requests', fr ? 'Demandes d’accès' : 'طلبات الانضمام', pendingCount)}
            {tabBtn('rooms', fr ? 'Salons proposés' : 'فضاءات مقترحة', proposed.length)}
            {tabBtn('reports', fr ? 'Signalements' : 'التبليغات', openReports)}
          </div>
          {tab === 'requests' && (
            <>
              <div className="relative bg-white rounded-xl border border-[#F1E5EC] flex items-center px-3 py-2">
                <Search className="w-4 h-4 text-[#8D174B] shrink-0 me-2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={fr ? 'Rechercher par pseudo, salon ou motif...' : 'البحث...'}
                  className="w-full bg-transparent text-xs focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px]">
                {(['pending', 'member', 'rejected', 'all'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer whitespace-nowrap ${statusFilter === s ? 'bg-[#8D174B]/10 text-[#8D174B]' : 'text-[#6E6773]'}`}
                  >
                    {s === 'pending' ? (fr ? 'En attente' : 'قيد الانتظار') : s === 'member' ? (fr ? 'Acceptées' : 'مقبولة') : s === 'rejected' ? (fr ? 'Refusées' : 'مرفوضة') : (fr ? 'Toutes' : 'الكل')}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && requests.length + proposed.length + reports.length === 0 ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-[#FAF4F7] animate-pulse" />
              ))}
            </div>
          ) : tab === 'requests' ? (
            shownRequests.length === 0 ? (
              <Empty text={fr ? 'Aucune demande dans cette catégorie.' : 'لا توجد طلبات.'} />
            ) : (
              shownRequests.map((r) => (
                <div key={`${r.roomId}-${r.userId}`} className="bg-white rounded-2xl border border-[#F1E5EC] p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs sm:text-sm text-[#242126] flex items-center gap-1.5 flex-wrap">
                        {r.pseudo || (fr ? 'Membre sans pseudo' : 'عضو بدون اسم')}
                        {r.headline && <span className="px-2 py-0.5 rounded-md bg-[#FAF0F5] text-[#8D174B] text-[10px] font-bold">{r.headline}</span>}
                      </h4>
                      <span className="text-[11px] text-[#6E6773] flex items-center gap-1 mt-0.5">
                        <Lock className="w-3 h-3 text-amber-700" />
                        <strong className="text-amber-900">{r.roomName}</strong>
                      </span>
                    </div>
                    <StatusBadge status={r.status} fr={fr} />
                  </div>
                  {r.reason && (
                    <div className="bg-[#FAF7F9] p-3 rounded-xl border border-[#F1E5EC] text-xs text-[#3E3844] break-words">
                      <strong className="block text-[10px] font-bold text-[#8D174B] uppercase mb-0.5">{fr ? 'Motif :' : 'السبب :'}</strong>
                      {r.reason}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-[#FAF4F7] text-[11px]">
                    <span className="text-[#8E8694]">{timeAgo(r.createdAt, language)}</span>
                    <div className="flex items-center gap-2">
                      {r.status !== 'member' && (
                        <button onClick={() => act(() => decideAccessRequest(r.roomId, r.userId, true), fr ? 'Accès accordé.' : 'تمت الموافقة.')} className={okBtn}>
                          <Check className="w-3.5 h-3.5" />
                          {fr ? 'Accepter' : 'قبول'}
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button onClick={() => act(() => decideAccessRequest(r.roomId, r.userId, false), fr ? 'Demande refusée.' : 'تم الرفض.')} className={noBtn}>
                          <X className="w-3.5 h-3.5" />
                          {r.status === 'member' ? (fr ? 'Retirer l’accès' : 'سحب الولوج') : (fr ? 'Refuser' : 'رفض')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )
          ) : tab === 'rooms' ? (
            proposed.length === 0 ? (
              <Empty text={fr ? 'Aucune proposition de salon en attente.' : 'لا توجد اقتراحات.'} />
            ) : (
              proposed.map((room) => (
                <div key={room.id} className="bg-white rounded-2xl border border-[#F1E5EC] p-4 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-extrabold text-sm text-[#242126] flex items-center gap-1.5 break-words">
                      <Users className="w-4 h-4 text-[#8D174B] shrink-0" />
                      {room.name.fr}
                    </h4>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 shrink-0">
                      {room.type === 'public' ? (fr ? 'Public' : 'عام') : (fr ? 'Privé' : 'خاص')}
                    </span>
                  </div>
                  {room.description.fr && <p className="text-xs text-[#5A5360] break-words">{room.description.fr}</p>}
                  <div className="flex items-center justify-between pt-2 border-t border-[#FAF4F7] text-[11px]">
                    <span className="text-[#8E8694]">{timeAgo(room.createdAt, language)}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => act(() => setRoomStatus(room.id, 'active'), fr ? 'Salon publié.' : 'تم نشر الفضاء.')} className={okBtn}>
                        <Check className="w-3.5 h-3.5" />
                        {fr ? 'Publier' : 'نشر'}
                      </button>
                      <button onClick={() => act(() => setRoomStatus(room.id, 'archived'), fr ? 'Proposition refusée.' : 'تم الرفض.')} className={noBtn}>
                        <X className="w-3.5 h-3.5" />
                        {fr ? 'Refuser' : 'رفض'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : reports.length === 0 ? (
            <Empty text={fr ? 'Aucun signalement.' : 'لا توجد تبليغات.'} />
          ) : (
            reports.map((r) => (
              <div key={r.id} className={`bg-white rounded-2xl border p-4 shadow-xs space-y-2.5 ${r.status === 'open' ? 'border-rose-200' : 'border-[#F1E5EC] opacity-75'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <Flag className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#242126] break-words line-clamp-2">« {r.excerpt} »</p>
                      <p className="text-[11px] text-[#6E6773] mt-1 break-words">
                        {fr ? 'Motif : ' : 'السبب: '}
                        {r.reason}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0">
                    {r.status === 'open' ? (fr ? 'À traiter' : 'للمعالجة') : r.status === 'resolved' ? (fr ? 'Traité' : 'معالج') : (fr ? 'Classé' : 'محفوظ')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#FAF4F7] text-[11px] gap-2 flex-wrap">
                  <span className="text-[#8E8694]">{timeAgo(r.createdAt, language)}</span>
                  <div className="flex items-center gap-2">
                    {r.postId && onOpenPost && (
                      <button onClick={() => onOpenPost(r.roomId, r.postId)} className="px-3 py-1.5 rounded-xl bg-white border border-[#F1E5EC] text-[#8D174B] font-bold text-xs flex items-center gap-1 cursor-pointer">
                        <ExternalLink className="w-3.5 h-3.5" />
                        {fr ? 'Voir' : 'عرض'}
                      </button>
                    )}
                    {r.status === 'open' && (
                      <>
                        <button onClick={() => act(() => resolveReport(r.id, 'resolved'), fr ? 'Signalement traité.' : 'تمت المعالجة.')} className={okBtn}>
                          <Check className="w-3.5 h-3.5" />
                          {fr ? 'Traité' : 'معالج'}
                        </button>
                        <button
                          onClick={() => act(() => resolveReport(r.id, 'dismissed'), fr ? 'Signalement classé.' : 'تم الحفظ.')}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer active:scale-95"
                        >
                          {fr ? 'Classer' : 'حفظ'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-center py-12 text-[#6E6773] space-y-2">
    <ShieldCheck className="w-10 h-10 mx-auto opacity-30 text-[#8D174B]" />
    <p className="text-xs font-semibold">{text}</p>
  </div>
);

const StatusBadge: React.FC<{ status: AccessRequest['status']; fr: boolean }> = ({ status, fr }) =>
  status === 'pending' ? (
    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 text-[10px] font-extrabold border border-amber-200 shrink-0 flex items-center gap-1">
      <Clock className="w-3 h-3" />
      {fr ? 'En attente' : 'قيد الانتظار'}
    </span>
  ) : status === 'member' ? (
    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200 shrink-0 flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3" />
      {fr ? 'Accepté' : 'مقبول'}
    </span>
  ) : (
    <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 text-[10px] font-extrabold border border-rose-200 shrink-0 flex items-center gap-1">
      <XCircle className="w-3 h-3" />
      {fr ? 'Refusé' : 'مرفوض'}
    </span>
  );
