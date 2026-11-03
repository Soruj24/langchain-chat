import { apiOk, parseJson, requireApiUser, withApi } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/user";
import { serializeUser } from "@/lib/serializers";
import { profileSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withApi<Record<string, string>>(async () => {
  const user = await requireApiUser();
  return apiOk({ user });
});

export const PATCH = withApi<Record<string, string>>(async (request) => {
  const current = await requireApiUser();
  const body = profileSchema.parse(await parseJson(request));

  await connectDB();
  const updated = await User.findByIdAndUpdate(
    current.id,
    { $set: { name: body.name } },
    { returnDocument: "after", runValidators: true }
  ).lean();

  if (!updated) {
    return apiOk({ user: current });
  }

  await logActivity({
    actorId: current.id,
    action: "user.profile.updated",
    targetType: "user",
    targetId: current.id,
    description: `${current.email} updated their profile.`,
  });

  return apiOk({ user: serializeUser(updated) });
});
