import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Language, Contest } from '../types';
import {
  Users, MessageSquare, Heart, Bookmark, ArrowLeft, ArrowRight, Search, Plus,
  Send, MessageCircle, CheckCircle2, ShieldCheck, Lock, Globe, AlertCircle, Key, X,
  LogIn, Upload, Image as ImageIcon, Trash2, RefreshCw, Clock, Flag, Pin, BadgeCheck,
  UserCircle2, LogOut, Sparkles,
} from 'lucide-react';
import {
  CommunityError, CommunityProfile, Comment, Post, PostCategory, Room,
  createComment, createPost, createRoom, deleteComment, deletePost, ensureContestRoom,
  getMyCommunityProfile, getMyUserId, joinRoom, leaveRoom, listAccessRequests, listComments, listPosts,
  listProposedRooms, listReports, listRooms, report, saveMyCommunityProfile, setBookmarked,
  setCommentLiked, setPostLiked, setPostPinned, setVerifiedAnswer, subscribeCommunity,
  timeAgo, uploadRoomImage,
} from '../data/communityApi';
import { AdminCommunityRequestsModal } from './AdminCommunityRequestsModal';

interface CommunityModuleProps {
  language: Language;
  initialContestId?: string | null;
  isAuthed?: boolean;
  isStaff?: boolean;
  currentUserId?: string | null;
  onAuthClick?: () => void;
  allContests?: Contest[];
}

const CATEGORIES: { id: 'all' | PostCategory; fr: string; ar: string }[] = [
  { id: 'all', fr: 'Tous les sujets', ar: 'كافة المواضيع' },
  { id: 'questions', fr: 'Questions', ar: 'أسئلة' },
  { id: 'conseils', fr: 'Conseils', ar: 'نصائح' },
  { id: 'experiences', fr: 'Expériences', ar: 'تجارب' },
  { id: 'annonces', fr: 'Annonces', ar: 'إعلانات' },
];

const errText = (e: unknown) => (e instanceof CommunityError ? e.message : 'Une erreur est survenue. Réessayez.');

const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' }> = ({ name, size = 'md' }) => (
  <div
    className={`${size === 'sm' ? 'w-9 h-9 rounded-xl text-xs' : 'w-10 h-10 rounded-2xl text-sm'} bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center font-extrabold shrink-0 shadow-xs`}
  >
    {(name || '?').charAt(0).toUpperCase()}
  </div>
);

export const CommunityModule: React.FC<CommunityModuleProps> = ({
  language,
  initialContestId = null,
  isAuthed = false,
  isStaff = false,
  currentUserId: currentUserIdProp = null,
  onAuthClick,
  allContests = [],
}) => {
  const fr = language === 'fr';
  const isRTL = language === 'ar';
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  // Identifiant de l'utilisateur (prop, sinon lu dans la session).
  const [currentUserId, setCurrentUserId] = useState<string | null>(currentUserIdProp);
  useEffect(() => {
    if (currentUserIdProp) setCurrentUserId(currentUserIdProp);
    else if (isAuthed) getMyUserId().then(setCurrentUserId).catch(() => undefined);
  }, [currentUserIdProp, isAuthed]);

  // ─── Données (toutes réelles, lues dans Supabase) ───────────────────────────
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [pendingModeration, setPendingModeration] = useState(0);

  // ─── Navigation ─────────────────────────────────────────────────────────────
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [directoryFilter, setDirectoryFilter] = useState<'all' | 'public' | 'private' | 'mine'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | PostCategory>('all');
  const [roomSearch, setRoomSearch] = useState('');
  const [postSearch, setPostSearch] = useState('');
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);

  // ─── Retours utilisateur ────────────────────────────────────────────────────
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const flash = useCallback((kind: 'ok' | 'err', text: string) => {
    setNotice({ kind, text });
    window.setTimeout(() => setNotice(null), 4500);
  }, []);

  // ─── Modales ────────────────────────────────────────────────────────────────
  const [pseudoOpen, setPseudoOpen] = useState(false);
  const [pseudoDraft, setPseudoDraft] = useState('');
  const [headlineDraft, setHeadlineDraft] = useState('');
  const pendingAfterPseudo = useRef<null | (() => void)>(null);

  const [joinPrivateRoom, setJoinPrivateRoom] = useState<Room | null>(null);
  const [joinReason, setJoinReason] = useState('');

  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<PostCategory>('questions');

  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [roomContestId, setRoomContestId] = useState('');
  const [roomNameFr, setRoomNameFr] = useState('');
  const [roomNameAr, setRoomNameAr] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [roomType, setRoomType] = useState<'public' | 'private'>('public');
  const [roomAccessNote, setRoomAccessNote] = useState('');
  const [roomImage, setRoomImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reportTarget, setReportTarget] = useState<null | { postId?: string; commentId?: string; label: string }>(null);
  const [reportReason, setReportReason] = useState('');

  const [moderationOpen, setModerationOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  // ─── Chargements ────────────────────────────────────────────────────────────
  const loadRooms = useCallback(async () => {
    try {
      setRooms(await listRooms());
    } catch (e) {
      flash('err', errText(e));
    } finally {
      setRoomsLoading(false);
    }
  }, [flash]);

  const loadPosts = useCallback(async (roomId: string, silent = false) => {
    if (!silent) setPostsLoading(true);
    try {
      setPosts(await listPosts(roomId));
    } catch (e) {
      if (!silent) flash('err', errText(e));
    } finally {
      setPostsLoading(false);
    }
  }, [flash]);

  const loadComments = useCallback(async (postId: string, silent = false) => {
    if (!silent) setCommentsLoading(true);
    try {
      setComments(await listComments(postId));
    } catch (e) {
      if (!silent) flash('err', errText(e));
    } finally {
      setCommentsLoading(false);
    }
  }, [flash]);

  const loadModerationCount = useCallback(async () => {
    if (!isStaff) return;
    try {
      const [reqs, props, reps] = await Promise.all([listAccessRequests(), listProposedRooms(), listReports()]);
      setPendingModeration(
        reqs.filter((r) => r.status === 'pending').length + props.length + reps.filter((r) => r.status === 'open').length
      );
    } catch {
      /* compteur indicatif */
    }
  }, [isStaff]);

  // Premier chargement : profil + salons (+ salon du concours demandé).
  useEffect(() => {
    if (!isAuthed) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await getMyCommunityProfile();
        if (!cancelled) setProfile(p);
      } catch {
        /* le pseudo sera demandé à la première participation */
      }
      if (initialContestId) {
        try {
          const id = await ensureContestRoom(initialContestId);
          if (!cancelled) setSelectedRoomId(id);
        } catch (e) {
          if (!cancelled) flash('err', errText(e));
        }
      }
      if (!cancelled) await loadRooms();
      if (!cancelled) await loadModerationCount();
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthed, initialContestId, loadRooms, loadModerationCount, flash]);

  useEffect(() => {
    if (!isAuthed || !selectedRoomId) return;
    setSelectedCategory('all');
    setPostSearch('');
    setOnlyBookmarks(false);
    loadPosts(selectedRoomId);
  }, [isAuthed, selectedRoomId, loadPosts]);

  useEffect(() => {
    if (!isAuthed || !selectedPostId) return;
    setComments([]);
    loadComments(selectedPostId);
  }, [isAuthed, selectedPostId, loadComments]);

  // Temps réel : on recharge en silence la vue ouverte (regroupé ~0,5 s).
  const viewRef = useRef({ roomId: selectedRoomId, postId: selectedPostId });
  viewRef.current = { roomId: selectedRoomId, postId: selectedPostId };
  useEffect(() => {
    if (!isAuthed) return;
    let timer: number | undefined;
    const tables = new Set<string>();
    const unsubscribe = subscribeCommunity((table) => {
      tables.add(table);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const { roomId, postId } = viewRef.current;
        if (roomId) loadPosts(roomId, true);
        if (postId && (tables.has('community_comments') || tables.has('community_posts'))) loadComments(postId, true);
        if (tables.has('community_memberships') || tables.has('community_posts')) loadRooms();
        if (tables.has('community_memberships')) loadModerationCount();
        tables.clear();
      }, 500);
    });
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [isAuthed, loadPosts, loadComments, loadRooms, loadModerationCount]);

  // ─── Dérivés ────────────────────────────────────────────────────────────────
  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || null;
  const activePost = posts.find((p) => p.id === selectedPostId) || null;
  const canParticipate = !!currentRoom && (isStaff || currentRoom.type === 'public' || currentRoom.myStatus === 'member');

  const emblemOf = (room: Room | null): string | undefined => {
    if (!room) return undefined;
    const c = room.contestId ? allContests.find((x) => x.id === room.contestId) : undefined;
    return room.heroImage || c?.image || c?.administration?.logo || undefined;
  };

  const filteredRooms = useMemo(() => {
    const q = roomSearch.trim().toLowerCase();
    return rooms.filter((r) => {
      if (r.status !== 'active' && !(r.status === 'proposed' && r.createdBy === currentUserId)) return false;
      if (q && !`${r.name.fr} ${r.name.ar} ${r.description.fr}`.toLowerCase().includes(q)) return false;
      if (directoryFilter === 'public') return r.type === 'public';
      if (directoryFilter === 'private') return r.type === 'private';
      if (directoryFilter === 'mine') return r.myStatus === 'member' || r.myStatus === 'pending';
      return true;
    });
  }, [rooms, roomSearch, directoryFilter, currentUserId]);

  const activeRooms = rooms.filter((r) => r.status === 'active');
  const myRoomsCount = rooms.filter((r) => r.myStatus === 'member' || r.myStatus === 'pending').length;

  const filteredPosts = useMemo(() => {
    const q = postSearch.trim().toLowerCase();
    return posts.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (onlyBookmarks && !p.isBookmarked) return false;
      if (q && !`${p.title} ${p.content} ${p.authorName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [posts, selectedCategory, postSearch, onlyBookmarks]);

  // ─── Actions ────────────────────────────────────────────────────────────────
  // Toute participation exige un pseudo public (jamais l'e-mail).
  const withProfile = (action: () => void) => {
    if (profile) return action();
    pendingAfterPseudo.current = action;
    setPseudoDraft('');
    setHeadlineDraft('');
    setPseudoOpen(true);
  };

  const run = async (fn: () => Promise<void>, ok?: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      if (ok) flash('ok', ok);
    } catch (e) {
      flash('err', errText(e));
    } finally {
      setBusy(false);
    }
  };

  const handleSavePseudo = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const p = await saveMyCommunityProfile(pseudoDraft, headlineDraft);
      setProfile(p);
      setPseudoOpen(false);
      const next = pendingAfterPseudo.current;
      pendingAfterPseudo.current = null;
      if (next) window.setTimeout(next, 0);
      if (selectedRoomId) loadPosts(selectedRoomId, true);
    }, fr ? 'Pseudo enregistré.' : 'تم حفظ الاسم المستعار.');
  };

  const handleJoin = (room: Room) => {
    if (room.type === 'private') {
      setJoinReason('');
      setJoinPrivateRoom(room);
      return;
    }
    run(async () => {
      await joinRoom(room);
      await loadRooms();
    }, fr ? `Vous avez rejoint « ${room.name.fr} ».` : `انضممت إلى « ${room.name.ar} ».`);
  };

  const handleRequestPrivate = (e: React.FormEvent) => {
    e.preventDefault();
    const room = joinPrivateRoom;
    if (!room) return;
    run(async () => {
      await joinRoom(room, joinReason);
      setJoinPrivateRoom(null);
      await loadRooms();
    }, fr ? 'Demande envoyée à l’équipe de modération.' : 'تم إرسال طلبك إلى فريق الإشراف.');
  };

  const handleLeave = (room: Room) => {
    if (!window.confirm(fr ? `Quitter « ${room.name.fr} » ?` : `مغادرة « ${room.name.ar} » ؟`)) return;
    run(async () => {
      await leaveRoom(room.id);
      await loadRooms();
    }, fr ? 'Vous avez quitté la communauté.' : 'غادرت المجتمع.');
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom) return;
    const roomId = currentRoom.id;
    run(async () => {
      await createPost(roomId, newPostTitle, newPostContent, newPostCategory);
      setNewPostOpen(false);
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostCategory('questions');
      await loadPosts(roomId, true);
      await loadRooms();
    }, fr ? 'Discussion publiée.' : 'تم نشر النقاش.');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostId || !replyText.trim()) return;
    const postId = selectedPostId;
    const text = replyText;
    withProfile(() =>
      run(async () => {
        await createComment(postId, text);
        setReplyText('');
        await loadComments(postId, true);
        if (selectedRoomId) await loadPosts(selectedRoomId, true);
      })
    );
  };

  // Mise à jour optimiste, puis la base fait foi (rechargement en cas d'échec).
  const toggleLike = (post: Post) => {
    const liked = !post.isLiked;
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, isLiked: liked, likesCount: Math.max(0, p.likesCount + (liked ? 1 : -1)) } : p)));
    setPostLiked(post.id, liked).catch((err) => {
      flash('err', errText(err));
      if (selectedRoomId) loadPosts(selectedRoomId, true);
    });
  };

  const toggleBookmark = (post: Post) => {
    const marked = !post.isBookmarked;
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, isBookmarked: marked } : p)));
    setBookmarked(post.id, marked).catch((err) => {
      flash('err', errText(err));
      if (selectedRoomId) loadPosts(selectedRoomId, true);
    });
  };

  const toggleCommentLike = (c: Comment) => {
    const liked = !c.isLiked;
    setComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, isLiked: liked, likesCount: Math.max(0, x.likesCount + (liked ? 1 : -1)) } : x)));
    setCommentLiked(c.id, liked).catch((err) => {
      flash('err', errText(err));
      if (selectedPostId) loadComments(selectedPostId, true);
    });
  };

  const handleDeletePost = (post: Post) => {
    if (!window.confirm(fr ? 'Supprimer définitivement cette discussion et ses réponses ?' : 'حذف هذا النقاش وردوده نهائياً ؟')) return;
    run(async () => {
      await deletePost(post.id);
      setSelectedPostId(null);
      if (selectedRoomId) await loadPosts(selectedRoomId, true);
      await loadRooms();
    }, fr ? 'Discussion supprimée.' : 'تم حذف النقاش.');
  };

  const handleDeleteComment = (c: Comment) => {
    if (!window.confirm(fr ? 'Supprimer cette réponse ?' : 'حذف هذا الرد ؟')) return;
    run(async () => {
      await deleteComment(c.id);
      if (selectedPostId) await loadComments(selectedPostId, true);
      if (selectedRoomId) await loadPosts(selectedRoomId, true);
    }, fr ? 'Réponse supprimée.' : 'تم حذف الرد.');
  };

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    const target = reportTarget;
    if (!target) return;
    run(async () => {
      await report(target, reportReason);
      setReportTarget(null);
      setReportReason('');
      loadModerationCount();
    }, fr ? 'Merci, le signalement a été transmis à la modération.' : 'شكراً، تم إرسال التبليغ إلى الإشراف.');
  };

  const handleContestSelect = (contestId: string) => {
    setRoomContestId(contestId);
    const c = allContests.find((it) => it.id === contestId);
    if (c) {
      setRoomNameFr(c.title.fr);
      setRoomNameAr(c.title.ar);
      setRoomDesc(`Salon d’entraide et de révision pour le concours : ${c.title.fr}.`);
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    uploadRoomImage(file)
      .then((url) => setRoomImage(url))
      .catch((err) => flash('err', errText(err)))
      .finally(() => setUploading(false));
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await createRoom(
        { contestId: roomContestId || null, nameFr: roomNameFr, nameAr: roomNameAr, descriptionFr: roomDesc, heroImage: roomImage || null, type: roomType, accessNote: roomAccessNote },
        isStaff
      );
      setCreateRoomOpen(false);
      setRoomContestId('');
      setRoomNameFr('');
      setRoomNameAr('');
      setRoomDesc('');
      setRoomType('public');
      setRoomAccessNote('');
      setRoomImage('');
      await loadRooms();
      loadModerationCount();
    }, isStaff
      ? (fr ? 'Communauté créée.' : 'تم إحداث المجتمع.')
      : (fr ? 'Proposition envoyée : visible après validation par l’équipe.' : 'تم إرسال الاقتراح وسيظهر بعد موافقة الفريق.'));
  };

  // ─── Écran non connecté ─────────────────────────────────────────────────────
  if (!isAuthed) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center animate-fade-in">
        <div className="bg-white rounded-3xl border border-[#F1E5EC] p-8 sm:p-12 shadow-xl shadow-[#8D174B]/5">
          <div className="flex flex-col items-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center mb-6 shadow-xl shadow-[#8D174B]/20 animate-card-breathe">
              <Users className="w-10 h-10" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#8D174B] bg-[#FDF2F7] px-3.5 py-1 rounded-full border border-[#8D174B]/15 mb-3">
              {fr ? 'Espace communautaire modéré' : 'مجتمع المترشحين المؤطر'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#242126] tracking-tight mb-3">
              {fr ? 'Connectez-vous pour rejoindre la Communauté' : 'سجّل الدخول للانضمام إلى مجتمع المترشحين'}
            </h2>
            <p className="text-sm text-[#6E6773] leading-relaxed mb-8">
              {fr
                ? 'Échangez avec d’autres candidats dans un salon par concours, posez vos questions et partagez vos retours d’expérience, sous un pseudo de votre choix.'
                : 'تبادل مع مترشحين آخرين في فضاء خاص بكل مباراة، اطرح أسئلتك وشارك تجربتك باسم مستعار من اختيارك.'}
            </p>
            <button
              type="button"
              onClick={onAuthClick}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#8D174B] hover:bg-[#70113B] text-white font-bold text-sm shadow-lg shadow-[#8D174B]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 animate-selected-glow"
            >
              <LogIn className="w-4 h-4" />
              <span>{fr ? 'Se connecter / Créer un compte' : 'تسجيل الدخول / إنشاء حساب'}</span>
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-10 pt-8 border-t border-[#F1E5EC] text-start">
              {[
                { icon: <MessageSquare className="w-4 h-4 text-[#8D174B] shrink-0 mt-0.5" />, t: fr ? 'Un salon par concours' : 'فضاء لكل مباراة', s: fr ? 'Questions et réponses' : 'أسئلة وأجوبة' },
                { icon: <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />, t: fr ? 'Espace modéré' : 'فضاء مؤطر', s: fr ? 'Signalement en un clic' : 'تبليغ بنقرة واحدة' },
                { icon: <UserCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />, t: fr ? 'Pseudo public' : 'اسم مستعار', s: fr ? 'Votre e-mail reste privé' : 'بريدك يبقى خاصاً' },
              ].map((x, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAF4F7]">
                  {x.icon}
                  <div className="text-[11px]">
                    <strong className="block text-[#242126] font-bold">{x.t}</strong>
                    <span className="text-[#6E6773]">{x.s}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderAuthor = (name: string, headline: string | null, createdAt: string, size: 'sm' | 'md' = 'md') => (
    <div className="flex items-center gap-2.5 min-w-0">
      <Avatar name={name} size={size} />
      <div className="min-w-0">
        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
          <strong className="text-xs sm:text-sm font-extrabold text-[#242126] truncate">{name}</strong>
          {headline && (
            <span className="px-2 py-0.5 rounded-full bg-[#FAF0F5] text-[#8D174B] text-[10px] sm:text-[11px] font-bold border border-[#8D174B]/15">{headline}</span>
          )}
        </div>
        <span className="text-[11px] text-[#8E8694]">{timeAgo(createdAt, language)}</span>
      </div>
    </div>
  );

  const skeleton = (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-3xl border border-[#F1E5EC] p-5 space-y-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5EBF0]" />
            <div className="h-3 w-32 rounded bg-[#F5EBF0]" />
          </div>
          <div className="h-4 w-3/4 rounded bg-[#F5EBF0]" />
          <div className="h-3 w-full rounded bg-[#FAF4F7]" />
        </div>
      ))}
    </div>
  );

  const pill = (active: boolean) =>
    `px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
      active ? 'bg-[#8D174B] text-white' : 'bg-white text-[#6E6773] hover:bg-[#FAF7F9] border border-[#F1E5EC]'
    }`;
  const input = 'w-full bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl px-3 py-2 text-xs text-[#242126] focus:outline-none focus:border-[#8D174B]';

  return (
    <div className="w-full">
      {notice && (
        <div
          role="status"
          className={`fixed top-20 start-1/2 -translate-x-1/2 z-[120] max-w-[92vw] px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2.5 animate-fade-in ${
            notice.kind === 'ok' ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          {notice.kind === 'ok' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      {selectedPostId && activePost ? (
        /* ═══════════════ VUE 1 : DISCUSSION ═══════════════ */
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 animate-fade-in space-y-4">
          <button
            onClick={() => setSelectedPostId(null)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF4F7] text-[#8D174B] border border-[#8D174B]/20 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            <BackIcon className="w-4 h-4" />
            <span>{fr ? 'Retour aux discussions' : 'الرجوع للنقاشات'}</span>
          </button>

          <article className="bg-white rounded-3xl border border-[#F1E5EC] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              {renderAuthor(activePost.authorName, activePost.authorHeadline, activePost.createdAt)}
              <div className="flex items-center gap-1 shrink-0">
                {isStaff && (
                  <button
                    onClick={() => run(async () => { await setPostPinned(activePost.id, !activePost.isPinned); if (selectedRoomId) await loadPosts(selectedRoomId, true); })}
                    className={`p-1.5 rounded-lg cursor-pointer ${activePost.isPinned ? 'text-[#8D174B]' : 'text-[#8E8694] hover:text-[#8D174B]'}`}
                    title={activePost.isPinned ? (fr ? 'Désépingler' : 'إلغاء التثبيت') : (fr ? 'Épingler' : 'تثبيت')}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                )}
                {activePost.authorId !== currentUserId && (
                  <button
                    onClick={() => setReportTarget({ postId: activePost.id, label: activePost.title })}
                    className="p-1.5 rounded-lg text-[#8E8694] hover:text-rose-600 cursor-pointer"
                    title={fr ? 'Signaler' : 'تبليغ'}
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                )}
                {(activePost.authorId === currentUserId || isStaff) && (
                  <button onClick={() => handleDeletePost(activePost)} className="p-1.5 rounded-lg text-[#8E8694] hover:text-rose-600 cursor-pointer" title={fr ? 'Supprimer' : 'حذف'}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {currentRoom && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAF4F7] text-[#8D174B] text-[11px] font-bold border border-[#8D174B]/15">
                <Users className="w-3.5 h-3.5" />
                <span>{currentRoom.name[language] || currentRoom.name.fr}</span>
              </div>
            )}

            <h2 className="text-base sm:text-lg font-extrabold text-[#242126] leading-snug break-words">{activePost.title}</h2>
            <div className="text-xs sm:text-sm text-[#3E3844] leading-relaxed whitespace-pre-line break-words">{activePost.content}</div>

            <div className="flex items-center justify-between pt-4 border-t border-[#F5EBF0] text-xs text-[#6E6773]">
              <div className="flex items-center gap-5">
                <button
                  onClick={() => withProfile(() => toggleLike(activePost))}
                  className={`flex items-center gap-1.5 font-bold transition-all cursor-pointer active:scale-95 ${activePost.isLiked ? 'text-[#8D174B]' : 'hover:text-[#8D174B]'}`}
                >
                  <Heart className={`w-4 h-4 ${activePost.isLiked ? 'fill-current' : ''}`} />
                  <span>{activePost.likesCount}</span>
                </button>
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>{comments.length}</span>
                </span>
              </div>
              <button
                onClick={() => toggleBookmark(activePost)}
                className={`p-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${activePost.isBookmarked ? 'text-[#8D174B]' : 'hover:text-[#8D174B]'}`}
                title={fr ? 'Enregistrer' : 'حفظ'}
              >
                <Bookmark className={`w-4 h-4 ${activePost.isBookmarked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </article>

          <h3 className="text-sm font-extrabold text-[#242126] px-1">{fr ? `Réponses (${comments.length})` : `الردود (${comments.length})`}</h3>

          <div className="space-y-3.5 mb-8">
            {commentsLoading ? (
              skeleton
            ) : comments.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-3xl border border-[#F1E5EC] p-6">
                <MessageCircle className="w-10 h-10 text-[#6E6773]/30 mx-auto mb-2" />
                <p className="text-xs text-[#6E6773]">{fr ? 'Soyez le premier à répondre !' : 'كن أول من يجيب !'}</p>
              </div>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className={`bg-white rounded-3xl border p-4 sm:p-5 shadow-2xs space-y-2.5 animate-fade-in ${c.isVerifiedAnswer ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-[#F1E5EC]'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {renderAuthor(c.authorName, c.authorHeadline, c.createdAt, 'sm')}
                      {c.isVerifiedAnswer && (
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                          <BadgeCheck className="w-3 h-3" />
                          {fr ? 'Réponse validée par l’équipe' : 'جواب معتمد من الفريق'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {isStaff && (
                        <button
                          onClick={() => run(async () => { await setVerifiedAnswer(c.id, !c.isVerifiedAnswer); if (selectedPostId) await loadComments(selectedPostId, true); })}
                          className={`p-1.5 rounded-lg cursor-pointer ${c.isVerifiedAnswer ? 'text-emerald-600' : 'text-[#8E8694] hover:text-emerald-600'}`}
                          title={fr ? 'Marquer comme réponse validée' : 'اعتماد الجواب'}
                        >
                          <BadgeCheck className="w-4 h-4" />
                        </button>
                      )}
                      {c.authorId !== currentUserId && (
                        <button onClick={() => setReportTarget({ commentId: c.id, label: c.content.slice(0, 120) })} className="p-1.5 rounded-lg text-[#8E8694] hover:text-rose-600 cursor-pointer" title={fr ? 'Signaler' : 'تبليغ'}>
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(c.authorId === currentUserId || isStaff) && (
                        <button onClick={() => handleDeleteComment(c)} className="p-1.5 rounded-lg text-[#8E8694] hover:text-rose-600 cursor-pointer" title={fr ? 'Supprimer' : 'حذف'}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[#3E3844] leading-relaxed whitespace-pre-line break-words">{c.content}</p>
                  <button
                    onClick={() => withProfile(() => toggleCommentLike(c))}
                    className={`flex items-center gap-1 text-[11px] font-bold cursor-pointer active:scale-95 ${c.isLiked ? 'text-[#8D174B]' : 'text-[#8E8694] hover:text-[#8D174B]'}`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${c.isLiked ? 'fill-current' : ''}`} />
                    <span>{c.likesCount}</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {canParticipate ? (
            <div className="sticky bottom-20 md:bottom-2 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-[#F1E5EC] p-2.5 shadow-lg">
              <form onSubmit={handleSendReply} className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  maxLength={3000}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={fr ? 'Écrire une réponse constructive...' : 'أكتب إجابتك هنا...'}
                  className="flex-1 bg-transparent px-3 py-2 text-xs text-[#242126] placeholder-[#8E8694] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || busy}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-md active:scale-95 ${
                    replyText.trim() ? 'bg-[#8D174B] hover:bg-[#75123E] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  aria-label={fr ? 'Envoyer' : 'إرسال'}
                >
                  <Send className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </form>
            </div>
          ) : (
            <p className="text-center text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl p-3">
              {fr ? 'Seuls les membres approuvés peuvent répondre dans cette communauté privée.' : 'فقط الأعضاء المعتمدون يمكنهم الرد في هذا الفضاء الخاص.'}
            </p>
          )}
        </div>
      ) : selectedRoomId && currentRoom ? (
        /* ═══════════════ VUE 2 : SALON ═══════════════ */
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 animate-fade-in space-y-4">
          <div className="relative rounded-3xl border border-[#F1E5EC] overflow-hidden shadow-xs bg-gradient-to-br from-[#240A18] via-[#8D174B] to-[#450C25] text-white">
            {currentRoom.heroImage && <img src={currentRoom.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1F0714]/95 via-[#8D174B]/70 to-[#1F0714]/50 pointer-events-none" />
            <div className="relative z-10 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedRoomId(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/25 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <BackIcon className="w-4 h-4" />
                  <span>{fr ? 'Toutes les communautés' : 'كافة المجتمعات'}</span>
                </button>
                {currentRoom.type === 'public' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-extrabold">
                    <Globe className="w-3 h-3" />
                    {fr ? 'Publique' : 'عام'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/90 text-white text-[11px] font-extrabold">
                    <Lock className="w-3 h-3" />
                    {fr ? 'Privée' : 'خاص'}
                  </span>
                )}
              </div>

              <div className="flex items-start gap-4 pt-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/95 p-2 shadow-lg shrink-0 flex items-center justify-center overflow-hidden">
                  {emblemOf(currentRoom) ? <img src={emblemOf(currentRoom)} alt="" className="w-full h-full object-contain" /> : <Users className="w-7 h-7 text-[#8D174B]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-2xl font-extrabold text-white break-words">{currentRoom.name[language] || currentRoom.name.fr}</h1>
                  {currentRoom.description.fr && (
                    <p className="text-xs sm:text-sm text-rose-100/90 mt-1 leading-relaxed">{currentRoom.description[language] || currentRoom.description.fr}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-rose-200 font-medium">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-rose-300" />
                      <strong>{currentRoom.members}</strong> {fr ? 'membre(s)' : 'عضو'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-rose-300" />
                      <strong>{currentRoom.posts}</strong> {fr ? 'discussion(s)' : 'نقاش'}
                    </span>
                    {currentRoom.myStatus === 'member' && (
                      <button onClick={() => handleLeave(currentRoom)} className="flex items-center gap-1 underline hover:text-white cursor-pointer">
                        <LogOut className="w-3.5 h-3.5" />
                        {fr ? 'Quitter' : 'مغادرة'}
                      </button>
                    )}
                    {currentRoom.type === 'public' && currentRoom.myStatus !== 'member' && (
                      <button
                        onClick={() => withProfile(() => handleJoin(currentRoom))}
                        className="px-3 py-1 rounded-xl bg-white text-[#8D174B] font-extrabold hover:bg-rose-50 cursor-pointer active:scale-95"
                      >
                        {fr ? 'Rejoindre' : 'انضمام'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {currentRoom.type === 'private' && !canParticipate && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-200/80 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <strong className="block text-sm font-bold">{fr ? 'Communauté privée' : 'فضاء خاص'}</strong>
                  <span className="text-xs text-amber-800">{currentRoom.accessNote || (fr ? 'Accès sur validation par l’équipe de modération.' : 'الولوج بعد موافقة فريق الإشراف.')}</span>
                </div>
              </div>
              {currentRoom.myStatus === 'pending' ? (
                <div className="px-4 py-2.5 rounded-xl bg-amber-200 text-amber-950 text-xs font-bold shrink-0 flex items-center gap-2 border border-amber-300">
                  <Clock className="w-4 h-4 text-amber-800" />
                  {fr ? 'Demande en cours d’examen' : 'طلبك قيد المراجعة'}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => withProfile(() => handleJoin(currentRoom))}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {currentRoom.myStatus === 'rejected' ? (fr ? 'Refusée — refaire une demande' : 'مرفوض — إعادة الطلب') : (fr ? 'Demander à rejoindre' : 'طلب الانضمام')}
                </button>
              )}
            </div>
          )}

          {canParticipate && (
            <>
              <div className="relative bg-white rounded-2xl border border-[#F1E5EC] focus-within:border-[#8D174B] shadow-xs flex items-center px-3.5 py-2.5">
                <Search className="w-4 h-4 text-[#8D174B] shrink-0 me-2" />
                <input
                  type="text"
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  placeholder={fr ? 'Rechercher une discussion dans ce salon...' : 'البحث عن نقاش في هذا الفضاء...'}
                  className="w-full bg-transparent text-xs sm:text-sm text-[#242126] placeholder-[#8E8694] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {CATEGORIES.map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={pill(selectedCategory === cat.id)}>
                    {fr ? cat.fr : cat.ar}
                  </button>
                ))}
                <button onClick={() => setOnlyBookmarks((v) => !v)} className={`${pill(onlyBookmarks)} flex items-center gap-1`}>
                  <Bookmark className="w-3.5 h-3.5" />
                  {fr ? 'Enregistrées' : 'المحفوظة'}
                </button>
              </div>

              <button
                onClick={() => withProfile(() => setNewPostOpen(true))}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#8D174B] hover:bg-[#75123E] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#8D174B]/20 transition-all cursor-pointer active:scale-95 animate-selected-glow"
              >
                <Plus className="w-5 h-5" />
                {fr ? 'Nouvelle discussion dans ce salon' : 'إنشاء نقاش جديد في هذا الفضاء'}
              </button>

              <div className="space-y-3.5">
                {postsLoading ? (
                  skeleton
                ) : filteredPosts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-3xl border border-[#F1E5EC] p-6 shadow-xs">
                    <MessageCircle className="w-12 h-12 text-[#6E6773]/30 mx-auto mb-2" />
                    <p className="text-xs text-[#6E6773] font-medium">
                      {posts.length === 0
                        ? (fr ? 'Aucune discussion pour l’instant : lancez la première !' : 'لا توجد نقاشات بعد: ابدأ أول نقاش !')
                        : (fr ? 'Aucune discussion ne correspond à vos critères.' : 'لا توجد نقاشات مطابقة.')}
                    </p>
                  </div>
                ) : (
                  filteredPosts.map((post, i) => (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPostId(post.id)}
                      className="bg-white rounded-3xl border border-[#F1E5EC] p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-[#8D174B]/40 hover-scale transition-all cursor-pointer space-y-3 animate-fade-in"
                      style={{ animationDelay: `${Math.min(i, 8) * 80}ms` }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {renderAuthor(post.authorName, post.authorHeadline, post.createdAt)}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {post.isPinned && <Pin className="w-4 h-4 text-[#8D174B]" />}
                          {post.category === 'annonces' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200">{fr ? 'Annonce' : 'إعلان'}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-[#242126] leading-snug break-words">{post.title}</h3>
                        <p className="text-xs text-[#5A5360] line-clamp-2 mt-1 leading-relaxed break-words">{post.content}</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-[#FAF4F7] text-xs text-[#6E6773]">
                        <div className="flex items-center gap-5">
                          <button
                            onClick={(e) => { e.stopPropagation(); withProfile(() => toggleLike(post)); }}
                            className={`flex items-center gap-1.5 font-bold cursor-pointer active:scale-95 ${post.isLiked ? 'text-[#8D174B]' : 'hover:text-[#8D174B]'}`}
                          >
                            <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                            <span>{post.likesCount}</span>
                          </button>
                          <span className="flex items-center gap-1.5 font-bold">
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.commentsCount}</span>
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleBookmark(post); }}
                          className={`p-1.5 rounded-lg cursor-pointer active:scale-95 ${post.isBookmarked ? 'text-[#8D174B]' : 'hover:text-[#8D174B]'}`}
                          aria-label={fr ? 'Enregistrer' : 'حفظ'}
                        >
                          <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        /* ═══════════════ VUE 3 : ANNUAIRE ═══════════════ */
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 animate-fade-in space-y-6">
          <div className="bg-gradient-to-r from-[#FAF0F5] via-[#FFFDFE] to-[#FDF2F7] rounded-3xl border border-[#F1E5EC] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8D174B]/10 text-[#8D174B] text-[11px] font-bold mb-2">
                <Users className="w-3.5 h-3.5" />
                {fr ? 'Communautés de candidats' : 'مجتمعات المترشحين'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#8D174B]">{fr ? 'Communautés de Concours' : 'مجتمعات مباريات التوظيف'}</h1>
              <p className="text-xs sm:text-sm text-[#6E6773] mt-1.5 leading-relaxed font-medium">
                {fr ? 'Un salon par concours, un espace général et des cercles privés validés par l’équipe.' : 'فضاء لكل مباراة، فضاء عام، ومجموعات خاصة بموافقة الفريق.'}
              </p>
              <button
                onClick={() => {
                  setPseudoDraft(profile?.pseudo || '');
                  setHeadlineDraft(profile?.headline || '');
                  pendingAfterPseudo.current = null;
                  setPseudoOpen(true);
                }}
                className="mt-2 text-[11px] text-[#8D174B] font-bold underline cursor-pointer"
              >
                {profile
                  ? (fr ? `Votre pseudo : ${profile.pseudo} (modifier)` : `اسمك المستعار: ${profile.pseudo} (تعديل)`)
                  : (fr ? 'Choisir mon pseudo public' : 'اختيار اسمي المستعار')}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto">
              {isStaff && (
                <button
                  type="button"
                  onClick={() => setModerationOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer relative active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {fr ? `Modération (${pendingModeration})` : `الإشراف (${pendingModeration})`}
                  {pendingModeration > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping absolute -top-1 -end-1" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setCreateRoomOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-extrabold shadow-md shadow-[#8D174B]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                {isStaff ? (fr ? 'Créer un salon' : 'إحداث فضاء') : (fr ? 'Proposer une communauté' : 'اقتراح مجتمع')}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative bg-white rounded-2xl border border-[#F1E5EC] focus-within:border-[#8D174B] shadow-xs flex items-center px-3.5 py-3">
              <Search className="w-4 h-4 text-[#8D174B] shrink-0 me-2" />
              <input
                type="text"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder={fr ? 'Rechercher une communauté (Intérieur, Finances, Santé...)' : 'ابحث عن مجتمع (الداخلية، المالية، الصحة...)'}
                className="w-full bg-transparent text-xs sm:text-sm text-[#242126] placeholder-[#8E8694] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', fr: `Toutes (${activeRooms.length})`, ar: `الكل (${activeRooms.length})` },
                { id: 'public', fr: `Publiques (${activeRooms.filter((r) => r.type === 'public').length})`, ar: `عامة (${activeRooms.filter((r) => r.type === 'public').length})` },
                { id: 'private', fr: `Privées (${activeRooms.filter((r) => r.type === 'private').length})`, ar: `خاصة (${activeRooms.filter((r) => r.type === 'private').length})` },
                { id: 'mine', fr: `Mes groupes (${myRoomsCount})`, ar: `مجموعاتي (${myRoomsCount})` },
              ].map((f) => (
                <button key={f.id} onClick={() => setDirectoryFilter(f.id as typeof directoryFilter)} className={pill(directoryFilter === f.id)}>
                  {fr ? f.fr : f.ar}
                </button>
              ))}
            </div>
          </div>

          {roomsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl border border-[#F1E5EC] p-5 h-40 animate-pulse" />
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-[#F1E5EC] p-6">
              <Users className="w-12 h-12 text-[#6E6773]/30 mx-auto mb-2" />
              <p className="text-xs text-[#6E6773]">{fr ? 'Aucune communauté ne correspond.' : 'لا توجد مجتمعات مطابقة.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRooms.map((room, i) => {
                const isMember = room.myStatus === 'member' || isStaff;
                const emblem = emblemOf(room);
                return (
                  <div
                    key={room.id}
                    onClick={() => room.status === 'active' && setSelectedRoomId(room.id)}
                    className={`bg-white rounded-3xl border border-[#F1E5EC] p-5 shadow-xs hover:shadow-md hover:border-[#8D174B]/40 hover-scale transition-all flex flex-col justify-between space-y-4 animate-fade-in ${room.status === 'active' ? 'cursor-pointer' : 'opacity-80'}`}
                    style={{ animationDelay: `${Math.min(i, 8) * 80}ms` }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8D174B] to-[#C73578] text-white flex items-center justify-center shrink-0 overflow-hidden">
                            {emblem ? <img src={emblem} alt="" className="w-full h-full object-contain p-1.5 bg-white" /> : <Users className="w-6 h-6" />}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-extrabold text-[#242126] leading-snug line-clamp-2">{room.name[language] || room.name.fr}</h3>
                            <span className="text-[11px] text-[#8E8694] flex items-center gap-1 mt-0.5">
                              {room.isGeneral ? <Sparkles className="w-3 h-3 text-[#8D174B]" /> : <ShieldCheck className="w-3 h-3 text-[#8D174B]" />}
                              {room.isGeneral ? (fr ? 'Espace général' : 'فضاء عام') : room.contestId ? (fr ? 'Salon du concours' : 'فضاء المباراة') : (fr ? 'Communauté' : 'مجتمع')}
                            </span>
                          </div>
                        </div>
                        {room.status === 'proposed' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-extrabold border border-gray-200 shrink-0">{fr ? 'En validation' : 'قيد المراجعة'}</span>
                        ) : room.type === 'public' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200 shrink-0">
                            <Globe className="w-3 h-3" />
                            {fr ? 'Public' : 'عام'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-extrabold border border-amber-200 shrink-0">
                            <Lock className="w-3 h-3" />
                            {fr ? 'Privé' : 'خاص'}
                          </span>
                        )}
                      </div>
                      {room.description.fr && <p className="text-xs text-[#5A5360] mt-3 line-clamp-2 leading-relaxed">{room.description[language] || room.description.fr}</p>}
                      {room.type === 'private' && room.accessNote && (
                        <div className="mt-2.5 text-[11px] text-amber-800 bg-amber-50/80 px-2.5 py-1.5 rounded-xl border border-amber-200/60 flex items-center gap-1.5">
                          <Key className="w-3 h-3 shrink-0" />
                          <span className="line-clamp-1">{room.accessNote}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#FAF4F7] flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3 text-[#6E6773] text-[11px]">
                        <span className="flex items-center gap-1" title={fr ? 'Membres' : 'أعضاء'}>
                          <Users className="w-3.5 h-3.5 text-[#8D174B]" />
                          <strong>{room.members}</strong>
                        </span>
                        <span className="flex items-center gap-1" title={fr ? 'Discussions' : 'نقاشات'}>
                          <MessageSquare className="w-3.5 h-3.5 text-[#8D174B]" />
                          <strong>{room.posts}</strong>
                        </span>
                        {room.lastActivity && <span className="text-[#8E8694]">{timeAgo(room.lastActivity, language)}</span>}
                      </div>
                      {room.status !== 'active' ? null : isMember ? (
                        <span className="inline-flex items-center gap-1 text-[#8D174B] font-extrabold">
                          {fr ? 'Entrer' : 'دخول'}
                          <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                        </span>
                      ) : room.myStatus === 'pending' ? (
                        <span className="text-amber-800 font-bold text-[11px] bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-xl flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {fr ? 'En attente' : 'قيد المراجعة'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); withProfile(() => handleJoin(room)); }}
                          className="px-3 py-1.5 rounded-xl bg-[#FAF0F5] hover:bg-[#8D174B] text-[#8D174B] hover:text-white border border-[#8D174B]/20 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                        >
                          {room.type === 'private' && <Lock className="w-3 h-3" />}
                          {room.type === 'private' ? (fr ? 'Demander accès' : 'طلب الانضمام') : (fr ? 'Rejoindre' : 'انضمام')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ MODALES ═══════════════ */}

      {pseudoOpen && (
        <div className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <form onSubmit={handleSavePseudo} className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#F1E5EC] overflow-hidden">
            <div className="bg-[#8D174B] text-white p-4 sm:p-5 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <UserCircle2 className="w-5 h-5 text-amber-300" />
                {fr ? 'Votre pseudo dans la Communauté' : 'اسمك المستعار في المجتمع'}
              </h3>
              <button type="button" onClick={() => { setPseudoOpen(false); pendingAfterPseudo.current = null; }} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer" aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              <p className="text-[#6E6773]">
                {fr ? 'Il sera affiché sur vos messages. Votre nom et votre e-mail ne sont jamais montrés.' : 'سيظهر على رسائلك. اسمك وبريدك لا يظهران أبداً.'}
              </p>
              <div>
                <label className="font-bold text-[#242126] block mb-1">{fr ? 'Pseudo (3 à 30 caractères)' : 'الاسم المستعار (3 إلى 30 حرفاً)'}</label>
                <input value={pseudoDraft} onChange={(e) => setPseudoDraft(e.target.value)} minLength={3} maxLength={30} required autoFocus placeholder="Ex : Candidat_Rabat" className={input} />
              </div>
              <div>
                <label className="font-bold text-[#242126] block mb-1">{fr ? 'Profil (facultatif)' : 'الصفة (اختياري)'}</label>
                <input
                  value={headlineDraft}
                  onChange={(e) => setHeadlineDraft(e.target.value)}
                  maxLength={60}
                  placeholder={fr ? 'Ex : Master Gestion, candidat Administrateur' : 'مثال: ماستر تدبير'}
                  className={input}
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white font-bold shadow-md cursor-pointer active:scale-95 disabled:opacity-60">
                  {fr ? 'Enregistrer' : 'حفظ'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {joinPrivateRoom && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-y-auto">
          <form onSubmit={handleRequestPrivate} className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#F1E5EC] overflow-hidden my-auto">
            <div className="bg-gradient-to-r from-amber-700 to-amber-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-300" />
                {fr ? 'Demande d’accès' : 'طلب الانضمام'}
              </h3>
              <button type="button" onClick={() => setJoinPrivateRoom(null)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer" aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <h4 className="font-extrabold text-amber-950 text-xs sm:text-sm">{joinPrivateRoom.name[language] || joinPrivateRoom.name.fr}</h4>
                <span className="text-[11px] text-amber-800 block mt-0.5">{joinPrivateRoom.accessNote || (fr ? 'Validation par l’équipe de modération.' : 'الموافقة من فريق الإشراف.')}</span>
              </div>
              <div>
                <label className="font-bold text-[#242126] block mb-1">{fr ? 'Votre motif (facultatif) :' : 'سبب الطلب (اختياري) :'}</label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={joinReason}
                  onChange={(e) => setJoinReason(e.target.value)}
                  placeholder={fr ? 'Ex : convoqué à l’oral, spécialité Gestion...' : 'مثال: مدعو للشفوي، تخصص التدبير...'}
                  className={`${input} p-3`}
                />
                <span className="text-[10px] text-gray-500 mt-1 block">{fr ? 'N’indiquez ni numéro de CIN ni donnée sensible.' : 'لا تكتب رقم البطاقة الوطنية أو معطيات حساسة.'}</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setJoinPrivateRoom(null)} className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer">
                  {fr ? 'Annuler' : 'إلغاء'}
                </button>
                <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-60">
                  <Send className="w-3.5 h-3.5" />
                  {fr ? 'Envoyer la demande' : 'إرسال الطلب'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {newPostOpen && currentRoom && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <form onSubmit={handleCreatePost} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#F1E5EC] overflow-hidden">
            <div className="bg-[#8D174B] text-white p-4 sm:p-5 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-300" />
                {fr ? 'Nouvelle discussion' : 'نقاش جديد'}
              </h3>
              <button type="button" onClick={() => setNewPostOpen(false)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer" aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#6E6773] block mb-1">{fr ? 'Catégorie :' : 'الصنف :'}</label>
                <select value={newPostCategory} onChange={(e) => setNewPostCategory(e.target.value as PostCategory)} className={input}>
                  <option value="questions">{fr ? 'Questions & demandes d’aide' : 'أسئلة وطلب مساعدة'}</option>
                  <option value="conseils">{fr ? 'Conseils & méthodologie' : 'نصائح ومنهجية'}</option>
                  <option value="experiences">{fr ? 'Retours d’expérience' : 'تجارب'}</option>
                  {isStaff && <option value="annonces">{fr ? 'Annonce officielle (équipe)' : 'إعلان رسمي (الفريق)'}</option>}
                </select>
              </div>
              <div>
                <label className="font-bold text-[#6E6773] block mb-1">{fr ? 'Titre :' : 'العنوان :'}</label>
                <input
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  minLength={3}
                  maxLength={160}
                  required
                  placeholder={fr ? 'Ex : Comment préparer l’épreuve de spécialité ?' : 'مثال: كيف أستعد لاختبار التخصص؟'}
                  className={input}
                />
              </div>
              <div>
                <label className="font-bold text-[#6E6773] block mb-1">{fr ? 'Message :' : 'النص :'}</label>
                <textarea rows={5} value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} maxLength={5000} required className={input} />
                <span className="text-[10px] text-gray-500">{newPostContent.length}/5000</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setNewPostOpen(false)} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer">
                  {fr ? 'Annuler' : 'إلغاء'}
                </button>
                <button type="submit" disabled={busy} className="px-5 py-2 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white font-bold shadow-md cursor-pointer active:scale-95 disabled:opacity-60">
                  {fr ? 'Publier' : 'نشر'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {createRoomOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-y-auto">
          <form onSubmit={handleCreateRoom} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#F1E5EC] overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="bg-[#8D174B] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-300" />
                {isStaff ? (fr ? 'Créer une communauté' : 'إحداث مجتمع') : (fr ? 'Proposer une communauté' : 'اقتراح مجتمع')}
              </h3>
              <button type="button" onClick={() => setCreateRoomOpen(false)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer" aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {!isStaff && (
                <div className="bg-rose-50 border border-rose-200 text-[#8D174B] p-3 rounded-2xl text-[11px] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  {fr ? 'Votre proposition sera visible après validation par l’équipe KounKour.' : 'سيظهر اقتراحك بعد موافقة فريق كونكور.'}
                </div>
              )}
              {allContests.length > 0 && (
                <div>
                  <label className="font-bold text-[#6E6773] block mb-1">{fr ? 'Concours associé (facultatif) :' : 'المباراة المرتبطة (اختياري) :'}</label>
                  <select value={roomContestId} onChange={(e) => handleContestSelect(e.target.value)} className={input}>
                    <option value="">{fr ? '— Aucun concours —' : '— بدون مباراة —'}</option>
                    {allContests.map((c) => (
                      <option key={c.id} value={c.id}>{c.title.fr}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="bg-[#FAF4F7] p-3.5 rounded-2xl border border-[#F1E5EC] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#8D174B] flex items-center gap-1.5 text-[11px] uppercase">
                    <ImageIcon className="w-3.5 h-3.5" />
                    {fr ? 'Image (facultatif, 2 Mo max)' : 'صورة (اختياري، 2 ميغا)'}
                  </label>
                  {roomImage && (
                    <button type="button" onClick={() => setRoomImage('')} className="text-[10px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer font-bold">
                      <Trash2 className="w-3 h-3" />
                      {fr ? 'Retirer' : 'حذف'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-14 rounded-xl border border-[#8D174B]/20 bg-white overflow-hidden shrink-0 flex items-center justify-center relative">
                    {roomImage ? <img src={roomImage} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-gray-300" />}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageFile} accept="image/jpeg,image/png,image/webp" className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 py-1.5 rounded-xl bg-[#8D174B] hover:bg-[#70113B] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60"
                  >
                    <Upload className="w-3 h-3" />
                    {fr ? 'Choisir une image' : 'اختيار صورة'}
                  </button>
                </div>
              </div>
              <div>
                <label className="font-bold text-[#6E6773] block mb-1">{fr ? 'Type d’accès :' : 'نوع الولوج :'}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['public', 'private'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setRoomType(t)}
                      className={`p-2.5 rounded-2xl border font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        roomType === t ? 'bg-[#8D174B] text-white border-[#8D174B]' : 'bg-[#FAF7F9] text-[#6E6773] border-[#F1E5EC]'
                      }`}
                    >
                      {t === 'public' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {t === 'public' ? (fr ? 'Public (ouvert)' : 'عام') : (fr ? 'Privé (sur validation)' : 'خاص')}
                    </button>
                  ))}
                </div>
              </div>
              {roomType === 'private' && (
                <div>
                  <label className="font-bold text-[#6E6773] block mb-1">{fr ? 'Condition d’accès affichée :' : 'شرط الولوج :'}</label>
                  <input
                    value={roomAccessNote}
                    onChange={(e) => setRoomAccessNote(e.target.value)}
                    maxLength={300}
                    placeholder={fr ? 'Ex : réservé aux candidats convoqués à l’oral' : 'مثال: خاص بالمدعوين للشفوي'}
                    className={input}
                  />
                </div>
              )}
              <div>
                <label className="font-bold text-[#6E6773] block mb-1">{fr ? 'Nom (français) :' : 'الاسم (بالفرنسية) :'}</label>
                <input value={roomNameFr} onChange={(e) => setRoomNameFr(e.target.value)} minLength={3} maxLength={200} required className={input} />
              </div>
              <div>
                <label className="font-bold text-[#6E6773] block mb-1">{fr ? 'Nom (arabe, facultatif) :' : 'الاسم (بالعربية، اختياري) :'}</label>
                <input value={roomNameAr} onChange={(e) => setRoomNameAr(e.target.value)} maxLength={200} dir="rtl" className={input} />
              </div>
              <div>
                <label className="font-bold text-[#6E6773] block mb-1">{fr ? 'Description :' : 'الوصف :'}</label>
                <textarea rows={3} value={roomDesc} onChange={(e) => setRoomDesc(e.target.value)} maxLength={800} className={input} />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setCreateRoomOpen(false)} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer">
                  {fr ? 'Annuler' : 'إلغاء'}
                </button>
                <button type="submit" disabled={busy || uploading} className="px-5 py-2 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white font-bold shadow-md cursor-pointer active:scale-95 disabled:opacity-60">
                  {isStaff ? (fr ? 'Créer' : 'إحداث') : (fr ? 'Soumettre' : 'إرسال')}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {reportTarget && (
        <div className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <form onSubmit={handleReport} className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#F1E5EC] overflow-hidden">
            <div className="bg-rose-700 text-white p-4 sm:p-5 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <Flag className="w-5 h-5" />
                {fr ? 'Signaler un contenu' : 'التبليغ عن محتوى'}
              </h3>
              <button type="button" onClick={() => setReportTarget(null)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer" aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              <p className="p-3 bg-[#FAF7F9] rounded-xl border border-[#F1E5EC] text-[#3E3844] line-clamp-3">« {reportTarget.label} »</p>
              <div>
                <label className="font-bold text-[#242126] block mb-1">{fr ? 'Motif :' : 'السبب :'}</label>
                <textarea
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  minLength={3}
                  maxLength={500}
                  required
                  placeholder={fr ? 'Ex : insulte, fausse information, publicité, données personnelles...' : 'مثال: سب، معلومة خاطئة، إشهار...'}
                  className={`${input} p-3`}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setReportTarget(null)} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer">
                  {fr ? 'Annuler' : 'إلغاء'}
                </button>
                <button type="submit" disabled={busy} className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold shadow-md cursor-pointer active:scale-95 disabled:opacity-60">
                  {fr ? 'Envoyer' : 'إرسال'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {isStaff && (
        <AdminCommunityRequestsModal
          isOpen={moderationOpen}
          onClose={() => setModerationOpen(false)}
          language={language}
          onRequestUpdated={() => {
            loadRooms();
            loadModerationCount();
          }}
          onOpenPost={(roomId, postId) => {
            setModerationOpen(false);
            if (roomId) setSelectedRoomId(roomId);
            if (postId) window.setTimeout(() => setSelectedPostId(postId), 400);
          }}
        />
      )}
    </div>
  );
};
