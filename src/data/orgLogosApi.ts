import { getSupabase } from '../lib/supabase';

// Logos officiels des organismes : liste pour l'équipe + remplacement manuel.
// Les octets vivent dans administration_logos, servis par /api/logo.

// Date du jour au Maroc (AAAA-MM-JJ), pas en UTC.
const todayMorocco = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Casablanca' });

export interface OrgLogoRow {
  id: string;
  name: string;
  logoUrl: string | null;
  openContests: number;
  totalContests: number;
}

export async function fetchOrgLogos(): Promise<OrgLogoRow[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Service indisponible.');
  const { data, error } = await sb
    .from('administrations')
    .select('id,name_fr,logo_url,contests(id,status,deadline_date)')
    .order('name_fr');
  if (error) throw new Error(error.message);
  const today = todayMorocco();
  return (data || [])
    .map((a: any) => {
      const cs: any[] = a.contests || [];
      return {
        id: a.id,
        name: a.name_fr,
        logoUrl: a.logo_url,
        totalContests: cs.length,
        openContests: cs.filter(
          (c) => (c.status === 'publie' || c.status === 'mis_a_jour') && (!c.deadline_date || c.deadline_date >= today),
        ).length,
      };
    })
    .filter((a) => a.totalContests > 0);
}

// PNG conservé (transparence des logos), réduit à 600 px maximum.
async function toLogoPayload(file: File): Promise<{ mime: string; b64: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const mime = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mime, 0.9);
  return { mime, b64: dataUrl.slice(dataUrl.indexOf(',') + 1) };
}

// Pose ou remplace le logo (file), ou le retire (null). Renvoie la nouvelle logo_url.
export async function setOrgLogo(adminId: string, file: File | null): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) throw new Error('Service indisponible.');
  const payload = file ? await toLogoPayload(file) : null;
  const { data, error } = await sb.rpc('admin_logo_staff_set', {
    p_admin: adminId,
    p_mime: payload?.mime ?? null,
    p_b64: payload?.b64 ?? null,
  });
  if (error) throw new Error(/staff/.test(error.message) ? 'Réservé à l’équipe KounKour.' : error.message);
  return (data as string | null) ?? null;
}
