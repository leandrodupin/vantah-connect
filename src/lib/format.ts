export const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function statusLabel(status: string) {
  if (status === "approved") return { label: "Aprovado", tone: "text-success" };
  if (status === "cancelled" || status === "rejected")
    return { label: "Cancelado", tone: "text-destructive" };
  return { label: "Pendente", tone: "text-warning" };
}
