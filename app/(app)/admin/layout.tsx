import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/session";
import { getSystemSettings } from "@/lib/db/settings";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdmin();
  const system = await getSystemSettings();

  return (
    <AdminShell user={user} appName={system.appName}>
      {children}
    </AdminShell>
  );
}
