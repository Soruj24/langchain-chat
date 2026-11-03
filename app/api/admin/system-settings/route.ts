import {
  apiOk,
  parseJson,
  requireApiAdmin,
  withApi,
} from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { connectDB } from "@/lib/db/connect";
import { SystemSettings } from "@/lib/db/models/settings";
import { getSystemSettings } from "@/lib/db/settings";
import { systemSettingsSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withApi<Record<string, string>>(async () => {
  await requireApiAdmin();
  return apiOk({ settings: await getSystemSettings() });
});

export const PATCH = withApi<Record<string, string>>(async (request) => {
  const admin = await requireApiAdmin();
  const body = systemSettingsSchema.parse(await parseJson(request));

  await connectDB();
  await SystemSettings.findByIdAndUpdate(
    "system",
    { $set: body },
    { upsert: true, returnDocument: "after", runValidators: true }
  );

  await logActivity({
    actorId: admin.id,
    action: "admin.system_settings.updated",
    targetType: "settings",
    targetId: "system",
    description: `${admin.email} updated the system settings.`,
  });

  return apiOk({ settings: await getSystemSettings() });
});
