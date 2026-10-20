import React, { useCallback, useEffect, useState } from 'react';
import { Language } from '../types';
import { getSupabase } from '../lib/supabase';
import { Eye, RefreshCw, Smartphone, Monitor, ExternalLink } from 'lucide-react';

// Audience du site (RPC admin_visits, staff uniquement) : chiffres comptés par
// src/lib/visits.ts, sans cookie. Une visite = une session de navigation.

interface Pair { visits: number; views: number }
interface VisitsData {
  generated_at: string;
  since: string | null;
  live: number;
  today: Pair;
  yesterday: Pair;
  d7: Pair;
  d30: Pair;
  series: { day: string; visits: number; views: number }[];
  sources_7d: { source: string; visits: number }[];
  devices_7d: Record<string, number>;
  ar_7d: number;
  top_pages_7d: { path: string; views: number; title: string | null }[];
}

const SOURCE: Record<string, { fr: string; ar: string }> = {
  facebook: { fr: 'Facebook', ar: 'فيسبوك' },
  instagram: { fr: 'Instagram', ar: 'إنستغرام' },
  whatsapp: { fr: 'WhatsApp', ar: 'واتساب' },
  google: { fr: 'Google', ar: 'غوغل' },
  autre_moteur: { fr: 'Autres moteurs de recherche', ar: 'محركات بحث أخرى' },
  autre_site: { fr: 'Autres sites', ar: 'مواقع أخرى' },
  direct: { fr: 'Accès direct (lien tapé, favori, appli)', ar: 'دخول مباشر' },
};

function pageLabel(p: { path: string; title: string | null }, fr: boolean): string {
  if (p.title) return p.title;
  if (p.path === '/') return fr ? 'Accueil' : 'الرئيسية';
  if (p.path === '/concours') return fr ? 'Liste des concours' : 'لائحة المباريات';
  if (p.path === '/preparation') return fr ? 'Préparation' : 'التحضير';
  if (p.path.startsWith('/preparation/qcm/')) return `QCM · ${decodeURIComponent(p.path.slice(17))}`;
  if (p.path.startsWith('/preparation/')) return `${fr ? 'Dossier' : 'ملف'} · ${decodeURIComponent(p.path.slice(13))}`;
  if (p.path === '/communaute') return fr ? 'Communauté' : 'المجتمع';
  if (p.path === '/profil') return fr ? 'Profil' : 'الملف';
  return p.path;
}

export const AdminVisits: React.FC<{ language: Language }> = ({ language }) => {
  const fr = language === 'fr';
  const [data, setData] = useState<VisitsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const sb = getSupabase();
    const { data: d, error: e } = sb ? await sb.rpc('admin_visits') : { data: null, error: { message: 'Supabase' } };
    if (e || !d || typeof d !== 'object' || !('today' in (d as object))) setError(e?.message || (fr ? 'Réponse inattendue.' : 'استجابة غير متوقعة.'));
    else {
      setError(null);
      setData(d as VisitsData);
    }
    setLoading(false);
  }, [fr]);

  useEffect(() => {
    load();
    // « En ce moment » reste à jour quand le tableau de bord reste ouvert.
    const t = window.setInterval(load, 60_000);
    return () => window.clearInterval(t);
  }, [load]);

  const shell = (body: React.ReactNode) => (
    <div className="bg-white rounded-3xl border border-[#F1E5EC] p-4 sm:p-5 shadow-xs mb-4 animate-fade-in">
      <h2 className="text-sm font-extrabold text-[#242126] mb-3 flex items-center gap-2">
        <Eye className="w-4 h-4 text-[#8D174B]" />
        {fr ? 'Visites du site' : 'زيارات الموقع'}
        <button
          onClick={load}
          disabled={loading}
          className="ms-auto p-1.5 rounded-xl text-[#8D174B] hover:bg-[#FAF0F5] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          aria-label={fr ? 'Actualiser' : 'تحديث'}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </h2>
      {body}
    </div>
  );

  if (!data)
    return shell(
      error ? (
        <p className="text-xs text-rose-800">{fr ? `Impossible de lire les visites : ${error}` : `تعذرت قراءة الزيارات: ${error}`}</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-[#FAF4F7] animate-pulse" />)}</div>
      )
    );

  const max = Math.max(1, ...data.series.map((s) => s.visits));
  const srcTotal = Math.max(1, data.sources_7d.reduce((a, s) => a + s.visits, 0));
  const mobile = data.devices_7d.mobile || 0;
  const desktop = data.devices_7d.ordinateur || 0;
  const devTotal = Math.max(1, mobile + desktop);
  const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(fr ? 'fr-FR' : 'ar-MA', { day: 'numeric', month: 'short' });

  const tile = (i: number, value: React.ReactNode, label: string, sub: string, live = false) => (
    <div
      key={label}
      className={`rounded-2xl p-3 animate-fade-in ${live ? 'bg-emerald-50 border border-emerald-200' : 'bg-[#FAF7F9]'}`}
      style={{ animationDelay: `${i * 80}ms` }}
    >
      <div className="text-2xl font-extrabold font-mono text-[#1F1924] leading-none flex items-center gap-1.5">
        {live && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
        {value}
      </div>
      <div className="text-[11px] font-bold text-[#5A5360] mt-1">{label}</div>
      <div className="text-[10px] text-[#8E8694]">{sub}</div>
    </div>
  );

  return shell(
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {tile(0, data.live, fr ? 'En ce moment' : 'الآن', fr ? 'visiteurs (30 dernières min)' : 'زوار (آخر 30 دقيقة)', true)}
        {tile(1, data.today.visits, fr ? "Visites aujourd'hui" : 'زيارات اليوم', fr ? `${data.today.views} pages vues · hier ${data.yesterday.visits}` : `${data.today.views} صفحة · أمس ${data.yesterday.visits}`)}
        {tile(2, data.d7.visits, fr ? 'Visites (7 jours)' : 'زيارات (7 أيام)', fr ? `${data.d7.views} pages vues` : `${data.d7.views} صفحة`)}
        {tile(3, data.d30.visits, fr ? 'Visites (30 jours)' : 'زيارات (30 يوماً)', fr ? `${data.d30.views} pages vues` : `${data.d30.views} صفحة`)}
      </div>

      {data.d30.views === 0 ? (
        <p className="text-xs text-[#6E6773] rounded-2xl bg-[#FAF7F9] p-3">
          {fr
            ? 'Le comptage est actif : les chiffres apparaîtront dès les premières visites. Les visites antérieures ne peuvent pas être récupérées.'
            : 'العد مفعل: ستظهر الأرقام مع أولى الزيارات.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#8D174B] mb-2">{fr ? 'Visites par jour (14 jours)' : 'الزيارات اليومية'}</h3>
            <div className="flex items-end gap-1 h-28" dir="ltr">
              {data.series.map((s, i) => (
                <div key={s.day} className="flex-1 flex flex-col items-center justify-end h-full group" title={`${fmtDay(s.day)} : ${s.visits} ${fr ? 'visites' : 'زيارة'}, ${s.views} ${fr ? 'pages' : 'صفحة'}`}>
                  <span className="text-[9px] font-bold text-[#5A5360] opacity-0 group-hover:opacity-100 transition-opacity">{s.visits}</span>
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${i === data.series.length - 1 ? 'bg-[#8D174B]' : 'bg-[#E8C9D8] group-hover:bg-[#C77FA2]'}`}
                    style={{ height: `${Math.max(3, (s.visits / max) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-[#8E8694] mt-1" dir="ltr">
              <span>{fmtDay(data.series[0].day)}</span>
              <span>{fr ? "aujourd'hui" : 'اليوم'}</span>
            </div>

            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#8D174B] mt-4 mb-2">{fr ? 'Pages les plus vues (7 jours)' : 'الصفحات الأكثر زيارة'}</h3>
            <ul className="space-y-1.5">
              {data.top_pages_7d.map((p) => (
                <li key={p.path} className="flex items-center justify-between gap-2 text-xs">
                  <a href={p.path} target="_blank" rel="noopener noreferrer" className="truncate text-[#242126] hover:text-[#8D174B] inline-flex items-center gap-1">
                    {pageLabel(p, fr)}
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                  </a>
                  <span className="shrink-0 font-bold font-mono">{p.views}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#8D174B] mb-2">{fr ? 'Provenance des visites (7 jours)' : 'مصدر الزيارات'}</h3>
            <ul className="space-y-2 mb-4">
              {data.sources_7d.map((s) => (
                <li key={s.source} className="text-xs">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[#5A5360]">{SOURCE[s.source]?.[language] || s.source}</span>
                    <span className="font-bold font-mono">{s.visits} · {Math.round((s.visits / srcTotal) * 100)} %</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F4EEF2] overflow-hidden">
                    <div className="h-full rounded-full bg-[#8D174B] transition-all duration-500" style={{ width: `${(s.visits / srcTotal) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#8D174B] mb-2">{fr ? 'Appareils (7 jours)' : 'الأجهزة'}</h3>
            <div className="flex gap-2 text-xs mb-2">
              <span className="flex-1 rounded-xl bg-[#FAF7F9] px-2.5 py-2 flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-[#8D174B]" />{fr ? 'Téléphone' : 'هاتف'} <b className="ms-auto font-mono">{Math.round((mobile / devTotal) * 100)} %</b></span>
              <span className="flex-1 rounded-xl bg-[#FAF7F9] px-2.5 py-2 flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5 text-[#8D174B]" />{fr ? 'Ordinateur' : 'حاسوب'} <b className="ms-auto font-mono">{Math.round((desktop / devTotal) * 100)} %</b></span>
            </div>
            <p className="text-[11px] text-[#8E8694]">{fr ? `${data.ar_7d} visite(s) en arabe sur 7 jours.` : `${data.ar_7d} زيارة بالعربية خلال 7 أيام.`}</p>
          </div>
        </div>
      )}

      <p className="text-[10px] text-[#8E8694] mt-3">
        {fr
          ? "Une visite = une session de navigation (sans cookie). Cet appareil n'est pas compté, comme tout appareil qui ouvre l'espace admin. Robots exclus."
          : 'زيارة = جلسة تصفح (بدون كوكيز). هذا الجهاز غير محتسب.'}
      </p>
    </>
  );
};
