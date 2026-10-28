-- Alertes sans compte (28/10/2026) : un visiteur peut, en un clic et sans s'inscrire,
-- recevoir les notifications d'un concours (convocations, résultats, date limite proche)
-- et/ou les nouveaux concours du jour. L'abonnement push (endpoint secret propre à
-- l'appareil) sert d'identifiant ; il est rattaché au compte si le visiteur se connecte.

alter table public.push_subscriptions alter column user_id drop not null;
alter table public.push_subscriptions add column if not exists follows uuid[] not null default '{}';
alter table public.push_subscriptions add column if not exists new_contests boolean not null default false;
alter table public.push_subscriptions add column if not exists lang text not null default 'fr';
alter table public.push_subscriptions add column if not exists last_digest_at timestamptz;

-- Journal des envois aux abonnements (avec ou sans compte) : jamais deux fois la même alerte.
create table if not exists public.push_follow_log (
  endpoint text not null references public.push_subscriptions(endpoint) on delete cascade,
  contest_id uuid not null,
  kind text not null,
  sent_at timestamptz not null default now(),
  primary key (endpoint, contest_id, kind)
);
alter table public.push_follow_log enable row level security;

-- Abonne cet appareil et suit un concours et/ou les nouveaux concours (visiteur ou compte).
create or replace function public.push_follow(
  p_endpoint text, p_p256dh text, p_auth text, p_ua text default null,
  p_contest uuid default null, p_new boolean default null, p_lang text default 'fr'
) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare r public.push_subscriptions;
begin
  if p_endpoint is null or p_endpoint !~ '^https://' or length(p_endpoint) > 1000 then raise exception 'invalid endpoint'; end if;
  if coalesce(p_p256dh,'') = '' or coalesce(p_auth,'') = '' then raise exception 'invalid keys'; end if;
  if p_contest is not null and not exists (select 1 from public.contests c where c.id = p_contest) then raise exception 'unknown contest'; end if;
  insert into public.push_subscriptions(endpoint, user_id, p256dh, auth, user_agent, follows, new_contests, lang)
  values (p_endpoint, auth.uid(), p_p256dh, p_auth, left(p_ua, 300),
          case when p_contest is null then '{}' else array[p_contest] end, coalesce(p_new, false),
          case when p_lang = 'ar' then 'ar' else 'fr' end)
  on conflict (endpoint) do update set
    user_id = coalesce(auth.uid(), public.push_subscriptions.user_id),
    p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent, gone_at = null,
    follows = case when p_contest is null or p_contest = any(public.push_subscriptions.follows) then public.push_subscriptions.follows
                   else (public.push_subscriptions.follows || p_contest)[greatest(1, cardinality(public.push_subscriptions.follows) - 98):] end,
    new_contests = coalesce(p_new, public.push_subscriptions.new_contests),
    lang = excluded.lang
  returning * into r;
  return jsonb_build_object('follows', to_jsonb(r.follows), 'new_contests', r.new_contests);
end $$;

-- Ne plus suivre un concours / ne plus recevoir les nouveaux concours (connaître l'endpoint suffit).
create or replace function public.push_unfollow(p_endpoint text, p_contest uuid default null, p_new boolean default null)
returns jsonb
language plpgsql security definer set search_path to '' as $$
declare r public.push_subscriptions;
begin
  update public.push_subscriptions set
    follows = case when p_contest is null then follows else array_remove(follows, p_contest) end,
    new_contests = case when p_new is false then false else new_contests end
  where endpoint = p_endpoint returning * into r;
  if r.endpoint is null then return null; end if;
  return jsonb_build_object('follows', to_jsonb(r.follows), 'new_contests', r.new_contests);
end $$;

-- État de cet appareil (pour afficher « Alertes activées »).
create or replace function public.push_status(p_endpoint text)
returns jsonb
language sql stable security definer set search_path to '' as $$
  select jsonb_build_object('follows', to_jsonb(s.follows), 'new_contests', s.new_contests)
  from public.push_subscriptions s where s.endpoint = p_endpoint and s.gone_at is null;
$$;

grant execute on function public.push_follow(text, text, text, text, uuid, boolean, text) to anon, authenticated;
grant execute on function public.push_unfollow(text, uuid, boolean) to anon, authenticated;
grant execute on function public.push_status(text) to anon, authenticated;

-- Robot : appareils qui suivent ces concours (listes de convoqués / résultats).
create or replace function public.push_follow_targets(p_contest_ids uuid[])
returns jsonb
language plpgsql stable security definer set search_path to '' as $$
begin
  if not public.radar_robot_ok() then raise exception 'robot key required'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth, 'lang', s.lang, 'contest_id', f.cid,
      'sent', coalesce((select jsonb_agg(l.kind) from public.push_follow_log l where l.endpoint = s.endpoint and l.contest_id = f.cid), '[]'::jsonb)))
    from public.push_subscriptions s cross join lateral unnest(s.follows) as f(cid)
    where s.gone_at is null and f.cid = any(p_contest_ids)
      -- déjà prévenus par le suivi du compte (favori) : pas de doublon
      and not exists (select 1 from public.contest_bookmarks b where b.user_id = s.user_id and b.contest_id = f.cid)
  ), '[]'::jsonb);
end $$;

-- Robot : alertes quotidiennes des abonnements (rappel date limite des concours suivis, nouveaux concours).
create or replace function public.push_follow_due()
returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare today date := (now() at time zone 'Africa/Casablanca')::date;
begin
  if not public.radar_robot_ok() then raise exception 'robot key required'; end if;
  return jsonb_build_object(
    'today', today,
    'subs', coalesce((select jsonb_agg(jsonb_build_object(
        'endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth, 'lang', s.lang, 'new_contests', s.new_contests,
        'since', coalesce(s.last_digest_at, s.created_at),
        'follows', to_jsonb(s.follows),
        'sent', coalesce((select jsonb_agg(jsonb_build_array(l.contest_id, l.kind)) from public.push_follow_log l where l.endpoint = s.endpoint), '[]'::jsonb)))
      from public.push_subscriptions s
      where s.gone_at is null and (s.new_contests or cardinality(s.follows) > 0)
        -- les comptes avec alertes Smart Match reçoivent déjà le tri par profil
        and not exists (select 1 from public.smart_match_preferences p where p.user_id = s.user_id and p.push_alerts)), '[]'::jsonb),
    'contests', coalesce((select jsonb_agg(jsonb_build_object(
        'id', c.id, 'slug', c.slug, 'title_fr', c.title_fr, 'title_ar', c.title_ar, 'deadline_date', c.deadline_date,
        'published_at', coalesce(c.published_at, c.updated_at), 'positions', c.positions))
      from public.contests c where c.status in ('publie','mis_a_jour') and c.deadline_date >= today), '[]'::jsonb));
end $$;

create or replace function public.push_follow_record(p jsonb, p_digest text[] default '{}')
returns integer
language plpgsql security definer set search_path to '' as $$
declare n integer;
begin
  if not public.radar_robot_ok() then raise exception 'robot key required'; end if;
  insert into public.push_follow_log(endpoint, contest_id, kind)
  select x->>'endpoint', (x->>'contest_id')::uuid, x->>'kind' from jsonb_array_elements(p) x
  where exists (select 1 from public.push_subscriptions s where s.endpoint = x->>'endpoint')
  on conflict do nothing;
  get diagnostics n = row_count;
  update public.push_subscriptions set last_digest_at = now() where endpoint = any(coalesce(p_digest, '{}'));
  return n;
end $$;
