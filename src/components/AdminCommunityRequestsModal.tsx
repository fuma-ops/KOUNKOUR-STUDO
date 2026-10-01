import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { 
  CommunityAccessRequest, 
  loadCommunityRequests, 
  approveCommunityRequest, 
  rejectCommunityRequest 
} from '../utils/communityStorage';
import { 
  X, Check, Lock, ShieldCheck, Clock, CheckCircle2, 
  XCircle, Search, User, Filter, AlertCircle 
} from 'lucide-react';

interface AdminCommunityRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onRequestUpdated?: () => void;
}

export const AdminCommunityRequestsModal: React.FC<AdminCommunityRequestsModalProps> = ({
  isOpen,
  onClose,
  language,
  onRequestUpdated,
}) => {
  const [requests, setRequests] = useState<CommunityAccessRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRequests(loadCommunityRequests());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApprove = (id: string, candidateName: string) => {
    approveCommunityRequest(id);
    setRequests(loadCommunityRequests());
    if (onRequestUpdated) onRequestUpdated();
    setActionFeedback(
      language === 'fr' 
        ? `Accès accordé à ${candidateName} avec succès !` 
        : `تمت الموافقة على انضمام ${candidateName} بنجاح !`
    );
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleReject = (id: string, candidateName: string) => {
    rejectCommunityRequest(id);
    setRequests(loadCommunityRequests());
    if (onRequestUpdated) onRequestUpdated();
    setActionFeedback(
      language === 'fr' 
        ? `Demande de ${candidateName} refusée.` 
        : `تم رفض طلب ${candidateName}.`
    );
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch = !searchQuery.trim() || 
      r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roomName.fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#F1E5EC] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-[#8D174B] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                {language === 'fr' ? 'Demandes d’accès aux Cercles Privés' : 'طلبات الانضمام للفضاءات الخاصة'}
              </h3>
              <span className="text-[11px] text-rose-200">
                {language === 'fr' 
                  ? `${pendingCount} demande(s) en attente de validation` 
                  : `${pendingCount} طلب(ات) في انتظار المراجعة`}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action feedback toast */}
        {actionFeedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 px-5 py-2.5 text-xs font-bold flex items-center gap-2 animate-fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Filters & Search */}
        <div className="p-4 border-b border-[#F1E5EC] bg-[#FAF7F9] space-y-3 shrink-0">
          <div className="relative bg-white rounded-xl border border-[#F1E5EC] flex items-center px-3 py-2">
            <Search className="w-4 h-4 text-[#8D174B] shrink-0 me-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'fr' ? 'Rechercher par candidat, salon ou motif...' : 'البحث بالاسم، الفضاء أو السبب...'}
              className="w-full bg-transparent text-xs text-[#242126] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            {[
              { id: 'all', label: language === 'fr' ? `Toutes (${requests.length})` : `الكل (${requests.length})` },
              { id: 'pending', label: language === 'fr' ? `En attente (${pendingCount})` : `قيد الانتظار (${pendingCount})` },
              { id: 'approved', label: language === 'fr' ? `Approuvées (${requests.filter(r => r.status === 'approved').length})` : `مقبولة (${requests.filter(r => r.status === 'approved').length})` },
              { id: 'rejected', label: language === 'fr' ? `Refusées (${requests.filter(r => r.status === 'rejected').length})` : `مرفوضة (${requests.filter(r => r.status === 'rejected').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-[#8D174B] text-white shadow-xs'
                    : 'bg-white text-[#6E6773] border border-[#F1E5EC] hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-[#6E6773] space-y-2">
              <ShieldCheck className="w-10 h-10 mx-auto opacity-30 text-[#8D174B]" />
              <p className="text-xs font-semibold">
                {language === 'fr' ? 'Aucune demande d’accès pour le moment.' : 'لا توجد طلبات انضمام حالياً.'}
              </p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-[#F1E5EC] p-4 shadow-xs space-y-3 hover:border-[#8D174B]/30 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {req.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-[#242126] flex items-center gap-1.5 flex-wrap">
                        <span>{req.userName}</span>
                        {req.userRole && (
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF0F5] text-[#8D174B] text-[10px] font-bold">
                            {req.userRole}
                          </span>
                        )}
                      </h4>
                      <span className="text-[11px] text-[#6E6773] flex items-center gap-1 mt-0.5">
                        <Lock className="w-3 h-3 text-amber-700" />
                        <strong className="text-amber-900">{req.roomName[language] || req.roomName.fr}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {req.status === 'pending' ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 text-[10px] font-extrabold border border-amber-200 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{language === 'fr' ? 'En attente' : 'قيد الانتظار'}</span>
                    </span>
                  ) : req.status === 'approved' ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200 shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{language === 'fr' ? 'Accès Validé' : 'مقبول'}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 text-[10px] font-extrabold border border-rose-200 shrink-0 flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-600" />
                      <span>{language === 'fr' ? 'Refusé' : 'مرفوض'}</span>
                    </span>
                  )}
                </div>

                {/* Justification Text */}
                <div className="bg-[#FAF7F9] p-3 rounded-xl border border-[#F1E5EC] text-xs text-[#3E3844] leading-relaxed">
                  <strong className="block text-[10px] font-bold text-[#8D174B] uppercase mb-0.5">
                    {language === 'fr' ? 'Motif & Preuve de convocation :' : 'سبب الترشح وإثبات الاستدعاء :'}
                  </strong>
                  <span>{req.reason}</span>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[#FAF4F7] text-[11px]">
                  <span className="text-[#8E8694]">{req.createdAt}</span>

                  <div className="flex items-center gap-2">
                    {req.status !== 'approved' && (
                      <button
                        onClick={() => handleApprove(req.id, req.userName)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{language === 'fr' ? 'Approuver l’accès' : 'الموافقة على الانضمام'}</span>
                      </button>
                    )}

                    {req.status !== 'rejected' && (
                      <button
                        onClick={() => handleReject(req.id, req.userName)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{language === 'fr' ? 'Refuser' : 'رفض'}</span>
                      </button>
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
