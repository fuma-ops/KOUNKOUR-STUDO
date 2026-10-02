import React, { useState, useRef, useEffect } from 'react';
import { CommunityPost, CommunityComment, Language, Contest } from '../types';
import { translations } from '../i18n/translations';
import { mockCommunityPosts, CONTEST_COMMUNITIES, ContestCommunityRoom } from '../data/mockCommunity';
import { 
  Users, MessageSquare, Heart, Bookmark, Eye, MoreHorizontal,
  ArrowLeft, ArrowRight, Search, Plus, 
  Send, MessageCircle, CheckCircle2,
  Building2, Sparkles, ShieldCheck, Lock, Globe,
  AlertCircle, Key, X, LogIn, Upload, Image as ImageIcon,
  Trash2, RefreshCw, Clock
} from 'lucide-react';
import { 
  createCommunityRequest, 
  loadCommunityRequests, 
  isUserApprovedForRoom,
  loadApprovedRooms
} from '../utils/communityStorage';
import { AdminCommunityRequestsModal } from './AdminCommunityRequestsModal';

interface CommunityModuleProps {
  language: Language;
  initialContestId?: string | null;
  isAuthed?: boolean;
  onAuthClick?: () => void;
  allContests?: Contest[];
}

export const CommunityModule: React.FC<CommunityModuleProps> = ({ 
  language,
  initialContestId = null,
  isAuthed = false,
  onAuthClick,
  allContests = [],
}) => {
  const t = translations[language];
  const isRTL = language === 'ar';
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  // Role Simulator: 'user' (candidat) vs 'admin' (administrateur officiel)
  const [currentUserRole, setCurrentUserRole] = useState<'user' | 'admin'>('user');
  
  // Admin requests modal state
  const [isAdminRequestsModalOpen, setIsAdminRequestsModalOpen] = useState(false);
  const [communityRequestsCount, setCommunityRequestsCount] = useState<number>(() => {
    return loadCommunityRequests().filter((r) => r.status === 'pending').length;
  });

  // Approved rooms in local storage version
  const [approvedRoomsVersion, setApprovedRoomsVersion] = useState(0);

  // Sync with global storage events
  useEffect(() => {
    const handleStorageUpdate = () => {
      const pending = loadCommunityRequests().filter((r) => r.status === 'pending').length;
      setCommunityRequestsCount(pending);
      setApprovedRoomsVersion((v) => v + 1);
    };

    window.addEventListener('kounkour_community_requests_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('kounkour_community_requests_updated', handleStorageUpdate);
    };
  }, []);

  // Community rooms state
  const [rooms, setRooms] = useState<ContestCommunityRoom[]>(() => {
    if (initialContestId) {
      const match = allContests.find((c) => c.id === initialContestId || c.id.replace(/^c-/, '') === initialContestId.replace(/^c-/, ''));
      const existing = CONTEST_COMMUNITIES.find((r) => r.id === initialContestId || r.contestId === initialContestId);
      if (match && !existing) {
        const newContestRoom: ContestCommunityRoom = {
          id: match.id,
          contestId: match.id,
          name: {
            fr: match.title.fr,
            ar: match.title.ar,
          },
          heroImage: match.image || match.administration?.logo || '',
          type: 'public',
          membersCount: '1.2K',
          discussionsCount: 45,
          badge: match.administration?.name?.fr || 'Concours',
          description: {
            fr: `Salon officiel d’échange et d’entraide pour le concours : ${match.title.fr}.`,
            ar: `فضاء النقاش والتبادل الرسمي لمباراة : ${match.title.ar}.`,
          },
          adminName: 'Équipe KounKour Admin',
          isJoined: true,
          membershipStatus: 'member',
          tags: [match.degreeLevel || 'Concours', match.administration?.name?.fr || 'Public'],
        };
        return [newContestRoom, ...CONTEST_COMMUNITIES];
      }
    }
    return CONTEST_COMMUNITIES;
  });
  
  // Selected View Mode
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialContestId || null);

  // Directory filter
  const [directoryTypeFilter, setDirectoryTypeFilter] = useState<'all' | 'public' | 'private' | 'my_rooms'>('all');
  
  // Category filter within posts
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Search queries
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  const [postSearchQuery, setPostSearchQuery] = useState('');

  // Posts state
  const [posts, setPosts] = useState<CommunityPost[]>(mockCommunityPosts);
  
  // Detailed discussion view
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
  // Reply input in detailed view
  const [replyText, setReplyText] = useState('');
  
  // Modals state
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isJoinPrivateOpen, setIsJoinPrivateOpen] = useState<ContestCommunityRoom | null>(null);
  const [isNewDiscussionOpen, setIsNewDiscussionOpen] = useState(false);
  const [joinReason, setJoinReason] = useState('');
  const [joinSuccessNotice, setJoinSuccessNotice] = useState<string | null>(null);

  // New room form state (Admin)
  const [newRoomContestId, setNewRoomContestId] = useState<string>('');
  const [newRoomNameFr, setNewRoomNameFr] = useState('');
  const [newRoomNameAr, setNewRoomNameAr] = useState('');
  const [newRoomType, setNewRoomType] = useState<'public' | 'private'>('public');
  const [newRoomDescFr, setNewRoomDescFr] = useState('');
  const [newRoomDescAr, setNewRoomDescAr] = useState('');
  const [newRoomHeroImage, setNewRoomHeroImage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New discussion form state
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'questions' | 'conseils' | 'experiences' | 'annonces'>('questions');

  // Reload approved status on change
  useEffect(() => {
    const pending = loadCommunityRequests().filter((r) => r.status === 'pending').length;
    setCommunityRequestsCount(pending);
  }, [approvedRoomsVersion]);

  if (!isAuthed) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center animate-fade-in">
        <div className="bg-white rounded-3xl border border-[#F1E5EC] p-8 sm:p-12 shadow-xl shadow-[#8D174B]/5 relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%238D174B' stroke-width='1'%3E%3Cpath d='M24 0 L29 19 L48 24 L29 29 L24 48 L19 29 L0 24 L19 19 Z'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '36px 36px',
            }}
          />

          <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center mb-6 shadow-xl shadow-[#8D174B]/20">
              <Users className="w-10 h-10" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-[#8D174B] bg-[#FDF2F7] px-3.5 py-1 rounded-full border border-[#8D174B]/15 mb-3">
              {language === 'fr' ? 'Espace Communautaire Sécurisé' : 'مجتمع المترشحين الآمن'}
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#242126] tracking-tight mb-3">
              {language === 'fr' 
                ? 'Connexion requise pour accéder à la Communauté' 
                : 'تسجيل الدخول مطلوب للولوج إلى مجتمع المترشحين'}
            </h2>

            <p className="text-sm text-[#6E6773] leading-relaxed mb-8">
              {language === 'fr'
                ? 'Rejoignez des milliers de candidats marocains, participez aux salons d’échange par concours, partagez des corrigés et posez vos questions en direct aux lauréats.'
                : 'انضم إلى آلاف المترشحين في المغرب، شارك في قنوات النقاش المخصصة لكل مباراة، وتبادل نصائح وتجارب اجتياز الاختبارات الكتابية والشفوية.'}
            </p>

            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onAuthClick}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#8D174B] hover:bg-[#70113B] text-white font-bold text-sm shadow-lg shadow-[#8D174B]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{language === 'fr' ? 'Se connecter / Créer un compte' : 'تسجيل الدخول / إنشاء حساب'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-10 pt-8 border-t border-[#F1E5EC] text-start">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAF4F7]">
                <MessageSquare className="w-4 h-4 text-[#8D174B] shrink-0 mt-0.5" />
                <div className="text-[11px]">
                  <strong className="block text-[#242126] font-bold">Salons par concours</strong>
                  <span className="text-[#6E6773]">Échanges vérifiés</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAF4F7]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px]">
                  <strong className="block text-[#242126] font-bold">Espace modéré</strong>
                  <span className="text-[#6E6773]">Respect et entraide</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAF4F7]">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-[11px]">
                  <strong className="block text-[#242126] font-bold">Conseils d'épreuves</strong>
                  <span className="text-[#6E6773]">Retours d'expériences</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Selected Active Room Object
  const currentRoom = rooms.find((r) => r.id === selectedRoomId);
  const activePost = posts.find((p) => p.id === selectedPostId);

  // Check if current user is member of selected room
  const isApprovedLocally = currentRoom ? isUserApprovedForRoom(currentRoom.id) : false;
  const isUserMemberOfCurrentRoom = currentRoom?.type === 'public' || 
    isApprovedLocally || 
    currentRoom?.membershipStatus === 'member' || 
    currentUserRole === 'admin';

  // Resolved Hero Image for Current Room
  const linkedContest = allContests?.find(
    (c) => c.id === currentRoom?.id || c.id === currentRoom?.contestId || c.id.replace(/^c-/, '') === currentRoom?.id.replace(/^c-/, '')
  );
  const resolvedRoomHero = currentRoom?.heroImage || currentRoom?.image || linkedContest?.image || (linkedContest?.administration?.logo?.startsWith('http') ? linkedContest.administration.logo : undefined);

  // Filtered Community Rooms for the Directory
  const filteredRooms = rooms.map((r) => {
    if (isUserApprovedForRoom(r.id)) {
      return { ...r, isJoined: true, membershipStatus: 'member' as const };
    }
    return r;
  }).filter((r) => {
    const matchesSearch = !communitySearchQuery.trim() || 
      r.name.fr.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
      r.name.ar.includes(communitySearchQuery) ||
      r.description.fr.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(communitySearchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (directoryTypeFilter === 'public') return r.type === 'public';
    if (directoryTypeFilter === 'private') return r.type === 'private';
    if (directoryTypeFilter === 'my_rooms') return r.membershipStatus === 'member' || r.isJoined || isUserApprovedForRoom(r.id);
    return true;
  });

  // Filtered Posts inside the selected community hub
  const filteredPosts = posts.filter((post) => {
    const matchesRoom = !selectedRoomId || selectedRoomId === 'all' || post.contestId === selectedRoomId;
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = !postSearchQuery.trim() || 
      post.title.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      post.authorName.toLowerCase().includes(postSearchQuery.toLowerCase());
    return matchesRoom && matchesCategory && matchesSearch;
  });

  // Handle contest selection in create room modal
  const handleContestSelect = (contestId: string) => {
    setNewRoomContestId(contestId);
    const c = allContests.find((it) => it.id === contestId);
    if (c) {
      setNewRoomNameFr(c.title.fr);
      setNewRoomNameAr(c.title.ar);
      setNewRoomDescFr(`Salon d’entraide et de révision pour le concours : ${c.title.fr}.`);
      setNewRoomDescAr(`فضاء النقاش والمراجعة لمباراة : ${c.title.ar}.`);
      setNewRoomHeroImage(c.image || c.administration?.logo || '');
    }
  };

  const handleHeroFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) {
        setNewRoomHeroImage(res);
      }
      setIsUploadingImage(false);
    };
    reader.onerror = () => {
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Handlers for Community Membership
  const handleJoinCommunity = (room: ContestCommunityRoom, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (room.type === 'private' && currentUserRole !== 'admin') {
      setIsJoinPrivateOpen(room);
      return;
    }

    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, isJoined: true, membershipStatus: 'member' } : r))
    );
    setJoinSuccessNotice(language === 'fr' ? `Vous avez rejoint "${room.name.fr}" !` : `لقد انضممت إلى "${room.name.ar}" بنجاح !`);
    setTimeout(() => setJoinSuccessNotice(null), 3500);
  };

  const handleRequestPrivateAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isJoinPrivateOpen) return;

    createCommunityRequest(
      isJoinPrivateOpen.id,
      isJoinPrivateOpen.name,
      'Candidat_Maroc',
      joinReason || 'Candidature déposée pour le concours',
      'candidat.maroc@kounkour.ma',
      'Candidat Éligible'
    );

    setRooms((prev) =>
      prev.map((r) => (r.id === isJoinPrivateOpen.id ? { ...r, membershipStatus: 'pending' } : r))
    );
    setCommunityRequestsCount(loadCommunityRequests().filter((r) => r.status === 'pending').length);
    setJoinSuccessNotice(
      language === 'fr' 
        ? 'Votre demande d’adhésion a été transmise à l’administrateur ! Vous recevrez l’accès dès validation.' 
        : 'تم إرسال طلب الانضمام إلى المشرف! سيتم تفعيل العضوية فور المراجعة والموافقة.'
    );
    setIsJoinPrivateOpen(null);
    setJoinReason('');
    setTimeout(() => setJoinSuccessNotice(null), 5000);
  };

  // Handlers for Post Reactions
  const handleToggleLike = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );
  };

  const handleToggleBookmark = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p))
    );
  };

  const handleSendReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedPostId) return;

    if (currentRoom?.type === 'private' && !isUserMemberOfCurrentRoom) {
      alert(language === 'fr' ? 'Seuls les membres approuvés peuvent commenter dans cette communauté privée.' : 'فقط الأعضاء المعتمدون يمكنهم التعليق في هذا الفضاء الخاص.');
      return;
    }

    const newComment: CommunityComment = {
      id: `comm-${Date.now()}`,
      authorName: currentUserRole === 'admin' ? 'Administrateur KounKour' : 'Candidat_Maroc',
      authorAvatar: currentUserRole === 'admin' 
        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      authorRole: currentUserRole === 'admin' 
        ? { fr: 'Modérateur Officiel', ar: 'مشرف رسمي' }
        : { fr: 'Collaborateur Public', ar: 'عضو متعاون' },
      content: replyText.trim(),
      createdAt: language === 'fr' ? 'À l’instant' : 'الآن',
      likesCount: 0,
      isLiked: false,
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === selectedPostId) {
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...p.comments, newComment],
          };
        }
        return p;
      })
    );

    setReplyText('');
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const targetRoomId = selectedRoomId || 'all';
    const targetRoom = rooms.find((r) => r.id === targetRoomId);

    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      authorName: currentUserRole === 'admin' ? 'Admin_KounKour' : 'Candidat_Maroc',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      authorRole: currentUserRole === 'admin' 
        ? { fr: 'Admin KounKour', ar: 'إدارة المنصة' }
        : { fr: 'Candidat Concours', ar: 'مترشح للمباراة' },
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      category: newPostCategory,
      contestId: targetRoomId !== 'all' ? targetRoomId : undefined,
      contestTitle: targetRoom ? targetRoom.name : undefined,
      createdAt: language === 'fr' ? 'À l’instant' : 'الآن',
      likesCount: 1,
      isLiked: true,
      viewsCount: 1,
      commentsCount: 0,
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
    setIsNewDiscussionOpen(false);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNameFr.trim()) return;

    const newRoom: ContestCommunityRoom = {
      id: newRoomContestId || `room-${Date.now()}`,
      contestId: newRoomContestId || undefined,
      name: {
        fr: newRoomNameFr.trim(),
        ar: newRoomNameAr.trim() || newRoomNameFr.trim(),
      },
      heroImage: newRoomHeroImage || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
      type: newRoomType,
      membersCount: '1',
      discussionsCount: 0,
      badge: currentUserRole === 'admin' ? 'Officiel' : 'Communauté',
      description: {
        fr: newRoomDescFr.trim() || `Salon dédié aux échanges pour : ${newRoomNameFr}.`,
        ar: newRoomDescAr.trim() || `فضاء مخصص للنقاش حول : ${newRoomNameAr || newRoomNameFr}.`,
      },
      adminName: currentUserRole === 'admin' ? 'Administrateur KounKour' : 'Candidat Fondateur',
      isJoined: true,
      membershipStatus: 'member',
      tags: ['Nouveau', 'Entraide'],
    };

    setRooms([newRoom, ...rooms]);
    setJoinSuccessNotice(
      currentUserRole === 'admin' 
        ? (language === 'fr' ? `Salon "${newRoom.name.fr}" créé avec succès !` : `تم إنشاء الفضاء "${newRoom.name.ar}" بنجاح !`)
        : (language === 'fr' ? 'Proposition transmise aux administrateurs !' : 'تم إرسال الاقتراح للإدارة للمراجعة !')
    );
    setIsCreateRoomOpen(false);
    setNewRoomNameFr('');
    setNewRoomNameAr('');
    setNewRoomDescFr('');
    setNewRoomDescAr('');
    setNewRoomHeroImage('');
    setNewRoomContestId('');
    setTimeout(() => setJoinSuccessNotice(null), 4000);
  };

  const getRoleLabel = (role?: { fr: string; ar: string } | string) => {
    if (!role) return '';
    if (typeof role === 'string') return role;
    return role[language] || role.fr || '';
  };

  return (
    <div className="w-full">
      {/* ========================================================================= */}
      {/* VIEW 1: DETAILED POST DISCUSSION VIEW (SCREEN 12.3) */}
      {/* ========================================================================= */}
      {selectedPostId && activePost ? (
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedPostId(null)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF4F7] text-[#8D174B] border border-[#8D174B]/20 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <BackIcon className="w-4 h-4" />
              <span>{language === 'fr' ? 'Retour aux discussions' : 'الرجوع للنقاشات'}</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-[#F1E5EC] p-5 sm:p-6 shadow-xs space-y-4 mb-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center shrink-0 shadow-sm font-extrabold text-sm">
                  {activePost.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-extrabold text-sm text-[#242126]">
                      {activePost.authorName}
                    </span>
                    {activePost.authorRole && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0F5] text-[#8D174B] text-[11px] font-bold border border-[#8D174B]/15">
                        {getRoleLabel(activePost.authorRole)}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#8E8694] block mt-0.5">
                    {activePost.createdAt}
                  </span>
                </div>
              </div>

              <button className="text-[#8E8694] hover:text-[#242126] p-1.5 rounded-lg">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {activePost.contestTitle && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAF4F7] text-[#8D174B] text-[11px] font-bold border border-[#8D174B]/15">
                <Building2 className="w-3.5 h-3.5" />
                <span>{activePost.contestTitle[language] || activePost.contestTitle.fr}</span>
              </div>
            )}

            <h2 className="text-base sm:text-lg font-extrabold text-[#242126] leading-snug">
              {activePost.title}
            </h2>

            <div className="text-xs sm:text-sm text-[#3E3844] leading-relaxed whitespace-pre-line font-normal">
              {activePost.content}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#F5EBF0] text-xs text-[#6E6773]">
              <div className="flex items-center gap-5">
                <button
                  onClick={(e) => handleToggleLike(activePost.id, e)}
                  className={`flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                    activePost.isLiked ? 'text-[#8D174B]' : 'hover:text-[#8D174B]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${activePost.isLiked ? 'fill-current text-[#8D174B]' : ''}`} />
                  <span>{activePost.likesCount}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>{activePost.comments.length}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[#8E8694]">
                  <Eye className="w-4 h-4" />
                  <span>{activePost.viewsCount || 324}</span>
                </div>
              </div>

              <button
                onClick={(e) => handleToggleBookmark(activePost.id, e)}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  activePost.isBookmarked ? 'text-[#8D174B]' : 'hover:text-[#8D174B]'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${activePost.isBookmarked ? 'fill-current text-[#8D174B]' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mb-4 px-1">
            <h3 className="text-sm font-extrabold text-[#242126]">
              {language === 'fr' ? `Réponses (${activePost.comments.length})` : `الردود (${activePost.comments.length})`}
            </h3>
          </div>

          <div className="space-y-3.5 mb-8">
            {activePost.comments.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-3xl border border-[#F1E5EC] p-6">
                <MessageCircle className="w-10 h-10 text-[#6E6773]/30 mx-auto mb-2" />
                <p className="text-xs text-[#6E6773]">
                  {language === 'fr' ? 'Soyez le premier à répondre à cette question !' : 'كن أول من يجيب على هذا السؤال !'}
                </p>
              </div>
            ) : (
              activePost.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white rounded-3xl border border-[#F1E5EC] p-4 sm:p-5 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {comment.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-extrabold text-[#242126]">
                            {comment.authorName}
                          </strong>
                          {comment.authorRole && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FAF0F5] text-[#8D174B] text-[10px] font-bold border border-[#8D174B]/15">
                              {getRoleLabel(comment.authorRole)}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#8E8694]">
                          {comment.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#3E3844] leading-relaxed whitespace-pre-line">
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="sticky bottom-2 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-[#F1E5EC] p-2.5 shadow-lg">
            <form onSubmit={handleSendReply} className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={language === 'fr' ? 'Écrire une réponse constructive...' : 'أكتب إجابتك هنا...'}
                className="flex-1 bg-transparent px-3 py-2 text-xs text-[#242126] placeholder-[#8E8694] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-md ${
                  replyText.trim()
                    ? 'bg-[#8D174B] hover:bg-[#75123E] text-white shadow-[#8D174B]/25'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </form>
          </div>
        </div>
      ) : selectedRoomId && currentRoom ? (
        /* ========================================================================= */
        /* VIEW 2: INSIDE A SPECIFIC COMMUNITY HUB (FEED DU SALON) */
        /* ========================================================================= */
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 animate-fade-in space-y-4">
          
          {/* Header Navigation & Hub Banner with Hero Image Backdrop */}
          <div className="relative rounded-3xl border border-[#F1E5EC] overflow-hidden shadow-xs bg-gradient-to-br from-[#240A18] via-[#8D174B] to-[#450C25] text-white">
            {resolvedRoomHero && (
              <img
                src={resolvedRoomHero}
                alt={currentRoom.name[language] || currentRoom.name.fr}
                className="absolute inset-0 w-full h-full object-cover object-center opacity-40 scale-105 filter blur-xs"
              />
            )}

            <div 
              className="absolute inset-0 opacity-[0.10] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.9'%3E%3Cpath d='M24 0 L29 19 L48 24 L29 29 L24 48 L19 29 L0 24 L19 19 Z'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '36px 36px',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1F0714]/95 via-[#8D174B]/70 to-[#1F0714]/50 pointer-events-none" />

            <div className="relative z-10 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedRoomId(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/25 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <BackIcon className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Toutes les Communautés' : 'كافة المجتمعات'}</span>
                </button>

                <div className="flex items-center gap-2">
                  {currentRoom.type === 'public' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-extrabold backdrop-blur-xs">
                      <Globe className="w-3 h-3" />
                      <span>{language === 'fr' ? 'Communauté Publique' : 'مجتمع عام مفتوح'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/90 text-white text-[11px] font-extrabold backdrop-blur-xs">
                      <Lock className="w-3 h-3" />
                      <span>{language === 'fr' ? 'Communauté Privée' : 'فضاء خاص مقيد'}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4 pt-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/95 p-2 shadow-lg shrink-0 flex items-center justify-center overflow-hidden border-2 border-white/80">
                  {resolvedRoomHero && (resolvedRoomHero.includes('logo') || resolvedRoomHero.includes('emblem') || !resolvedRoomHero.includes('unsplash')) ? (
                    <img
                      src={resolvedRoomHero}
                      alt={currentRoom.name[language] || 'Emblème'}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center">
                      <Users className="w-7 h-7" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h1 className="text-lg sm:text-2xl font-extrabold text-white drop-shadow-sm">
                    {currentRoom.name[language] || currentRoom.name.fr}
                  </h1>
                  <p className="text-xs sm:text-sm text-rose-100/90 mt-1 leading-relaxed">
                    {currentRoom.description[language] || currentRoom.description.fr}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-rose-200 font-medium">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-rose-300" />
                      <strong>{currentRoom.membersCount}</strong> {language === 'fr' ? 'membres' : 'عضو'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-rose-300" />
                      <strong>{currentRoom.discussionsCount}</strong> {language === 'fr' ? 'discussions' : 'نقاش'}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-300" />
                      {language === 'fr' ? 'Modérateur :' : 'المشرف :'} <strong>{currentRoom.adminName}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Private Access Warning if non-member */}
          {currentRoom.type === 'private' && !isUserMemberOfCurrentRoom && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-200/80 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <strong className="block text-sm font-bold">
                    {language === 'fr' ? 'Communauté Privée à Accès Restreint' : 'فضاء خاص يتطلب الموافقة'}
                  </strong>
                  <span className="text-xs text-amber-800">
                    {currentRoom.accessRequired ? currentRoom.accessRequired[language] : (language === 'fr' ? 'Seuls les membres autorisés peuvent participer.' : 'فقط الأعضاء المعتمدون يمكنهم النشر والتفاعل.')}
                  </span>
                </div>
              </div>

              {currentRoom.membershipStatus === 'pending' ? (
                <div className="px-4 py-2.5 rounded-xl bg-amber-200 text-amber-950 text-xs font-bold shrink-0 flex items-center gap-2 border border-amber-300">
                  <Clock className="w-4 h-4 text-amber-800 animate-spin" />
                  <span>{language === 'fr' ? 'Demande en cours d’examen' : 'طلبك قيد المراجعة'}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsJoinPrivateOpen(currentRoom)}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer shrink-0 flex items-center gap-1.5 transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Demander à rejoindre' : 'طلب الانضمام'}</span>
                </button>
              )}
            </div>
          )}

          {/* Search Bar within Room */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 bg-white rounded-2xl border border-[#F1E5EC] focus-within:border-[#8D174B] shadow-xs flex items-center px-3.5 py-2.5 transition-all">
              <Search className="w-4 h-4 text-[#8D174B] shrink-0 me-2" />
              <input
                type="text"
                value={postSearchQuery}
                onChange={(e) => setPostSearchQuery(e.target.value)}
                placeholder={language === 'fr' ? 'Rechercher une discussion dans ce salon...' : 'البحث عن نقاش في هذا الفضاء...'}
                className="w-full bg-transparent text-xs sm:text-sm text-[#242126] placeholder-[#8E8694] focus:outline-none"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', labelFr: 'Tous les sujets', labelAr: 'كافة المواضيع' },
              { id: 'questions', labelFr: 'Questions', labelAr: 'أسئلة' },
              { id: 'conseils', labelFr: 'Conseils', labelAr: 'نصائح' },
              { id: 'experiences', labelFr: 'Expériences', labelAr: 'تجارب' },
              { id: 'annonces', labelFr: 'Annonces', labelAr: 'إعلانات' },
            ].map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#8D174B] text-white shadow-2xs'
                      : 'bg-white text-[#6E6773] hover:bg-[#FAF7F9] border border-[#F1E5EC]'
                  }`}
                >
                  {language === 'fr' ? cat.labelFr : cat.labelAr}
                </button>
              );
            })}
          </div>

          {/* Big CTA Button: + Nouvelle discussion */}
          <button
            onClick={() => {
              if (currentRoom.type === 'private' && !isUserMemberOfCurrentRoom) {
                alert(language === 'fr' ? 'Vous devez d’abord rejoindre cette communauté privée pour y publier un sujet.' : 'يجب أولاً الانضمام إلى هذا الفضاء الخاص لنشر موضوع.');
                return;
              }
              setIsNewDiscussionOpen(true);
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#8D174B] hover:bg-[#75123E] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#8D174B]/20 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>{language === 'fr' ? 'Nouvelle discussion dans ce salon' : 'إنشاء نقاش جديد في هذا الفضاء'}</span>
          </button>

          {/* Discussion Cards Feed */}
          <div className="space-y-3.5">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-[#F1E5EC] p-6 shadow-xs">
                <MessageCircle className="w-12 h-12 text-[#6E6773]/30 mx-auto mb-2" />
                <p className="text-xs text-[#6E6773] font-medium">
                  {language === 'fr' ? 'Aucune discussion ne correspond à vos critères.' : 'لا توجد نقاشات مطابقة لمعايير البحث.'}
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPostId(post.id)}
                  className="bg-white rounded-3xl border border-[#F1E5EC] p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-[#8D174B]/40 transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {post.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <strong className="text-xs sm:text-sm font-extrabold text-[#242126]">
                            {post.authorName}
                          </strong>
                          {post.authorRole && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FAF0F5] text-[#8D174B] text-[10px] sm:text-[11px] font-bold border border-[#8D174B]/15">
                              {getRoleLabel(post.authorRole)}
                            </span>
                          )}
                          <span className="text-[11px] text-[#8E8694]">
                            {post.createdAt}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button className="text-[#8E8694] hover:text-[#242126] p-1">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[#242126] leading-snug hover:text-[#8D174B] transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs text-[#5A5360] line-clamp-2 mt-1 leading-relaxed">
                      {post.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#FAF4F7] text-xs text-[#6E6773]">
                    <div className="flex items-center gap-5">
                      <button
                        onClick={(e) => handleToggleLike(post.id, e)}
                        className={`flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                          post.isLiked ? 'text-[#8D174B]' : 'hover:text-[#8D174B]'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current text-[#8D174B]' : ''}`} />
                        <span>{post.likesCount}</span>
                      </button>

                      <div className="flex items-center gap-1.5 font-bold">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.commentsCount || post.comments.length}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[#8E8694]">
                        <Eye className="w-4 h-4" />
                        <span>{post.viewsCount || 324}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleToggleBookmark(post.id, e)}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        post.isBookmarked ? 'text-[#8D174B]' : 'hover:text-[#8D174B]'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-current text-[#8D174B]' : ''}`} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 3: ANNUAIRE DES COMMUNAUTÉS (GRID DE CARTES) */
        /* ========================================================================= */
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 animate-fade-in space-y-6">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#FAF0F5] via-[#FFFDFE] to-[#FDF2F7] rounded-3xl border border-[#F1E5EC] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8D174B]/10 text-[#8D174B] text-[11px] font-bold mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Espace Multi-Communautés' : 'فضاء المجتمعات المتخصصة'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#8D174B]">
                {language === 'fr' ? 'Communautés de Concours' : 'مجتمعات مباريات التوظيف'}
              </h1>
              <p className="text-xs sm:text-sm text-[#6E6773] mt-1.5 leading-relaxed font-medium">
                {language === 'fr' 
                  ? 'Rejoignez les espaces d’échanges publics et les cercles privés dédiés à chaque concours d’État.' 
                  : 'انضم إلى فضاءات النقاش العامة والمجموعات الخاصة المخصصة لكل مباراة وطنية.'}
              </p>
            </div>

            {/* Action Buttons: Role Switcher & Admin Requests / Create Room */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#F1E5EC] shadow-2xs text-xs font-bold">
                <button
                  onClick={() => setCurrentUserRole('user')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    currentUserRole === 'user' ? 'bg-[#8D174B] text-white shadow-xs' : 'text-[#6E6773] hover:text-[#242126]'
                  }`}
                >
                  {language === 'fr' ? 'Candidat' : 'مترشح'}
                </button>
                <button
                  onClick={() => setCurrentUserRole('admin')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    currentUserRole === 'admin' ? 'bg-[#8D174B] text-white shadow-xs' : 'text-[#6E6773] hover:text-[#242126]'
                  }`}
                >
                  👑 {language === 'fr' ? 'Admin' : 'مشرف'}
                </button>
              </div>

              {currentUserRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => setIsAdminRequestsModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer relative"
                  title={language === 'fr' ? 'Gérer les demandes d’adhésion' : 'إدارة طلبات الانضمام'}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {language === 'fr' 
                      ? `Demandes Cercles Privés (${communityRequestsCount})` 
                      : `طلبات الفضاءات الخاصة (${communityRequestsCount})`}
                  </span>
                  {communityRequestsCount > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping absolute -top-1 -end-1" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCreateRoomOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-extrabold shadow-md shadow-[#8D174B]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {currentUserRole === 'admin' 
                    ? (language === 'fr' ? 'Créer un salon (Admin)' : 'إحداث فضاء جديد (مشرف)')
                    : (language === 'fr' ? 'Proposer une communauté' : 'اقتراح مجتمع جديد')}
                </span>
              </button>
            </div>
          </div>

          {/* Success Notification Toast */}
          {joinSuccessNotice && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{joinSuccessNotice}</span>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 bg-white rounded-2xl border border-[#F1E5EC] focus-within:border-[#8D174B] shadow-xs flex items-center px-3.5 py-3 transition-all">
                <Search className="w-4 h-4 text-[#8D174B] shrink-0 me-2" />
                <input
                  type="text"
                  value={communitySearchQuery}
                  onChange={(e) => setCommunitySearchQuery(e.target.value)}
                  placeholder={language === 'fr' ? 'Rechercher une communauté (Intérieur, Finances, Justice, Santé...)' : 'ابحث عن مجتمع (الداخلية، المالية، العدل، الصحة...)'}
                  className="w-full bg-transparent text-xs sm:text-sm text-[#242126] placeholder-[#8E8694] focus:outline-none"
                />
              </div>
            </div>

            {/* Directory Type Filters */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', labelFr: `Toutes les communautés (${rooms.length})`, labelAr: `كافة المجتمعات (${rooms.length})` },
                { id: 'public', labelFr: `Communautés Publiques (${rooms.filter(r=>r.type==='public').length})`, labelAr: `مجتمعات عامة (${rooms.filter(r=>r.type==='public').length})` },
                { id: 'private', labelFr: `Communautés Privées (${rooms.filter(r=>r.type==='private').length})`, labelAr: `مجتمعات خاصة (${rooms.filter(r=>r.type==='private').length})` },
                { id: 'my_rooms', labelFr: `Mes Groupes (${rooms.filter(r=>r.membershipStatus==='member'||r.isJoined||isUserApprovedForRoom(r.id)).length})`, labelAr: `مجموعاتي (${rooms.filter(r=>r.membershipStatus==='member'||r.isJoined||isUserApprovedForRoom(r.id)).length})` },
              ].map((f) => {
                const isSelected = directoryTypeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setDirectoryTypeFilter(f.id as any)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#8D174B] text-white shadow-xs'
                        : 'bg-white text-[#6E6773] hover:bg-[#FAF7F9] border border-[#F1E5EC]'
                    }`}
                  >
                    {language === 'fr' ? f.labelFr : f.labelAr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RECTANGLE COMMUNITY CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRooms.map((room) => {
              const isApproved = isUserApprovedForRoom(room.id);
              const isMember = room.type === 'public' || room.membershipStatus === 'member' || room.isJoined || isApproved || currentUserRole === 'admin';
              const isPending = room.membershipStatus === 'pending' && !isApproved;
              const contestMatch = allContests.find((c) => c.id === room.id || c.id === room.contestId || c.id.replace(/^c-/, '') === room.id.replace(/^c-/, ''));
              const cardEmblem = room.heroImage || room.image || contestMatch?.image || contestMatch?.administration?.logo;

              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className="bg-white rounded-3xl border border-[#F1E5EC] p-5 shadow-xs hover:shadow-md hover:border-[#8D174B]/40 transition-all flex flex-col justify-between cursor-pointer space-y-4 relative group overflow-hidden"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
                          {cardEmblem && (cardEmblem.includes('logo') || cardEmblem.includes('emblem') || !cardEmblem.includes('unsplash')) ? (
                            <img
                              src={cardEmblem}
                              alt={room.name[language] || 'Emblème'}
                              className="w-full h-full object-contain p-1.5 bg-white"
                            />
                          ) : (
                            <Users className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-extrabold text-[#242126] group-hover:text-[#8D174B] transition-colors leading-snug">
                            {room.name[language] || room.name.fr}
                          </h3>
                          <span className="text-[11px] text-[#8E8694] block mt-0.5 font-medium flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-[#8D174B]" />
                            <span>{room.adminName}</span>
                          </span>
                        </div>
                      </div>

                      {room.type === 'public' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200 shrink-0">
                          <Globe className="w-3 h-3" />
                          <span>{language === 'fr' ? 'Public' : 'عام'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-extrabold border border-amber-200 shrink-0">
                          <Lock className="w-3 h-3 text-amber-700" />
                          <span>{language === 'fr' ? 'Privé' : 'خاص'}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#5A5360] mt-3 line-clamp-2 leading-relaxed">
                      {room.description[language] || room.description.fr}
                    </p>

                    {room.type === 'private' && room.accessRequired && (
                      <div className="mt-2.5 text-[11px] text-amber-800 bg-amber-50/80 px-2.5 py-1.5 rounded-xl border border-amber-200/60 flex items-center gap-1.5">
                        <Key className="w-3 h-3 shrink-0" />
                        <span className="line-clamp-1">{room.accessRequired[language]}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#FAF4F7] flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 text-[#6E6773] font-medium text-[11px]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#8D174B]" />
                        <strong>{room.membersCount}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-[#8D174B]" />
                        <strong>{room.discussionsCount}</strong>
                      </span>
                    </div>

                    <div>
                      {isMember ? (
                        <span className="inline-flex items-center gap-1 text-[#8D174B] font-extrabold text-xs">
                          <span>{language === 'fr' ? 'Entrer' : 'دخول'}</span>
                          <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                        </span>
                      ) : isPending ? (
                        <span className="text-amber-800 font-bold text-[11px] bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-xl flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>{language === 'fr' ? 'En attente' : 'قيد المراجعة'}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleJoinCommunity(room, e)}
                          className="px-3 py-1.5 rounded-xl bg-[#FAF0F5] hover:bg-[#8D174B] text-[#8D174B] hover:text-white border border-[#8D174B]/20 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" />
                          <span>
                            {room.type === 'private' 
                              ? (language === 'fr' ? 'Demander accès' : 'طلب الانضمام')
                              : (language === 'fr' ? 'Rejoindre' : 'انضمام')}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROOT-LEVEL MODALS (RENDERED UNCONDITIONALLY FROM ANY VIEW) */}
      {/* ========================================================================= */}

      {/* 1. MODAL: REQUEST ACCESS TO PRIVATE COMMUNITY */}
      {isJoinPrivateOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#F1E5EC] overflow-hidden my-auto">
            <div className="bg-gradient-to-r from-amber-700 to-amber-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm sm:text-base font-bold">
                  {language === 'fr' ? 'Demande d’adhésion au Cercle Privé' : 'طلب الانضمام إلى الفضاء الخاص'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsJoinPrivateOpen(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestPrivateAccess} className="p-5 sm:p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-amber-950 text-xs sm:text-sm">{isJoinPrivateOpen.name[language] || isJoinPrivateOpen.name.fr}</h4>
                  <span className="text-[11px] text-amber-800 block mt-0.5">
                    {isJoinPrivateOpen.accessRequired ? isJoinPrivateOpen.accessRequired[language] : (language === 'fr' ? 'Validation sur justificatif par l’administrateur' : 'الموافقة بعد التحقق من طرف المشرف')}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#242126] block mb-1">
                  {language === 'fr' ? 'Motif ou référence de convocation au concours (facultatif) :' : 'سبب الترشح أو رقم الاستدعاء (اختياري) :'}
                </label>
                <textarea
                  rows={3}
                  value={joinReason}
                  onChange={(e) => setJoinReason(e.target.value)}
                  placeholder={language === 'fr' ? 'Ex: Convoqué pour l’épreuve du concours, Spécialité Gestion / Droit / Informatique...' : 'مثال: مدعو لاجتياز المباراة، تخصص التدبير / القانون / المعلوميات...'}
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl p-3 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  {language === 'fr' 
                    ? 'Votre demande sera transmise en temps réel au panneau d’administration.' 
                    : 'سيتم إرسال طلبك مباشرة إلى لوحة تحكم المشرف للموافقة.'}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsJoinPrivateOpen(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer transition-all"
                >
                  {language === 'fr' ? 'Annuler' : 'إلغاء'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Envoyer la demande' : 'إرسال الطلب للمشرف'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL: CREATE COMMUNITY */}
      {isCreateRoomOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#F1E5EC] overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="bg-[#8D174B] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm sm:text-base font-bold">
                  {currentUserRole === 'admin' 
                    ? (language === 'fr' ? 'Créer une communauté avec Hero Image (Admin)' : 'إحداث مجتمع جديد مع صورة الغلاف (مشرف)')
                    : (language === 'fr' ? 'Proposer une nouvelle communauté' : 'اقتراح مجتمع جديد')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateRoomOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {currentUserRole !== 'admin' && (
                <div className="bg-rose-50 border border-rose-200 text-[#8D174B] p-3 rounded-2xl text-[11px] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {language === 'fr' 
                      ? 'Note : La création d’une communauté est soumise à la validation préalable de l’équipe d’administration KounKour.' 
                      : 'ملاحظة: يخضع إحداث أي مجتمع جديد للموافقة المسبقة من طرف إدارة كونكور.'}
                  </span>
                </div>
              )}

              {allContests.length > 0 && (
                <div>
                  <label className="font-bold text-[#6E6773] block mb-1">
                    {language === 'fr' ? 'Associer à un concours existant (Hérite automatiquement du Hero) :' : 'ربط بمباراة معينة (يرث صورة الغلاف تلقائياً) :'}
                  </label>
                  <select
                    value={newRoomContestId}
                    onChange={(e) => handleContestSelect(e.target.value)}
                    className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                  >
                    <option value="">{language === 'fr' ? '-- Salon Général / Sans concours spécifique --' : '-- فضاء عام / بدون مباراة محددة --'}</option>
                    {allContests.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.administration?.name?.fr} — {c.title.fr}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-[#FAF4F7] p-3.5 rounded-2xl border border-[#F1E5EC] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#8D174B] flex items-center gap-1.5 uppercase text-[11px]">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{language === 'fr' ? 'Image Hero de la Communauté (Upload)' : 'صورة غلاف المجتمع (رفع صورة)'}</span>
                  </label>
                  {newRoomHeroImage && (
                    <button
                      type="button"
                      onClick={() => setNewRoomHeroImage('')}
                      className="text-[10px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{language === 'fr' ? 'Supprimer' : 'حذف'}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-20 h-14 rounded-xl border border-[#8D174B]/20 bg-white overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                    {newRoomHeroImage ? (
                      <img src={newRoomHeroImage} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-300" />
                    )}
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleHeroFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-[#8D174B] hover:bg-[#70113B] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{language === 'fr' ? 'Choisir un fichier...' : 'اختيار ملف...'}</span>
                    </button>
                    <input
                      type="url"
                      value={newRoomHeroImage.startsWith('data:') ? '' : newRoomHeroImage}
                      onChange={(e) => setNewRoomHeroImage(e.target.value)}
                      placeholder="Ou URL : https://.../image.jpg"
                      className="w-full bg-white border border-[#F1E5EC] rounded-lg px-2.5 py-1 text-[11px] focus:outline-none focus:border-[#8D174B]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#6E6773] block mb-1">
                  {language === 'fr' ? 'Type d’accès à la communauté :' : 'نوع الولوج للمجتمع :'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRoomType('public')}
                    className={`p-2.5 rounded-2xl border text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      newRoomType === 'public'
                        ? 'bg-[#8D174B] text-white border-[#8D174B]'
                        : 'bg-[#FAF7F9] text-[#6E6773] border-[#F1E5EC]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{language === 'fr' ? 'Public (Ouvert)' : 'عام (مفتوح)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoomType('private')}
                    className={`p-2.5 rounded-2xl border text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      newRoomType === 'private'
                        ? 'bg-[#8D174B] text-white border-[#8D174B]'
                        : 'bg-[#FAF7F9] text-[#6E6773] border-[#F1E5EC]'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{language === 'fr' ? 'Privé (Sur validation)' : 'خاص (بالموافقة)'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#6E6773] block mb-1">
                  {language === 'fr' ? 'Nom du salon (Français) :' : 'اسم المجتمع (بالفرنسية) :'}
                </label>
                <input
                  type="text"
                  value={newRoomNameFr}
                  onChange={(e) => setNewRoomNameFr(e.target.value)}
                  placeholder="Ex: Ministère de l'Agriculture • Ingénieurs Agronomes"
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#6E6773] block mb-1">
                  {language === 'fr' ? 'Nom du salon (Arabe) :' : 'اسم المجتمع (بالعربية) :'}
                </label>
                <input
                  type="text"
                  value={newRoomNameAr}
                  onChange={(e) => setNewRoomNameAr(e.target.value)}
                  placeholder="مثال: وزارة الفلاحة • مهندسين زراعيين"
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                />
              </div>

              <div>
                <label className="font-bold text-[#6E6773] block mb-1">
                  {language === 'fr' ? 'Description des objectifs :' : 'وصف أهداف الفضاء :'}
                </label>
                <textarea
                  rows={3}
                  value={newRoomDescFr}
                  onChange={(e) => setNewRoomDescFr(e.target.value)}
                  placeholder="Objectifs d'échange, concours visé, partage de cours..."
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateRoomOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer"
                >
                  {language === 'fr' ? 'Annuler' : 'إلغاء'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white font-bold shadow-md cursor-pointer"
                >
                  {currentUserRole === 'admin' 
                    ? (language === 'fr' ? 'Créer le salon' : 'إحداث الفضاء')
                    : (language === 'fr' ? 'Soumettre la proposition' : 'إرسال الاقتراح')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL: NEW DISCUSSION */}
      {isNewDiscussionOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#F1E5EC] overflow-hidden">
            <div className="bg-[#8D174B] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm sm:text-base font-bold">
                  {language === 'fr' ? 'Publier une nouvelle discussion' : 'نشر نقاش جديد'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewDiscussionOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#6E6773] block mb-1">
                  {language === 'fr' ? 'Catégorie du sujet :' : 'صنف الموضوع :'}
                </label>
                <select
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value as any)}
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                >
                  <option value="questions">Questions & Demandes d'aide</option>
                  <option value="conseils">Conseils & Méthodologie</option>
                  <option value="experiences">Retours d'expérience d'épreuves</option>
                  <option value="annonces">Annonces & Mises à jour</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#6E6773] block mb-1">
                  {language === 'fr' ? 'Titre de la discussion :' : 'عنوان النقاش :'}
                </label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Ex: Comment bien préparer l'épreuve de spécialité ?"
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#6E6773] block mb-1">
                  {language === 'fr' ? 'Message ou question détaillée :' : 'نص الموضوع بالتفصيل :'}
                </label>
                <textarea
                  rows={4}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Expliquez clairement votre question ou partagez vos conseils..."
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewDiscussionOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer"
                >
                  {language === 'fr' ? 'Annuler' : 'إلغاء'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white font-bold shadow-md cursor-pointer"
                >
                  {language === 'fr' ? 'Publier la discussion' : 'نشر النقاش'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: ADMIN COMMUNITY REQUESTS */}
      <AdminCommunityRequestsModal
        isOpen={isAdminRequestsModalOpen}
        onClose={() => setIsAdminRequestsModalOpen(false)}
        language={language}
        onRequestUpdated={() => {
          setApprovedRoomsVersion((v) => v + 1);
          setCommunityRequestsCount(loadCommunityRequests().filter((r) => r.status === 'pending').length);
          setRooms((prev) =>
            prev.map((r) => isUserApprovedForRoom(r.id) ? { ...r, isJoined: true, membershipStatus: 'member' } : r)
          );
        }}
      />
    </div>
  );
};
