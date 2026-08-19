import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
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

function AdminProduto() {
  const [products, setProducts] = useState<Product[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

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

  return (
    <div>
      <h1 className="text-3xl font-bold">Produtos</h1>
      <p className="mt-2 text-muted-foreground">
        Edite as informações comerciais dos produtos vendidos.
      </p>

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
