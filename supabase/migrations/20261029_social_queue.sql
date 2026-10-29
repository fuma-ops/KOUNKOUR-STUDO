-- File de publication des pages supplémentaires : Facebook est programmé directement chez Meta ;
-- Instagram (pas de programmation par l'API) est publié par la tâche planifiée quand l'heure arrive,
-- en reprenant le fichier déjà envoyé à Facebook. Lecture et écriture avec la clé robot seulement.
-- Appliquée le 29/10/2026.
create table if not exists public.social_queue (
  id bigserial primary key,
  page text not null,
  network text not null,
  item text not null,
  kind text not null,
  publish_at timestamptz not null,
  caption text not null,
  fb_post_id text,
  post_id text,
  status text not null default 'pending',
  error text,
  created_at timestamptz not null default now(),
  unique (page, network, item)
);
alter table public.social_queue enable row level security;

create or replace function public.social_queue_put(p jsonb)
returns boolean language plpgsql security definer set search_path to '' as $$
begin
  if not public.radar_robot_ok() then raise exception 'robot key required'; end if;
  insert into public.social_queue(page, network, item, kind, publish_at, caption, fb_post_id, post_id, status)
  values (p->>'page', p->>'network', p->>'item', p->>'kind', (p->>'publish_at')::timestamptz, p->>'caption', p->>'fb_post_id', p->>'post_id', coalesce(p->>'status', 'pending'))
  on conflict (page, network, item) do update set kind = excluded.kind, publish_at = excluded.publish_at, caption = excluded.caption,
    fb_post_id = coalesce(excluded.fb_post_id, public.social_queue.fb_post_id), post_id = coalesce(excluded.post_id, public.social_queue.post_id), status = excluded.status;
  return true;
end $$;

create or replace function public.social_queue_list(p_page text, p_network text)
returns jsonb language plpgsql stable security definer set search_path to '' as $$
begin
  if not public.radar_robot_ok() then raise exception 'robot key required'; end if;
  return coalesce((select jsonb_agg(to_jsonb(q) order by publish_at) from public.social_queue q where page = p_page and network = p_network), '[]'::jsonb);
end $$;

create or replace function public.social_queue_mark(p_id bigint, p_status text, p_post text default null, p_error text default null)
returns boolean language plpgsql security definer set search_path to '' as $$
begin
  if not public.radar_robot_ok() then raise exception 'robot key required'; end if;
  update public.social_queue set status = p_status, post_id = coalesce(p_post, post_id), error = p_error where id = p_id;
  return found;
end $$;

revoke all on function public.social_queue_put(jsonb) from public, authenticated;
revoke all on function public.social_queue_list(text, text) from public, authenticated;
revoke all on function public.social_queue_mark(bigint, text, text, text) from public, authenticated;
grant execute on function public.social_queue_put(jsonb) to anon;
grant execute on function public.social_queue_list(text, text) to anon;
grant execute on function public.social_queue_mark(bigint, text, text, text) to anon;
