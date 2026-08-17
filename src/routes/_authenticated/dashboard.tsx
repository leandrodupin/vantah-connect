import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, CreditCard, Loader2, ShoppingBag, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { VirtualCardPreview } from "@/components/VirtualCardPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { createCheckoutPreference } from "@/lib/vantah.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel do cliente | Vantah Media" },
      {
        name: "description",
        content:
          "Compre, acompanhe seus pedidos e personalize os dados do seu cartão de visita virtual da Vantah Media.",
      },
      { property: "og:title", content: "Painel do cliente | Vantah Media" },
      {
        property: "og:description",
        content: "Acompanhe pedidos e personalize seu cartão de visita virtual.",
      },
    ],
  }),
  component: DashboardPage,
});

type Product = { id: string; name: string; description: string | null; price: number };
type Order = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  product_id: string | null;
};

const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function statusLabel(status: string) {
  if (status === "approved") return { label: "Aprovado", tone: "text-success" };
  if (status === "cancelled" || status === "rejected")
    return { label: "Cancelado", tone: "text-destructive" };
  return { label: "Pendente", tone: "text-warning" };
}

function DashboardPage() {
  const { user, profile, isAdmin } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paying, setPaying] = useState(false);
  const [savingCard, setSavingCard] = useState(false);
  const [card, setCard] = useState({
    displayName: "",
    jobTitle: "",
    whatsapp: "",
    instagram: "",
    linkedin: "",
    bio: "",
    logoUrl: "",
  });
  const [cardId, setCardId] = useState<string | null>(null);
  const checkout = useServerFn(createCheckoutPreference);

  const loadOrders = async (userId: string) => {
    const { data } = await supabase
      .from("orders")
      .select("id, amount, status, created_at, product_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
  };

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, description, price")
      .eq("is_active", true)
      .order("created_at")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setProduct(data as Product | null));
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadOrders(user.id);
    supabase
      .from("card_customizations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setCardId(data.id as string);
        setCard({
          displayName: data.display_name ?? "",
          jobTitle: data.job_title ?? "",
          whatsapp: data.whatsapp ?? "",
          instagram: data.instagram ?? "",
          linkedin: data.linkedin ?? "",
          bio: data.bio ?? "",
          logoUrl: data.logo_url ?? "",
        });
      });
  }, [user]);

  const approvedOrder = orders.find((order) => order.status === "approved");

  const handleBuy = async () => {
    if (!product) return;
    setPaying(true);
    try {
      const result = await checkout({
        data: { productId: product.id, origin: window.location.origin },
      });
      window.location.href = result.initPoint;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao iniciar o pagamento.");
      setPaying(false);
    }
  };

  const handleSaveCard = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSavingCard(true);
    const payload = {
      user_id: user.id,
      order_id: approvedOrder?.id ?? null,
      display_name: card.displayName,
      job_title: card.jobTitle,
      whatsapp: card.whatsapp,
      instagram: card.instagram,
      linkedin: card.linkedin,
      bio: card.bio,
      logo_url: card.logoUrl || null,
    };

    const { data, error } = cardId
      ? await supabase.from("card_customizations").update(payload).eq("id", cardId).select("id").single()
      : await supabase.from("card_customizations").insert(payload).select("id").single();

    setSavingCard(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCardId(data.id as string);
    toast.success("Dados do cartão salvos!");
  };

  return (
    <AppShell title="Painel do cliente" isAdmin={isAdmin}>
      <h1 className="text-3xl font-bold">
        Olá, {profile?.full_name?.split(" ")[0] ?? "cliente"} 👋
      </h1>
      <p className="mt-2 text-muted-foreground">
        Gerencie sua compra e personalize o seu cartão de visita virtual.
      </p>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card-elevated p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <ShoppingBag className="size-3.5 text-primary" /> Produto
              </span>
              <h2 className="mt-2 text-2xl font-semibold">
                {product?.name ?? "Cartão de Visita Virtual"}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {product?.description ??
                  "Cartão interativo digital com links para WhatsApp, Redes, Pix e Bio"}
              </p>
            </div>
            <p className="text-2xl font-bold text-gradient">{brl(Number(product?.price ?? 49.9))}</p>
          </div>
          <Button
            variant="hero"
            size="lg"
            className="mt-6 w-full sm:w-auto"
            onClick={handleBuy}
            disabled={paying || !product}
          >
            {paying ? <Loader2 className="animate-spin" /> : <CreditCard />} Comprar / Pagar com
            Mercado Pago
          </Button>
        </div>

        <div className="card-elevated p-6">
          <h2 className="text-lg font-semibold">Histórico de pedidos</h2>
          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Você ainda não fez nenhum pedido.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {orders.map((order) => {
                const status = statusLabel(order.status);
                return (
                  <li
                    key={order.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{brl(Number(order.amount))}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs ${status.tone}`}>
                      {order.status === "approved" ? (
                        <CheckCircle2 className="size-4" />
                      ) : order.status === "pending" ? (
                        <Clock className="size-4" />
                      ) : (
                        <XCircle className="size-4" />
                      )}
                      {status.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-10">
        {approvedOrder ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={handleSaveCard} className="card-elevated space-y-4 p-6">
              <div>
                <h2 className="text-lg font-semibold">Dados do seu cartão</h2>
                <p className="text-sm text-muted-foreground">
                  Preencha as informações que aparecerão no seu cartão virtual.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nome exibido"
                  value={card.displayName}
                  onChange={(v) => setCard({ ...card, displayName: v })}
                />
                <Field
                  label="Cargo"
                  value={card.jobTitle}
                  onChange={(v) => setCard({ ...card, jobTitle: v })}
                />
                <Field
                  label="WhatsApp"
                  value={card.whatsapp}
                  onChange={(v) => setCard({ ...card, whatsapp: v })}
                />
                <Field
                  label="Instagram"
                  value={card.instagram}
                  onChange={(v) => setCard({ ...card, instagram: v })}
                />
                <Field
                  label="LinkedIn"
                  value={card.linkedin}
                  onChange={(v) => setCard({ ...card, linkedin: v })}
                />
                <Field
                  label="URL do logo"
                  value={card.logoUrl}
                  onChange={(v) => setCard({ ...card, logoUrl: v })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={card.bio}
                  onChange={(e) => setCard({ ...card, bio: e.target.value })}
                />
              </div>
              <Button type="submit" variant="hero" disabled={savingCard}>
                {savingCard ? <Loader2 className="animate-spin" /> : null} Salvar cartão
              </Button>
            </form>
            <div className="flex items-start justify-center">
              <VirtualCardPreview data={card} />
            </div>
          </div>
        ) : (
          <div className="card-elevated p-6 text-center">
            <h2 className="text-lg font-semibold">Formulário do cartão bloqueado</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Assim que o pagamento do seu pedido for aprovado, o formulário de personalização
              aparece aqui.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
