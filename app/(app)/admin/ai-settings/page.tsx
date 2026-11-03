import type { Metadata } from "next";

import { AiSettingsForm } from "@/components/admin/ai-settings-form";

export const metadata: Metadata = {
  title: "AI configuration — Assistant",
};

export default function AdminAiSettingsPage() {
  return <AiSettingsForm />;
}
