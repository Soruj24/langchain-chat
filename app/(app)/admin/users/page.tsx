import type { Metadata } from "next";

import { UsersManager } from "@/components/admin/users-manager";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "User management — Assistant",
};

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  return <UsersManager currentUserId={admin.id} />;
}
