import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { VirtualCardPreview } from "@/components/VirtualCardPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { brl, statusLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/compras")({
  head: () => ({
    meta: [
      { title: "Minhas compras | Vantah Media" },
      {
        name: "description",
        content:
          "Acompanhe seus pedidos e personalize os dados do cartão de visita virtual já adquirido.",
      },
      { property: "og:title", content: "Minhas compras | Vantah Media" },
      { property: "og:description", content: "Pedidos, status e personalização do seu cartão." },
    ],
  }),
  component: ComprasPage,
});

type Order = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  product_id: string | null;
};

function ComprasPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [savingCard, setSavingCard] = useState(false);
  const [cardId, setCardId] = useState<string | null>(null);
  const [card, setCard] = useState({
    displayName: "",
    jobTitle: "",
    whatsapp: "",
    instagram: "",
    linkedin: "",
    bio: "",
    logoUrl: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id, amount, status, created_at, product_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as Order[]) ?? []));

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
      ? await supabase
          .from("card_customizations")
          .update(payload)
          .eq("id", cardId)
          .select("id")
          .single()
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
    <div>
      <h1 className="text-3xl font-bold">Minhas compras</h1>
      <p className="mt-2 text-muted-foreground">
        Aqui ficam seus pedidos e os produtos já liberados.
      </p>

      <section className="card-elevated mt-8 p-6">
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
      </section>

      <section className="mt-8">
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
                  onChange={(event) => setCard({ ...card, bio: event.target.value })}
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
            <h2 className="text-lg font-semibold">Nenhum produto liberado ainda</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Assim que o pagamento do seu pedido for aprovado, o formulário de personalização
              aparece aqui.
            </p>
          </div>
        )}
      </section>
    </div>
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
