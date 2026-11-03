import { apiOk, requireApiAdmin, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db/connect";
import { Conversation } from "@/lib/db/models/conversation";
import { User } from "@/lib/db/models/user";
import { serializeUser } from "@/lib/serializers";
import { adminUserQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const GET = withApi<Record<string, string>>(async (request) => {
  await requireApiAdmin();
  await connectDB();

  const url = new URL(request.url);
  const { q, page, limit, role, active } = adminUserQuerySchema.parse({
    q: url.searchParams.get("q") ?? "",
    page: url.searchParams.get("page") ?? 1,
    limit: url.searchParams.get("limit") ?? 20,
    role: url.searchParams.get("role") ?? "all",
    active: url.searchParams.get("active") ?? "all",
  });

  const filter: Record<string, unknown> = {};
  if (q) {
    const pattern = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: pattern }, { email: pattern }];
  }
  if (role !== "all") filter.role = role;
  if (active !== "all") filter.isActive = active === "active";

  const [total, docs] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const ids = docs.map((doc) => doc._id);
  const conversationCounts = ids.length
    ? await Conversation.aggregate<{ _id: unknown; count: number }>([
        { $match: { userId: { $in: ids } } },
        { $group: { _id: "$userId", count: { $sum: 1 } } },
      ])
    : [];
  const counts = new Map(
    conversationCounts.map((entry) => [String(entry._id), entry.count])
  );

  return apiOk({
    items: docs.map((doc) => ({
      ...serializeUser(doc),
      conversationCount: counts.get(String(doc._id)) ?? 0,
    })),
    total,
    page,
    limit,
  });
});
