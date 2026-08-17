import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Package, Pencil, Plus, Search, Trash2, TrendingUp, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { adminCreateClient, adminDeleteClient } from "@/lib/vantah.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo | Vantah Media" },
      {
        name: "description",
        content:
          "Gerencie clientes, pedidos, faturamento e o produto Cartão de Visita Virtual da Vantah Media.",
      },
      { property: "og:title", content: "Painel administrativo | Vantah Media" },
      {
        property: "og:description",
        content: "Métricas, clientes, pedidos e produto em um só lugar.",
      },
    ],
  }),
  component: AdminPage,
});

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  whatsapp: string | null;
  role: string;
  created_at: string;
};
type Order = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  mercadopago_payment_id: string | null;
};
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
};

const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUSES = ["pending", "approved", "cancelled"] as const;

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [newClient, setNewClient] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    password: "",
  });

  const createClient = useServerFn(adminCreateClient);
  const deleteClient = useServerFn(adminDeleteClient);

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error("Acesso restrito a administradores.");
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, isAdmin, navigate]);

  const refresh = useCallback(async () => {
    const [profilesRes, ordersRes, productRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("id, user_id, amount, status, created_at, mercadopago_payment_id")
        .order("created_at", { ascending: false }),
      supabase
        .from("products")
        .select("id, name, description, price, is_active")
        .order("created_at")
        .limit(1)
        .maybeSingle(),
    ]);
    setClients((profilesRes.data as Profile[]) ?? []);
    setOrders((ordersRes.data as Order[]) ?? []);
    setProduct((productRes.data as Product) ?? null);
  }, []);

  useEffect(() => {
    if (isAdmin) void refresh();
  }, [isAdmin, refresh]);

  const revenue = useMemo(
    () =>
      orders
        .filter((order) => order.status === "approved")
        .reduce((total, order) => total + Number(order.amount), 0),
    [orders],
  );

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (client) =>
        (client.full_name ?? "").toLowerCase().includes(term) ||
        (client.email ?? "").toLowerCase().includes(term),
    );
  }, [clients, search]);

  const clientName = (userId: string) =>
    clients.find((client) => client.id === userId)?.full_name ??
    clients.find((client) => client.id === userId)?.email ??
    "—";

  const handleCreateClient = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await createClient({ data: { ...newClient, isAdmin: false } });
      toast.success("Cliente criado com sucesso.");
      setCreateOpen(false);
      setNewClient({ fullName: "", email: "", whatsapp: "", password: "" });
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar cliente.");
    }
    setBusy(false);
  };

  const handleUpdateClient = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editing.full_name,
        email: editing.email,
        whatsapp: editing.whatsapp,
      })
      .eq("id", editing.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cliente atualizado.");
    setEditing(null);
    await refresh();
  };

  const handleDeleteClient = async (client: Profile) => {
    if (!window.confirm(`Excluir ${client.full_name ?? client.email}?`)) return;
    try {
      await deleteClient({ data: { userId: client.id } });
      toast.success("Cliente excluído.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir cliente.");
    }
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Status atualizado.");
    await refresh();
  };

  const handleProductSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!product) return;
    setBusy(true);
    const { error } = await supabase
      .from("products")
      .update({
        name: product.name,
        description: product.description,
        price: Number(product.price),
        is_active: product.is_active,
      })
      .eq("id", product.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Produto atualizado.");
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppShell title="Painel administrativo" isAdmin>
      <h1 className="text-3xl font-bold">Administração</h1>
      <p className="mt-2 text-muted-foreground">Visão geral da operação da Vantah Media.</p>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric icon={Users} label="Total de clientes" value={String(clients.length)} />
        <Metric icon={Package} label="Total de pedidos" value={String(orders.length)} />
        <Metric icon={TrendingUp} label="Faturamento total" value={brl(revenue)} />
      </section>

      <section className="card-elevated mt-10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Clientes</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="w-56 pl-9"
                placeholder="Pesquisar nome ou e-mail"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Button variant="hero" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus /> Novo cliente
            </Button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="pb-3">Nome</th>
                <th className="pb-3">E-mail</th>
                <th className="pb-3">WhatsApp</th>
                <th className="pb-3">Perfil</th>
                <th className="pb-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className="border-t border-border">
                  <td className="py-3">{client.full_name ?? "—"}</td>
                  <td className="py-3 text-muted-foreground">{client.email ?? "—"}</td>
                  <td className="py-3 text-muted-foreground">{client.whatsapp ?? "—"}</td>
                  <td className="py-3">
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                      {client.role}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(client)}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(client)}>
                      <Trash2 className="text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-elevated mt-8 p-6">
        <h2 className="text-lg font-semibold">Pedidos</h2>
        <div className="mt-6 overflow-x-auto">
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
                  <td className="py-3">{clientName(order.user_id)}</td>
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
                            {status === "approved"
                              ? "Aprovado"
                              : status === "pending"
                                ? "Pendente"
                                : "Cancelado"}
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

      {product ? (
        <section className="card-elevated mt-8 p-6">
          <h2 className="text-lg font-semibold">Produto</h2>
          <form onSubmit={handleProductSave} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-name">Nome</Label>
              <Input
                id="p-name"
                value={product.name}
                onChange={(event) => setProduct({ ...product, name: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-price">Preço (R$)</Label>
              <Input
                id="p-price"
                type="number"
                step="0.01"
                value={product.price}
                onChange={(event) =>
                  setProduct({ ...product, price: Number(event.target.value) })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="p-desc">Descrição</Label>
              <Textarea
                id="p-desc"
                rows={3}
                value={product.description ?? ""}
                onChange={(event) => setProduct({ ...product, description: event.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" variant="hero" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : null} Salvar produto
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
            <DialogDescription>Crie manualmente um acesso para um cliente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateClient} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-name">Nome completo</Label>
              <Input
                id="c-name"
                required
                value={newClient.fullName}
                onChange={(e) => setNewClient({ ...newClient, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">E-mail</Label>
              <Input
                id="c-email"
                type="email"
                required
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-whats">WhatsApp</Label>
              <Input
                id="c-whats"
                value={newClient.whatsapp}
                onChange={(e) => setNewClient({ ...newClient, whatsapp: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-pass">Senha provisória</Label>
              <Input
                id="c-pass"
                type="password"
                required
                minLength={6}
                value={newClient.password}
                onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="submit" variant="hero" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : null} Criar cliente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription>Atualize os dados cadastrais do cliente.</DialogDescription>
          </DialogHeader>
          {editing ? (
            <form onSubmit={handleUpdateClient} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="e-name">Nome completo</Label>
                <Input
                  id="e-name"
                  value={editing.full_name ?? ""}
                  onChange={(e) => setEditing({ ...editing, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-email">E-mail</Label>
                <Input
                  id="e-email"
                  value={editing.email ?? ""}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-whats">WhatsApp</Label>
                <Input
                  id="e-whats"
                  value={editing.whatsapp ?? ""}
                  onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="submit" variant="hero" disabled={busy}>
                  {busy ? <Loader2 className="animate-spin" /> : null} Salvar
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="card-elevated p-6">
      <span className="bg-brand mb-4 flex size-10 items-center justify-center rounded-xl text-primary-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
