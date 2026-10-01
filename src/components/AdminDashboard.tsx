import React, { useState } from 'react';
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
import { loadCommunityRequests } from '../utils/communityStorage';
import { getAllActiveContests, deleteContestFromSystem, updateContestInSystem, resolveAdministrationLogo } from '../utils/radarStorage';
import { checkEligibility, CandidateProfile } from '../utils/candidateStorage';

interface AdminDashboardProps {
  language: Language;
  onNavigateToUserApp?: () => void;
  onNavigateTab?: (tab: string) => void;
  onSelectContest?: (contest: Contest) => void;
  onContestImported?: (contest: Contest) => void;
  onDeleteContest?: (contestId: string) => Promise<void> | void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  language,
  onNavigateToUserApp,
  onNavigateTab,
  onSelectContest,
  onContestImported,
  onDeleteContest,
}) => {
  const isRTL = language === 'ar';
  
  // Active Sidebar Item
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('statistiques');

  // Search query
  const [topSearch, setTopSearch] = useState('');

  // Date Range state
  const [dateRange, setDateRange] = useState('1 sept. 2026 - 30 sept. 2026');

  // Settings Toggles State
  const [settingsTab, setSettingsTab] = useState<'general' | 'notifications' | 'security' | 'integrations'>('general');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [manualValidation, setManualValidation] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

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
  const [communityRequestsCount, setCommunityRequestsCount] = useState<number>(() => {
    return loadCommunityRequests().filter((r) => r.status === 'pending').length;
  });

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

  const handleSaveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleExportReport = () => {
    setExportNotice(
      language === 'fr' 
        ? 'Rapport d’audit et d’analytics généré avec succès (PDF / CSV) !' 
        : 'تم تصدير تقرير الإحصائيات وسجل العمليات بنجاح !'
    );
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#FDF9FB] text-[#242126] flex flex-col lg:flex-row antialiased">
      
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR (Matching Screenshot Navigation) */}
      {/* ========================================================= */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-[#F1E5EC] flex flex-col shrink-0">
        
        {/* Logo */}
        <div className="p-5 border-b border-[#F1E5EC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#8D174B] flex items-center justify-center shadow-md shadow-[#8D174B]/20">
              <span className="text-white text-lg font-bold">🌸</span>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-[#8D174B]">KounKour</span>
              <span className="text-[10px] font-bold text-gray-400 block -mt-1">ADMIN PORTAL</span>
            </div>
          </div>

          {onNavigateToUserApp && (
            <button
              onClick={onNavigateToUserApp}
              className="lg:hidden px-3 py-1 rounded-xl bg-[#FAF0F5] text-[#8D174B] text-xs font-bold"
            >
              Retour App
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs font-semibold">
          
          {/* Main User Sections */}
          <div className="space-y-1">
            {[
              { id: 'home', labelFr: 'Accueil', labelAr: 'الرئيسية', icon: Home },
              { id: 'concours', labelFr: 'Concours', labelAr: 'المباريات', icon: Award },
              { id: 'annales', labelFr: 'Annales', labelAr: 'النماذج السابقة', icon: FileText },
              { id: 'cours', labelFr: 'Cours', labelAr: 'الدروس', icon: BookOpen },
              { id: 'qcm', labelFr: 'QCM', labelAr: 'الاختبارات', icon: CheckSquare },
              { id: 'fiches', labelFr: 'Fiches', labelAr: 'البطاقات', icon: Layers },
              { id: 'actualites', labelFr: 'Actualités', labelAr: 'المستجدات', icon: Newspaper },
              { id: 'community', labelFr: 'Communauté', labelAr: 'المجتمع', icon: Users },
              { id: 'mes_favoris', labelFr: 'Mes favoris', labelAr: 'المفضلة', icon: Heart },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeSidebarItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'home') {
                      if (onNavigateToUserApp) onNavigateToUserApp();
                    } else {
                      setActiveSidebarItem(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer text-start ${
                    isActive
                      ? 'bg-[#8D174B] text-white font-bold shadow-md shadow-[#8D174B]/25'
                      : 'text-[#6E6773] hover:text-[#242126] hover:bg-[#FAF4F7]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8D174B]'}`} />
                  <span>{language === 'fr' ? item.labelFr : item.labelAr}</span>
                </button>
              );
            })}
          </div>

          {/* Section Divider: ESPACE ADMIN */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-extrabold text-[#8D174B] uppercase tracking-wider">
              {language === 'fr' ? 'Espace Admin' : 'فضاء الإدارة'}
            </div>
            
            <div className="space-y-1">
              {[
                { id: 'tableau_de_bord', labelFr: 'Tableau de bord', labelAr: 'لوحة القيادة', icon: PlusCircle },
                { id: 'gestion_contenus', labelFr: 'Gestion contenus', labelAr: 'إدارة المحتويات', icon: Database },
                { id: 'concours_radar', labelFr: 'Concours Radar', labelAr: 'رادار المباريات', icon: Radio },
                { id: 'revue_annonces', labelFr: 'Revue des annonces', labelAr: 'مراجعة الإعلانات', icon: BellRing },
                { id: 'smart_match', labelFr: 'Smart Match', labelAr: 'المطابقة الذكية', icon: Sparkles },
                { id: 'utilisateurs', labelFr: 'Utilisateurs', labelAr: 'المستخدمين', icon: Users },
                { id: 'statistiques', labelFr: 'Statistiques', labelAr: 'الإحصائيات والتدقيق', icon: TrendingUp },
                { id: 'parametres', labelFr: 'Paramètres', labelAr: 'الإعدادات العامة', icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeSidebarItem === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSidebarItem(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer text-start ${
                      isActive
                        ? 'bg-[#8D174B] text-white font-bold shadow-md shadow-[#8D174B]/25'
                        : 'text-[#5A5360] hover:text-[#242126] hover:bg-[#FAF4F7]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8D174B]'}`} />
                    <span>{language === 'fr' ? item.labelFr : item.labelAr}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Back to Candidate Portal CTA */}
        {onNavigateToUserApp && (
          <div className="p-4 border-t border-[#F1E5EC] hidden lg:block">
            <button
              onClick={onNavigateToUserApp}
              className="w-full py-2.5 px-3 rounded-2xl bg-[#FAF0F5] hover:bg-[#F3E2EC] text-[#8D174B] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{language === 'fr' ? '⬅ Revenir au Portail Candidat' : '⬅ العودة إلى بوابة المترشح'}</span>
            </button>
          </div>
        )}
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN ADMIN CONTENT AREA */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Moroccan Panoramic Header Bar */}
        <div className="relative bg-white border-b border-[#F1E5EC] overflow-hidden">
          {/* Subtle Moroccan minaret panorama backdrop */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#8D174B_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="relative w-full sm:max-w-md bg-[#FAF7F9] border border-[#F1E5EC] rounded-2xl px-4 py-2.5 flex items-center gap-2.5 focus-within:border-[#8D174B] focus-within:bg-white transition-all shadow-2xs">
              <Search className="w-4 h-4 text-[#8D174B]" />
              <input
                type="text"
                value={topSearch}
                onChange={(e) => setTopSearch(e.target.value)}
                placeholder={language === 'fr' ? 'Rechercher un concours, un document, une administration...' : 'البحث عن مباراة، وثيقة، إدارة...'}
                className="w-full bg-transparent text-xs text-[#242126] placeholder-[#8E8694] focus:outline-none"
              />
            </div>

            {/* User Profile & Notification icons */}
            <div className="flex items-center gap-3">
              {/* Private Circle Requests Button */}
              <button
                onClick={() => setIsCommunityRequestsModalOpen(true)}
                className="px-3 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer relative shadow-2xs"
                title={language === 'fr' ? 'Validation des demandes d’adhésion aux cercles privés' : 'طلبات الانضمام للفضاءات الخاصة'}
              >
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span className="hidden sm:inline">
                  {language === 'fr' ? 'Cercles Privés' : 'الفضاءات الخاصة'}
                </span>
                {communityRequestsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[10px] font-bold">
                    {communityRequestsCount}
                  </span>
                )}
              </button>

              {/* Notification Bell */}
              <button className="relative p-2.5 rounded-2xl bg-white border border-[#F1E5EC] hover:bg-[#FAF0F5] text-[#242126] transition-all cursor-pointer">
                <Bell className="w-4 h-4 text-[#8D174B]" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#8D174B] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white">
                  5
                </span>
              </button>

              {/* User Profile Capsule */}
              <div className="flex items-center gap-2.5 bg-white border border-[#F1E5EC] rounded-2xl p-1.5 pe-3 shadow-2xs">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Yasmine"
                  className="w-8 h-8 rounded-xl object-cover"
                />
                <div className="text-start">
                  <div className="text-xs font-extrabold text-[#242126] leading-none">Yasmine</div>
                  <div className="text-[10px] text-[#8E8694] font-semibold mt-0.5">Administrateur</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ms-1" />
              </div>
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
            <CommunityModule language={language} />
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
                    ? 'Testez instantanément les règles statutaires marocaines (non-surqualification Bac+5 vs Bac+2, conditions d’âge, concordance de spécialité) sur tous les concours actifs.'
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
                <h3 className="text-sm font-bold text-[#242126] mb-1">Bornes d’âge officielles</h3>
                <p className="text-xs text-[#6E6773]">
                  45 ans (Échelle 10/11), 40 ans (Techniciens Échelle 8/9), 30 ans (Sûreté Nationale DGSN).
                </p>
              </div>
            </div>
          </div>
        ) : activeSidebarItem === 'annales' || activeSidebarItem === 'cours' || activeSidebarItem === 'fiches' || activeSidebarItem === 'actualites' ? (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F1924]">
                {language === 'fr' ? 'Ressources & Bibliothèque Pédagogique' : 'المكتبة الرقمية والمراجع'} <span className="text-[#8D174B] font-serif italic">• {activeSidebarItem.toUpperCase()}</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#6E6773] mt-1">
                {language === 'fr' ? 'Gestion des sujets d’annales des sessions passées, cours de synthèse et fiches de révision.' : 'إدارة نماذج الامتحانات السابقة، الملخصات والبطاقات التوجيهية.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Sujet Concours Administrateurs 2e grade (Économie & Gestion)', year: 'Session 2025', type: 'Annales PDF', size: '2.4 Mo', url: 'https://www.emploi-public.ma' },
                { title: 'Épreuve Ingénieurs d’État Génie Informatique & Réseaux', year: 'Session 2025', type: 'Annales PDF', size: '3.1 Mo', url: 'https://www.emploi-public.ma' },
                { title: 'Fiche Synthèse : Organisation administrative du Royaume', year: 'Guide 2026', type: 'Fiche PDF', size: '1.2 Mo', url: 'https://www.emploi-public.ma' },
                { title: 'QCM Droit Administratif & Fonction Publique Marocaine', year: 'Série QCM', type: 'Test interactif', size: '50 questions', url: 'https://www.emploi-public.ma' },
                { title: 'Guide de rédaction du Sujet d’ordre général (Dissertation)', year: 'Méthodologie', type: 'Cours PDF', size: '1.8 Mo', url: 'https://www.emploi-public.ma' },
                { title: 'Épreuve Techniciens Spécialisés Génie Civil & BTP', year: 'Session 2024', type: 'Annales PDF', size: '2.9 Mo', url: 'https://www.emploi-public.ma' },
              ].map((res, i) => (
                <div key={i} className="p-5 rounded-3xl bg-white border border-[#F1E5EC] shadow-xs flex flex-col justify-between hover:border-[#8D174B]/30 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0F5] text-[#8D174B] text-[10px] font-bold">
                        {res.type}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{res.year}</span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#242126] mb-2 leading-snug">{res.title}</h3>
                  </div>
                  <div className="pt-3 border-t border-[#FAF4F7] flex items-center justify-between text-xs gap-2">
                    <span className="text-[11px] text-gray-500 font-mono">{res.size}</span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => {
                          setAdminPdfUrl(res.url);
                          setAdminPdfTitle(res.title);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF0F5] hover:bg-[#F3E2EC] text-[#8D174B] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{language === 'fr' ? 'Visualiser' : 'معاينة'}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setAdminPdfUrl(res.url);
                          setAdminPdfTitle(res.title);
                        }}
                        className="p-1 rounded-lg hover:bg-gray-100 text-[#8D174B] cursor-pointer"
                        title="Télécharger"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeSidebarItem === 'utilisateurs' ? (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F1924]">
                  {language === 'fr' ? 'Gestion des Utilisateurs' : 'إدارة المستخدمين'} <span className="text-[#8D174B] font-serif italic">• {language === 'fr' ? 'Rôles & Accès' : 'الصلاحيات'}</span>
                </h1>
                <p className="text-xs sm:text-sm text-[#6E6773] mt-1">
                  {language === 'fr' ? 'Comptes enregistrés, permissions du personnel administratif et candidats connectés.' : 'حسابات المترشحين، صلاحيات الإدارة والأعضاء.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-[#F1E5EC] shadow-xs">
                <span className="text-2xl font-black text-[#1F1924] font-mono">56 842</span>
                <span className="text-xs font-bold text-gray-500 block mt-1">Candidats inscrits</span>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-[#F1E5EC] shadow-xs">
                <span className="text-2xl font-black text-[#8D174B] font-mono">14</span>
                <span className="text-xs font-bold text-gray-500 block mt-1">Modérateurs & Staff</span>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-[#F1E5EC] shadow-xs">
                <span className="text-2xl font-black text-emerald-700 font-mono">2</span>
                <span className="text-xs font-bold text-gray-500 block mt-1">Super Administrateurs</span>
              </div>
            </div>
          </div>
        ) : activeSidebarItem === 'mes_favoris' ? (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F1924]">
                {language === 'fr' ? 'Favoris & Suivi des Candidatures' : 'المفضلة وتتبع الترشيحات'}
              </h1>
              <p className="text-xs sm:text-sm text-[#6E6773] mt-1">
                {language === 'fr' ? 'Concours mis en favoris et étapes de suivi des dossiers de candidature.' : 'المباريات المحفوظة في المفضلة ومراحل تتبع الملفات.'}
              </p>
            </div>
            <div className="bg-white rounded-3xl border border-[#F1E5EC] p-6 shadow-xs">
              <p className="text-xs text-[#6E6773]">
                {language === 'fr' ? 'Consultez la liste des concours suivis et synchronisez vos alertes.' : 'استعرض المباريات المتابعة وقم بتفعيل التنبيهات.'}
              </p>
            </div>
          </div>
        ) : (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Header Title & Date Range / Export Report */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F1924]">
                Analytics <span className="text-[#8D174B] font-serif italic">• Paramètres & Journal d’audit</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#6E6773] mt-1 font-medium">
                {language === 'fr' 
                  ? 'Suivez les performances de la plateforme, gérez les paramètres et consultez l’historique des actions.' 
                  : 'تتبع مؤشرات أداء المنصة، ضبط الإعدادات ومراجعة سجل العمليات الإدارية.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <button className="px-3.5 py-2.5 rounded-2xl bg-white border border-[#F1E5EC] hover:border-[#8D174B]/30 text-xs font-bold text-[#242126] flex items-center gap-2 shadow-2xs transition-all cursor-pointer">
                <Calendar className="w-3.5 h-3.5 text-[#8D174B]" />
                <span>{dateRange}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              <button
                onClick={handleExportReport}
                className="px-4 py-2.5 rounded-2xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold shadow-md shadow-[#8D174B]/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>{language === 'fr' ? 'Exporter le rapport' : 'تصدير التقرير'}</span>
              </button>
            </div>
          </div>

          {/* Export Toast notice */}
          {exportNotice && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{exportNotice}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. TOP 4 METRIC KPI CARDS (Matching Screenshot) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1 */}
            <div className="bg-white rounded-3xl border border-[#F1E5EC] p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
              <div className="w-13 h-13 rounded-2xl bg-[#FAF0F5] flex items-center justify-center text-[#8D174B] shrink-0">
                <Users className="w-6 h-6 text-[#8D174B]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-[#1F1924] font-mono">56 842</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-200">
                    ▲ 18%
                  </span>
                </div>
                <div className="text-xs font-bold text-[#5A5360] mt-0.5">
                  {language === 'fr' ? 'Utilisateurs actifs' : 'المستخدمون النشطون'}
                </div>
                <span className="text-[10px] text-gray-400 block">vs. mois précédent</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white rounded-3xl border border-[#F1E5EC] p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
              <div className="w-13 h-13 rounded-2xl bg-[#FAF0F5] flex items-center justify-center text-[#8D174B] shrink-0">
                <FileText className="w-6 h-6 text-[#8D174B]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-[#1F1924] font-mono">1 284</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-200">
                    ▲ 22%
                  </span>
                </div>
                <div className="text-xs font-bold text-[#5A5360] mt-0.5">
                  {language === 'fr' ? 'Annonces publiées' : 'الإعلانات المنشورة'}
                </div>
                <span className="text-[10px] text-gray-400 block">vs. mois précédent</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white rounded-3xl border border-[#F1E5EC] p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
              <div className="w-13 h-13 rounded-2xl bg-[#FAF0F5] flex items-center justify-center text-[#8D174B] shrink-0">
                <Eye className="w-6 h-6 text-[#8D174B]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-[#1F1924] font-mono">462 920</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-200">
                    ▲ 35%
                  </span>
                </div>
                <div className="text-xs font-bold text-[#5A5360] mt-0.5">
                  {language === 'fr' ? 'Vues des annonces' : 'مشاهدات الإعلانات'}
                </div>
                <span className="text-[10px] text-gray-400 block">vs. mois précédent</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white rounded-3xl border border-[#F1E5EC] p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
              <div className="w-13 h-13 rounded-2xl bg-[#FAF0F5] flex items-center justify-center text-[#8D174B] shrink-0">
                <Download className="w-6 h-6 text-[#8D174B]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-[#1F1924] font-mono">83 476</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-200">
                    ▲ 28%
                  </span>
                </div>
                <div className="text-xs font-bold text-[#5A5360] mt-0.5">
                  {language === 'fr' ? 'Téléchargements' : 'تحميلات الوثائق'}
                </div>
                <span className="text-[10px] text-gray-400 block">vs. mois précédent</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. MAIN ANALYTICS GRID (Charts & Settings) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: 3 Visual Charts */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Row with 2 Charts: Évolution des utilisateurs & Répartition par contenu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Chart 1: Évolution des utilisateurs */}
                <div className="bg-white rounded-3xl border border-[#F1E5EC] p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#8D174B]" />
                      <h3 className="text-xs font-extrabold text-[#1F1924]">
                        {language === 'fr' ? 'Évolution des utilisateurs' : 'تطور المستخدمين'}
                      </h3>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-purple-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                      Nouveaux utilisateurs
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#8D174B]"></span>
                      Utilisateurs actifs
                    </span>
                  </div>

                  {/* SVG Line Chart */}
                  <div className="h-44 w-full relative pt-2">
                    <svg viewBox="0 0 300 120" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8D174B" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#8D174B" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      <line x1="30" y1="20" x2="290" y2="20" stroke="#F1E5EC" strokeDasharray="3 3" />
                      <line x1="30" y1="50" x2="290" y2="50" stroke="#F1E5EC" strokeDasharray="3 3" />
                      <line x1="30" y1="80" x2="290" y2="80" stroke="#F1E5EC" strokeDasharray="3 3" />
                      <line x1="30" y1="105" x2="290" y2="105" stroke="#E5D6DF" />

                      {/* Y-Axis Labels */}
                      <text x="5" y="24" fontSize="8" fill="#8E8694">20K</text>
                      <text x="5" y="54" fontSize="8" fill="#8E8694">10K</text>
                      <text x="5" y="84" fontSize="8" fill="#8E8694">5K</text>
                      <text x="15" y="108" fontSize="8" fill="#8E8694">0</text>

                      {/* Area Fill */}
                      <path
                        d="M 30 95 Q 60 70, 95 85 T 160 65 T 225 75 T 290 35 L 290 105 L 30 105 Z"
                        fill="url(#roseGrad)"
                      />

                      {/* Line Curve 1: Active Users */}
                      <path
                        d="M 30 95 Q 60 70, 95 85 T 160 65 T 225 75 T 290 35"
                        fill="none"
                        stroke="#8D174B"
                        strokeWidth="2.5"
                      />

                      {/* Line Curve 2: New Users */}
                      <path
                        d="M 30 100 Q 60 85, 95 90 T 160 80 T 225 60 T 290 50"
                        fill="none"
                        stroke="#A855F7"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                    </svg>

                    {/* X-Axis dates */}
                    <div className="flex justify-between text-[9px] text-gray-400 font-bold px-4 mt-1">
                      <span>1 sept.</span>
                      <span>7 sept.</span>
                      <span>14 sept.</span>
                      <span>21 sept.</span>
                      <span>28 sept.</span>
                    </div>
                  </div>
                </div>

                {/* Chart 2: Répartition par type de contenu (Donut) */}
                <div className="bg-white rounded-3xl border border-[#F1E5EC] p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#8D174B]" />
                    <h3 className="text-xs font-extrabold text-[#1F1924]">
                      {language === 'fr' ? 'Répartition par type de contenu' : 'توزيع حسب نوع المحتوى'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    {/* Donut Chart SVG */}
                    <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {/* Concours 38% */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#8D174B" strokeWidth="16" strokeDasharray="90 150" />
                        {/* Annales 22% */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#A855F7" strokeWidth="16" strokeDasharray="52 188" strokeDashoffset="-90" />
                        {/* Cours 16% */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#3B82F6" strokeWidth="16" strokeDasharray="38 202" strokeDashoffset="-142" />
                        {/* QCM 12% */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#EC4899" strokeWidth="16" strokeDasharray="28 212" strokeDashoffset="-180" />
                        {/* Fiches 8% */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="16" strokeDasharray="19 221" strokeDashoffset="-208" />
                        {/* Actualites 4% */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#06B6D4" strokeWidth="16" strokeDasharray="10 230" strokeDashoffset="-227" />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-xs font-extrabold text-[#1F1924] block">12 840</span>
                        <span className="text-[8px] text-gray-400 block -mt-0.5">Consultations</span>
                      </div>
                    </div>

                    {/* Breakdown List */}
                    <div className="space-y-1 text-[11px] font-bold flex-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-rose-800"><span className="w-2 h-2 rounded-full bg-[#8D174B]"></span> Concours</span>
                        <span className="font-mono text-gray-600">38%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-purple-800"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Annales</span>
                        <span className="font-mono text-gray-600">22%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-blue-800"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Cours</span>
                        <span className="font-mono text-gray-600">16%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-pink-800"><span className="w-2 h-2 rounded-full bg-pink-500"></span> QCM</span>
                        <span className="font-mono text-gray-600">12%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-amber-800"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Fiches</span>
                        <span className="font-mono text-gray-600">8%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-cyan-800"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> Actualités</span>
                        <span className="font-mono text-gray-600">4%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart 3: Top 10 des administrations (Horizontal Bars) */}
              <div className="bg-white rounded-3xl border border-[#F1E5EC] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#8D174B]" />
                    <h3 className="text-xs font-extrabold text-[#1F1924]">
                      {language === 'fr' ? 'Top 10 des administrations les plus consultées' : 'أكثر 10 إدارات طلباً ومتابعة'}
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">Total vues</span>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { name: 'Intérieur', count: '12 420', percent: 95 },
                    { name: 'Finances', count: '9 850', percent: 78 },
                    { name: 'Éducation Nationale', count: '8 230', percent: 65 },
                    { name: 'Santé', count: '6 540', percent: 52 },
                    { name: 'Équipement', count: '5 980', percent: 47 },
                    { name: 'Douanes', count: '4 820', percent: 38 },
                    { name: 'Justice', count: '4 210', percent: 33 },
                    { name: 'Agriculture', count: '3 900', percent: 30 },
                    { name: 'Transport', count: '3 120', percent: 24 },
                    { name: 'Autres', count: '2 480', percent: 19 },
                  ].map((adm, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-32 text-[11px] font-bold text-[#3E3844] truncate">{adm.name}</span>
                      <div className="flex-1 bg-[#FAF4F7] h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#8D174B] to-[#B82B67] h-full rounded-full transition-all duration-500"
                          style={{ width: `${adm.percent}%` }}
                        />
                      </div>
                      <span className="w-14 text-end text-[11px] font-mono font-bold text-[#6E6773]">{adm.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Platform Settings & Mini Audit Log */}
            <div className="space-y-6">
              
              {/* Settings Panel (Paramètres de la plateforme) */}
              <div className="bg-white rounded-3xl border border-[#F1E5EC] p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#8D174B]" />
                  <h3 className="text-xs font-extrabold text-[#1F1924]">
                    {language === 'fr' ? 'Paramètres de la plateforme' : 'إعدادات المنصة العامة'}
                  </h3>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px] font-bold">
                  {[
                    { id: 'general', label: 'Général' },
                    { id: 'notifications', label: 'Notifications' },
                    { id: 'security', label: 'Sécurité' },
                    { id: 'integrations', label: 'Intégrations' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSettingsTab(t.id as any)}
                      className={`px-2.5 py-1 rounded-xl transition-all ${
                        settingsTab === t.id 
                          ? 'bg-[#8D174B] text-white shadow-2xs' 
                          : 'bg-[#FAF4F7] text-[#6E6773] hover:text-[#242126]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Toggles List */}
                <div className="space-y-3.5 text-xs">
                  
                  {/* Toggle 1: Mode maintenance */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-[#8D174B] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-extrabold text-[#242126] text-[11px]">Mode maintenance</div>
                        <div className="text-[10px] text-gray-400">Désactive temporairement l'accès public</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        maintenanceMode ? 'bg-[#8D174B]' : 'bg-gray-200'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 2: Inscription des utilisateurs */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-[#8D174B] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-extrabold text-[#242126] text-[11px]">Inscription des utilisateurs</div>
                        <div className="text-[10px] text-gray-400">Autoriser les nouvelles inscriptions</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setAllowRegistration(!allowRegistration)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        allowRegistration ? 'bg-[#8D174B]' : 'bg-gray-200'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        allowRegistration ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 3: Validation des annonces */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-[#8D174B] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-extrabold text-[#242126] text-[11px]">Validation des annonces</div>
                        <div className="text-[10px] text-gray-400">Publication manuelle obligatoire</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setManualValidation(!manualValidation)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        manualValidation ? 'bg-[#8D174B]' : 'bg-gray-200'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        manualValidation ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 4: Notifications email */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <BellRing className="w-4 h-4 text-[#8D174B] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-extrabold text-[#242126] text-[11px]">Notifications email</div>
                        <div className="text-[10px] text-gray-400">Envoi automatique des notifications</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        emailNotifications ? 'bg-[#8D174B]' : 'bg-gray-200'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        emailNotifications ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 5: Sauvegarde automatique */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Database className="w-4 h-4 text-[#8D174B] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-extrabold text-[#242126] text-[11px]">Sauvegarde automatique</div>
                        <div className="text-[10px] text-gray-400">Sauvegarde quotidienne des données</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setAutoBackup(!autoBackup)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        autoBackup ? 'bg-[#8D174B]' : 'bg-gray-200'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        autoBackup ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Toggle 6: Mode debug */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#8D174B] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-extrabold text-[#242126] text-[11px]">Mode debug</div>
                        <div className="text-[10px] text-gray-400">Activer les logs détaillés</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setDebugMode(!debugMode)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        debugMode ? 'bg-[#8D174B]' : 'bg-gray-200'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        debugMode ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="w-full py-2.5 rounded-2xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-extrabold shadow-md shadow-[#8D174B]/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {settingsSaved ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Paramètres enregistrés !</span>
                    </>
                  ) : (
                    <span>Enregistrer les paramètres</span>
                  )}
                </button>
              </div>

              {/* Mini Audit Log Feed */}
              <div className="bg-white rounded-3xl border border-[#F1E5EC] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#8D174B]" />
                    <h3 className="text-xs font-extrabold text-[#1F1924]">
                      {language === 'fr' ? 'Journal d’audit' : 'سجل العمليات'}
                    </h3>
                  </div>
                  <button className="px-2 py-1 rounded-lg bg-[#FAF4F7] text-[#8D174B] text-[10px] font-bold flex items-center gap-1">
                    <Filter className="w-3 h-3" />
                    <span>Filtres</span>
                  </button>
                </div>

                <div className="space-y-2 text-[11px]">
                  {[
                    { time: '14:32', user: 'Admin', text: 'a publié une annonce', icon: '👁️' },
                    { time: '13:15', user: 'Yasmine', text: 'a modifié une fiche', icon: '📝' },
                    { time: '12:48', user: 'fatima123', text: 's’est inscrite', icon: '👤' },
                    { time: '11:20', user: 'Système', text: 'a importé 25 annonces', icon: '📥' },
                    { time: '10:05', user: 'Yasmine', text: 'a rejeté une annonce', icon: '❌' },
                  ].map((log, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-mono text-[10px]">{log.time}</span>
                        <strong className="text-[#8D174B]">{log.user}</strong>
                        <span className="text-gray-600">{log.text}</span>
                      </div>
                      <span className="text-xs">{log.icon}</span>
                    </div>
                  ))}
                </div>

                <button className="w-full py-2 rounded-xl bg-[#FAF0F5] hover:bg-[#F3E2EC] text-[#8D174B] font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1">
                  <span>Voir le journal complet</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 5. RECENT ACTIVITY AUDIT TABLE (Matching Screenshot) */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl border border-[#F1E5EC] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FAF0F5] flex items-center justify-center text-[#8D174B]">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-[#1F1924]">
                  {language === 'fr' ? 'Activité récente de la plateforme' : 'الأنشطة الأخيرة على المنصة'}
                </h3>
              </div>

              <button className="text-xs font-bold text-[#8D174B] hover:underline flex items-center gap-1">
                <span>Voir tout l'historique</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="border-b border-[#F1E5EC] text-gray-400 font-bold uppercase text-[10px]">
                    <th className="pb-3 text-start">Date</th>
                    <th className="pb-3 text-start">Action</th>
                    <th className="pb-3 text-start">Utilisateur</th>
                    <th className="pb-3 text-start">Détails</th>
                    <th className="pb-3 text-end">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF4F7]">
                  {[
                    { date: '30 sept. 2026  14:32', action: 'Publication d’une annonce', icon: '📄', user: 'Admin', userIcon: '👥', details: 'Concours Ingénieurs d’État - Douanes', status: 'Succès', statusType: 'success' },
                    { date: '30 sept. 2026  13:15', action: 'Modification d’un contenu', icon: '🔔', user: 'Yasmine', userIcon: '👤', details: 'Mise à jour fiche de révision', status: 'Succès', statusType: 'success' },
                    { date: '30 sept. 2026  12:48', action: 'Nouvel utilisateur', icon: '📄', user: 'fatima123', userIcon: '👤', details: 'Inscription sur la plateforme', status: 'Succès', statusType: 'success' },
                    { date: '30 sept. 2026  11:20', action: 'Import automatique', icon: '📥', user: 'Système', userIcon: '⚙️', details: '25 annonces importées (Emploi Public)', status: 'Succès', statusType: 'success' },
                    { date: '30 sept. 2026  10:05', action: 'Rejet d’une annonce', icon: '❌', user: 'Yasmine', userIcon: '👤', details: 'Annonce incomplète', status: 'Avertissement', statusType: 'warning' },
                    { date: '30 sept. 2026  09:41', action: 'Connexion admin', icon: '⚙️', user: 'Yasmine', userIcon: '👤', details: 'Connexion depuis 197.12.45.89', status: 'Succès', statusType: 'success' },
                    { date: '29 sept. 2026  18:22', action: 'Modification des paramètres', icon: '⚙️', user: 'Admin', userIcon: '👥', details: 'Activation des notifications email', status: 'Succès', statusType: 'success' },
                    { date: '29 sept. 2026  16:10', action: 'Suppression d’un contenu', icon: '🗑️', user: 'Admin', userIcon: '👤', details: 'Fiche obsolète', status: 'Succès', statusType: 'success' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-[#FAF7F9] transition-colors">
                      <td className="py-3 font-mono text-[11px] text-gray-500 whitespace-nowrap">{row.date}</td>
                      <td className="py-3 font-bold text-[#242126] flex items-center gap-1.5 whitespace-nowrap">
                        <span>{row.icon}</span>
                        <span>{row.action}</span>
                      </td>
                      <td className="py-3 font-bold text-[#8D174B] whitespace-nowrap">
                        <span className="me-1">{row.userIcon}</span>
                        <span>{row.user}</span>
                      </td>
                      <td className="py-3 text-gray-600 max-w-xs truncate">{row.details}</td>
                      <td className="py-3 text-end whitespace-nowrap">
                        {row.statusType === 'success' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                            Succès
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-extrabold border border-amber-200">
                            Avertissement
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
          setCommunityRequestsCount(loadCommunityRequests().filter((r) => r.status === 'pending').length);
        }}
      />
    </div>
  );
};
