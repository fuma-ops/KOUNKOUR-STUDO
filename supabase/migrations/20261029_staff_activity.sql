-- Notifications de l'équipe : chaque nouveau message (community_posts) ou commentaire
-- (community_comments) apparaît dans le tableau de bord admin, avec l'auteur, le texte et
-- l'endroit (concours ou salon). « Vu » est mémorisé par membre de l'équipe.

create table if not exists public.staff_notif_seen (
  user_id uuid primary key references auth.users(id) on delete cascade,
  seen_at timestamptz not null default now()
);
alter table public.staff_notif_seen enable row level security;
drop policy if exists staff_notif_seen_own on public.staff_notif_seen;
create policy staff_notif_seen_own on public.staff_notif_seen for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Derniers messages et commentaires (hors ceux de l'appelant), réservé à l'équipe.
create or replace function public.staff_activity(p_limit int default 40)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_seen timestamptz; v_items jsonb; v_unread int;
begin
  if not public.is_staff(auth.uid()) then raise exception 'réservé à l''équipe'; end if;
  select seen_at into v_seen from staff_notif_seen where user_id = auth.uid();
  v_seen := coalesce(v_seen, now() - interval '7 days');
  with acts as (
    select 'post'::text kind, p.id, p.id post_id, p.created_at, p.author_id, p.title, p.content, p.room_id
      from community_posts p where p.author_id is distinct from auth.uid()
    union all
    select 'comment', c.id, c.post_id, c.created_at, c.author_id, p.title, c.content, p.room_id
      from community_comments c join community_posts p on p.id = c.post_id where c.author_id is distinct from auth.uid()
  ), last as (select * from acts order by created_at desc limit greatest(1, least(p_limit, 100)))
  select coalesce(jsonb_agg(jsonb_build_object(
      'kind', a.kind, 'id', a.id, 'post_id', a.post_id, 'created_at', a.created_at,
      'author', coalesce(pr.pseudo, 'Membre'), 'title', a.title, 'content', left(a.content, 500),
      'room_id', a.room_id, 'room', r.name_fr, 'contest_id', r.contest_id, 'contest_slug', ct.slug,
      'contest_title', coalesce(ct.title_fr, ct.title_original), 'unread', a.created_at > v_seen
    ) order by a.created_at desc), '[]'::jsonb)
    into v_items
    from last a
    left join community_profiles pr on pr.user_id = a.author_id
    left join community_rooms r on r.id = a.room_id
    left join contests ct on ct.id = r.contest_id;
  select count(*) into v_unread from (
    select created_at from community_posts where author_id is distinct from auth.uid() and created_at > v_seen
    union all
    select created_at from community_comments where author_id is distinct from auth.uid() and created_at > v_seen
  ) u;
  return jsonb_build_object('seen_at', v_seen, 'unread', v_unread, 'items', v_items);
end $$;

create or replace function public.staff_mark_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'réservé à l''équipe'; end if;
  insert into staff_notif_seen(user_id, seen_at) values (auth.uid(), now())
    on conflict (user_id) do update set seen_at = excluded.seen_at;
end $$;

revoke all on function public.staff_activity(int) from public, anon;
revoke all on function public.staff_mark_seen() from public, anon;
grant execute on function public.staff_activity(int) to authenticated;
grant execute on function public.staff_mark_seen() to authenticated;
