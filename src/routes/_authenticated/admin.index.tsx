import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Visão geral admin | Vantah Media" },
      {
        name: "description",
        content: "Métricas de clientes, pedidos e faturamento da Vantah Media.",
      },
      { property: "og:title", content: "Visão geral admin | Vantah Media" },
      { property: "og:description", content: "Acompanhe a operação da Vantah Media." },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  const [clients, setClients] = useState(0);
  const [orders, setOrders] = useState(0);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    void (async () => {
      const [profilesRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("amount, status"),
      ]);
      setClients(profilesRes.count ?? 0);
      const rows = (ordersRes.data as { amount: number; status: string }[]) ?? [];
      setOrders(rows.length);
      setRevenue(
        rows
          .filter((row) => row.status === "approved")
          .reduce((total, row) => total + Number(row.amount), 0),
      );
    })();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold">Administração</h1>
      <p className="mt-2 text-muted-foreground">Visão geral da operação da Vantah Media.</p>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric icon={Users} label="Total de clientes" value={String(clients)} />
        <Metric icon={Package} label="Total de pedidos" value={String(orders)} />
        <Metric icon={TrendingUp} label="Faturamento total" value={brl(revenue)} />
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <Shortcut to="/admin/clientes" label="Cadastro de clientes" icon={Users} />
        <Shortcut to="/admin/produto" label="Produtos" icon={Package} />
        <Shortcut to="/admin/vendas" label="Vendas" icon={ShoppingCart} />
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="card-elevated p-6">
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5 text-primary" /> {label}
      </span>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Shortcut({
  to,
  label,
  icon: Icon,
}: {
  to: "/admin/clientes" | "/admin/produto" | "/admin/vendas";
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      to={to}
      className="card-elevated flex items-center gap-3 p-6 transition-transform hover:-translate-y-1"
    >
      <span className="bg-brand flex size-10 items-center justify-center rounded-xl text-primary-foreground">
        <Icon className="size-4" />
      </span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
