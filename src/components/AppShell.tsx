import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fallbackAvatar } from "@/lib/avatars";

const adminLinks = [
  { to: "/admin", label: "Visão geral", exact: true },
  { to: "/admin/clientes", label: "Clientes" },
  { to: "/admin/produto", label: "Produto" },
  { to: "/admin/vendas", label: "Vendas" },
  { to: "/admin/acessos", label: "Acessos" },
] as const;

const clientLinks = [
  { to: "/dashboard", label: "Início", exact: true },
  { to: "/dashboard/cadastro", label: "Meu cadastro" },
  { to: "/dashboard/comprar", label: "Comprar" },
  { to: "/dashboard/compras", label: "Minhas compras" },
] as const;

export function AppShell({
  children,
  title,
  isAdmin,
  area = "client",
}: {
  children: ReactNode;
  title: string;
  isAdmin?: boolean;
  area?: "client" | "admin";
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const links = area === "admin" ? adminLinks : clientLinks;
  const avatar =
    profile?.avatar_url ?? fallbackAvatar(profile?.full_name ?? profile?.email ?? "Vantah");

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
              <Button asChild variant="ghost" size="sm">
                <Link to={area === "admin" ? "/dashboard" : "/admin"}>
                  {area === "admin" ? "Área do cliente" : "Área admin"}
                </Link>
              </Button>
            ) : null}
            <img
              src={avatar}
              alt={`Avatar de ${profile?.full_name ?? "usuário"}`}
              className="size-9 rounded-full border border-border bg-secondary object-cover"
            />
            <Button variant="subtle" size="sm" onClick={handleSignOut}>
              <LogOut /> Sair
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 text-sm">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: "exact" in link ? link.exact : false }}
              activeProps={{ className: "bg-secondary text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className="whitespace-nowrap rounded-full px-4 py-1.5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
    </div>
  );
}
