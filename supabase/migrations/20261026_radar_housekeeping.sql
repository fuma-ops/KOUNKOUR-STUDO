-- Entretien quotidien automatique (appliqué le 26/10/2026 sur kounkour-v2) :
-- clôtures, annonces expirées, rejet des « À traiter » sans source après 7 jours,
-- purge des fichiers d'arrêtés, rétention des visites ; suivi des étapes le matin.
-- Leçon du 22/10/2026 : l'ancienne base a saturé son disque (1 Go de copies d'arrêtés).
create or replace function public.radar_housekeeping()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  t date := (now() at time zone 'Africa/Casablanca')::date;
  n_close int; n_reject int; n_stale int; n_purge int; n_visits int;
begin
  update contests set status = 'cloture', updated_at = now()
  where status in ('publie', 'mis_a_jour') and deadline_date < t;
  get diagnostics n_close = row_count;

  update radar_candidates set analysis_status = 'rejete', analyzed_at = now(),
    analysis = coalesce(analysis, '{}'::jsonb) || jsonb_build_object('raison',
      'Annonce déjà expirée à son arrivée (date limite ' || to_char(deadline_date, 'DD/MM/YYYY') || ')')
  where analysis_status in ('a_analyser', 'nouveau', 'erreur') and deadline_date < t;
  get diagnostics n_reject = row_count;

  update radar_candidates set analysis_status = 'rejete', analyzed_at = now(),
    analysis = coalesce(analysis, '{}'::jsonb) || jsonb_build_object('raison',
      'Rejet automatique : aucune source officielle jointe après 7 jours')
  where analysis_status = 'a_verifier' and coalesce(analyzed_at, updated_at, created_at) < now() - interval '7 days';
  get diagnostics n_stale = row_count;

  with d as (
    select d.id from radar_documents d join radar_candidates c on c.id = d.candidate_id
    where c.analysis_status in ('publie', 'rejete') and (d.content_b64 is not null or d.raw_html is not null)
    limit 500
  )
  update radar_documents r set content_b64 = null, raw_html = null from d where r.id = d.id;
  get diagnostics n_purge = row_count;

  delete from site_visits where at < now() - interval '400 days';
  get diagnostics n_visits = row_count;

  return jsonb_build_object('clotures', n_close, 'rejetes_expires', n_reject, 'rejetes_sans_source', n_stale,
    'documents_purges', n_purge, 'visites_effacees', n_visits, 'base_mo', pg_database_size(current_database()) / 1048576);
end $$;
revoke all on function public.radar_housekeeping() from public, anon, authenticated;
select cron.schedule('kounkour-housekeeping', '10 23 * * *', 'select public.radar_housekeeping()');

create or replace function public.track_stages_call()
returns bigint language plpgsql security definer set search_path = public as $$
declare rid bigint;
begin
  select net.http_get(
    url := 'https://kounkour.com/api/radar/track-stages?limit=40&key=' || (select secret from public.radar_robot_key where id = 1),
    timeout_milliseconds := 60000) into rid;
  return rid;
end $$;
revoke all on function public.track_stages_call() from public, anon, authenticated;
select cron.schedule('kounkour-track-stages', '*/10 5-7 * * *', 'select public.track_stages_call()');
