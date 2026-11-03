import { apiOk, requireApiAdmin, withApi } from "@/lib/api";
import { reconcileConversations } from "@/lib/conversations";
import { connectDB } from "@/lib/db/connect";
import { Conversation } from "@/lib/db/models/conversation";
import { User } from "@/lib/db/models/user";
import { serializeConversation } from "@/lib/serializers";
import { adminConversationQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const GET = withApi<Record<string, string>>(async (request) => {
  await requireApiAdmin();
  await connectDB();

  let warning: string | null = null;
  try {
    await reconcileConversations(undefined, 200);
  } catch (error) {
    console.error("Admin conversation reconciliation failed:", error);
    warning = "The AI service is offline. Conversation data may be stale.";
  }

  const url = new URL(request.url);
  const { q, page, limit, userId } = adminConversationQuerySchema.parse({
    q: url.searchParams.get("q") ?? "",
    page: url.searchParams.get("page") ?? 1,
    limit: url.searchParams.get("limit") ?? 20,
    userId: url.searchParams.get("userId") ?? "",
  });

  const filter: Record<string, unknown> = {};
  if (q) filter.title = new RegExp(escapeRegex(q), "i");
  if (userId) filter.userId = userId;

  const [total, docs] = await Promise.all([
    Conversation.countDocuments(filter),
    Conversation.find(filter)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const ownerIds = Array.from(
    new Set(docs.map((doc) => String(doc.userId)))
  );
  const owners = ownerIds.length
    ? await User.find({ _id: { $in: ownerIds } })
        .select("name email")
        .lean()
    : [];
  const ownerMap = new Map(owners.map((owner) => [String(owner._id), owner]));

  return apiOk({
    items: docs.map((doc) => {
      const owner = ownerMap.get(String(doc.userId));
      return {
        ...serializeConversation(doc),
        owner: owner
          ? { name: owner.name, email: owner.email }
          : null,
      };
    }),
    total,
    page,
    limit,
    warning,
  });
});
