-- Publication automatique sur la page Facebook KounKour (28/10/2026).
-- Le jeton de page est rangé ici (RLS sans politique : illisible avec la clé publique),
-- lu uniquement par les fonctions serveur avec la clé robot (social_secret).
create table if not exists public.social_config (
  id integer primary key default 1 check (id = 1),
  fb_page_id text,
  fb_page_token text,
  updated_at timestamptz not null default now()
);
alter table public.social_config enable row level security;

-- Journal : un concours n'est jamais publié deux fois pour le même type de post.
create table if not exists public.social_posts (
  contest_id uuid not null,
  kind text not null,
  network text not null default 'facebook',
  post_id text,
  posted_at timestamptz not null default now(),
  primary key (contest_id, kind, network)
);
alter table public.social_posts enable row level security;

create or replace function public.social_secret()
returns jsonb language plpgsql stable security definer set search_path to '' as $$
begin
  if not public.radar_robot_ok() then raise exception 'robot key required'; end if;
  return (select jsonb_build_object('page_id', fb_page_id, 'token', fb_page_token) from public.social_config where id = 1);
end $$;

create or replace function public.social_record(p_contest uuid, p_kind text, p_post text, p_network text default 'facebook')
returns boolean language plpgsql security definer set search_path to '' as $$
begin
  if not public.radar_robot_ok() then raise exception 'robot key required'; end if;
  insert into public.social_posts(contest_id, kind, network, post_id) values (p_contest, p_kind, p_network, p_post) on conflict do nothing;
  return found;
end $$;

create or replace function public.social_posted(p_kind text, p_network text default 'facebook')
returns jsonb language plpgsql stable security definer set search_path to '' as $$
begin
  if not public.radar_robot_ok() then raise exception 'robot key required'; end if;
  return coalesce((select jsonb_agg(contest_id) from public.social_posts where kind = p_kind and network = p_network), '[]'::jsonb);
end $$;
