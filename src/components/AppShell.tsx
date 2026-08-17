import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function AppShell({
  children,
  title,
  isAdmin,
}: {
  children: ReactNode;
  title: string;
  isAdmin?: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "login" }, replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="bg-brand flex size-9 items-center justify-center rounded-xl text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="hidden text-lg font-semibold sm:block">Vantah Media</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-border px-3 py-1 text-xs text-muted-foreground md:block">
              {title}
            </span>
            {isAdmin ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/dashboard">Cliente</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">Admin</Link>
                </Button>
              </>
            ) : null}
            <Button variant="subtle" size="sm" onClick={handleSignOut}>
              <LogOut /> Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
    </div>
  );
}
