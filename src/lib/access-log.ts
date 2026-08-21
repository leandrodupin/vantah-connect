import { supabase } from "@/integrations/supabase/client";

/** Registra um acesso do usuário logado no histórico do admin. */
export async function logAccess(userId: string) {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();

    await supabase.from("access_logs").insert({
      user_id: userId,
      email: data?.email ?? null,
      full_name: data?.full_name ?? null,
    });
  } catch {
    // registro de acesso não deve bloquear o login
  }
}
