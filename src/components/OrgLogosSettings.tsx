import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CheckCircle2, Landmark, Loader2, Search, Trash2 } from 'lucide-react';
import { OrgLogoRow, fetchOrgLogos, setOrgLogo } from '../data/orgLogosApi';
import { OrgLogo } from './OrgLogo';

// Équipe : logo officiel de chaque organisme (repris de sa page emploi-public).
// Les organismes sans logo affichent un emblème neutre — jamais le logo d'un autre.
// Ici on peut poser, remplacer ou retirer un logo à la main.

const Row: React.FC<{ org: OrgLogoRow; i: number; onChange: (url: string | null) => void }> = ({ org, i, onChange }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const act = async (file: File | null, ok: string) => {
    setBusy(true);
    setMsg(null);
    try {
      onChange(await setOrgLogo(org.id, file));
      setMsg(ok);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Action impossible.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <li
      className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#F1E5EC] hover:shadow-md transition-shadow animate-fade-in"
      style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
    >
      <div className="w-28 h-14 shrink-0 rounded-xl bg-[#FAF7F9] border border-[#F1E5EC] flex items-center justify-center overflow-hidden p-1">
        <OrgLogo src={org.logoUrl} name={org.name} size="sm" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-bold text-[#242126] leading-snug line-clamp-2">{org.name}</p>
        <p className="text-[11px] text-[#6E6773]">
          {org.openContests > 0 ? `${org.openContests} concours ouvert${org.openContests > 1 ? 's' : ''} • ` : ''}
          {org.totalContests} au total
          {msg && <span className="ms-2 font-bold text-[#8D174B]">{msg}</span>}
        </p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#8D174B] text-white text-[11px] font-extrabold active:scale-95 transition cursor-pointer disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{org.logoUrl ? 'Remplacer' : 'Ajouter'}</span>
        </button>
        {org.logoUrl && (
          <button
            type="button"
            title="Retirer le logo"
            disabled={busy}
            onClick={() => window.confirm(`Retirer le logo de « ${org.name} » ?`) && act(null, 'Logo retiré.')}
            className="p-1.5 rounded-lg border border-red-200 text-red-700 active:scale-95 transition cursor-pointer disabled:opacity-60"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) act(f, 'Logo enregistré.');
        }}
      />
    </li>
  );
};

export const OrgLogosSettings: React.FC = () => {
  const [orgs, setOrgs] = useState<OrgLogoRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [onlyMissing, setOnlyMissing] = useState(true);

  useEffect(() => {
    fetchOrgLogos().then(setOrgs).catch((e) => setErr(e instanceof Error ? e.message : 'Chargement impossible.'));
  }, []);

  const stats = useMemo(() => {
    const open = (orgs || []).filter((o) => o.openContests > 0);
    return { open: open.length, openWith: open.filter((o) => o.logoUrl).length, all: orgs?.length || 0, allWith: (orgs || []).filter((o) => o.logoUrl).length };
  }, [orgs]);

  const list = useMemo(() => {
    const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const nq = norm(q.trim());
    return (orgs || [])
      .filter((o) => (!onlyMissing || !o.logoUrl) && (!nq || norm(o.name).includes(nq)))
      .sort((a, b) => b.openContests - a.openContests || a.name.localeCompare(b.name, 'fr'));
  }, [orgs, q, onlyMissing]);

  if (err) return <p className="text-sm text-red-700 font-bold">{err}</p>;
  if (!orgs)
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-[#F6EEF2] animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-[#F1E5EC] p-4 animate-scale-in">
          <p className="text-[11px] font-bold text-[#6E6773] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Organismes avec concours ouverts
          </p>
          <p className="text-2xl font-extrabold text-[#242126]">
            {stats.openWith}
            <span className="text-sm text-[#6E6773]"> / {stats.open} avec logo</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-[#F1E5EC] p-4 animate-scale-in" style={{ animationDelay: '80ms' }}>
          <p className="text-[11px] font-bold text-[#6E6773] flex items-center gap-1">
            <Landmark className="w-3.5 h-3.5 text-[#8D174B]" /> Tous les organismes
          </p>
          <p className="text-2xl font-extrabold text-[#242126]">
            {stats.allWith}
            <span className="text-sm text-[#6E6773]"> / {stats.all} avec logo</span>
          </p>
        </div>
      </div>

      <p className="text-[11px] text-[#6E6773] bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl p-3">
        Le logo affiché sur les concours est celui de la page officielle de l’organisme (emploi-public). Sans logo connu, un emblème neutre
        s’affiche — jamais le logo d’un autre organisme. Utilisez une image officielle (PNG transparent de préférence).
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#F1E5EC]">
          <Search className="w-4 h-4 text-[#8D174B]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un organisme…" className="flex-1 text-sm outline-none bg-transparent" />
        </label>
        <div className="flex gap-1 p-1 rounded-xl bg-[#F6EEF2] text-xs font-bold">
          {[
            [true, 'Sans logo'],
            [false, 'Tous'],
          ].map(([v, l]) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => setOnlyMissing(v as boolean)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer active:scale-95 ${onlyMissing === v ? 'bg-white text-[#8D174B] shadow-sm' : 'text-[#6E6773]'}`}
            >
              {l as string}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-[#6E6773] text-center py-8">{onlyMissing ? 'Tous les organismes ont un logo.' : 'Aucun organisme trouvé.'}</p>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {list.map((o, i) => (
            <Row key={o.id} org={o} i={i} onChange={(url) => setOrgs((all) => all!.map((x) => (x.id === o.id ? { ...x, logoUrl: url } : x)))} />
          ))}
        </ul>
      )}
    </div>
  );
};
