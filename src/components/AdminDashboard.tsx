import React, { useState, useEffect } from 'react';
import { Language, Contest } from '../types';
import { 
  Users, FileText, Eye, Download, TrendingUp, Settings, 
  ShieldCheck, AlertTriangle, CheckCircle2, MoreHorizontal, 
  Calendar, Search, Bell, ChevronDown, ArrowRight, ArrowLeft,
  Home, Award, BookOpen, CheckSquare, Layers, Newspaper, 
  Heart, PlusCircle, Database, Radio, BellRing, Sparkles,
  SlidersHorizontal, Check, RefreshCw, X, ShieldAlert, Filter, Trash2,
  Edit3, Upload, Image as ImageIcon
} from 'lucide-react';
import { RadarModule } from './RadarModule';
import { QcmModule } from './QcmModule';
import { CommunityModule } from './CommunityModule';
import { PdfViewerModal } from './PdfViewerModal';
import { ContestEditModal } from './ContestEditModal';
import { AdminCommunityRequestsModal } from './AdminCommunityRequestsModal';
import { AdminOverview } from './AdminOverview';
import { listAccessRequests } from '../data/communityApi';
import { getAllActiveContests, deleteContestFromSystem, updateContestInSystem, resolveAdministrationLogo } from '../utils/radarStorage';
import { checkEligibility, CandidateProfile } from '../utils/candidateStorage';

interface AdminDashboardProps {
  language: Language;
  onNavigateToUserApp?: () => void;
  onNavigateTab?: (tab: string) => void;
  onSelectContest?: (contest: Contest) => void;
  onContestImported?: (contest: Contest) => void;
  onDeleteContest?: (contestId: string) => Promise<void> | void;
  // Compte connecté (affiché dans l'en-tête à la place d'un profil d'exemple).
  userEmail?: string | null;
  userRole?: string | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  language,
  onNavigateToUserApp,
  onNavigateTab,
  onSelectContest,
  onContestImported,
  onDeleteContest,
  userEmail = null,
  userRole = null,
}) => {
  const isRTL = language === 'ar';
  
  // Active Sidebar Item
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('tableau_de_bord');



  // Export report notification
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [adminPdfUrl, setAdminPdfUrl] = useState<string | null>(null);
  const [adminPdfTitle, setAdminPdfTitle] = useState<string>('');

  // Contests management, modification & suppression state
  const [contestsList, setContestsList] = useState<Contest[]>(() => getAllActiveContests());
  const [contestSearchQuery, setContestSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [isCommunityRequestsModalOpen, setIsCommunityRequestsModalOpen] = useState<boolean>(false);
  const [communityRequestsCount, setCommunityRequestsCount] = useState<number>(0);
  const refreshCommunityRequestsCount = () => {
    listAccessRequests()
      .then((reqs) => setCommunityRequestsCount(reqs.filter((r) => r.status === 'pending').length))
      .catch(() => setCommunityRequestsCount(0));
  };
  useEffect(() => {
    refreshCommunityRequestsCount();
  }, []);

  const handleSaveContest = async (updated: Contest) => {
    await updateContestInSystem(updated);
    setContestsList((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (onContestImported) {
      onContestImported(updated);
    }
    setExportNotice(
      language === 'fr' 
        ? 'Concours et image modifiés avec succès !' 
        : 'تم تحديث بيانات المباراة والصورة بنجاح !'
    );
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleDeleteContest = async (id: string) => {
    setIsDeletingId(id);
    try {
      if (onDeleteContest) {
        await onDeleteContest(id);
      } else {
        await deleteContestFromSystem(id);
      }
      setContestsList((prev) => prev.filter((c) => c.id !== id && c.id !== `c-${id}`));
      setExportNotice(
        language === 'fr' 
          ? 'Concours supprimé définitivement du catalogue.' 
          : 'تم حذف المباراة نهائياً من الدليل.'
      );
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      setExportNotice(language === 'fr' ? 'Erreur lors de la suppression' : 'خطأ أثناء الحذف');
    } finally {
      setIsDeletingId(null);
      setDeleteConfirmId(null);
    }
  };



  return (
    <div className="min-h-screen bg-[#FDF9FB] text-[#242126] flex flex-col lg:flex-row antialiased">
      
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR (Matching Screenshot Navigation) */}
      {/* ========================================================= */}
      {(() => {
        // Sections réelles du back-office (sans pages d'exemple).
        const NAV = [
          { id: 'tableau_de_bord', labelFr: 'Tableau de bord', labelAr: 'لوحة القيادة', icon: TrendingUp },
          { id: 'concours_radar', labelFr: 'Radar & revue', labelAr: 'الرادار والمراجعة', icon: Radio },
          { id: 'gestion_contenus', labelFr: 'Concours publiés', labelAr: 'المباريات المنشورة', icon: Database },
          { id: 'qcm', labelFr: 'QCM & annales', labelAr: 'الاختبارات', icon: CheckSquare },
          { id: 'community', labelFr: 'Communauté', labelAr: 'المجتمع', icon: Users },
          { id: 'utilisateurs', labelFr: 'Utilisateurs', labelAr: 'المستخدمون', icon: ShieldCheck },
          { id: 'smart_match', labelFr: 'Smart Match', labelAr: 'المطابقة الذكية', icon: Sparkles },
        ];
        const label = (it: (typeof NAV)[number]) => (language === 'fr' ? it.labelFr : it.labelAr);
        return (
          <>
            {/* Téléphone / tablette : barre compacte + sections en défilement horizontal */}
            <div className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F1E5EC]">
              <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#8D174B] flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">👑</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-[#8D174B] leading-none">KounKour Admin</div>
                    {userEmail && <div className="text-[10px] text-[#8E8694] truncate">{userEmail}</div>}
                  </div>
                </div>
                {onNavigateToUserApp && (
                  <button
                    onClick={onNavigateToUserApp}
                    className="shrink-0 px-3 py-2 rounded-xl bg-[#FAF0F5] text-[#8D174B] text-xs font-bold active:scale-95 transition-all"
                  >
                    {language === 'fr' ? '← Retour au site' : 'العودة للموقع →'}
                  </button>
                )}
              </div>
              <nav aria-label="Sections admin" className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSidebarItem === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSidebarItem(item.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                        isActive ? 'bg-[#8D174B] text-white shadow-md shadow-[#8D174B]/25' : 'bg-[#FAF4F7] text-[#5A5360]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label(item)}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Ordinateur : barre latérale */}
            <aside className="hidden lg:flex w-64 bg-white border-r border-[#F1E5EC] flex-col shrink-0 lg:sticky lg:top-0 lg:h-screen">
              <div className="p-5 border-b border-[#F1E5EC] flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#8D174B] flex items-center justify-center shadow-md shadow-[#8D174B]/20">
                  <span className="text-white text-lg font-bold">👑</span>
                </div>
                <div>
                  <span className="text-xl font-extrabold tracking-tight text-[#8D174B]">KounKour</span>
                  <span className="text-[10px] font-bold text-gray-400 block -mt-1">ADMIN</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1 text-xs font-semibold">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSidebarItem === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSidebarItem(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer text-start ${
                        isActive ? 'bg-[#8D174B] text-white font-bold shadow-md shadow-[#8D174B]/25' : 'text-[#5A5360] hover:text-[#242126] hover:bg-[#FAF4F7]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8D174B]'}`} />
                      <span>{label(item)}</span>
                    </button>
                  );
                })}
              </div>
              {onNavigateToUserApp && (
                <div className="p-4 border-t border-[#F1E5EC]">
                  <button
                    onClick={onNavigateToUserApp}
                    className="w-full py-2.5 px-3 rounded-2xl bg-[#FAF0F5] hover:bg-[#F3E2EC] text-[#8D174B] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>{language === 'fr' ? '⬅ Revenir au site' : '⬅ العودة إلى الموقع'}</span>
                  </button>
                </div>
              )}
            </aside>
          </>
        );
      })()}

      {/* ========================================================= */}
      {/* 2. MAIN ADMIN CONTENT AREA */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Moroccan Panoramic Header Bar */}
        <div className="relative bg-white border-b border-[#F1E5EC] overflow-hidden">
          {/* Subtle Moroccan minaret panorama backdrop */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#8D174B_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">

            {/* User Profile & Notification icons */}
            <div className="flex items-center gap-3">
              {/* Private Circle Requests Button */}
              <button
                onClick={() => setIsCommunityRequestsModalOpen(true)}
                className="px-3 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer relative shadow-2xs"
                title={language === 'fr' ? 'Demandes d’accès, salons proposés et signalements' : 'طلبات الانضمام والفضاءات المقترحة والتبليغات'}
              >
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>
                  {language === 'fr' ? 'Modération' : 'الإشراف'}
                </span>
                {communityRequestsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[10px] font-bold">
                    {communityRequestsCount}
                  </span>
                )}
              </button>

              {/* Compte réellement connecté */}
              {userEmail && (
                <div className="hidden lg:flex items-center gap-2.5 bg-white border border-[#F1E5EC] rounded-2xl px-3 py-2 shadow-2xs">
                  <div className="text-start">
                    <div className="text-xs font-extrabold text-[#242126] leading-none">{userEmail}</div>
                    {userRole && <div className="text-[10px] text-[#8E8694] font-semibold mt-0.5 capitalize">{userRole}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Body */}
        {activeSidebarItem === 'concours_radar' || activeSidebarItem === 'revue_annonces' ? (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <RadarModule
              language={language}
              onSelectContest={onSelectContest}
              onContestImported={(c) => {
                setContestsList(getAllActiveContests());
                if (onContestImported) onContestImported(c);
              }}
              onDeleteContest={handleDeleteContest}
            />
          </div>
        ) : activeSidebarItem === 'gestion_contenus' || activeSidebarItem === 'concours' ? (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F1924]">
                  {language === 'fr' ? 'Gestion des concours' : 'إدارة المباريات'} <span className="text-[#8D174B] font-serif italic">• {language === 'fr' ? 'Catalogue & Suppression' : 'الدليل والحذف'}</span>
                </h1>
                <p className="text-xs sm:text-sm text-[#6E6773] mt-1 font-medium">
                  {language === 'fr'
                    ? 'Consultez toutes les annonces actuellement au catalogue et supprimez directement celles qui sont obsolètes ou invalides.'
                    : 'استعرض جميع مباريات الدليل الحالي واحذف مباشرة الإعلانات المنتهية أو غير الصالحة.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-[#FAF0F5] text-[#8D174B] text-xs font-bold border border-[#8D174B]/20">
                  {contestsList.length} {language === 'fr' ? 'concours actifs' : 'مباراة نشطة'}
                </span>
              </div>
            </div>

            {/* Toast notification */}
            {exportNotice && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{exportNotice}</span>
              </div>
            )}

            {/* Search & Actions Bar */}
            <div className="bg-white border border-[#F1E5EC] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 text-[#8D174B] absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={contestSearchQuery}
                  onChange={(e) => setContestSearchQuery(e.target.value)}
                  placeholder={language === 'fr' ? 'Filtrer par titre, administration, référence...' : 'بحث بالعنوان، الإدارة أو المرجع...'}
                  className="w-full text-xs bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl ps-9 pe-3 py-2 text-[#242126] focus:outline-none focus:border-[#8D174B]"
                />
              </div>

              <button
                onClick={() => setContestsList(getAllActiveContests())}
                className="px-3.5 py-2 rounded-xl bg-[#FAF4F7] hover:bg-[#F3E2EC] text-[#8D174B] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Rafraîchir la liste' : 'تحديث القائمة'}</span>
              </button>
            </div>

            {/* Contests Table */}
            <div className="bg-white rounded-3xl border border-[#F1E5EC] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead>
                    <tr className="bg-[#FAF7F9] border-b border-[#F1E5EC] text-gray-500 font-bold uppercase text-[10px]">
                      <th className="py-3 px-4 text-start">Administration</th>
                      <th className="py-3 px-4 text-start">Intitulé du concours</th>
                      <th className="py-3 px-4 text-center">Postes</th>
                      <th className="py-3 px-4 text-start">Dernier délai</th>
                      <th className="py-3 px-4 text-center">Statut</th>
                      <th className="py-3 px-4 text-end">Actions Administrateur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FAF4F7]">
                    {contestsList
                      .filter((c) => {
                        if (!contestSearchQuery.trim()) return true;
                        const q = contestSearchQuery.toLowerCase().trim();
                        return (
                          (c.title?.fr || '').toLowerCase().includes(q) ||
                          (c.title?.ar || '').toLowerCase().includes(q) ||
                          (c.administration?.name?.fr || '').toLowerCase().includes(q) ||
                          (c.administration?.name?.ar || '').toLowerCase().includes(q) ||
                          (c.referenceCode || '').toLowerCase().includes(q) ||
                          (c.specialty?.fr || '').toLowerCase().includes(q)
                        );
                      })
                      .map((c) => {
                        const isDeletingThis = isDeletingId === c.id;
                        const isConfirming = deleteConfirmId === c.id;
                        return (
                          <tr key={c.id} className="hover:bg-[#FAF7F9] transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                  <img
                                    src={resolveAdministrationLogo(c.administration?.name?.fr, c.administration?.category, c.title?.fr)}
                                    alt="Logo"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <span className="font-bold text-[#8D174B] text-[11px] truncate max-w-[140px]">
                                  {c.administration?.name?.[language] || c.administration?.name?.fr || 'Administration'}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-[#242126] max-w-xs">
                              <div className="truncate">{c.title?.[language] || c.title?.fr}</div>
                              {c.referenceCode && (
                                <span className="text-[10px] text-gray-400 font-mono font-normal">
                                  {c.referenceCode}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center font-extrabold text-[#242126] font-mono">
                              {c.postsCount || 1}
                            </td>

                            <td className="py-3.5 px-4 text-[11px] text-gray-600 whitespace-nowrap">
                              {c.deadlineDate || (language === 'fr' ? 'À vérifier' : 'غير مؤكد')}
                            </td>

                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.status === 'open' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                c.status === 'closing_soon' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {c.status === 'open' ? (language === 'fr' ? 'Ouvert' : 'مفتوح') :
                                 c.status === 'closing_soon' ? (language === 'fr' ? 'Bientôt clos' : 'قريب الإغلاق') :
                                 (language === 'fr' ? 'Clôturé' : 'مغلق')}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-end whitespace-nowrap">
                              {isConfirming ? (
                                <div className="flex items-center justify-end gap-1.5 animate-fade-in">
                                  <span className="text-[10px] text-rose-700 font-bold">
                                    {language === 'fr' ? 'Confirmer ?' : 'تأكيد ؟'}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteContest(c.id)}
                                    disabled={isDeletingThis}
                                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    {isDeletingThis ? '...' : (language === 'fr' ? 'Oui, supprimer' : 'نعم')}
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold transition-all cursor-pointer"
                                  >
                                    {language === 'fr' ? 'Non' : 'لا'}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  {onSelectContest && (
                                    <button
                                      onClick={() => onSelectContest(c)}
                                      className="px-2.5 py-1.5 rounded-xl bg-[#FAF0F5] hover:bg-[#F3E2EC] text-[#8D174B] text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                      title={language === 'fr' ? 'Voir l’annonce' : 'عرض الإعلان'}
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>{language === 'fr' ? 'Consulter' : 'عرض'}</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => setEditingContest(c)}
                                    className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                    title={language === 'fr' ? 'Modifier les données et téléverser une image' : 'تعديل ورفع صورة'}
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{language === 'fr' ? 'Modifier' : 'تعديل'}</span>
                                  </button>

                                  <button
                                    onClick={() => setDeleteConfirmId(c.id)}
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                    title={language === 'fr' ? 'Supprimer ce concours' : 'حذف المباراة'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                    <span>{language === 'fr' ? 'Supprimer' : 'حذف'}</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeSidebarItem === 'qcm' ? (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F1924]">
                {language === 'fr' ? 'Module QCM & Examens' : 'بنك أسئلة الـ QCM'} <span className="text-[#8D174B] font-serif italic">• {language === 'fr' ? 'Préparation & Entraînement' : 'التدريب والاختبارات'}</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#6E6773] mt-1">
                {language === 'fr' ? 'Consultez les séries de questions, effectuez des simulations et suivez les scores des candidats.' : 'استعرض سلاسل الأسئلة، قم بإجراء اختبارات تجريبية وتتبع نتائج المرشحين.'}
              </p>
            </div>
            <QcmModule language={language} />
          </div>
        ) : activeSidebarItem === 'community' ? (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F1924]">
                {language === 'fr' ? 'Communauté & Entraide' : 'المجتمع والتعاون'} <span className="text-[#8D174B] font-serif italic">• {language === 'fr' ? 'Modération & Échanges' : 'إدارة ومراقبة المنشورات'}</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#6E6773] mt-1">
                {language === 'fr' ? 'Espace d’entraide entre candidats marocains et modération des discussions sur les concours.' : 'فضاء التبادل والتوجيه بين المترشحين ومراقبة منشورات المباريات.'}
              </p>
            </div>
            <CommunityModule language={language} isAuthed isStaff />
          </div>
        ) : activeSidebarItem === 'smart_match' ? (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F1924]">
                  Smart Match <span className="text-[#8D174B] font-serif italic">• Simulateur d’éligibilité statutaire</span>
                </h1>
                <p className="text-xs sm:text-sm text-[#6E6773] mt-1">
                  {language === 'fr'
                    ? 'Testez instantanément les règles statutaires marocaines (même spécialité ET même nombre d’années après le bac, conditions d’âge ; en cas de doute : « à vérifier ») sur tous les concours actifs.'
                    : 'اختبر قواعد المطابقة القانونية المغربية الفورية على كافة مباريات الدليل.'}
                </p>
              </div>
            </div>

            {/* Smart Match Rules Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-[#F1E5EC] shadow-xs">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-3">
                  1
                </div>
                <h3 className="text-sm font-bold text-[#242126] mb-1">Règle statutaire stricte</h3>
                <p className="text-xs text-[#6E6773]">
                  Un titulaire d'un diplôme d'Ingénieur ou Master (Bac+5) est classé <strong>Non Éligible</strong> d'office pour un grade de Technicien (Bac+2).
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#F1E5EC] shadow-xs">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-3">
                  2
                </div>
                <h3 className="text-sm font-bold text-[#242126] mb-1">Spécialités officielles</h3>
                <p className="text-xs text-[#6E6773]">
                  Croisement strict des racines lexicales du profil candidat contre le tableau des spécialités statutaires de l'arrêté.
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#F1E5EC] shadow-xs">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold mb-3">
                  3
                </div>
                <h3 className="text-sm font-bold text-[#242126] mb-1">Âge et autres conditions</h3>
                <p className="text-xs text-[#6E6773]">
                  Pris en compte uniquement quand l’annonce officielle les indique ; sinon « à vérifier » dans l’arrêté.
                </p>
              </div>
            </div>
          </div>
        ) : activeSidebarItem === 'utilisateurs' ? (
          <AdminOverview language={language} section="users" />
        ) : (
          <AdminOverview
            language={language}
            onGo={setActiveSidebarItem}
            onOpenModeration={() => setIsCommunityRequestsModalOpen(true)}
          />
        )}
      </main>

      {/* Admin In-Site PDF Viewer */}
      <PdfViewerModal
        isOpen={!!adminPdfUrl}
        onClose={() => setAdminPdfUrl(null)}
        pdfUrl={adminPdfUrl || ''}
        title={adminPdfTitle}
        language={language}
      />

      {/* Admin Contest & Image Upload Edit Modal */}
      <ContestEditModal
        isOpen={!!editingContest}
        onClose={() => setEditingContest(null)}
        contest={editingContest}
        language={language}
        onSave={handleSaveContest}
      />

      {/* Admin Private Circle Access Requests Modal */}
      <AdminCommunityRequestsModal
        isOpen={isCommunityRequestsModalOpen}
        onClose={() => setIsCommunityRequestsModalOpen(false)}
        language={language}
        onRequestUpdated={() => {
          refreshCommunityRequestsCount();
        }}
      />
    </div>
  );
};
