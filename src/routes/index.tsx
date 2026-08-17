import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Gauge,
  Leaf,
  Link2,
  Share2,
  Smartphone,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { VirtualCardPreview } from "@/components/VirtualCardPreview";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vantah Media | Cartão de Visita Virtual Interativo" },
      {
        name: "description",
        content:
          "Cartão de visita virtual da Vantah Media: um único link com WhatsApp, redes sociais, Pix e bio. Profissional, rápido e fácil de compartilhar.",
      },
      { property: "og:title", content: "Vantah Media | Cartão de Visita Virtual" },
      {
        property: "og:description",
        content:
          "Transforme seus contatos em oportunidades com um cartão digital interativo por R$ 49,90.",
      },
    ],
  }),
  component: LandingPage,
});

const benefits = [
  {
    icon: Smartphone,
    title: "100% digital",
    text: "Funciona em qualquer celular, sem instalar aplicativo nenhum.",
  },
  {
    icon: Share2,
    title: "Compartilhe em 1 toque",
    text: "Envie por WhatsApp, QR Code ou link direto na bio das suas redes.",
  },
  {
    icon: Wallet,
    title: "Receba pelo Pix",
    text: "Sua chave Pix disponível junto com os seus contatos principais.",
  },
  {
    icon: Gauge,
    title: "Entrega rápida",
    text: "Preencha seus dados após a compra e seu cartão fica pronto.",
  },
  {
    icon: BadgeCheck,
    title: "Visual premium",
    text: "Design moderno que valoriza a sua marca em cada apresentação.",
  },
  {
    icon: Leaf,
    title: "Sem papel",
    text: "Atualize seus dados quando quiser, sem reimprimir nada.",
  },
];

function LandingPage() {
  const [price, setPrice] = useState(49.9);
  const [demo, setDemo] = useState({
    displayName: "Ana Ribeiro",
    jobTitle: "Consultora de Marketing",
    whatsapp: "(11) 99999-0000",
    instagram: "@ana.ribeiro",
    linkedin: "linkedin.com/in/anaribeiro",
    bio: "Ajudo negócios locais a venderem mais com presença digital.",
  });

  useEffect(() => {
    supabase
      .from("products")
      .select("price")
      .eq("is_active", true)
      .order("created_at")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.price != null) setPrice(Number(data.price));
      });
  }, []);

  const formattedPrice = price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="bg-brand flex size-9 items-center justify-center rounded-xl text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Vantah Media</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#beneficios" className="transition-colors hover:text-foreground">
              Benefícios
            </a>
            <a href="#demo" className="transition-colors hover:text-foreground">
              Demonstração
            </a>
            <a href="#comprar" className="transition-colors hover:text-foreground">
              Preço
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth" search={{ mode: "login" }}>
                Entrar
              </Link>
            </Button>
            <Button asChild variant="hero" size="sm">
              <Link to="/auth" search={{ mode: "signup" }}>
                Cadastrar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[520px]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:py-28 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="size-3 text-primary" /> Novo produto Vantah Media
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
                Seu <span className="text-gradient">Cartão de Visita Virtual</span> em um único
                link
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                Cartão interativo digital com links para WhatsApp, redes sociais, Pix e bio. Cause
                a impressão certa em cada novo contato.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild variant="hero" size="xl">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Comprar agora <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="subtle" size="xl">
                  <a href="#demo">Ver demonstração</a>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Pagamento seguro via Mercado Pago · {formattedPrice} pagamento único
              </p>
            </div>
            <div className="relative">
              <VirtualCardPreview data={demo} />
            </div>
          </div>
        </section>

        <section id="beneficios" className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold md:text-4xl">Por que usar um cartão digital?</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Tudo o que seu cliente precisa saber sobre você, organizado em uma página elegante e
            sempre atualizada.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="card-elevated p-6">
                <span className="bg-brand mb-4 flex size-10 items-center justify-center rounded-xl text-primary-foreground">
                  <benefit.icon className="size-5" />
                </span>
                <h3 className="text-lg font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{benefit.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="demo" className="border-y border-border bg-card/30">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl">Monte e veja ao vivo</h2>
              <p className="mt-3 text-muted-foreground">
                Digite seus dados abaixo e acompanhe como ficaria o seu cartão Vantah Media.
              </p>
              <div className="mt-8 space-y-4">
                {(
                  [
                    ["displayName", "Nome"],
                    ["jobTitle", "Cargo / negócio"],
                    ["whatsapp", "WhatsApp"],
                    ["instagram", "Instagram"],
                    ["bio", "Bio"],
                  ] as const
                ).map(([field, label]) => (
                  <label key={field} className="block">
                    <span className="mb-1.5 block text-sm text-muted-foreground">{label}</span>
                    <input
                      value={demo[field]}
                      onChange={(event) =>
                        setDemo((current) => ({ ...current, [field]: event.target.value }))
                      }
                      className="w-full rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-start justify-center">
              <VirtualCardPreview data={demo} />
            </div>
          </div>
        </section>

        <section id="comprar" className="mx-auto max-w-4xl px-4 py-24 text-center">
          <div className="card-elevated relative overflow-hidden p-10">
            <div className="hero-glow pointer-events-none absolute inset-x-0 -top-24 h-56" />
            <div className="relative">
              <Link2 className="mx-auto size-8 text-primary" />
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">Cartão de Visita Virtual</h2>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                Cartão interativo digital com links para WhatsApp, Redes, Pix e Bio.
              </p>
              <p className="mt-8 text-5xl font-bold text-gradient">{formattedPrice}</p>
              <p className="mt-1 text-sm text-muted-foreground">pagamento único</p>
              <Button asChild variant="hero" size="xl" className="mt-8">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Comprar agora <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card/30">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base font-semibold text-foreground">Vantah Media</p>
            <p className="mt-1">Soluções digitais para marcas que querem ser lembradas.</p>
          </div>
          <div className="flex flex-wrap gap-6">
            <a href="#beneficios" className="hover:text-foreground">
              Benefícios
            </a>
            <a href="#demo" className="hover:text-foreground">
              Demonstração
            </a>
            <Link to="/auth" search={{ mode: "login" }} className="hover:text-foreground">
              Área do cliente
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Vantah Media</p>
        </div>
      </footer>
    </div>
  );
}
