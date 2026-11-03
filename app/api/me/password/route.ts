import {
  ApiError,
  apiOk,
  parseJson,
  requireApiUser,
  withApi,
} from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/user";
import { changePasswordSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Changing the password bumps `sessionVersion`, which invalidates every
 * existing JWT (including the current one). The client signs out afterwards.
 */
export const POST = withApi<Record<string, string>>(async (request) => {
  const current = await requireApiUser();
  const body = changePasswordSchema.parse(await parseJson(request));

  await connectDB();
  const user = await User.findById(current.id).select("+passwordHash").lean();
  if (!user?.passwordHash) {
    throw new ApiError(404, "Account not found.", "not_found");
  }

  const valid = await verifyPassword(body.currentPassword, user.passwordHash);
  if (!valid) {
    throw new ApiError(
      422,
      "Your current password is incorrect.",
      "invalid_password"
    );
  }

  const passwordHash = await hashPassword(body.newPassword);
  await User.updateOne(
    { _id: user._id },
    {
      $set: { passwordHash },
      $inc: { sessionVersion: 1 },
    }
  );

  await logActivity({
    actorId: current.id,
    action: "user.password.changed",
    targetType: "user",
    targetId: current.id,
    description: `${current.email} changed their password.`,
  });

  return apiOk({ signedOut: true });
});
