-- Mesure d'audience sans cookie (cahier des charges §16) : une ligne par page vue.
-- sid = identifiant aléatoire de la session de navigation (sessionStorage, oublié à la
-- fermeture de l'onglet) : il sert à compter les visites, pas à suivre une personne.
-- Aucune adresse IP, aucun compte, aucun texte libre n'est enregistré.
create table if not exists public.site_visits (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  day date not null default (now() at time zone 'Africa/Casablanca')::date,
  sid uuid not null,
  path text not null,
  lang text not null default 'fr',
  source text not null,
  device text not null
);
create index if not exists site_visits_day_idx on public.site_visits (day);
create index if not exists site_visits_at_idx on public.site_visits (at);
create index if not exists site_visits_sid_idx on public.site_visits (sid, at);
alter table public.site_visits enable row level security;
-- Pas de politique : lecture et écriture uniquement via les fonctions ci-dessous.

create or replace function public.track_visit(p_sid uuid, p_path text, p_lang text, p_source text, p_device text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_sid is null or p_path is null or p_path !~ '^/' or length(p_path) > 200 or p_path like '/admin%' then return; end if;
  -- Garde-fou contre l'envoi en boucle : 300 pages par session et par jour au plus.
  if (select count(*) from site_visits where sid = p_sid and at > now() - interval '1 day') >= 300 then return; end if;
  insert into site_visits (sid, path, lang, source, device)
  values (
    p_sid, p_path,
    case when p_lang = 'ar' then 'ar' else 'fr' end,
    case when p_source in ('facebook', 'instagram', 'whatsapp', 'google', 'autre_moteur', 'autre_site', 'direct') then p_source else 'autre_site' end,
    case when p_device in ('mobile', 'ordinateur') then p_device else 'mobile' end
  );
end $$;
revoke all on function public.track_visit(uuid, text, text, text, text) from public;
grant execute on function public.track_visit(uuid, text, text, text, text) to anon, authenticated;

-- Chiffres pour le tableau de bord admin (staff uniquement).
create or replace function public.admin_visits()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  t date := (now() at time zone 'Africa/Casablanca')::date;
  r jsonb;
begin
  if not public.is_staff(auth.uid()) then raise exception 'réservé à l''équipe'; end if;
  with v as (select * from site_visits where day >= t - 29)
  select jsonb_build_object(
    'generated_at', now(),
    'since', (select min(at) from site_visits),
    'live', (select count(distinct sid) from site_visits where at > now() - interval '30 minutes'),
    'today', (select jsonb_build_object('visits', count(distinct sid), 'views', count(*)) from v where day = t),
    'yesterday', (select jsonb_build_object('visits', count(distinct sid), 'views', count(*)) from v where day = t - 1),
    'd7', (select jsonb_build_object('visits', count(distinct sid), 'views', count(*)) from v where day > t - 7),
    'd30', (select jsonb_build_object('visits', count(distinct sid), 'views', count(*)) from v),
    'series', (select jsonb_agg(jsonb_build_object('day', d::date, 'visits', coalesce(x.visits, 0), 'views', coalesce(x.views, 0)) order by d)
               from generate_series(t - 13, t, interval '1 day') g(d)
               left join (select day, count(distinct sid) visits, count(*) views from v group by day) x on x.day = g.d::date),
    'sources_7d', (select coalesce(jsonb_agg(jsonb_build_object('source', source, 'visits', n) order by n desc), '[]')
                   from (select source, count(distinct sid) n from v where day > t - 7 group by source) s),
    'devices_7d', (select coalesce(jsonb_object_agg(device, n), '{}')
                   from (select device, count(distinct sid) n from v where day > t - 7 group by device) s),
    'ar_7d', (select count(distinct sid) from v where day > t - 7 and lang = 'ar'),
    'top_pages_7d', (select coalesce(jsonb_agg(jsonb_build_object('path', p.path, 'views', p.n, 'title', c.title_fr) order by p.n desc), '[]')
                     from (select path, count(*) n from v where day > t - 7 group by path order by count(*) desc limit 10) p
                     left join contests c on p.path like '/concours/%' and c.slug = split_part(p.path, '/', 3))
  ) into r;
  return r;
end $$;
revoke all on function public.admin_visits() from public;
grant execute on function public.admin_visits() to authenticated;
