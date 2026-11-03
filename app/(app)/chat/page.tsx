import type { Metadata } from "next";

import Chat from "@/components/chat/Chat";
import type { ChatRuntimeConfig } from "@/components/chat/config";
import { requireUser } from "@/lib/auth/session";
import {
  getAiSettings,
  getSystemSettings,
  resolveUserModel,
} from "@/lib/db/settings";
import { threadIdSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat — Assistant",
};

type ChatPageProps = {
  searchParams: Promise<{ thread?: string }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const user = await requireUser();
  const [ai, system, params] = await Promise.all([
    getAiSettings(),
    getSystemSettings(),
    searchParams,
  ]);

  const requested = params.thread;
  const initialThreadId =
    requested && threadIdSchema.safeParse(requested).success ? requested : null;

  const config: ChatRuntimeConfig = {
    appName: system.appName,
    welcomeMessage: system.welcomeMessage,
    models: ai.models,
    defaultModel: resolveUserModel(ai, system),
    modelSelectionEnabled: ai.modelSelectionEnabled,
    suggestionsEnabled: ai.suggestionsEnabled,
  };

  return (
    <Chat
      user={{ name: user.name, email: user.email, role: user.role }}
      config={config}
      initialThreadId={initialThreadId}
    />
  );
}
