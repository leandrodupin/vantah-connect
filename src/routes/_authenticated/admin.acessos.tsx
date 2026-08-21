import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

type AccessLog = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/admin/acessos")({
  head: () => ({
    meta: [
      { title: "Histórico de acessos | Vantah Media" },
      {
        name: "description",
        content: "Registro de quem acessou a plataforma Vantah Media, com data e hora.",
      },
      { property: "og:title", content: "Histórico de acessos | Vantah Media" },
      {
        property: "og:description",
        content: "Acompanhe os acessos dos clientes à plataforma Vantah Media.",
      },
    ],
  }),
  component: AdminAcessos,
});

function AdminAcessos() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("access_logs")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      setLogs((data as AccessLog[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold">Histórico de acessos</h1>
      <p className="mt-2 text-muted-foreground">
        Todos os acessos registrados na plataforma, do mais recente para o mais antigo.
      </p>

      <div className="card-elevated mt-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Data e hora</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando acessos...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  <History className="mx-auto mb-2 size-5" />
                  Nenhum acesso registrado ainda.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium">{log.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{log.email ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "medium",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
