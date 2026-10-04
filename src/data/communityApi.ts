import { getSupabase } from '../lib/supabase';

// Communauté : accès aux VRAIES données partagées (Supabase). Aucune donnée
// fictive : compteurs, messages et adhésions viennent de la base. Les droits
// (salon privé, modération, annonces) sont re-vérifiés par les RLS côté serveur.

export type RoomType = 'public' | 'private';
export type MyRoomStatus = 'member' | 'pending' | 'rejected' | null;
export type PostCategory = 'questions' | 'conseils' | 'experiences' | 'annonces';

export interface CommunityProfile {
  userId: string;
  pseudo: string;
  headline: string | null;
}

export interface Room {
  id: string;
  contestId: string | null;
  name: { fr: string; ar: string };
  description: { fr: string; ar: string };
  heroImage: string | null;
  type: RoomType;
  accessNote: string | null;
  status: 'active' | 'proposed' | 'archived';
  isGeneral: boolean;
  createdBy: string | null;
  createdAt: string;
  members: number;
  posts: number;
  lastActivity: string | null;
  myStatus: MyRoomStatus;
}

export interface Post {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  authorHeadline: string | null;
  title: string;
  content: string;
  category: PostCategory;
  isPinned: boolean;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorHeadline: string | null;
  content: string;
  isVerifiedAnswer: boolean;
  createdAt: string;
  likesCount: number;
  isLiked: boolean;
}

export interface AccessRequest {
  roomId: string;
  roomName: string;
  userId: string;
  pseudo: string | null;
  headline: string | null;
  reason: string | null;
  status: 'pending' | 'member' | 'rejected';
  createdAt: string;
}

export interface Report {
  id: string;
  postId: string | null;
  commentId: string | null;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
  excerpt: string;
  roomId: string | null;
}

export class CommunityError extends Error {}

function sb() {
  const client = getSupabase();
  if (!client) throw new CommunityError('Service indisponible. Réessayez plus tard.');
  return client;
}

async function uid(): Promise<string> {
  const { data } = await sb().auth.getUser();
  if (!data.user) throw new CommunityError('Connexion requise.');
  return data.user.id;
}

// Messages d'erreur compréhensibles (jamais le message technique brut).
function fail(error: { message?: string; code?: string } | null, fallback: string): never {
  const m = error?.message || '';
  if (error?.code === '23505' && /pseudo/i.test(m)) throw new CommunityError('Ce pseudo est déjà pris. Choisissez-en un autre.');
  if (error?.code === '23505') throw new CommunityError('Déjà enregistré.');
  if (error?.code === '42501' || /row-level security/i.test(m)) throw new CommunityError('Action non autorisée pour votre compte.');
  if (error?.code === '23514') throw new CommunityError('Contenu invalide (trop court ou trop long).');
  throw new CommunityError(fallback);
}

export async function getMyUserId(): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

// ─── Profil communautaire (pseudo public) ─────────────────────────────────────

export async function getMyCommunityProfile(): Promise<CommunityProfile | null> {
  const me = await uid();
  const { data, error } = await sb().from('community_profiles').select('user_id, pseudo, headline').eq('user_id', me).maybeSingle();
  if (error) fail(error, 'Impossible de charger votre profil.');
  return data ? { userId: data.user_id, pseudo: data.pseudo, headline: data.headline } : null;
}

export async function saveMyCommunityProfile(pseudo: string, headline: string): Promise<CommunityProfile> {
  const me = await uid();
  const p = pseudo.trim();
  if (p.length < 3 || p.length > 30) throw new CommunityError('Le pseudo doit faire entre 3 et 30 caractères.');
  const h = headline.trim().slice(0, 60) || null;
  const { data, error } = await sb()
    .from('community_profiles')
    .upsert({ user_id: me, pseudo: p, headline: h, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select('user_id, pseudo, headline')
    .single();
  if (error || !data) fail(error, 'Impossible d’enregistrer le pseudo.');
  return { userId: data.user_id, pseudo: data.pseudo, headline: data.headline };
}

// ─── Salons ───────────────────────────────────────────────────────────────────

function mapRoom(r: any, stats: Map<string, any>, mine: Map<string, MyRoomStatus>): Room {
  const s = stats.get(r.id);
  return {
    id: r.id,
    contestId: r.contest_id,
    name: { fr: r.name_fr, ar: r.name_ar || r.name_fr },
    description: { fr: r.description_fr || '', ar: r.description_ar || r.description_fr || '' },
    heroImage: r.hero_image,
    type: r.type,
    accessNote: r.access_note,
    status: r.status,
    isGeneral: r.is_general,
    createdBy: r.created_by,
    createdAt: r.created_at,
    members: Number(s?.members || 0),
    posts: Number(s?.posts || 0),
    lastActivity: s?.last_activity || null,
    myStatus: mine.get(r.id) ?? null,
  };
}

// Salons visibles (actifs + mes propositions ; tout pour le staff).
export async function listRooms(): Promise<Room[]> {
  const me = await uid();
  const [rooms, stats, mine] = await Promise.all([
    sb().from('community_rooms').select('*').neq('status', 'archived').order('is_general', { ascending: false }).order('created_at', { ascending: false }),
    sb().rpc('community_room_stats'),
    sb().from('community_memberships').select('room_id, status').eq('user_id', me),
  ]);
  if (rooms.error) fail(rooms.error, 'Impossible de charger les communautés.');
  const statMap = new Map<string, any>((stats.data || []).map((s: any) => [s.room_id, s]));
  const mineMap = new Map<string, MyRoomStatus>((mine.data || []).map((m: any) => [m.room_id, m.status]));
  return (rooms.data || []).map((r) => mapRoom(r, statMap, mineMap));
}

// Salon public d'un concours (créé à la demande, nom repris du concours).
export async function ensureContestRoom(contestId: string): Promise<string> {
  const { data, error } = await sb().rpc('community_ensure_contest_room', { p_contest: contestId });
  if (error || !data) fail(error, 'Impossible d’ouvrir le salon de ce concours.');
  return data as string;
}

export async function joinRoom(room: Room, reason?: string): Promise<MyRoomStatus> {
  const me = await uid();
  const status = room.type === 'public' ? 'member' : 'pending';
  // Une demande refusée peut être renouvelée : on retire l'ancienne d'abord.
  if (room.myStatus === 'rejected') {
    await sb().from('community_memberships').delete().eq('room_id', room.id).eq('user_id', me);
  }
  const { error } = await sb()
    .from('community_memberships')
    .insert({ room_id: room.id, user_id: me, status, reason: reason?.trim().slice(0, 500) || null });
  if (error && error.code !== '23505') fail(error, 'Impossible de rejoindre cette communauté.');
  return status;
}

export async function leaveRoom(roomId: string): Promise<void> {
  const me = await uid();
  const { error } = await sb().from('community_memberships').delete().eq('room_id', roomId).eq('user_id', me);
  if (error) fail(error, 'Impossible de quitter cette communauté.');
}

export interface NewRoomInput {
  contestId: string | null;
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  heroImage: string | null;
  type: RoomType;
  accessNote: string;
}

// Staff : salon actif immédiatement. Candidat : proposition soumise à validation.
export async function createRoom(input: NewRoomInput, isStaff: boolean): Promise<void> {
  const me = await uid();
  const { error } = await sb().from('community_rooms').insert({
    contest_id: input.contestId || null,
    name_fr: input.nameFr.trim(),
    name_ar: input.nameAr.trim() || null,
    description_fr: input.descriptionFr.trim() || null,
    hero_image: input.heroImage || null,
    type: input.type,
    access_note: input.type === 'private' ? input.accessNote.trim() || null : null,
    status: isStaff ? 'active' : 'proposed',
    created_by: me,
  });
  if (error) fail(error, 'Impossible de créer la communauté.');
}

export async function setRoomStatus(roomId: string, status: 'active' | 'archived'): Promise<void> {
  const { error } = await sb().from('community_rooms').update({ status }).eq('id', roomId);
  if (error) fail(error, 'Action refusée.');
}

// Image du salon : stockée dans Supabase Storage (2 Mo max, jpeg/png/webp).
export async function uploadRoomImage(file: File): Promise<string> {
  const me = await uid();
  if (file.size > 2 * 1024 * 1024) throw new CommunityError('Image trop lourde (2 Mo maximum).');
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new CommunityError('Formats acceptés : JPG, PNG, WebP.');
  const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
  const path = `rooms/${me}/${Date.now()}.${ext}`;
  const { error } = await sb().storage.from('community').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new CommunityError('Échec de l’envoi de l’image.');
  return sb().storage.from('community').getPublicUrl(path).data.publicUrl;
}

// ─── Discussions ──────────────────────────────────────────────────────────────

const POST_SELECT =
  'id, room_id, author_id, title, content, category, is_pinned, created_at, author:community_profiles(pseudo, headline), comments:community_comments(count), likes:community_post_likes(count)';

function countOf(rel: any): number {
  return Array.isArray(rel) && rel[0] && typeof rel[0].count === 'number' ? rel[0].count : 0;
}

export async function listPosts(roomId: string): Promise<Post[]> {
  const me = await uid();
  const { data, error } = await sb()
    .from('community_posts')
    .select(POST_SELECT)
    .eq('room_id', roomId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) fail(error, 'Impossible de charger les discussions.');
  const ids = (data || []).map((p: any) => p.id);
  const [likes, marks] = ids.length
    ? await Promise.all([
        sb().from('community_post_likes').select('post_id').eq('user_id', me).in('post_id', ids),
        sb().from('community_bookmarks').select('post_id').eq('user_id', me).in('post_id', ids),
      ])
    : [{ data: [] }, { data: [] }];
  const liked = new Set((likes.data || []).map((l: any) => l.post_id));
  const marked = new Set((marks.data || []).map((b: any) => b.post_id));
  return (data || []).map((p: any) => ({
    id: p.id,
    roomId: p.room_id,
    authorId: p.author_id,
    authorName: p.author?.pseudo || 'Membre',
    authorHeadline: p.author?.headline || null,
    title: p.title,
    content: p.content,
    category: p.category,
    isPinned: p.is_pinned,
    createdAt: p.created_at,
    likesCount: countOf(p.likes),
    commentsCount: countOf(p.comments),
    isLiked: liked.has(p.id),
    isBookmarked: marked.has(p.id),
  }));
}

export async function listComments(postId: string): Promise<Comment[]> {
  const me = await uid();
  const { data, error } = await sb()
    .from('community_comments')
    .select('id, post_id, author_id, content, is_verified_answer, created_at, author:community_profiles(pseudo, headline), likes:community_comment_likes(count)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) fail(error, 'Impossible de charger les réponses.');
  const ids = (data || []).map((c: any) => c.id);
  const mine = ids.length
    ? await sb().from('community_comment_likes').select('comment_id').eq('user_id', me).in('comment_id', ids)
    : { data: [] };
  const liked = new Set((mine.data || []).map((l: any) => l.comment_id));
  return (data || []).map((c: any) => ({
    id: c.id,
    postId: c.post_id,
    authorId: c.author_id,
    authorName: c.author?.pseudo || 'Membre',
    authorHeadline: c.author?.headline || null,
    content: c.content,
    isVerifiedAnswer: c.is_verified_answer,
    createdAt: c.created_at,
    likesCount: countOf(c.likes),
    isLiked: liked.has(c.id),
  }));
}

export async function createPost(roomId: string, title: string, content: string, category: PostCategory): Promise<void> {
  const me = await uid();
  const { error } = await sb()
    .from('community_posts')
    .insert({ room_id: roomId, author_id: me, title: title.trim(), content: content.trim(), category });
  if (error) fail(error, 'Impossible de publier la discussion.');
}

export async function deletePost(postId: string): Promise<void> {
  const { error, count } = await sb().from('community_posts').delete({ count: 'exact' }).eq('id', postId);
  if (error) fail(error, 'Suppression impossible.');
  if (!count) throw new CommunityError('Action non autorisée pour votre compte.');
}

export async function createComment(postId: string, content: string): Promise<void> {
  const me = await uid();
  const { error } = await sb().from('community_comments').insert({ post_id: postId, author_id: me, content: content.trim() });
  if (error) fail(error, 'Impossible d’envoyer la réponse.');
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error, count } = await sb().from('community_comments').delete({ count: 'exact' }).eq('id', commentId);
  if (error) fail(error, 'Suppression impossible.');
  if (!count) throw new CommunityError('Action non autorisée pour votre compte.');
}

export async function setPostLiked(postId: string, liked: boolean): Promise<void> {
  const me = await uid();
  const q = liked
    ? sb().from('community_post_likes').insert({ post_id: postId, user_id: me })
    : sb().from('community_post_likes').delete().eq('post_id', postId).eq('user_id', me);
  const { error } = await q;
  if (error && error.code !== '23505') fail(error, 'Action impossible.');
}

export async function setCommentLiked(commentId: string, liked: boolean): Promise<void> {
  const me = await uid();
  const q = liked
    ? sb().from('community_comment_likes').insert({ comment_id: commentId, user_id: me })
    : sb().from('community_comment_likes').delete().eq('comment_id', commentId).eq('user_id', me);
  const { error } = await q;
  if (error && error.code !== '23505') fail(error, 'Action impossible.');
}

export async function setBookmarked(postId: string, marked: boolean): Promise<void> {
  const me = await uid();
  const q = marked
    ? sb().from('community_bookmarks').insert({ post_id: postId, user_id: me })
    : sb().from('community_bookmarks').delete().eq('post_id', postId).eq('user_id', me);
  const { error } = await q;
  if (error && error.code !== '23505') fail(error, 'Action impossible.');
}

export async function report(target: { postId?: string; commentId?: string }, reason: string): Promise<void> {
  const me = await uid();
  const { error } = await sb().from('community_reports').insert({
    post_id: target.postId || null,
    comment_id: target.commentId || null,
    reporter_id: me,
    reason: reason.trim(),
  });
  if (error) fail(error, 'Signalement impossible.');
}

// ─── Modération (staff — re-vérifié par les RLS) ──────────────────────────────

export async function setPostPinned(postId: string, pinned: boolean): Promise<void> {
  const { error } = await sb().from('community_posts').update({ is_pinned: pinned }).eq('id', postId);
  if (error) fail(error, 'Action refusée.');
}

export async function setVerifiedAnswer(commentId: string, verified: boolean): Promise<void> {
  const { error } = await sb().from('community_comments').update({ is_verified_answer: verified }).eq('id', commentId);
  if (error) fail(error, 'Action refusée.');
}

export async function listAccessRequests(): Promise<AccessRequest[]> {
  const { data, error } = await sb()
    .from('community_memberships')
    .select('room_id, user_id, status, reason, created_at, room:community_rooms!inner(name_fr, type)')
    .eq('room.type', 'private')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) fail(error, 'Impossible de charger les demandes.');
  const userIds = [...new Set((data || []).map((m: any) => m.user_id))];
  const profiles = userIds.length
    ? await sb().from('community_profiles').select('user_id, pseudo, headline').in('user_id', userIds)
    : { data: [] };
  const byUser = new Map((profiles.data || []).map((p: any) => [p.user_id, p]));
  return (data || []).map((m: any) => ({
    roomId: m.room_id,
    roomName: m.room?.name_fr || '',
    userId: m.user_id,
    pseudo: byUser.get(m.user_id)?.pseudo || null,
    headline: byUser.get(m.user_id)?.headline || null,
    reason: m.reason,
    status: m.status,
    createdAt: m.created_at,
  }));
}

export async function decideAccessRequest(roomId: string, userId: string, approve: boolean): Promise<void> {
  const me = await uid();
  const { error } = await sb()
    .from('community_memberships')
    .update({ status: approve ? 'member' : 'rejected', decided_by: me, decided_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (error) fail(error, 'Action refusée.');
}

export async function listProposedRooms(): Promise<Room[]> {
  const { data, error } = await sb().from('community_rooms').select('*').eq('status', 'proposed').order('created_at', { ascending: false });
  if (error) fail(error, 'Impossible de charger les propositions.');
  return (data || []).map((r) => mapRoom(r, new Map(), new Map()));
}

export async function listReports(): Promise<Report[]> {
  const { data, error } = await sb()
    .from('community_reports')
    .select('id, post_id, comment_id, reason, status, created_at, post:community_posts(title, room_id), comment:community_comments(content, post_id)')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) fail(error, 'Impossible de charger les signalements.');
  return (data || []).map((r: any) => ({
    id: r.id,
    postId: r.post_id || r.comment?.post_id || null,
    commentId: r.comment_id,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
    excerpt: r.post?.title || r.comment?.content || '(contenu supprimé)',
    roomId: r.post?.room_id || null,
  }));
}

export async function resolveReport(id: string, status: 'resolved' | 'dismissed'): Promise<void> {
  const me = await uid();
  const { error } = await sb()
    .from('community_reports')
    .update({ status, resolved_by: me, resolved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) fail(error, 'Action refusée.');
}

// ─── Temps réel ───────────────────────────────────────────────────────────────

// Prévient l'écran quand une discussion, une réponse, un like ou une adhésion
// change (les abonnements respectent les RLS). Renvoie la fonction de désabonnement.
export function subscribeCommunity(onChange: (table: string) => void): () => void {
  const client = getSupabase();
  if (!client) return () => {};
  const channel = client.channel(`community-${Math.random().toString(36).slice(2)}`);
  for (const table of ['community_posts', 'community_comments', 'community_post_likes', 'community_memberships']) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange(table));
  }
  channel.subscribe();
  return () => {
    client.removeChannel(channel);
  };
}

// « il y a 5 min » — dates réelles, jamais de libellé figé.
export function timeAgo(iso: string, language: 'fr' | 'ar'): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const fr = language === 'fr';
  if (s < 60) return fr ? 'à l’instant' : 'الآن';
  const m = Math.round(s / 60);
  if (m < 60) return fr ? `il y a ${m} min` : `منذ ${m} د`;
  const h = Math.round(m / 60);
  if (h < 24) return fr ? `il y a ${h} h` : `منذ ${h} س`;
  const d = Math.round(h / 24);
  if (d < 30) return fr ? `il y a ${d} j` : `منذ ${d} ي`;
  return new Date(iso).toLocaleDateString(fr ? 'fr-FR' : 'ar-MA', { day: 'numeric', month: 'short', year: 'numeric' });
}
