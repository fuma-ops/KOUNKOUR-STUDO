import { getSupabase } from '../lib/supabase';
import type { CandidateProfile } from '../types';
import { profileDegreeYears, profileSpecialties } from '../utils/smartMatch';

// Sauvegarde du profil Smart Match dans le compte (table smart_match_preferences,
// RLS : chacun ne lit/écrit que sa ligne). Sert à retrouver son profil sur un autre
// appareil et, plus tard, aux alertes « nouveau concours pour vous ».

const DEGREE_BY_YEARS: Record<number, string> = { 8: 'Doctorat', 5: 'Master', 3: 'Licence', 2: 'Bac+2', 1: 'Technicien', 0: 'Bac' };

export async function saveMatchPreferences(profile: CandidateProfile): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const { data } = await sb.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;
    const years = profileDegreeYears(profile);
    await sb.from('smart_match_preferences').upsert(
      {
        user_id: uid,
        diploma_level: years !== null && years >= 0 && years <= 8 ? years : null,
        specialty: profileSpecialties(profile).join(' ; ') || null,
        region: profile.region || null,
        age: profile.age >= 15 && profile.age <= 80 ? profile.age : null,
        situation: profile.currentSituation || null,
        match_consent: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch {
    /* hors ligne : le profil reste enregistré sur l'appareil */
  }
}

/** Profil enregistré dans le compte (diplôme, spécialités, région), ou null. */
export async function loadMatchPreferences(): Promise<Partial<CandidateProfile> | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return null;
    const { data: row } = await sb
      .from('smart_match_preferences')
      .select('diploma_level, specialty, region')
      .eq('user_id', uid)
      .maybeSingle();
    if (!row) return null;
    const specialties = String(row.specialty || '')
      .split(/\s*;\s*/)
      .filter(Boolean);
    return {
      degreeLevel: row.diploma_level !== null && row.diploma_level !== undefined ? DEGREE_BY_YEARS[row.diploma_level] || '' : '',
      specialties,
      specialty: specialties[0] || '',
      region: row.region || '',
    };
  } catch {
    return null;
  }
}

/** Alertes e-mail (opt-in) : état actuel pour le compte connecté, null si non connecté. */
export async function loadEmailAlerts(): Promise<boolean | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return null;
    const { data: row } = await sb.from('smart_match_preferences').select('email_alerts').eq('user_id', uid).maybeSingle();
    return !!row?.email_alerts;
  } catch {
    return null;
  }
}

/** Active / désactive les alertes e-mail (enregistre aussi le profil, nécessaire au tri). */
export async function setEmailAlerts(enabled: boolean, profile: CandidateProfile): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Service indisponible' };
  try {
    const { data } = await sb.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return { ok: false, error: 'Connectez-vous pour recevoir les alertes.' };
    await saveMatchPreferences(profile);
    const { error } = await sb
      .from('smart_match_preferences')
      .upsert({ user_id: uid, email_alerts: enabled, match_consent: true, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Erreur réseau' };
  }
}
