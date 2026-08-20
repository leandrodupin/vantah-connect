import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/seed-admin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          email?: string;
          password?: string;
          fullName?: string;
          avatarUrl?: string;
        };
        if (!body.email || !body.password) return new Response("bad request", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
          email: body.email,
          password: body.password,
          email_confirm: true,
          user_metadata: { full_name: body.fullName ?? "Administrador", avatar_url: body.avatarUrl },
        });
        if (error) return new Response(error.message, { status: 400 });
        const id = created.user?.id;
        if (!id) return new Response("no user", { status: 500 });

        await supabaseAdmin
          .from("profiles")
          .update({ role: "admin", full_name: body.fullName ?? "Administrador", avatar_url: body.avatarUrl ?? null })
          .eq("id", id);
        await supabaseAdmin.from("user_roles").insert({ user_id: id, role: "admin" });

        return Response.json({ id });
      },
    },
  },
});
