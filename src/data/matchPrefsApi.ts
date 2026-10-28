import { getSupabase } from '../lib/supabase';
import type { CandidateProfile } from '../types';
import { profileDegreeYears, profileSpecialties } from '../utils/smartMatch';

// Sauvegarde du profil Smart Match dans le compte (table smart_match_preferences,
// RLS : chacun ne lit/écrit que sa ligne). Sert à retrouver son profil sur un autre
// appareil et, plus tard, aux alertes « nouveau concours pour vous ».

const DEGREE_BY_YEARS: Record<number, string> = { 8: 'Doctorat', 5: 'Master', 3: 'Licence', 2: 'Bac+2', 1: 'Technicien', 0: 'Bac', [-1]: 'CQP', [-2]: 'Lycee', [-3]: 'College' };

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
        diploma_level: years !== null && years >= -3 && years <= 8 ? years : null,
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

/** Notifications push (opt-in) : état actuel pour le compte connecté, null si non connecté. */
export async function loadPushAlerts(): Promise<boolean | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return null;
    const { data: row } = await sb.from('smart_match_preferences').select('push_alerts').eq('user_id', uid).maybeSingle();
    return !!row?.push_alerts;
  } catch {
    return null;
  }
}

/** Active / désactive les notifications (enregistre aussi le profil, nécessaire au tri). */
export async function setPushAlerts(enabled: boolean, profile: CandidateProfile): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Service indisponible' };
  try {
    const { data } = await sb.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return { ok: false, error: 'Connectez-vous pour recevoir les notifications.' };
    if (enabled) await saveMatchPreferences(profile);
    const { error } = await sb
      .from('smart_match_preferences')
      .upsert({ user_id: uid, push_alerts: enabled, match_consent: true, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Erreur réseau' };
  }
}

/** Enregistre l'abonnement push de cet appareil pour le compte connecté. */
export async function savePushSubscription(sub: PushSubscription): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Service indisponible' };
  const j = sub.toJSON();
  const { error } = await sb.rpc('push_subscribe', {
    p_endpoint: sub.endpoint,
    p_p256dh: j.keys?.p256dh || '',
    p_auth: j.keys?.auth || '',
    p_ua: navigator.userAgent,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Retire l'abonnement push de cet appareil. */
export async function removePushSubscription(endpoint: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.rpc('push_unsubscribe', { p_endpoint: endpoint });
}

/** État des alertes « en un clic » de cet appareil (sans compte). */
export interface FollowState {
  follows: string[];
  new_contests: boolean;
}

/** Abonne l'appareil (sans compte) et suit un concours et/ou les nouveaux concours. */
export async function savePushFollow(sub: PushSubscription, o: { contestId?: string; newContests?: boolean; lang: 'fr' | 'ar' }): Promise<{ ok: boolean; state?: FollowState; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Service indisponible' };
  const j = sub.toJSON();
  const { data, error } = await sb.rpc('push_follow', {
    p_endpoint: sub.endpoint,
    p_p256dh: j.keys?.p256dh || '',
    p_auth: j.keys?.auth || '',
    p_ua: navigator.userAgent,
    p_contest: o.contestId || null,
    p_new: o.newContests ?? null,
    p_lang: o.lang,
  });
  return error ? { ok: false, error: error.message } : { ok: true, state: data as FollowState };
}

export async function removePushFollow(endpoint: string, o: { contestId?: string; newContests?: false }): Promise<FollowState | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.rpc('push_unfollow', { p_endpoint: endpoint, p_contest: o.contestId || null, p_new: o.newContests ?? null });
  return (data as FollowState) || null;
}

export async function loadPushFollow(endpoint: string): Promise<FollowState | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.rpc('push_status', { p_endpoint: endpoint });
  return (data as FollowState) || null;
}
