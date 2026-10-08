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
