import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas | Vantah Media" },
      {
        name: "description",
        content: "Acompanhe todas as vendas e altere o status dos pedidos da Vantah Media.",
      },
      { property: "og:title", content: "Vendas | Vantah Media" },
      { property: "og:description", content: "Todos os pedidos e status em um só painel." },
    ],
  }),
  component: AdminVendas,
});

type Order = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  mercadopago_payment_id: string | null;
};

const STATUSES = ["pending", "approved", "cancelled"] as const;

const statusText = (status: string) =>
  status === "approved" ? "Aprovado" : status === "pending" ? "Pendente" : "Cancelado";

function AdminVendas() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    const [ordersRes, profilesRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, user_id, amount, status, created_at, mercadopago_payment_id")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email"),
    ]);
    setOrders((ordersRes.data as Order[]) ?? []);
    const map: Record<string, string> = {};
    for (const row of (profilesRes.data as
      | { id: string; full_name: string | null; email: string | null }[]
      | null) ?? []) {
      map[row.id] = row.full_name ?? row.email ?? "—";
    }
    setNames(map);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleStatusChange = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Status atualizado.");
    await refresh();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Vendas</h1>
      <p className="mt-2 text-muted-foreground">Todos os pedidos realizados no sistema.</p>

      <section className="card-elevated mt-8 p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="pb-3">Cliente</th>
                <th className="pb-3">Valor</th>
                <th className="pb-3">Data</th>
                <th className="pb-3">Mercado Pago</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="py-3">{names[order.user_id] ?? "—"}</td>
                  <td className="py-3">{brl(Number(order.amount))}</td>
                  <td className="py-3 text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-3 text-xs text-muted-foreground">
                    {order.mercadopago_payment_id ?? "—"}
                  </td>
                  <td className="py-3">
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {statusText(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    Nenhum pedido registrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
