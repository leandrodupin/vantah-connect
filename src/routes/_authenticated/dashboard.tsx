import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { isAdmin } = useAuth();
  return (
    <AppShell title="Área do cliente" isAdmin={isAdmin} area="client">
      <Outlet />
    </AppShell>
  );
}
