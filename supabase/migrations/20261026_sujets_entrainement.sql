-- Sujets écrits d'entraînement rédigés par KounKour (kind « entrainement », énoncé sans QCM) :
-- la routine peut leur ajouter un corrigé comme aux sujets réels (clé robot obligatoire).
create or replace function public.annales_set_corrige(p jsonb)
returns table(slug text, ok boolean) language plpgsql security definer set search_path to 'public' as $f$
declare r jsonb;
begin
  if not public.radar_robot_ok() then raise exception 'robot key required'; end if;
  for r in select * from jsonb_array_elements(p) loop
    update qcm_sets s set corrige = r->>'corrige'
     where (s.slug = r->>'slug' or (r->>'slug') = any(s.old_slugs))
       and (s.kind = 'sujet' or (s.kind = 'entrainement' and coalesce(s.statement, '') <> ''));
    slug := r->>'slug'; ok := found; return next;
  end loop;
end $f$;
grant execute on function public.annales_set_corrige(jsonb) to anon, authenticated;
