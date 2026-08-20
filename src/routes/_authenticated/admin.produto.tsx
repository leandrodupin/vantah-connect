import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/produto")({
  head: () => ({
    meta: [
      { title: "Produtos | Vantah Media" },
      {
        name: "description",
        content: "Edite nome, descrição, preço e status dos produtos da Vantah Media.",
      },
      { property: "og:title", content: "Produtos | Vantah Media" },
      { property: "og:description", content: "Gestão do catálogo de produtos." },
    ],
  }),
  component: AdminProduto,
});

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
};

const emptyDraft = { name: "", description: "", price: "" };

function AdminProduto() {
  const [products, setProducts] = useState<Product[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, description, price, is_active")
      .order("created_at");
    setProducts((data as Product[]) ?? []);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const patch = (id: string, changes: Partial<Product>) =>
    setProducts((list) => list.map((item) => (item.id === id ? { ...item, ...changes } : item)));

  const handleSave = async (product: Product) => {
    setSavingId(product.id);
    const { error } = await supabase
      .from("products")
      .update({
        name: product.name,
        description: product.description,
        price: Number(product.price),
        is_active: product.is_active,
      })
      .eq("id", product.id);
    setSavingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Produto atualizado.");
  };

  const handleCreate = async () => {
    if (draft.name.trim().length < 2) {
      toast.error("Informe o nome do produto.");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("products").insert({
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      price: Number(draft.price) || 0,
      is_active: true,
    });
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft(emptyDraft);
    toast.success("Produto cadastrado.");
    void refresh();
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Excluir o produto "${product.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Produto excluído.");
    void refresh();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Produtos</h1>
      <p className="mt-2 text-muted-foreground">
        Cadastre novos produtos e edite as informações comerciais dos existentes.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleCreate();
        }}
        className="card-elevated mt-8 grid gap-4 p-6 md:grid-cols-2"
      >
        <h2 className="md:col-span-2 text-lg font-semibold">Novo produto</h2>
        <div className="space-y-2">
          <Label htmlFor="new-name">Nome</Label>
          <Input
            id="new-name"
            value={draft.name}
            onChange={(event) => setDraft((d) => ({ ...d, name: event.target.value }))}
            placeholder="Ex.: Cartão de Visita Virtual"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-price">Preço (R$)</Label>
          <Input
            id="new-price"
            type="number"
            step="0.01"
            value={draft.price}
            onChange={(event) => setDraft((d) => ({ ...d, price: event.target.value }))}
            placeholder="49.90"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="new-desc">Descrição</Label>
          <Textarea
            id="new-desc"
            rows={3}
            value={draft.description}
            onChange={(event) => setDraft((d) => ({ ...d, description: event.target.value }))}
          />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" variant="hero" disabled={creating}>
            {creating ? <Loader2 className="animate-spin" /> : <Plus />} Cadastrar produto
          </Button>
        </div>
      </form>

      <div className="mt-8 space-y-6">
        {products.map((product) => (
          <form
            key={product.id}
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave(product);
            }}
            className="card-elevated grid gap-4 p-6 md:grid-cols-2"
          >
            <div className="md:col-span-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <span className="text-gradient font-bold">{brl(Number(product.price))}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`n-${product.id}`}>Nome</Label>
              <Input
                id={`n-${product.id}`}
                value={product.name}
                onChange={(event) => patch(product.id, { name: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`p-${product.id}`}>Preço (R$)</Label>
              <Input
                id={`p-${product.id}`}
                type="number"
                step="0.01"
                value={product.price}
                onChange={(event) => patch(product.id, { price: Number(event.target.value) })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`d-${product.id}`}>Descrição</Label>
              <Textarea
                id={`d-${product.id}`}
                rows={3}
                value={product.description ?? ""}
                onChange={(event) => patch(product.id, { description: event.target.value })}
              />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={product.is_active}
                  onChange={(event) => patch(product.id, { is_active: event.target.checked })}
                />
                Produto ativo
              </label>
              <Button type="submit" variant="hero" disabled={savingId === product.id}>
                {savingId === product.id ? <Loader2 className="animate-spin" /> : null} Salvar
                produto
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDelete(product)}
              >
                <Trash2 /> Excluir
              </Button>
            </div>
          </form>
        ))}
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
        ) : null}
      </div>
    </div>
  );
}
