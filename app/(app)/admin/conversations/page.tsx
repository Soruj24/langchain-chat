import type { Metadata } from "next";

import { ConversationsManager } from "@/components/admin/conversations-manager";

export const metadata: Metadata = {
  title: "Conversations — Assistant",
};

export default function AdminConversationsPage() {
  return <ConversationsManager />;
}
