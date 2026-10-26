-- Reconstruction du 26/10/2026 : fin du rejeu, fonction temporaire supprimée.
drop function if exists public.tmp_rebuild_exec(text, text);

-- Préparation automatique : la routine du matin crée des dossiers pour les métiers sans
-- annales ; match_terms relie le dossier aux concours (src/utils/prepMatch.ts).
alter table public.qcm_folders add column if not exists match_terms text[] not null default '{}';
grant select (match_terms) on public.qcm_folders to anon, authenticated;

create or replace function public.prep_folder_upsert(p jsonb)
returns text language plpgsql security definer set search_path = public as $$
-- p = {slug, title_fr, title_ar, organization, description_fr, description_ar, position, match_terms[]}
begin
  if not public.radar_robot_ok() then raise exception 'robot key required'; end if;
  if coalesce(p->>'slug', '') !~ '^[a-z0-9-]{5,80}$' or coalesce(p->>'title_fr', '') = '' then raise exception 'slug ou titre invalide'; end if;
  insert into qcm_folders (slug, title_fr, title_ar, organization, description_fr, description_ar, position, status, match_terms)
  values (p->>'slug', p->>'title_fr', p->>'title_ar', p->>'organization', p->>'description_fr', p->>'description_ar',
          coalesce((p->>'position')::int, 500), 'published',
          coalesce(array(select jsonb_array_elements_text(p->'match_terms')), '{}'))
  on conflict (slug) do update set
    match_terms = (select array(select distinct unnest(qcm_folders.match_terms || excluded.match_terms))),
    title_fr = excluded.title_fr, title_ar = coalesce(excluded.title_ar, qcm_folders.title_ar),
    organization = coalesce(excluded.organization, qcm_folders.organization),
    description_fr = coalesce(excluded.description_fr, qcm_folders.description_fr),
    description_ar = coalesce(excluded.description_ar, qcm_folders.description_ar);
  return p->>'slug';
end $$;
revoke all on function public.prep_folder_upsert(jsonb) from public, authenticated;
grant execute on function public.prep_folder_upsert(jsonb) to anon;
