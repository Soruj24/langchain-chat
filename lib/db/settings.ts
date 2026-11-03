import { connectDB } from "@/lib/db/connect";
import {
  AiSettings,
  type AiSettingsDocument,
} from "@/lib/db/models/settings";
import {
  SystemSettings,
  type SystemSettingsDocument,
} from "@/lib/db/models/settings";

export const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant.

Instructions:
- Answer user questions clearly and accurately.
- Respond in the same language as the user.
- Keep answers concise unless the user asks for details.`;

export type AiSettingsData = {
  models: string[];
  defaultModel: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  toolsEnabled: boolean;
  suggestionsEnabled: boolean;
  modelSelectionEnabled: boolean;
};

export type SystemSettingsData = {
  appName: string;
  logoUrl: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  defaultUserModel: string;
  welcomeMessage: string;
};

export const DEFAULT_AI_SETTINGS: AiSettingsData = {
  models: ["ornith:latest"],
  defaultModel: "ornith:latest",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  temperature: 0.2,
  maxTokens: 2048,
  toolsEnabled: true,
  suggestionsEnabled: true,
  modelSelectionEnabled: true,
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsData = {
  appName: "Assistant",
  logoUrl: "",
  maintenanceMode: false,
  registrationEnabled: true,
  defaultUserModel: "",
  welcomeMessage: "What can I help you with?",
};

function normalizeAiSettings(
  value: Partial<AiSettingsDocument> | null
): AiSettingsData {
  const models =
    value?.models?.filter((model) => typeof model === "string" && model.trim()) ??
    DEFAULT_AI_SETTINGS.models;

  const uniqueModels = Array.from(new Set(models.map((model) => model.trim())));
  const safeModels = uniqueModels.length
    ? uniqueModels
    : DEFAULT_AI_SETTINGS.models;

  const requestedDefault = value?.defaultModel?.trim() ?? "";
  const defaultModel = safeModels.includes(requestedDefault)
    ? requestedDefault
    : safeModels[0];

  return {
    models: safeModels,
    defaultModel,
    systemPrompt:
      value?.systemPrompt?.trim() || DEFAULT_AI_SETTINGS.systemPrompt,
    temperature:
      typeof value?.temperature === "number"
        ? value.temperature
        : DEFAULT_AI_SETTINGS.temperature,
    maxTokens:
      typeof value?.maxTokens === "number"
        ? value.maxTokens
        : DEFAULT_AI_SETTINGS.maxTokens,
    toolsEnabled:
      typeof value?.toolsEnabled === "boolean"
        ? value.toolsEnabled
        : DEFAULT_AI_SETTINGS.toolsEnabled,
    suggestionsEnabled:
      typeof value?.suggestionsEnabled === "boolean"
        ? value.suggestionsEnabled
        : DEFAULT_AI_SETTINGS.suggestionsEnabled,
    modelSelectionEnabled:
      typeof value?.modelSelectionEnabled === "boolean"
        ? value.modelSelectionEnabled
        : DEFAULT_AI_SETTINGS.modelSelectionEnabled,
  };
}

function normalizeSystemSettings(
  value: Partial<SystemSettingsDocument> | null
): SystemSettingsData {
  return {
    appName: value?.appName?.trim() || DEFAULT_SYSTEM_SETTINGS.appName,
    logoUrl: value?.logoUrl?.trim() || "",
    maintenanceMode: Boolean(value?.maintenanceMode),
    registrationEnabled:
      typeof value?.registrationEnabled === "boolean"
        ? value.registrationEnabled
        : DEFAULT_SYSTEM_SETTINGS.registrationEnabled,
    defaultUserModel: value?.defaultUserModel?.trim() || "",
    welcomeMessage:
      value?.welcomeMessage?.trim() || DEFAULT_SYSTEM_SETTINGS.welcomeMessage,
  };
}

export async function getAiSettings(): Promise<AiSettingsData> {
  await connectDB();
  const settings = await AiSettings.findById("ai").lean();
  return normalizeAiSettings(settings);
}

export async function getSystemSettings(): Promise<SystemSettingsData> {
  await connectDB();
  const settings = await SystemSettings.findById("system").lean();
  return normalizeSystemSettings(settings);
}

/** Creates the singleton settings documents if they do not exist yet. */
export async function ensureSettings(): Promise<void> {
  await connectDB();
  await Promise.all([
    AiSettings.updateOne(
      { _id: "ai" },
      { $setOnInsert: DEFAULT_AI_SETTINGS },
      { upsert: true }
    ),
    SystemSettings.updateOne(
      { _id: "system" },
      { $setOnInsert: DEFAULT_SYSTEM_SETTINGS },
      { upsert: true }
    ),
  ]);
}

/** Model a user may select, or the configured default. */
export function resolveUserModel(
  ai: AiSettingsData,
  system: SystemSettingsData,
  requested?: string | null
): string {
  if (requested && ai.models.includes(requested)) return requested;
  if (system.defaultUserModel && ai.models.includes(system.defaultUserModel)) {
    return system.defaultUserModel;
  }
  return ai.defaultModel;
}
