import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const aiSettingsSchema = new Schema(
  {
    _id: { type: String, default: "ai" },
    models: { type: [String], default: ["ornith:latest"] },
    defaultModel: { type: String, default: "ornith:latest" },
    systemPrompt: { type: String, default: "" },
    temperature: { type: Number, default: 0.2, min: 0, max: 2 },
    maxTokens: { type: Number, default: 2048, min: 64, max: 32768 },
    toolsEnabled: { type: Boolean, default: true },
    suggestionsEnabled: { type: Boolean, default: true },
    modelSelectionEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const systemSettingsSchema = new Schema(
  {
    _id: { type: String, default: "system" },
    appName: { type: String, default: "Assistant", maxlength: 60 },
    logoUrl: { type: String, default: "" },
    maintenanceMode: { type: Boolean, default: false },
    registrationEnabled: { type: Boolean, default: true },
    defaultUserModel: { type: String, default: "" },
    welcomeMessage: {
      type: String,
      default: "What can I help you with?",
      maxlength: 160,
    },
  },
  { timestamps: true }
);

export type AiSettingsDocument = InferSchemaType<typeof aiSettingsSchema>;
export type SystemSettingsDocument = InferSchemaType<typeof systemSettingsSchema>;

export const AiSettings: Model<AiSettingsDocument> =
  (models.AiSettings as Model<AiSettingsDocument> | undefined) ??
  model("AiSettings", aiSettingsSchema);

export const SystemSettings: Model<SystemSettingsDocument> =
  (models.SystemSettings as Model<SystemSettingsDocument> | undefined) ??
  model("SystemSettings", systemSettingsSchema);
