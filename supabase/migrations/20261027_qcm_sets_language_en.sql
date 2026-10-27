-- Tests psychotechniques universels : séries en anglais en plus du français et de l'arabe.
alter table public.qcm_sets drop constraint if exists qcm_sets_language_check;
alter table public.qcm_sets add constraint qcm_sets_language_check check (language = any (array['fr'::text, 'ar'::text, 'en'::text]));
