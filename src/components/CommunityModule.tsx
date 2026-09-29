import React, { useState } from 'react';
import { CommunityPost, CommunityComment, Language } from '../types';
import { translations } from '../i18n/translations';
import { mockCommunityPosts, CONTEST_COMMUNITIES, ContestCommunityRoom } from '../data/mockCommunity';
import { 
  Users, MessageSquare, Heart, Bookmark, Eye, MoreHorizontal,
  ArrowLeft, ArrowRight, Search, SlidersHorizontal, Plus, 
  Send, Paperclip, MessageCircle, Share2, CheckCircle2,
  Building2, Sparkles, Filter, ShieldCheck, Lock, Globe,
  Shield, UserCheck, AlertCircle, Check, Key, UserPlus, X, LogIn
} from 'lucide-react';

interface CommunityModuleProps {
  language: Language;
  initialContestId?: string | null;
}

export const CommunityModule: React.FC<CommunityModuleProps> = ({ 
  language,
  initialContestId = null,
}) => {
  const t = translations[language];
  const isRTL = language === 'ar';
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  // Role Simulator: 'user' (nouveau candidat/collaborateur) vs 'admin' (administrateur officiel)
  const [currentUserRole, setCurrentUserRole] = useState<'user' | 'admin'>('user');

  // Community rooms state
  const [rooms, setRooms] = useState<ContestCommunityRoom[]>(CONTEST_COMMUNITIES);
  
  // Selected View Mode: 'directory' (all community cards) or 'room_hub' (inside specific community)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialContestId || null);

  // Directory filter: 'all' | 'public' | 'private' | 'my_rooms'
  const [directoryTypeFilter, setDirectoryTypeFilter] = useState<'all' | 'public' | 'private' | 'my_rooms'>('all');
  
  // Category filter within posts: 'all' | 'questions' | 'conseils' | 'experiences' | 'annonces'
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Search queries
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  const [postSearchQuery, setPostSearchQuery] = useState('');

  // Posts state
  const [posts, setPosts] = useState<CommunityPost[]>(mockCommunityPosts);
  
  // Detailed discussion view (Screen 12.3)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
  // Reply input in detailed view
  const [replyText, setReplyText] = useState('');
  
  // Modals state
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isJoinPrivateOpen, setIsJoinPrivateOpen] = useState<ContestCommunityRoom | null>(null);
  const [isNewDiscussionOpen, setIsNewDiscussionOpen] = useState(false);
  const [joinReason, setJoinReason] = useState('');
  const [joinSuccessNotice, setJoinSuccessNotice] = useState<string | null>(null);

  // New room form state (Admin or request)
  const [newRoomNameFr, setNewRoomNameFr] = useState('');
  const [newRoomNameAr, setNewRoomNameAr] = useState('');
  const [newRoomType, setNewRoomType] = useState<'public' | 'private'>('public');
  const [newRoomIcon, setNewRoomIcon] = useState('🏛️');
  const [newRoomDescFr, setNewRoomDescFr] = useState('');
  const [newRoomDescAr, setNewRoomDescAr] = useState('');
  const [newRoomAccessFr, setNewRoomAccessFr] = useState('');

  // New discussion form state
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'questions' | 'conseils' | 'experiences' | 'annonces'>('questions');

  // Selected Active Room Object
  const currentRoom = rooms.find((r) => r.id === selectedRoomId);
  const activePost = posts.find((p) => p.id === selectedPostId);

  // Check if current user is member of selected room
  const isUserMemberOfCurrentRoom = currentRoom?.type === 'public' || currentRoom?.membershipStatus === 'member' || currentUserRole === 'admin';

  // Filtered Community Rooms for the Directory
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch = !communitySearchQuery.trim() || 
      r.name.fr.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
      r.name.ar.includes(communitySearchQuery) ||
      r.description.fr.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(communitySearchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (directoryTypeFilter === 'public') return r.type === 'public';
    if (directoryTypeFilter === 'private') return r.type === 'private';
    if (directoryTypeFilter === 'my_rooms') return r.membershipStatus === 'member' || r.isJoined;
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

    setRooms((prev) =>
      prev.map((r) => (r.id === isJoinPrivateOpen.id ? { ...r, membershipStatus: 'pending' } : r))
    );
    setJoinSuccessNotice(
      language === 'fr' 
        ? 'Demande d’adhésion transmise à l’administrateur ! Vous serez notifié après validation.' 
        : 'تم إرسال طلب الانضمام إلى المشرف! سيتم إشعاركم بعد المراجعة.'
    );
    setIsJoinPrivateOpen(null);
    setJoinReason('');
    setTimeout(() => setJoinSuccessNotice(null), 4000);
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

    // Check permission: If inside private room and user is non-member/pending and not admin
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
    setSelectedPostId(newPost.id);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNameFr.trim()) return;

    const newRoom: ContestCommunityRoom = {
      id: `c-custom-${Date.now()}`,
      name: {
        fr: newRoomNameFr.trim(),
        ar: newRoomNameAr.trim() || newRoomNameFr.trim(),
      },
      icon: newRoomIcon || '🏛️',
      type: newRoomType,
      accessRequired: newRoomType === 'private' ? {
        fr: newRoomAccessFr || 'Validation de l’administrateur',
        ar: 'موافقة المشرف الرسمي',
      } : undefined,
      membersCount: '1',
      discussionsCount: 0,
      badge: newRoomType === 'private' ? 'Privé' : 'Public',
      description: {
        fr: newRoomDescFr.trim() || 'Nouvel espace d’entraide et de partage pour candidats.',
        ar: newRoomDescAr.trim() || 'فضاء جديد للتعاون والتواصل بين المترشحين.',
      },
      adminName: currentUserRole === 'admin' ? 'Équipe KounKour Admin' : 'Candidat Porteur de projet',
      isJoined: true,
      membershipStatus: 'member',
      tags: ['Nouveau', newRoomType === 'private' ? 'Privé' : 'Public'],
    };

    setRooms([newRoom, ...rooms]);
    setIsCreateRoomOpen(false);
    setNewRoomNameFr('');
    setNewRoomNameAr('');
    setNewRoomDescFr('');
    setSelectedRoomId(newRoom.id);
  };

  const getRoleLabel = (role?: { fr: string; ar: string } | string) => {
    if (!role) return '';
    if (typeof role === 'string') return role;
    return role[language] || role.fr;
  };

  // =========================================================================
  // VIEW 1: SCREEN 12.3 - DÉTAIL D'UNE DISCUSSION
  // =========================================================================
  if (selectedPostId && activePost) {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 animate-fade-in">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-3 mb-4 sticky top-14 bg-white/95 backdrop-blur-md z-20 py-2 border-b border-[#F1E5EC]">
          <button
            onClick={() => setSelectedPostId(null)}
            className="p-2 rounded-xl hover:bg-[#FAF4F7] text-[#242126] flex items-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            <BackIcon className="w-5 h-5 text-[#8D174B]" />
            <span>{language === 'fr' ? 'Détail de la discussion' : 'تفاصيل النقاش'}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={(e) => handleToggleBookmark(activePost.id, e)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                activePost.isBookmarked 
                  ? 'bg-rose-100 text-[#8D174B]' 
                  : 'hover:bg-[#FAF4F7] text-[#6E6773]'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${activePost.isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 rounded-xl hover:bg-[#FAF4F7] text-[#6E6773] cursor-pointer">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Original Post Box (Screenshot 12.3 Exact Match) */}
        <div className="bg-white rounded-3xl border border-[#F1E5EC] p-5 sm:p-6 shadow-xs space-y-4 mb-6">
          {/* Author Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={activePost.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={activePost.authorName}
                className="w-11 h-11 rounded-full object-cover border border-[#8D174B]/20 shrink-0"
              />
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

          {/* Tag for Community / Contest */}
          {activePost.contestTitle && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAF4F7] text-[#8D174B] text-[11px] font-bold border border-[#8D174B]/15">
              <Building2 className="w-3.5 h-3.5" />
              <span>{activePost.contestTitle[language] || activePost.contestTitle.fr}</span>
            </div>
          )}

          {/* Title & Body */}
          <h2 className="text-base sm:text-lg font-extrabold text-[#242126] leading-snug">
            {activePost.title}
          </h2>

          <div className="text-xs sm:text-sm text-[#3E3844] leading-relaxed whitespace-pre-line font-normal">
            {activePost.content}
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-[#F5EBF0] text-xs text-[#6E6773]">
            <div className="flex items-center gap-5">
              {/* Likes */}
              <button
                onClick={(e) => handleToggleLike(activePost.id, e)}
                className={`flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                  activePost.isLiked ? 'text-[#8D174B]' : 'hover:text-[#8D174B]'
                }`}
              >
                <Heart className={`w-4 h-4 ${activePost.isLiked ? 'fill-current text-[#8D174B]' : ''}`} />
                <span>{activePost.likesCount}</span>
              </button>

              {/* Comments */}
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>{activePost.comments.length}</span>
              </div>

              {/* Views */}
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

        {/* Replies Section Header */}
        <div className="flex items-center justify-between gap-3 mb-4 px-1">
          <h3 className="text-sm font-extrabold text-[#242126]">
            {language === 'fr' ? `Réponses (${activePost.comments.length})` : `الردود (${activePost.comments.length})`}
          </h3>

          <div className="flex items-center gap-1 text-xs text-[#6E6773] font-bold">
            <span>{language === 'fr' ? 'Plus récents' : 'الأحدث'}</span>
            <span className="text-[10px]">▼</span>
          </div>
        </div>

        {/* Replies List */}
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
                    <img
                      src={comment.authorAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                      alt={comment.authorName}
                      className="w-9 h-9 rounded-full object-cover border border-[#8D174B]/20 shrink-0"
                    />
                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <strong className="text-xs font-bold text-[#242126]">
                          {comment.authorName}
                        </strong>
                        {comment.authorRole && (
                          <span className="px-2 py-0.2 rounded-full bg-[#FAF0F5] text-[#8D174B] text-[10px] font-bold border border-[#8D174B]/15">
                            {getRoleLabel(comment.authorRole)}
                          </span>
                        )}
                        <span className="text-[10px] text-[#8E8694]">
                          {comment.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button className="text-[#8E8694] hover:text-[#242126]">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[#3E3844] leading-relaxed ps-11">
                  {comment.content}
                </p>

                {/* Reply action footer */}
                <div className="flex items-center gap-4 ps-11 pt-1 text-[11px] text-[#6E6773]">
                  <button className="hover:text-[#8D174B] font-bold cursor-pointer">
                    <Heart className="w-3.5 h-3.5 inline me-1" />
                    <span>{comment.likesCount}</span>
                  </button>
                  <button 
                    onClick={() => setReplyText(`@${comment.authorName} `)}
                    className="hover:text-[#8D174B] font-bold cursor-pointer"
                  >
                    {language === 'fr' ? 'Répondre' : 'رد'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Fixed Bottom Input Bar (Screenshot 12.3) */}
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#F1E5EC] p-3 sm:p-4 z-40 shadow-xl">
          <form
            onSubmit={handleSendReply}
            className="max-w-2xl mx-auto flex items-center gap-2 sm:gap-3"
          >
            <button
              type="button"
              className="p-2.5 rounded-full hover:bg-[#FAF4F7] text-[#8D174B] border border-[#8D174B]/20 transition-all cursor-pointer shrink-0"
              title={language === 'fr' ? 'Joindre un fichier' : 'إرفاق ملف'}
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={language === 'fr' ? 'Écrire une réponse...' : 'اكتب رداً...'}
              className="flex-1 bg-[#FAF7F9] border border-[#F1E5EC] focus:border-[#8D174B] rounded-full px-4 py-2.5 text-xs sm:text-sm text-[#242126] placeholder-[#8E8694] focus:outline-none transition-all"
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
    );
  }

  // =========================================================================
  // VIEW 2: INSIDE A SPECIFIC COMMUNITY HUB (FEED DES DISCUSSIONS DU SALON)
  // =========================================================================
  if (selectedRoomId && currentRoom) {
    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 animate-fade-in space-y-4">
        
        {/* Header Navigation & Hub Banner */}
        <div className="bg-gradient-to-r from-[#FAF0F5] via-[#FFFDFE] to-[#FDF2F7] rounded-3xl border border-[#F1E5EC] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setSelectedRoomId(null)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF4F7] text-[#8D174B] border border-[#8D174B]/20 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <BackIcon className="w-4 h-4" />
              <span>{language === 'fr' ? 'Toutes les Communautés' : 'كافة المجتمعات'}</span>
            </button>

            <div className="flex items-center gap-2">
              {currentRoom.type === 'public' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                  <Globe className="w-3 h-3" />
                  <span>{language === 'fr' ? 'Communauté Publique' : 'مجتمع عام مفتوح'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold">
                  <Lock className="w-3 h-3 text-amber-700" />
                  <span>{language === 'fr' ? 'Communauté Privée' : 'فضاء خاص مقيد'}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-[#8D174B]/20 flex items-center justify-center text-3xl shadow-sm shrink-0">
              {currentRoom.icon}
            </div>

            <div className="flex-1">
              <h1 className="text-lg sm:text-2xl font-extrabold text-[#242126]">
                {currentRoom.name[language] || currentRoom.name.fr}
              </h1>
              <p className="text-xs sm:text-sm text-[#6E6773] mt-1 leading-relaxed">
                {currentRoom.description[language] || currentRoom.description.fr}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#6E6773] font-medium">
                <span>👥 <strong>{currentRoom.membersCount}</strong> {language === 'fr' ? 'membres' : 'عضو'}</span>
                <span>💬 <strong>{currentRoom.discussionsCount}</strong> {language === 'fr' ? 'discussions' : 'نقاش'}</span>
                <span>🛡️ {language === 'fr' ? 'Modérateur :' : 'المشرف :'} <strong>{currentRoom.adminName}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Private Access Warning if non-member */}
        {currentRoom.type === 'private' && !isUserMemberOfCurrentRoom && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
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
              <span className="px-4 py-2 rounded-xl bg-amber-200 text-amber-900 text-xs font-bold shrink-0">
                ⏳ {language === 'fr' ? 'Demande en cours d’examen' : 'طلبك قيد المراجعة'}
              </span>
            ) : (
              <button
                onClick={() => setIsJoinPrivateOpen(currentRoom)}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer shrink-0"
              >
                🔒 {language === 'fr' ? 'Demander à rejoindre' : 'طلب الانضمام'}
              </button>
            )}
          </div>
        )}

        {/* Search Bar & Category Filter within the Room */}
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

        {/* Category Pills (Tous, Questions, Conseils, Expériences, Annonces) */}
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
                    ? 'bg-rose-100 text-[#8D174B] border border-[#8D174B]/30 shadow-2xs'
                    : 'bg-white text-[#6E6773] hover:bg-[#FAF7F9] border border-[#F1E5EC]'
                }`}
              >
                {language === 'fr' ? cat.labelFr : cat.labelAr}
              </button>
            );
          })}
        </div>

        {/* Big CTA Button: + Nouvelle discussion (Screenshots 12.1 & 12.2) */}
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
              <MessageSquare className="w-12 h-12 text-[#6E6773]/30 mx-auto mb-3" />
              <h4 className="text-base font-bold text-[#242126] mb-1">
                {language === 'fr' ? 'Aucune discussion pour le moment' : 'لا توجد نقاشات حالياً'}
              </h4>
              <p className="text-xs text-[#6E6773] max-w-sm mx-auto mb-4">
                {language === 'fr' ? 'Soyez le premier à poser une question dans ce salon officiel !' : 'كن أول من يطرح سؤالاً في هذا الفضاء الرسمي !'}
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelectedPostId(post.id)}
                className="bg-white rounded-3xl border border-[#F1E5EC] p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-[#8D174B]/30 transition-all cursor-pointer space-y-3"
              >
                {/* Author Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={post.authorName}
                      className="w-10 h-10 rounded-full object-cover border border-[#8D174B]/20 shrink-0"
                    />
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

                {/* Post Title & Excerpt */}
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#242126] leading-snug hover:text-[#8D174B] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-[#5A5360] line-clamp-2 mt-1 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Card Footer: Likes, Comments, Views, Bookmark */}
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
    );
  }

  // =========================================================================
  // VIEW 3: ANNUAIRE DES COMMUNAUTÉS EN RECTANGLES (GRID DE CARTES)
  // =========================================================================
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 animate-fade-in space-y-6">
      
      {/* 1. Header Banner with Avatars (Screenshots 12.1 & 12.2) */}
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

        {/* Action Button: Create / Propose Community */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto">
          {/* Role Switcher Pill */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#F1E5EC] shadow-2xs text-xs font-bold">
            <button
              onClick={() => setCurrentUserRole('user')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                currentUserRole === 'user' ? 'bg-[#8D174B] text-white shadow-xs' : 'text-[#6E6773] hover:text-[#242126]'
              }`}
            >
              👤 {language === 'fr' ? 'Candidat' : 'مترشح'}
            </button>
            <button
              onClick={() => setCurrentUserRole('admin')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                currentUserRole === 'admin' ? 'bg-[#8D174B] text-white shadow-xs' : 'text-[#6E6773] hover:text-[#242126]'
              }`}
            >
              👑 {language === 'fr' ? 'Admin' : 'مشرف'}
            </button>
          </div>

          <button
            onClick={() => setIsCreateRoomOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-extrabold shadow-md shadow-[#8D174B]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {currentUserRole === 'admin' 
                ? (language === 'fr' ? 'Créer un salon' : 'إحداث فضاء جديد')
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

      {/* 2. Search & Filter Bar */}
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

        {/* Directory Type Filters (Toutes, Publiques, Privées, Mes Groupes) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', labelFr: `Toutes les communautés (${rooms.length})`, labelAr: `كافة المجتمعات (${rooms.length})` },
            { id: 'public', labelFr: `Communautés Publiques 🌍 (${rooms.filter(r=>r.type==='public').length})`, labelAr: `مجتمعات عامة (${rooms.filter(r=>r.type==='public').length})` },
            { id: 'private', labelFr: `Communautés Privées 🔒 (${rooms.filter(r=>r.type==='private').length})`, labelAr: `مجتمعات خاصة (${rooms.filter(r=>r.type==='private').length})` },
            { id: 'my_rooms', labelFr: `Mes Groupes (${rooms.filter(r=>r.membershipStatus==='member'||r.isJoined).length})`, labelAr: `مجموعاتي (${rooms.filter(r=>r.membershipStatus==='member'||r.isJoined).length})` },
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

      {/* 3. RECTANGLE COMMUNITY CARDS GRID (Requested by user) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRooms.map((room) => {
          const isMember = room.type === 'public' || room.membershipStatus === 'member' || room.isJoined || currentUserRole === 'admin';
          const isPending = room.membershipStatus === 'pending';

          return (
            <div
              key={room.id}
              onClick={() => setSelectedRoomId(room.id)}
              className="bg-white rounded-3xl border border-[#F1E5EC] p-5 shadow-xs hover:shadow-md hover:border-[#8D174B]/40 transition-all flex flex-col justify-between cursor-pointer space-y-4 relative group"
            >
              <div>
                {/* Header: Icon + Name + Public/Private Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF0F5] border border-[#8D174B]/15 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                      {room.icon}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-[#242126] group-hover:text-[#8D174B] transition-colors leading-snug">
                        {room.name[language] || room.name.fr}
                      </h3>
                      <span className="text-[11px] text-[#8E8694] block mt-0.5 font-medium">
                        🛡️ {room.adminName}
                      </span>
                    </div>
                  </div>

                  {/* Public / Private Badge */}
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

                {/* Description */}
                <p className="text-xs text-[#5A5360] mt-3 line-clamp-2 leading-relaxed">
                  {room.description[language] || room.description.fr}
                </p>

                {/* Access requirement notice if private */}
                {room.type === 'private' && room.accessRequired && (
                  <div className="mt-2.5 text-[11px] text-amber-800 bg-amber-50/80 px-2.5 py-1.5 rounded-xl border border-amber-200/60 flex items-center gap-1.5">
                    <Key className="w-3 h-3 shrink-0" />
                    <span className="line-clamp-1">{room.accessRequired[language]}</span>
                  </div>
                )}
              </div>

              {/* Card Footer: Members Count, Discussions, Action Button */}
              <div className="pt-3 border-t border-[#FAF4F7] flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3 text-[#6E6773] font-medium text-[11px]">
                  <span>👥 <strong>{room.membersCount}</strong></span>
                  <span>💬 <strong>{room.discussionsCount}</strong></span>
                </div>

                {/* Join / Access Button */}
                <div>
                  {isMember ? (
                    <span className="inline-flex items-center gap-1 text-[#8D174B] font-extrabold text-xs">
                      <span>{language === 'fr' ? 'Entrer' : 'دخول'}</span>
                      <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                    </span>
                  ) : isPending ? (
                    <span className="text-amber-700 font-bold text-[11px] bg-amber-50 px-2.5 py-1 rounded-lg">
                      ⏳ {language === 'fr' ? 'En attente' : 'قيد المراجعة'}
                    </span>
                  ) : (
                    <button
                      onClick={(e) => handleJoinCommunity(room, e)}
                      className="px-3 py-1 rounded-xl bg-[#FAF0F5] hover:bg-[#8D174B] text-[#8D174B] hover:text-white border border-[#8D174B]/20 font-bold text-[11px] transition-all cursor-pointer"
                    >
                      {room.type === 'private' 
                        ? (language === 'fr' ? '🔒 Demander accès' : '🔒 طلب الانضمام')
                        : (language === 'fr' ? 'Rejoindre' : 'انضمام')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. MODAL: CREATE / REQUEST NEW COMMUNITY (Admin or User proposal) */}
      {isCreateRoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#F1E5EC] overflow-hidden">
            <div className="bg-[#8D174B] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm sm:text-base font-bold">
                  {currentUserRole === 'admin' 
                    ? (language === 'fr' ? 'Créer une nouvelle communauté (Admin)' : 'إحداث مجتمع جديد (مشرف)')
                    : (language === 'fr' ? 'Proposer une nouvelle communauté' : 'اقتراح مجتمع جديد')}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateRoomOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-5 sm:p-6 space-y-4 text-xs">
              {currentUserRole !== 'admin' && (
                <div className="bg-rose-50 border border-rose-200 text-[#8D174B] p-3 rounded-2xl text-[11px] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {language === 'fr' 
                      ? 'Note : Conformément aux règles de la plateforme, la création d’une nouvelle communauté est soumise à la validation préalable de l’équipe d’administration KounKour.' 
                      : 'ملاحظة: وفقاً لضوابط المنصة، يخضع إحداث أي مجتمع جديد للموافقة المسبقة من طرف إدارة كونكور.'}
                  </span>
                </div>
              )}

              <div>
                <label className="font-bold text-[#6E6773] block mb-1">
                  {language === 'fr' ? 'Type d’accès à la communauté :' : 'نوع الولوج للمجتمع :'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRoomType('public')}
                    className={`p-3 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                      newRoomType === 'public'
                        ? 'bg-[#8D174B] text-white border-[#8D174B]'
                        : 'bg-[#FAF7F9] text-[#6E6773] border-[#F1E5EC]'
                    }`}
                  >
                    🌍 {language === 'fr' ? 'Public (Ouvert à tous)' : 'عام (مفتوح للجميع)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoomType('private')}
                    className={`p-3 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                      newRoomType === 'private'
                        ? 'bg-[#8D174B] text-white border-[#8D174B]'
                        : 'bg-[#FAF7F9] text-[#6E6773] border-[#F1E5EC]'
                    }`}
                  >
                    🔒 {language === 'fr' ? 'Privé (Sur validation)' : 'خاص (يتطلب الموافقة)'}
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

              <div className="pt-2 flex items-center justify-end gap-2">
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
                    ? (language === 'fr' ? 'Publier le salon' : 'نشر الفضاء')
                    : (language === 'fr' ? 'Soumettre la proposition' : 'إرسال الاقتراح')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: REQUEST ACCESS TO PRIVATE COMMUNITY */}
      {isJoinPrivateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#F1E5EC] overflow-hidden">
            <div className="bg-gradient-to-r from-amber-700 to-amber-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-bold">
                  {language === 'fr' ? 'Demande d’adhésion au Cercle Privé' : 'طلب الانضمام إلى الفضاء الخاص'}
                </h3>
              </div>
              <button
                onClick={() => setIsJoinPrivateOpen(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestPrivateAccess} className="p-5 sm:p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="text-2xl">{isJoinPrivateOpen.icon}</span>
                <div>
                  <h4 className="font-extrabold text-amber-950">{isJoinPrivateOpen.name[language]}</h4>
                  <span className="text-[11px] text-amber-800">
                    {isJoinPrivateOpen.accessRequired ? isJoinPrivateOpen.accessRequired[language] : ''}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#6E6773] block mb-1">
                  {language === 'fr' ? 'Motif ou référence de convocation au concours :' : 'سبب الترشح أو رقم الاستدعاء :'}
                </label>
                <textarea
                  rows={3}
                  value={joinReason}
                  onChange={(e) => setJoinReason(e.target.value)}
                  placeholder={language === 'fr' ? 'Indiquez votre spécialité ou numéro de convocation...' : 'اذكر تخصصك أو رقم استدعاء المباراة...'}
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsJoinPrivateOpen(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold cursor-pointer"
                >
                  {language === 'fr' ? 'Annuler' : 'إلغاء'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold shadow-md cursor-pointer"
                >
                  {language === 'fr' ? 'Envoyer la demande' : 'إرسال الطلب للمشرف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: NEW DISCUSSION */}
      {isNewDiscussionOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#F1E5EC] overflow-hidden">
            <div className="bg-[#8D174B] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm sm:text-base font-bold">
                  {language === 'fr' ? 'Publier une nouvelle discussion' : 'نشر نقاش جديد'}
                </h3>
              </div>
              <button
                onClick={() => setIsNewDiscussionOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#6E6773] block mb-1">
                  {language === 'fr' ? 'Catégorie :' : 'التصنيف :'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'questions', label: language === 'fr' ? 'Question' : 'سؤال' },
                    { id: 'conseils', label: language === 'fr' ? 'Conseil' : 'نصيحة' },
                    { id: 'experiences', label: language === 'fr' ? 'Expérience' : 'تجربة' },
                    { id: 'annonces', label: language === 'fr' ? 'Annonce' : 'إعلان' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewPostCategory(c.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                        newPostCategory === c.id
                          ? 'bg-[#8D174B] text-white border-[#8D174B]'
                          : 'bg-[#FAF7F9] text-[#6E6773] border-[#F1E5EC]'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-[#6E6773] block mb-1">
                  {language === 'fr' ? 'Titre de la discussion :' : 'عنوان النقاش :'}
                </label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Ex: Conseils pour réussir l'épreuve écrite..."
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#6E6773] block mb-1">
                  {language === 'fr' ? 'Votre message :' : 'نص الرسالة :'}
                </label>
                <textarea
                  rows={4}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Détaillez votre question ou retour d'expérience..."
                  className="w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewDiscussionOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold cursor-pointer"
                >
                  {language === 'fr' ? 'Annuler' : 'إلغاء'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white font-bold shadow-md cursor-pointer"
                >
                  {language === 'fr' ? 'Publier' : 'نشر النقاش'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
