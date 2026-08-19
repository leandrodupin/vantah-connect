import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
import { supabase } from "@/integrations/supabase/client";
import { adminCreateClient, adminDeleteClient } from "@/lib/vantah.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  head: () => ({
    meta: [
      { title: "Cadastro de clientes | Vantah Media" },
      {
        name: "description",
        content: "Cadastre, edite, pesquise e remova clientes da Vantah Media.",
      },
      { property: "og:title", content: "Cadastro de clientes | Vantah Media" },
      { property: "og:description", content: "Gestão completa da base de clientes." },
    ],
  }),
  component: AdminClientes,
});

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
};

function AdminClientes() {
  const [clients, setClients] = useState<Profile[]>([]);
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

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setClients((data as Profile[]) ?? []);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (client) =>
        (client.full_name ?? "").toLowerCase().includes(term) ||
        (client.email ?? "").toLowerCase().includes(term),
    );
  }, [clients, search]);

  const handleCreate = async (event: React.FormEvent) => {
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

  const handleUpdate = async (event: React.FormEvent) => {
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

  const handleDelete = async (client: Profile) => {
    if (!window.confirm(`Excluir ${client.full_name ?? client.email}?`)) return;
    try {
      await deleteClient({ data: { userId: client.id } });
      toast.success("Cliente excluído.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir cliente.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Clientes</h1>
      <p className="mt-2 text-muted-foreground">Cadastro completo da base de clientes.</p>

      <section className="card-elevated mt-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
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

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="pb-3">Cliente</th>
                <th className="pb-3">E-mail</th>
                <th className="pb-3">WhatsApp</th>
                <th className="pb-3">Perfil</th>
                <th className="pb-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="border-t border-border">
                  <td className="py-3">
                    <span className="flex items-center gap-2">
                      {client.avatar_url ? (
                        <img
                          src={client.avatar_url}
                          alt=""
                          className="size-8 rounded-full border border-border"
                        />
                      ) : null}
                      {client.full_name ?? "—"}
                    </span>
                  </td>
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
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(client)}>
                      <Trash2 className="text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
            <DialogDescription>Crie manualmente um acesso para um cliente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
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
            <form onSubmit={handleUpdate} className="space-y-4">
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
    </div>
  );
}
