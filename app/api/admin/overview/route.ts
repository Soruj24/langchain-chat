import { apiOk, requireApiAdmin, withApi } from "@/lib/api";
import { reconcileConversations } from "@/lib/conversations";
import { connectDB } from "@/lib/db/connect";
import { ActivityLog } from "@/lib/db/models/activity";
import { Conversation } from "@/lib/db/models/conversation";
import { User } from "@/lib/db/models/user";
import {
  serializeActivity,
  serializeUser,
} from "@/lib/serializers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DAY_MS = 24 * 60 * 60 * 1000;

export const GET = withApi<Record<string, string>>(async () => {
  await requireApiAdmin();
  await connectDB();

  let warning: string | null = null;
  try {
    await reconcileConversations(undefined, 200);
  } catch (error) {
    console.error("Admin overview reconciliation failed:", error);
    warning = "The AI service is offline. Conversation totals may be stale.";
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalUsers,
    activeUsers,
    adminUsers,
    newUsers,
    totalConversations,
    conversationsToday,
    messageTotals,
    modelUsage,
    activityDocs,
    recentUserDocs,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    Conversation.countDocuments({}),
    Conversation.countDocuments({ lastMessageAt: { $gte: today } }),
    Conversation.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: "$messageCount" } } },
    ]),
    Conversation.aggregate<{ _id: string; count: number }>([
      { $match: { model: { $nin: [null, ""] } } },
      { $group: { _id: "$model", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    ActivityLog.find({}).sort({ createdAt: -1 }).limit(12).lean(),
    User.find({}).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const actorIds = Array.from(
    new Set(
      activityDocs
        .map((entry) => (entry.actorId ? String(entry.actorId) : null))
        .filter((id): id is string => Boolean(id))
    )
  );
  const actors = actorIds.length
    ? await User.find({ _id: { $in: actorIds } }).lean()
    : [];
  const actorMap = new Map(actors.map((actor) => [String(actor._id), actor]));

  return apiOk({
    stats: {
      totalUsers,
      activeUsers,
      adminUsers,
      newUsersThisWeek: newUsers,
      totalConversations,
      conversationsToday,
      totalMessages: messageTotals[0]?.total ?? 0,
    },
    modelUsage: modelUsage.map((entry) => ({
      model: entry._id,
      count: entry.count,
    })),
    recentActivity: activityDocs.map((entry) =>
      serializeActivity(
        entry,
        entry.actorId ? actorMap.get(String(entry.actorId)) : null
      )
    ),
    recentUsers: recentUserDocs.map(serializeUser),
    warning,
  });
});
