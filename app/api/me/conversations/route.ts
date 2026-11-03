import { apiOk, requireApiUser, withApi } from "@/lib/api";
import { reconcileConversations } from "@/lib/conversations";
import { connectDB } from "@/lib/db/connect";
import { Conversation } from "@/lib/db/models/conversation";
import { serializeConversation } from "@/lib/serializers";
import { paginationSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const GET = withApi<Record<string, string>>(async (request) => {
  const user = await requireApiUser();
  const url = new URL(request.url);
  const { q, page, limit } = paginationSchema.parse({
    q: url.searchParams.get("q") ?? "",
    page: url.searchParams.get("page") ?? 1,
    limit: url.searchParams.get("limit") ?? 20,
  });

  let warning: string | null = null;
  try {
    // Real LangGraph threads are the source of truth; the mirror is repaired
    // on every list so the sidebar cannot drift after a failed sync.
    await reconcileConversations(user.id, 200);
  } catch (error) {
    console.error("Failed to reconcile conversations:", error);
    warning = "The AI service is offline. Showing the last saved history.";
  }

  await connectDB();
  const filter: Record<string, unknown> = { userId: user.id };
  if (q) {
    filter.title = new RegExp(escapeRegex(q), "i");
  }

  const [total, docs] = await Promise.all([
    Conversation.countDocuments(filter),
    Conversation.find(filter)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return apiOk({
    items: docs.map(serializeConversation),
    total,
    page,
    limit,
    warning,
  });
});
