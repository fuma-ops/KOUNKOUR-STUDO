import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, CornerDownRight, Flag, Heart, Loader2, LogIn, MessageCircle, Pin, Send, Trash2 } from 'lucide-react';
import type { Language } from '../types';
import { useSession } from '../lib/useSession';
import {
  CommunityError, createComment, deleteComment, deletePost, getContestDiscussion, getMyCommunityProfile,
  postContestMessage, report, saveMyCommunityProfile, setCommentLiked, setPostLiked, subscribeCommunity, timeAgo,
  type CommunityProfile, type ContestDiscussion, type ContestMessage, type PostCategory,
} from '../data/communityApi';

// Commentaires sous un concours : les candidats échangent directement depuis la
// fiche (questions, conseils, retours d'expérience). Lecture ouverte à tous,
// écriture avec un compte + pseudo public. Même fil que le salon du concours.

interface Props {
  contestId: string;
  language: Language;
  onRequestLogin?: () => void;
  onOpenCommunity?: () => void;
  onCountChange?: (n: number) => void;
}

const CATEGORIES: { id: Exclude<PostCategory, 'annonces'>; fr: string; ar: string; cls: string }[] = [
  { id: 'questions', fr: 'Question', ar: 'سؤال', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'conseils', fr: 'Conseil', ar: 'نصيحة', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'experiences', fr: 'Expérience', ar: 'تجربة', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
];

const STARTERS = {
  fr: ['Quelqu’un a déjà passé ce concours ?', 'Quels documents avez-vous déposés ?', 'Des conseils pour préparer l’écrit ?'],
  ar: ['هل اجتاز أحدكم هذه المباراة من قبل؟', 'ما هي الوثائق التي أودعتموها؟', 'نصائح للتحضير للاختبار الكتابي؟'],
};

const REPORT_REASONS = {
  fr: ['Contenu inapproprié', 'Fausse information', 'Spam ou publicité'],
  ar: ['محتوى غير لائق', 'معلومة خاطئة', 'إشهار أو رسائل مزعجة'],
};

const initial = (name: string) => (name.trim()[0] || '?').toUpperCase();

export const ContestComments: React.FC<Props> = ({ contestId, language, onRequestLogin, onOpenCommunity, onCountChange }) => {
  const fr = language === 'fr';
  const { user } = useSession();
  const [data, setData] = useState<ContestDiscussion | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CommunityProfile | null | undefined>(undefined);
  const [pseudo, setPseudo] = useState('');
  const [text, setText] = useState('');
  const [category, setCategory] = useState<Exclude<PostCategory, 'annonces'>>('questions');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [reporting, setReporting] = useState<{ postId?: string; commentId?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const countCb = useRef(onCountChange);
  countCb.current = onCountChange;

  const load = useCallback(async () => {
    try {
      const d = await getContestDiscussion(contestId);
      setData(d);
      setLoadError(null);
      countCb.current?.(d.total);
    } catch (e) {
      setLoadError(e instanceof CommunityError ? e.message : fr ? 'Commentaires indisponibles.' : 'التعليقات غير متاحة.');
    }
  }, [contestId, fr]);

  useEffect(() => {
    setData(null);
    load();
  }, [load, user?.id]);

  // Temps réel : on recharge quand quelqu'un écrit (comptes connectés).
  useEffect(() => {
    if (!user) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const off = subscribeCommunity(() => {
      clearTimeout(t);
      t = setTimeout(load, 600);
    });
    return () => {
      clearTimeout(t);
      off();
    };
  }, [user, load]);

  useEffect(() => {
    if (!user) {
      setProfile(undefined);
      return;
    }
    getMyCommunityProfile().then(setProfile).catch(() => setProfile(null));
  }, [user]);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  };

  const run = async (fn: () => Promise<unknown>, after?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      after?.();
      await load();
    } catch (e) {
      setError(e instanceof CommunityError ? e.message : fr ? 'Action impossible, réessayez.' : 'تعذر تنفيذ العملية.');
    } finally {
      setBusy(false);
    }
  };

  const savePseudo = () =>
    run(async () => setProfile(await saveMyCommunityProfile(pseudo, '')));

  const publish = () =>
    run(() => postContestMessage(contestId, text, category), () => {
      setText('');
      flash(fr ? 'Message publié ✓' : 'تم النشر ✓');
    });

  const sendReply = (postId: string) =>
    run(() => createComment(postId, replyText), () => {
      setReplyText('');
      setReplyTo(null);
    });

  const toggleLike = (kind: 'post' | 'comment', id: string, liked: boolean) => {
    if (!user) return onRequestLogin?.();
    run(() => (kind === 'post' ? setPostLiked(id, !liked) : setCommentLiked(id, !liked)));
  };

  const remove = (kind: 'post' | 'comment', id: string) => {
    const q = kind === 'post'
      ? fr ? 'Supprimer ce message et ses réponses ?' : 'حذف هذه الرسالة وردودها؟'
      : fr ? 'Supprimer cette réponse ?' : 'حذف هذا الرد؟';
    if (!window.confirm(q)) return;
    run(() => (kind === 'post' ? deletePost(id) : deleteComment(id)));
  };

  const sendReport = (reason: string) => {
    const target = reporting;
    if (!target) return;
    setReporting(null);
    run(() => report(target, reason), () => flash(fr ? 'Merci, la modération va vérifier.' : 'شكراً، سيتم التحقق.'));
  };

  const canWrite = !!user && !!profile;
  const total = data?.total ?? 0;

  const renderActions = ({ kind, id, likes, liked, mine, onReply }: { kind: 'post' | 'comment'; id: string; likes: number; liked: boolean; mine: boolean; onReply?: () => void }) => (
    <div className="flex items-center gap-3 mt-1.5 text-[11px] font-bold text-[#8E8694]">
      <button
        onClick={() => toggleLike(kind, id, liked)}
        disabled={busy}
        className={`flex items-center gap-1 hover:text-[#8D174B] active:scale-95 transition cursor-pointer ${liked ? 'text-[#8D174B]' : ''}`}
      >
        <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
        {likes > 0 && <span>{likes}</span>}
        <span className="sr-only">{fr ? 'Utile' : 'مفيد'}</span>
      </button>
      {onReply && (
        <button onClick={onReply} className="flex items-center gap-1 hover:text-[#8D174B] cursor-pointer">
          <CornerDownRight className="w-3.5 h-3.5" />
          {fr ? 'Répondre' : 'رد'}
        </button>
      )}
      {mine ? (
        <button onClick={() => remove(kind, id)} disabled={busy} className="flex items-center gap-1 hover:text-red-600 cursor-pointer">
          <Trash2 className="w-3.5 h-3.5" />
          {fr ? 'Supprimer' : 'حذف'}
        </button>
      ) : user ? (
        <button
          onClick={() => setReporting(kind === 'post' ? { postId: id } : { commentId: id })}
          className="flex items-center gap-1 hover:text-red-600 cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5" />
          {fr ? 'Signaler' : 'تبليغ'}
        </button>
      ) : null}
    </div>
  );

  const renderMessage = (m: ContestMessage) => {
    const cat = CATEGORIES.find((c) => c.id === m.category);
    return (
      <li key={m.id} className="animate-fade-in">
        <div className="flex gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FAF0F5] text-[#8D174B] font-black text-xs flex items-center justify-center shrink-0">
            {initial(m.author)}
          </div>
          <div className="min-w-0 flex-1">
            <div className={`rounded-2xl rounded-ss-sm px-3.5 py-2.5 border ${m.isPinned ? 'bg-[#FFF8E6] border-amber-200' : 'bg-[#FAF7F9] border-[#F1E5EC]'}`}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                <span className="text-xs font-extrabold text-[#242126]">{m.author}</span>
                {m.headline && <span className="text-[10px] text-[#8E8694] truncate max-w-[160px]">{m.headline}</span>}
                {m.isPinned && (
                  <span className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5">
                    <Pin className="w-3 h-3" />
                    {fr ? 'Épinglé' : 'مثبت'}
                  </span>
                )}
                {cat && <span className={`text-[10px] font-bold px-1.5 py-px rounded-full border ${cat.cls}`}>{cat[language]}</span>}
                <span className="text-[10px] text-[#8E8694] ms-auto">{timeAgo(m.createdAt, language)}</span>
              </div>
              <p className="text-[13px] text-[#3A3540] whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
            </div>
            {renderActions({
              kind: 'post',
              id: m.id,
              likes: m.likes,
              liked: m.liked,
              mine: m.isMine,
              onReply: () => {
                if (!user) return onRequestLogin?.();
                setReplyTo(replyTo === m.id ? null : m.id);
                setReplyText('');
              },
            })}

            {m.replies.length > 0 && (
              <ul className="mt-2 space-y-2 border-s-2 border-[#F1E5EC] ps-3">
                {m.replies.map((r) => (
                  <li key={r.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#F4F1F6] text-[#6E6773] font-black text-[10px] flex items-center justify-center shrink-0">
                      {initial(r.author)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`rounded-2xl rounded-ss-sm px-3 py-2 border ${r.isVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-[#F1E5EC]'}`}>
                        <div className="flex flex-wrap items-center gap-x-2 mb-0.5">
                          <span className="text-[11px] font-extrabold text-[#242126]">{r.author}</span>
                          {r.isVerified && (
                            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              {fr ? 'Réponse vérifiée' : 'جواب موثق'}
                            </span>
                          )}
                          <span className="text-[10px] text-[#8E8694] ms-auto">{timeAgo(r.createdAt, language)}</span>
                        </div>
                        <p className="text-[12.5px] text-[#3A3540] whitespace-pre-wrap break-words leading-relaxed">{r.content}</p>
                      </div>
                      {renderActions({ kind: 'comment', id: r.id, likes: r.likes, liked: r.liked, mine: r.isMine })}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {replyTo === m.id && canWrite && (
              <div className="mt-2 flex items-end gap-2 animate-fade-in">
                <textarea
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  maxLength={3000}
                  rows={2}
                  placeholder={fr ? `Répondre à ${m.author}…` : `الرد على ${m.author}…`}
                  className="flex-1 text-[13px] rounded-xl border border-[#E8DCE3] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8D174B]/30 resize-none"
                />
                <button
                  onClick={() => sendReply(m.id)}
                  disabled={busy || replyText.trim().length < 1}
                  className="p-2.5 rounded-xl bg-[#8D174B] text-white disabled:opacity-40 active:scale-95 transition cursor-pointer"
                  aria-label={fr ? 'Envoyer' : 'إرسال'}
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </li>
    );
  };

  return (
    <section id="contest-comments" className="bg-white rounded-3xl border border-[#F1E5EC] p-4 sm:p-5 shadow-xs space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-extrabold text-[#242126] flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#8D174B]" />
            {fr ? 'Discussion entre candidats' : 'نقاش بين المترشحين'}
            {total > 0 && <span className="text-[11px] font-black text-white bg-[#8D174B] rounded-full px-2 py-px">{total}</span>}
          </h4>
          <p className="text-[11px] text-[#6E6773] mt-0.5">
            {fr
              ? 'Posez vos questions, partagez vos conseils et votre expérience. Seul l’arrêté officiel fait foi.'
              : 'اطرح أسئلتك وشارك نصائحك وتجربتك. القرار الرسمي هو المرجع الوحيد.'}
          </p>
        </div>
        {onOpenCommunity && total > 0 && (
          <button onClick={onOpenCommunity} className="text-[11px] font-bold text-[#8D174B] hover:underline whitespace-nowrap cursor-pointer">
            {fr ? 'Salon complet →' : 'الفضاء الكامل ←'}
          </button>
        )}
      </header>

      {/* Zone d'écriture */}
      {!user ? (
        <button
          onClick={onRequestLogin}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-[#E8C9D8] text-[#8D174B] text-xs font-extrabold hover:bg-[#FAF0F5] active:scale-[0.98] transition cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          {fr ? 'Connectez-vous pour commenter et échanger avec les candidats' : 'سجّل الدخول للتعليق والتواصل مع المترشحين'}
        </button>
      ) : profile === undefined ? (
        <div className="h-20 rounded-2xl bg-[#FAF7F9] animate-pulse" />
      ) : !profile ? (
        <div className="rounded-2xl bg-[#FAF7F9] border border-[#F1E5EC] p-3 space-y-2">
          <p className="text-xs font-bold text-[#242126]">
            {fr ? 'Choisissez un pseudo public pour participer' : 'اختر اسماً مستعاراً للمشاركة'}
          </p>
          <div className="flex gap-2">
            <input
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              maxLength={30}
              placeholder={fr ? 'Ex. : Sara_Infirmière' : 'مثال: سارة_ممرضة'}
              className="flex-1 text-sm rounded-xl border border-[#E8DCE3] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8D174B]/30"
            />
            <button
              onClick={savePseudo}
              disabled={busy || pseudo.trim().length < 3}
              className="px-4 rounded-xl bg-[#8D174B] text-white text-xs font-extrabold disabled:opacity-40 active:scale-95 transition cursor-pointer"
            >
              {fr ? 'Valider' : 'تأكيد'}
            </button>
          </div>
          <p className="text-[10px] text-[#8E8694]">{fr ? 'Votre nom et votre e-mail ne sont jamais affichés.' : 'اسمك وبريدك لا يظهران أبداً.'}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E8DCE3] focus-within:ring-2 focus-within:ring-[#8D174B]/25 transition">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={5000}
            rows={3}
            placeholder={fr ? `Écrire un commentaire en tant que ${profile.pseudo}…` : `اكتب تعليقاً باسم ${profile.pseudo}…`}
            className="w-full text-[13px] rounded-t-2xl px-3.5 pt-3 pb-1 focus:outline-none resize-none"
          />
          <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition active:scale-95 cursor-pointer ${
                  category === c.id ? c.cls : 'bg-white text-[#8E8694] border-[#EEE6EB]'
                }`}
              >
                {c[language]}
              </button>
            ))}
            <button
              onClick={publish}
              disabled={busy || text.trim().length < 3}
              className="ms-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8D174B] hover:bg-[#70113B] text-white text-xs font-extrabold shadow-md shadow-[#8D174B]/20 disabled:opacity-40 disabled:shadow-none active:scale-95 transition cursor-pointer"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {fr ? 'Publier' : 'نشر'}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs font-bold text-red-600">{error}</p>}
      {notice && <p className="text-xs font-bold text-emerald-700 animate-fade-in">{notice}</p>}

      {reporting && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 animate-fade-in">
          <p className="text-xs font-bold text-red-800 mb-2">{fr ? 'Pourquoi signaler ce contenu ?' : 'لماذا تبلغ عن هذا المحتوى؟'}</p>
          <div className="flex flex-wrap gap-1.5">
            {REPORT_REASONS[language].map((r) => (
              <button key={r} onClick={() => sendReport(r)} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white border border-red-200 text-red-700 hover:bg-red-100 cursor-pointer">
                {r}
              </button>
            ))}
            <button onClick={() => setReporting(null)} className="text-[11px] font-bold px-2.5 py-1 text-[#6E6773] cursor-pointer">
              {fr ? 'Annuler' : 'إلغاء'}
            </button>
          </div>
        </div>
      )}

      {/* Fil */}
      {loadError ? (
        <p className="text-xs text-[#8E8694]">{loadError}</p>
      ) : !data ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#F4EEF2] animate-pulse" />
              <div className="flex-1 h-14 rounded-2xl bg-[#FAF7F9] animate-pulse" />
            </div>
          ))}
        </div>
      ) : data.messages.length === 0 ? (
        <div className="text-center py-3 space-y-2.5">
          <p className="text-xs text-[#6E6773]">
            {fr ? 'Aucun commentaire pour l’instant. Lancez la discussion :' : 'لا توجد تعليقات بعد. ابدأ النقاش:'}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {STARTERS[language].map((s) => (
              <button
                key={s}
                onClick={() => {
                  if (!user) return onRequestLogin?.();
                  setText(s);
                  setCategory('questions');
                  textareaRef.current?.focus();
                }}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-[#FAF0F5] text-[#8D174B] border border-[#8D174B]/15 hover:scale-105 hover:shadow-sm active:scale-95 transition cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {data.messages.map(renderMessage)}
        </ul>
      )}
    </section>
  );
};
