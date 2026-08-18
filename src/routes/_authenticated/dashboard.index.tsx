import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, ShoppingCart, UserCog } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "Painel do cliente | Vantah Media" },
      {
        name: "description",
        content:
          "Acesse seu cadastro, compre o Cartão de Visita Virtual e veja as compras já realizadas na Vantah Media.",
      },
      { property: "og:title", content: "Painel do cliente | Vantah Media" },
      {
        property: "og:description",
        content: "Cadastro, compras e produtos adquiridos em um só lugar.",
      },
    ],
  }),
  component: DashboardHome,
});

const shortcuts = [
  {
    to: "/dashboard/cadastro",
    label: "Alterar cadastro",
    description: "Atualize nome, WhatsApp e avatar.",
    icon: UserCog,
  },
  {
    to: "/dashboard/comprar",
    label: "Comprar",
    description: "Adquira o Cartão de Visita Virtual.",
    icon: ShoppingCart,
  },
  {
    to: "/dashboard/compras",
    label: "Compras",
    description: "Veja pedidos e personalize o cartão.",
    icon: ShoppingBag,
  },
] as const;

function DashboardHome() {
  const { profile } = useAuth();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-bold">
        Olá, {profile?.full_name?.split(" ")[0] ?? "cliente"} 👋
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Escolha o que você quer fazer agora na sua área Vantah Media.
      </p>

      <div className="mt-10 grid w-full gap-4 sm:grid-cols-3">
        {shortcuts.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="card-elevated group flex flex-col items-center gap-3 p-8 transition-transform hover:-translate-y-1"
          >
            <span className="bg-brand flex size-12 items-center justify-center rounded-2xl text-primary-foreground">
              <item.icon className="size-5" />
            </span>
            <span className="text-lg font-semibold">{item.label}</span>
            <span className="text-sm text-muted-foreground">{item.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
