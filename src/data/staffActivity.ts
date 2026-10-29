import { getSupabase } from '../lib/supabase';

// Notifications de l'équipe : nouveaux messages et commentaires de la communauté
// (RPC staff_activity / staff_mark_seen, réservées au staff).
export interface StaffActivityItem {
  kind: 'post' | 'comment';
  id: string;
  post_id: string;
  created_at: string;
  author: string;
  title: string | null;
  content: string;
  room_id: string | null;
  room: string | null;
  contest_id: string | null;
  contest_slug: string | null;
  contest_title: string | null;
  unread: boolean;
}
export interface StaffActivity {
  seen_at: string;
  unread: number;
  items: StaffActivityItem[];
}

export async function fetchStaffActivity(limit = 40): Promise<StaffActivity | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('staff_activity', { p_limit: limit });
  if (error) throw new Error(error.message);
  return data as StaffActivity;
}

export async function markStaffSeen(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.rpc('staff_mark_seen');
  if (error) throw new Error(error.message);
}
