import { apiOk, withApi } from "@/lib/api";
import {
  getAiSettings,
  getSystemSettings,
} from "@/lib/db/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Public, non-sensitive runtime configuration used by the app shell. */
export const GET = withApi<Record<string, string>>(async () => {
  const [ai, system] = await Promise.all([
    getAiSettings(),
    getSystemSettings(),
  ]);

  return apiOk({
    app: {
      appName: system.appName,
      logoUrl: system.logoUrl,
      welcomeMessage: system.welcomeMessage,
      maintenanceMode: system.maintenanceMode,
      registrationEnabled: system.registrationEnabled,
    },
    ai: {
      models: ai.models,
      defaultModel: ai.defaultModel,
      modelSelectionEnabled: ai.modelSelectionEnabled,
      suggestionsEnabled: ai.suggestionsEnabled,
      toolsEnabled: ai.toolsEnabled,
    },
  });
});
