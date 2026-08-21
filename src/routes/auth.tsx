import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { logAccess } from "@/lib/access-log";
import { AVATAR_OPTIONS, randomAvatar } from "@/lib/avatars";

type AuthSearch = { mode: "login" | "signup" };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    mode: search["mode"] === "signup" ? "signup" : "login",
  }),
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta | Vantah Media" },
      {
        name: "description",
        content:
          "Acesse a área do cliente Vantah Media para comprar e personalizar o seu cartão de visita virtual.",
      },
      { property: "og:title", content: "Área do cliente | Vantah Media" },
      {
        property: "og:description",
        content: "Entre ou crie sua conta na Vantah Media em poucos segundos.",
      },
    ],
  }),
  component: AuthPage,
});

// Permite entrar com usuário simples (sem @) usando um e-mail interno determinístico.
export function toLoginEmail(identifier: string) {
  const value = identifier.trim().toLowerCase();
  return value.includes("@") ? value : `${value.replace(/[^a-z0-9._-]/g, "")}@vantah.local`;
}

async function routeAfterLogin(userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return data ? "/admin" : "/dashboard";
}

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AuthSearch["mode"]>(mode);
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ identifier: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    password: "",
  });
  const [avatar, setAvatar] = useState(() => randomAvatar());

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const target = await routeAfterLogin(data.session.user.id);
      navigate({ to: target, replace: true });
    });
  }, [navigate]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: toLoginEmail(loginForm.identifier),
      password: loginForm.password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bem-vindo de volta!");
    const target = await routeAfterLogin(data.user.id);
    navigate({ to: target, replace: true });
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: signupForm.email,
      password: signupForm.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: signupForm.fullName,
          whatsapp: signupForm.whatsapp,
          avatar_url: avatar,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("Conta criada! Confirme o e-mail para acessar.");
      setTab("login");
      return;
    }
    toast.success("Conta criada com sucesso!");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-96" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="bg-brand flex size-9 items-center justify-center rounded-xl text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <span className="text-lg font-semibold">Vantah Media</span>
        </Link>

        <div className="card-elevated p-6">
          <Tabs value={tab} onValueChange={(value) => setTab(value as AuthSearch["mode"])}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-id">E-mail ou usuário</Label>
                  <Input
                    id="login-id"
                    required
                    autoComplete="username"
                    placeholder="voce@email.com ou seu usuário"
                    value={loginForm.identifier}
                    onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : null} Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-3">
                  <Label>Escolha seu avatar</Label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_OPTIONS.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setAvatar(url)}
                        className={`relative size-12 overflow-hidden rounded-full border-2 transition-colors ${
                          avatar === url ? "border-primary" : "border-border"
                        }`}
                      >
                        <img src={url} alt="Opção de avatar" className="size-full object-cover" />
                        {avatar === url ? (
                          <span className="bg-brand absolute bottom-0 right-0 flex size-4 items-center justify-center rounded-full text-primary-foreground">
                            <Check className="size-2.5" />
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome completo</Label>
                  <Input
                    id="signup-name"
                    required
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-whatsapp">WhatsApp</Label>
                  <Input
                    id="signup-whatsapp"
                    placeholder="(11) 99999-0000"
                    value={signupForm.whatsapp}
                    onChange={(e) => setSignupForm({ ...signupForm, whatsapp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    minLength={6}
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  />
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : null} Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            ← Voltar para o site
          </Link>
        </p>
      </div>
    </div>
  );
}
