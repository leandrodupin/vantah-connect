import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, Loader2, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";
import { createCheckoutPreference } from "@/lib/vantah.functions";

export const Route = createFileRoute("/_authenticated/dashboard/comprar")({
  head: () => ({
    meta: [
      { title: "Comprar produto | Vantah Media" },
      {
        name: "description",
        content: "Compre o Cartão de Visita Virtual da Vantah Media pagando com Mercado Pago.",
      },
      { property: "og:title", content: "Comprar produto | Vantah Media" },
      { property: "og:description", content: "Checkout rápido e seguro via Mercado Pago." },
    ],
  }),
  component: ComprarPage,
});

type Product = { id: string; name: string; description: string | null; price: number };

function ComprarPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const checkout = useServerFn(createCheckoutPreference);

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, description, price")
      .eq("is_active", true)
      .order("created_at")
      .then(({ data }) => {
        const list = (data as Product[]) ?? [];
        setProducts(list);
        setSelectedId((current) => current ?? list[0]?.id ?? null);
      });
  }, []);

  const handleBuy = async (product: Product) => {
    setPayingId(product.id);
    try {
      const result = await checkout({
        data: { productId: product.id, origin: window.location.origin },
      });
      window.location.href = result.initPoint;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao iniciar o pagamento.");
      setPayingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Comprar</h1>
      <p className="mt-2 text-muted-foreground">
        Escolha um produto e finalize o pagamento pelo Mercado Pago.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {products.map((product) => (
          <div key={product.id} className="card-elevated p-6">
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <ShoppingBag className="size-3.5 text-primary" /> Produto
            </span>
            <h2 className="mt-2 text-2xl font-semibold">{product.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
            <p className="text-gradient mt-4 text-2xl font-bold">{brl(Number(product.price))}</p>
            <Button
              variant="hero"
              size="lg"
              className="mt-6 w-full sm:w-auto"
              onClick={() => handleBuy(product)}
              disabled={payingId === product.id}
            >
              {payingId === product.id ? <Loader2 className="animate-spin" /> : <CreditCard />}{" "}
              Pagar com Mercado Pago
            </Button>
          </div>
        ))}
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum produto disponível no momento.</p>
        ) : null}
      </div>
    </div>
  );
}
