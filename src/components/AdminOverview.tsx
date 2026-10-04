import React, { useCallback, useEffect, useState } from 'react';
import { Language } from '../types';
import { getSupabase } from '../lib/supabase';
import {
  Users, Award, Radio, MessagesSquare, GraduationCap, RefreshCw, AlertTriangle, ShieldCheck, Clock, ArrowRight, ArrowLeft, Info,
} from 'lucide-react';

// Tableau de bord admin : uniquement des chiffres réels comptés en base
// (RPC admin_overview, réservée au staff). Aucune donnée d'exemple.

export interface AdminOverviewData {
  generated_at: string;
  users: { total: number; new_7d: number; active_7d: number; by_role: Record<string, number>; staff: { email: string; role: string }[] };
  contests: { public: number; open: number; closing_7d: number; no_deadline: number; archived: number; last_published_at: string | null };
  radar: { pending_review: number; imported: number; last_scraped_at: string | null };
  community: { rooms_active: number; rooms_proposed: number; requests_pending: number; reports_open: number; posts: number; posts_7d: number; comments: number };
  prep: { sets: number; questions_published: number; questions_to_verify: number; learners: number; attempts: number };
}

interface Props {
  language: Language;
  section?: 'all' | 'users';
  onGo?: (section: string) => void;
  onOpenModeration?: () => void;
}

const ROLE_LABEL: Record<string, { fr: string; ar: string }> = {
  administrateur: { fr: 'Administrateurs', ar: 'المدراء' },
  editeur: { fr: 'Éditeurs', ar: 'المحررون' },
  moderateur: { fr: 'Modérateurs', ar: 'المشرفون' },
  utilisateur: { fr: 'Candidats', ar: 'المترشحون' },
};

function fmtDateTime(iso: string | null, lang: Language) {
  if (!iso) return lang === 'fr' ? 'jamais' : 'أبداً';
  return new Date(iso).toLocaleString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca' });
}

export const AdminOverview: React.FC<Props> = ({ language, section = 'all', onGo, onOpenModeration }) => {
  const fr = language === 'fr';
  const Go = language === 'ar' ? ArrowLeft : ArrowRight;
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const sb = getSupabase();
    if (!sb) {
      setError(fr ? 'Base de données indisponible.' : 'قاعدة البيانات غير متاحة.');
      setLoading(false);
      return;
    }
    const { data: d, error: e } = await sb.rpc('admin_overview');
    if (e || !d) setError(e?.message || (fr ? 'Lecture impossible.' : 'تعذرت القراءة.'));
    else setData(d as AdminOverviewData);
    setLoading(false);
  }, [fr]);

  useEffect(() => {
    load();
  }, [load]);

  const card = (i: number, icon: React.ReactNode, value: React.ReactNode, label: string, sub?: string, onClick?: () => void, alert = false) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`text-start bg-white rounded-3xl border p-4 sm:p-5 shadow-xs transition-all animate-fade-in ${
        onClick ? 'hover:shadow-md hover-scale active:scale-95 cursor-pointer' : 'cursor-default'
      } ${alert ? 'border-amber-300 bg-amber-50/40' : 'border-[#F1E5EC]'}`}
      style={{ animationDelay: `${i * 80}ms` }}
    >
      <div className="flex items-center gap-2 text-[#8D174B] mb-2">{icon}</div>
      <div className="text-2xl sm:text-3xl font-extrabold text-[#1F1924] font-mono leading-none">{value}</div>
      <div className="text-xs font-bold text-[#5A5360] mt-1.5">{label}</div>
      {sub && <div className="text-[11px] text-[#8E8694] mt-0.5">{sub}</div>}
    </button>
  );

  const header = (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-[#1F1924]">
          {section === 'users' ? (fr ? 'Utilisateurs' : 'المستخدمون') : fr ? 'Tableau de bord' : 'لوحة القيادة'}
        </h1>
        <p className="text-[11px] sm:text-xs text-[#6E6773] mt-1 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {data ? `${fr ? 'Chiffres réels de la base · ' : 'أرقام حقيقية · '}${fmtDateTime(data.generated_at, language)}` : fr ? 'Chiffres réels de la base' : 'أرقام حقيقية'}
        </p>
      </div>
      <button
        onClick={load}
        disabled={loading}
        className="shrink-0 p-2.5 rounded-2xl bg-white border border-[#F1E5EC] text-[#8D174B] hover:bg-[#FAF0F5] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        title={fr ? 'Actualiser' : 'تحديث'}
        aria-label={fr ? 'Actualiser' : 'تحديث'}
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );

  if (loading && !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        {header}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} className="h-28 rounded-3xl bg-[#FAF4F7] animate-pulse" />)}
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        {header}
        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-4 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{fr ? `Impossible de lire les chiffres : ${error}` : `تعذرت قراءة الأرقام: ${error}`}</span>
        </div>
      </div>
    );
  }

  const { users, contests, radar, community, prep } = data;
  const roleRows = Object.entries(users.by_role).sort((a, b) => b[1] - a[1]);
  const withoutRole = Math.max(0, users.total - roleRows.reduce((a, [, n]) => a + n, 0));

  const usersBlock = (
    <div className="bg-white rounded-3xl border border-[#F1E5EC] p-4 sm:p-5 shadow-xs">
      <h2 className="text-sm font-extrabold text-[#242126] mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-[#8D174B]" />{fr ? 'Comptes' : 'الحسابات'}</h2>
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        {[
          [users.total, fr ? 'inscrits' : 'مسجلون'],
          [users.new_7d, fr ? 'nouveaux (7 j)' : 'جدد (7 أيام)'],
          [users.active_7d, fr ? 'connectés (7 j)' : 'متصلون (7 أيام)'],
        ].map(([n, l]) => (
          <div key={String(l)} className="rounded-2xl bg-[#FAF7F9] p-2.5">
            <div className="text-xl font-extrabold font-mono text-[#1F1924]">{n}</div>
            <div className="text-[10px] font-semibold text-[#6E6773]">{l}</div>
          </div>
        ))}
      </div>
      <ul className="space-y-1.5 text-xs mb-4">
        {roleRows.map(([role, n]) => (
          <li key={role} className="flex justify-between"><span className="text-[#5A5360]">{ROLE_LABEL[role]?.[language] || role}</span><span className="font-bold font-mono">{n}</span></li>
        ))}
        {withoutRole > 0 && <li className="flex justify-between"><span className="text-[#5A5360]">{fr ? 'Sans rôle' : 'بدون دور'}</span><span className="font-bold font-mono">{withoutRole}</span></li>}
      </ul>
      <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#8D174B] mb-2">{fr ? 'Équipe' : 'الفريق'}</h3>
      <ul className="space-y-1.5">
        {users.staff.map((s) => (
          <li key={s.email} className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-[#242126]">{s.email}</span>
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#FAF0F5] text-[#8D174B] text-[10px] font-bold">{ROLE_LABEL[s.role]?.[language]?.replace(/s$/, '') || s.role}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-[#8E8694] mt-3">{fr ? 'Les rôles se modifient dans Supabase (table user_roles).' : 'تعدل الأدوار في Supabase (جدول user_roles).'}</p>
    </div>
  );

  if (section === 'users') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full animate-fade-in">
        {header}
        {usersBlock}
      </div>
    );
  }

  const todo = [
    radar.pending_review > 0 && { n: radar.pending_review, label: fr ? 'annonces Radar à revoir' : 'إعلانات للمراجعة', go: () => onGo?.('concours_radar') },
    community.reports_open > 0 && { n: community.reports_open, label: fr ? 'signalements ouverts' : 'تبليغات مفتوحة', go: onOpenModeration },
    community.requests_pending > 0 && { n: community.requests_pending, label: fr ? 'demandes d’accès aux salons privés' : 'طلبات الانضمام', go: onOpenModeration },
    community.rooms_proposed > 0 && { n: community.rooms_proposed, label: fr ? 'salons proposés à valider' : 'فضاءات مقترحة', go: onOpenModeration },
    prep.questions_to_verify > 0 && { n: prep.questions_to_verify, label: fr ? 'questions QCM à vérifier (non publiées)' : 'أسئلة للتحقق', go: () => onGo?.('qcm') },
  ].filter(Boolean) as { n: number; label: string; go?: () => void }[];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {header}

      {/* À traiter */}
      <div className="bg-white rounded-3xl border border-[#F1E5EC] p-4 sm:p-5 shadow-xs mb-4 animate-fade-in">
        <h2 className="text-sm font-extrabold text-[#242126] mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#8D174B]" />{fr ? 'À traiter' : 'للمعالجة'}</h2>
        {todo.length === 0 ? (
          <p className="text-xs text-emerald-800">{fr ? 'Rien en attente.' : 'لا شيء في الانتظار.'}</p>
        ) : (
          <ul className="space-y-2">
            {todo.map((t) => (
              <li key={t.label}>
                <button onClick={t.go} className="w-full flex items-center justify-between gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-3.5 py-3 text-xs font-bold text-amber-900 hover:bg-amber-100 active:scale-95 transition-all cursor-pointer">
                  <span><span className="font-mono text-sm me-1.5">{t.n}</span>{t.label}</span>
                  <Go className="w-4 h-4 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Chiffres clés : 2 par ligne sur téléphone */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        {card(0, <Award className="w-5 h-5" />, contests.open, fr ? 'Concours ouverts' : 'مباريات مفتوحة', fr ? `${contests.closing_7d} clôturent sous 7 j · ${contests.public} publiés` : `${contests.closing_7d} تنتهي خلال 7 أيام · ${contests.public} منشورة`, () => onGo?.('gestion_contenus'))}
        {card(1, <Radio className="w-5 h-5" />, radar.pending_review, fr ? 'Annonces Radar à revoir' : 'إعلانات للمراجعة', `${fr ? 'Dernier scan' : 'آخر فحص'} : ${fmtDateTime(radar.last_scraped_at, language)}`, () => onGo?.('concours_radar'), radar.pending_review > 0)}
        {card(2, <Users className="w-5 h-5" />, users.total, fr ? 'Comptes inscrits' : 'حسابات مسجلة', fr ? `${users.new_7d} nouveaux · ${users.active_7d} connectés (7 j)` : `${users.new_7d} جدد · ${users.active_7d} متصلون`, () => onGo?.('utilisateurs'))}
        {card(3, <MessagesSquare className="w-5 h-5" />, community.posts, fr ? 'Discussions' : 'نقاشات', fr ? `${community.comments} réponses · ${community.rooms_active} salon(s)` : `${community.comments} رد · ${community.rooms_active} فضاء`, () => onGo?.('community'))}
        {card(4, <GraduationCap className="w-5 h-5" />, prep.questions_published, fr ? 'Questions QCM publiées' : 'أسئلة منشورة', fr ? `${prep.sets} annales · ${prep.questions_to_verify} à vérifier` : `${prep.sets} نماذج · ${prep.questions_to_verify} للتحقق`, () => onGo?.('qcm'))}
        {card(5, <GraduationCap className="w-5 h-5" />, prep.learners, fr ? 'Candidats qui s’entraînent' : 'مترشحون يتدربون', fr ? `${prep.attempts} QCM terminés (comptes connectés)` : `${prep.attempts} اختبار منجز`)}
        {card(6, <Award className="w-5 h-5" />, contests.archived, fr ? 'Concours archivés' : 'مباريات مؤرشفة', fr ? `Dernière publication : ${fmtDateTime(contests.last_published_at, language)}` : `آخر نشر: ${fmtDateTime(contests.last_published_at, language)}`)}
        {card(7, <ShieldCheck className="w-5 h-5" />, community.reports_open, fr ? 'Signalements ouverts' : 'تبليغات مفتوحة', fr ? `${community.requests_pending} demande(s) d’accès` : `${community.requests_pending} طلب انضمام`, onOpenModeration, community.reports_open > 0)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">{usersBlock}</div>
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#F1E5EC] p-4 sm:p-5 shadow-xs lg:sticky lg:top-4 self-start">
          <h2 className="text-sm font-extrabold text-[#242126] mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-[#8D174B]" />{fr ? 'Pas encore mesuré' : 'غير مقاس بعد'}</h2>
          <ul className="text-xs text-[#5A5360] space-y-2 list-disc ps-4">
            <li>{fr ? 'Visites et pages vues : aucun outil d’analytics n’est installé.' : 'الزيارات: لا توجد أداة إحصاء.'}</li>
            <li>{fr ? 'Journal d’audit des actions admin (cahier §12) : pas encore en place.' : 'سجل العمليات الإدارية: غير متوفر بعد.'}</li>
            <li>{fr ? 'Progression des visiteurs non connectés : gardée sur leur appareil, non comptée ici.' : 'تقدم الزوار غير المسجلين لا يُحتسب هنا.'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
