import {
  apiOk,
  parseJson,
  requireApiAdmin,
  withApi,
} from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { connectDB } from "@/lib/db/connect";
import { AiSettings } from "@/lib/db/models/settings";
import { getAiSettings } from "@/lib/db/settings";
import { aiSettingsSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withApi<Record<string, string>>(async () => {
  await requireApiAdmin();
  const settings = await getAiSettings();
  return apiOk({ settings });
});

export const PATCH = withApi<Record<string, string>>(async (request) => {
  const admin = await requireApiAdmin();
  const body = aiSettingsSchema.parse(await parseJson(request));

  await connectDB();
  await AiSettings.findByIdAndUpdate(
    "ai",
    { $set: body },
    { upsert: true, returnDocument: "after", runValidators: true }
  );

  await logActivity({
    actorId: admin.id,
    action: "admin.ai_settings.updated",
    targetType: "settings",
    targetId: "ai",
    description: `${admin.email} updated the AI configuration.`,
  });

  return apiOk({ settings: await getAiSettings() });
});
