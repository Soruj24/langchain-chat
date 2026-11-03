import { z } from "zod";

import { USER_ROLES } from "@/lib/db/models/user";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(254, "Email is too long.")
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.")
  .regex(/[A-Za-z]/, "Password must contain a letter.")
  .regex(/[0-9]/, "Password must contain a number.");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters.")
  .max(80, "Name must be at most 80 characters.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(72),
  callbackUrl: z.string().max(500).optional(),
});

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const profileSchema = z.object({
  name: nameSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required.").max(72),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "Choose a password different from your current one.",
  });

export const updateUserSchema = z
  .object({
    role: z.enum(USER_ROLES).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.role !== undefined || data.isActive !== undefined, {
    message: "Nothing to update.",
  });

export const aiSettingsSchema = z
  .object({
    models: z
      .array(z.string().trim().min(1).max(120))
      .min(1, "At least one model is required.")
      .max(30, "Too many models.")
      .transform((models) => Array.from(new Set(models))),
    defaultModel: z.string().trim().min(1, "A default model is required."),
    systemPrompt: z
      .string()
      .trim()
      .min(1, "System prompt is required.")
      .max(8000, "System prompt is too long."),
    temperature: z.coerce.number().min(0).max(2),
    maxTokens: z.coerce.number().int().min(64).max(32768),
    toolsEnabled: z.boolean(),
    suggestionsEnabled: z.boolean(),
    modelSelectionEnabled: z.boolean(),
  })
  .refine((data) => data.models.includes(data.defaultModel), {
    path: ["defaultModel"],
    message: "The default model must be one of the available models.",
  });

export const systemSettingsSchema = z.object({
  appName: z.string().trim().min(1).max(60),
  logoUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) =>
        value === "" ||
        value.startsWith("/") ||
        /^https?:\/\/[^\s]+$/i.test(value),
      "Use an https:// URL or a path starting with /."
    ),
  maintenanceMode: z.boolean(),
  registrationEnabled: z.boolean(),
  defaultUserModel: z.string().trim().max(120),
  welcomeMessage: z.string().trim().min(1).max(160),
});

export const threadIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{8,128}$/, "Invalid thread id.");

export const objectIdSchema = z
  .string()
  .regex(/^[a-f0-9]{24}$/i, "Invalid id.");

export const paginationSchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const adminUserQuerySchema = paginationSchema.extend({
  role: z.enum(["all", ...USER_ROLES]).optional().default("all"),
  active: z.enum(["all", "active", "inactive"]).optional().default("all"),
});

export const adminConversationQuerySchema = paginationSchema.extend({
  userId: objectIdSchema
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const passwordChangeRequestSchema = changePasswordSchema;

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid request.";
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !result[key]) result[key] = issue.message;
  }
  return result;
}
