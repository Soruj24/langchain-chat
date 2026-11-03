import {
  ApiError,
  apiOk,
  parseJson,
  requireApiAdmin,
  withApi,
} from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/user";
import { serializeUser } from "@/lib/serializers";
import { objectIdSchema, updateUserSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteParams = { id: string };

export const GET = withApi<RouteParams>(async (_request, context) => {
  await requireApiAdmin();
  const { id } = await context.params;
  const userId = objectIdSchema.parse(id);

  await connectDB();
  const user = await User.findById(userId).lean();
  if (!user) throw new ApiError(404, "User not found.", "not_found");

  return apiOk({ user: serializeUser(user) });
});

export const PATCH = withApi<RouteParams>(async (request, context) => {
  const admin = await requireApiAdmin();
  const { id } = await context.params;
  const userId = objectIdSchema.parse(id);
  const body = updateUserSchema.parse(await parseJson(request));

  await connectDB();
  const target = await User.findById(userId).lean();
  if (!target) throw new ApiError(404, "User not found.", "not_found");

  // An admin must not be able to lock themselves out of the panel.
  if (userId === admin.id) {
    if (body.role && body.role !== "admin") {
      throw new ApiError(
        422,
        "You cannot remove your own admin role.",
        "invalid_operation"
      );
    }
    if (body.isActive === false) {
      throw new ApiError(
        422,
        "You cannot deactivate your own account.",
        "invalid_operation"
      );
    }
  }

  // Keep at least one active admin in the system.
  const removesAdmin =
    target.role === "admin" &&
    (body.role === "user" || body.isActive === false);
  if (removesAdmin) {
    const activeAdmins = await User.countDocuments({
      role: "admin",
      isActive: true,
    });
    if (activeAdmins <= 1) {
      throw new ApiError(
        422,
        "At least one active admin must remain.",
        "invalid_operation"
      );
    }
  }

  const set: Record<string, unknown> = {};
  if (body.role !== undefined) set.role = body.role;
  if (body.isActive !== undefined) set.isActive = body.isActive;

  const changed =
    (body.role !== undefined && body.role !== target.role) ||
    (body.isActive !== undefined && body.isActive !== target.isActive);

  const updated = await User.findByIdAndUpdate(
    userId,
    {
      $set: set,
      // Invalidates the target's existing sessions after a privilege change.
      ...(changed ? { $inc: { sessionVersion: 1 } } : {}),
    },
    { returnDocument: "after", runValidators: true }
  ).lean();

  if (!updated) throw new ApiError(404, "User not found.", "not_found");

  if (changed) {
    await logActivity({
      actorId: admin.id,
      action: "admin.user.updated",
      targetType: "user",
      targetId: userId,
      description: `${admin.email} updated ${target.email} (${body.role ?? target.role}, active: ${body.isActive ?? target.isActive}).`,
    });
  }

  return apiOk({ user: serializeUser(updated) });
});
