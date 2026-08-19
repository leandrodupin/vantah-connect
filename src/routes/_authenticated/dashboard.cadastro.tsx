import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AVATAR_OPTIONS } from "@/lib/avatars";

export const Route = createFileRoute("/_authenticated/dashboard/cadastro")({
  head: () => ({
    meta: [
      { title: "Alterar cadastro | Vantah Media" },
      {
        name: "description",
        content: "Atualize seu nome, WhatsApp e avatar na área do cliente Vantah Media.",
      },
      { property: "og:title", content: "Alterar cadastro | Vantah Media" },
      { property: "og:description", content: "Mantenha seus dados cadastrais atualizados." },
    ],
  }),
  component: CadastroPage,
});

function CadastroPage() {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({ fullName: "", whatsapp: "", avatarUrl: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      fullName: profile.full_name ?? "",
      whatsapp: profile.whatsapp ?? "",
      avatarUrl: profile.avatar_url ?? "",
    });
  }, [profile]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.fullName,
        whatsapp: form.whatsapp,
        avatar_url: form.avatarUrl || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cadastro atualizado! Recarregue para ver o novo avatar no topo.");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Alterar cadastro</h1>
      <p className="mt-2 text-muted-foreground">Atualize seus dados e escolha seu avatar.</p>

      <form onSubmit={handleSubmit} className="card-elevated mt-8 space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whats">WhatsApp</Label>
          <Input
            id="whats"
            value={form.whatsapp}
            onChange={(event) => setForm({ ...form, whatsapp: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input value={profile?.email ?? ""} disabled />
        </div>
        <div className="space-y-3">
          <Label>Avatar</Label>
          <div className="flex flex-wrap gap-3">
            {AVATAR_OPTIONS.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setForm({ ...form, avatarUrl: url })}
                className={`relative size-16 overflow-hidden rounded-full border-2 transition-colors ${
                  form.avatarUrl === url ? "border-primary" : "border-border"
                }`}
              >
                <img src={url} alt="Opção de avatar" className="size-full object-cover" />
                {form.avatarUrl === url ? (
                  <span className="bg-brand absolute bottom-0 right-0 flex size-5 items-center justify-center rounded-full text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" variant="hero" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : null} Salvar alterações
        </Button>
      </form>
    </div>
  );
}
