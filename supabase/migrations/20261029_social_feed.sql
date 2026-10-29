-- Posts publiés sur un réseau depuis une date (clé robot) : sert à reprendre sur Instagram
-- ce qui est parti sur Facebook (même image, même texte adapté). Appliquée le 29/10/2026.
create or replace function public.social_feed(p_since timestamptz, p_network text default 'facebook')
returns jsonb language plpgsql stable security definer set search_path to '' as $$
begin
  if not public.radar_robot_ok() then raise exception 'robot key required'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('post_id', post_id, 'kind', kind, 'keys', keys, 'posted_at', posted_at) order by posted_at)
    from (
      select post_id, kind, jsonb_agg(contest_id) keys, min(posted_at) posted_at
      from public.social_posts where network = p_network and posted_at >= p_since and post_id is not null
      group by post_id, kind
    ) t
  ), '[]'::jsonb);
end $$;
revoke all on function public.social_feed(timestamptz, text) from public, authenticated;
grant execute on function public.social_feed(timestamptz, text) to anon;
