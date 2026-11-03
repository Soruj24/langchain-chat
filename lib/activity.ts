import { connectDB } from "@/lib/db/connect";
import { ActivityLog } from "@/lib/db/models/activity";

type LogActivityInput = {
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  description?: string;
  metadata?: Record<string, unknown>;
};

/** Audit trail writes must never break the user-facing operation. */
export async function logActivity({
  actorId = null,
  action,
  targetType = null,
  targetId = null,
  description = "",
  metadata = {},
}: LogActivityInput): Promise<void> {
  try {
    await connectDB();
    await ActivityLog.create({
      actorId,
      action,
      targetType,
      targetId,
      description,
      metadata,
    });
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
}
