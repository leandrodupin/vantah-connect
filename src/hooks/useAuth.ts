import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const [{ data: profileData }, { data: roleData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", nextSession.user.id).maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", nextSession.user.id)
          .eq("role", "admin")
          .maybeSingle(),
      ]);

      if (!active) return;
      setProfile((profileData as Profile) ?? null);
      setIsAdmin(Boolean(roleData));
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => void load(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "TOKEN_REFRESHED") return;
      void load(nextSession);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user, profile, isAdmin, loading };
}
