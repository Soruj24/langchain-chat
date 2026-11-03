import type { Metadata } from "next";

import { SystemSettingsForm } from "@/components/admin/system-settings-form";

export const metadata: Metadata = {
  title: "System settings — Assistant",
};

export default function AdminSystemSettingsPage() {
  return <SystemSettingsForm />;
}
