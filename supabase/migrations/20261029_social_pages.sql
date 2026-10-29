-- Pages Facebook supplémentaires (Bloomzein, حين تعرف الله…) et leur compte Instagram relié.
-- Jetons illisibles avec la clé publique (RLS sans politique), lus seulement avec la clé robot.
-- Appliquée le 29/10/2026.
create table if not exists public.social_pages (
  slug text primary key,
  name text,
  fb_page_id text not null,
  fb_page_token text not null,
  ig_user_id text,
  ig_username text,
  updated_at timestamptz not null default now()
);
alter table public.social_pages enable row level security;

create or replace function public.social_page_set(p_slug text, p_name text, p_page_id text, p_token text, p_ig_user_id text default null, p_ig_username text default null)
returns boolean language plpgsql security definer set search_path to '' as $$
begin
  if not public.radar_robot_ok() then raise exception 'robot key required'; end if;
  insert into public.social_pages(slug, name, fb_page_id, fb_page_token, ig_user_id, ig_username, updated_at)
  values (p_slug, p_name, p_page_id, p_token, p_ig_user_id, p_ig_username, now())
  on conflict (slug) do update set name = excluded.name, fb_page_id = excluded.fb_page_id, fb_page_token = excluded.fb_page_token,
    ig_user_id = excluded.ig_user_id, ig_username = excluded.ig_username, updated_at = now();
  return true;
end $$;

create or replace function public.social_page_secret(p_slug text)
returns jsonb language plpgsql stable security definer set search_path to '' as $$
begin
  if not public.radar_robot_ok() then raise exception 'robot key required'; end if;
  return (select jsonb_build_object('slug', slug, 'name', name, 'page_id', fb_page_id, 'token', fb_page_token, 'ig_user_id', ig_user_id, 'ig_username', ig_username)
          from public.social_pages where slug = p_slug);
end $$;

revoke all on function public.social_page_set(text, text, text, text, text, text) from public, authenticated;
revoke all on function public.social_page_secret(text) from public, authenticated;
grant execute on function public.social_page_set(text, text, text, text, text, text) to anon;
grant execute on function public.social_page_secret(text) to anon;
