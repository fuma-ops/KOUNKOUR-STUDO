import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

export type StaffRole = 'moderateur' | 'editeur' | 'administrateur';

export interface SessionState {
  session: Session | null;
  user: User | null;
  role: string | null;
  isStaff: boolean;
  isEditor: boolean;
  loading: boolean;
}

const STAFF_ROLES = ['moderateur', 'editeur', 'administrateur'];
const EDITOR_ROLES = ['editeur', 'administrateur'];

// Session Supabase + rôle serveur (table user_roles). Utilisé pour protéger
// l'admin et personnaliser (favoris, profil). Le rôle n'est JAMAIS décidé côté
// client : il est lu en base et re-vérifié par les RLS à chaque écriture.
export function useSession(): SessionState & { signOut: () => Promise<void> } {
  const [state, setState] = useState<SessionState>({
    session: null,
    user: null,
    role: null,
    isStaff: false,
    isEditor: false,
    loading: true,
  });

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    let active = true;

    async function loadRole(user: User | null): Promise<string | null> {
      if (!user) return null;
      const sb = getSupabase();
      if (!sb) return null;
      const { data } = await sb
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      return data?.role ?? null;
    }

    async function apply(session: Session | null) {
      const user = session?.user ?? null;
      const role = await loadRole(user);
      if (!active) return;
      setState({
        session,
        user,
        role,
        isStaff: !!role && STAFF_ROLES.includes(role),
        isEditor: !!role && EDITOR_ROLES.includes(role),
        loading: false,
      });
    }

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      apply(session);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
  }

  return { ...state, signOut };
}
