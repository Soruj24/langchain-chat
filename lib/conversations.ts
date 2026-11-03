import "server-only";

import { ApiError } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { connectDB } from "@/lib/db/connect";
import { Conversation } from "@/lib/db/models/conversation";
import type { SafeUser } from "@/lib/db/models/user";
import {
  createLangGraphThread,
  deleteLangGraphThread,
  getLangGraphState,
  getLangGraphThread,
  searchLangGraphThreads,
  statsFromMessages,
  type ThreadStats,
} from "@/lib/langgraph";
import { serializeConversation } from "@/lib/serializers";
import type { SafeConversation } from "@/lib/db/models/conversation";

type AccessOptions = { allowAdmin?: boolean };

export type ThreadAccess = {
  thread: NonNullable<Awaited<ReturnType<typeof getLangGraphThread>>>;
  conversation: SafeConversation | null;
};

/**
 * The single authorization gate for a LangGraph thread.
 *
 * Ownership comes from the MongoDB mirror when present, otherwise from the
 * thread's server-written metadata. A caller-supplied `user_id` is never used.
 * Non-admins receive 404 (not 403) so thread ids cannot be probed.
 */
export async function requireThreadAccess(
  threadId: string,
  user: SafeUser,
  { allowAdmin = false }: AccessOptions = {}
): Promise<ThreadAccess> {
  await connectDB();

  const thread = await getLangGraphThread(threadId);
  if (!thread) {
    throw new ApiError(404, "Conversation not found.", "not_found");
  }

  const conversationDoc = await Conversation.findOne({ threadId }).lean();
  const metadataOwner =
    typeof thread.metadata?.user_id === "string"
      ? thread.metadata.user_id
      : null;
  const ownerId = conversationDoc
    ? String(conversationDoc.userId)
    : metadataOwner;

  const isAdmin = allowAdmin && user.role === "admin";
  if (!isAdmin && ownerId !== user.id) {
    throw new ApiError(404, "Conversation not found.", "not_found");
  }

  return {
    thread,
    conversation: conversationDoc
      ? serializeConversation(conversationDoc)
      : null,
  };
}

export async function createConversationForUser(
  user: SafeUser
): Promise<SafeConversation> {
  await connectDB();

  const thread = await createLangGraphThread({
    userId: user.id,
    userEmail: user.email,
  });

  try {
    const conversation = await Conversation.create({
      threadId: thread.thread_id,
      userId: user.id,
      title: "New chat",
      messageCount: 0,
      humanMessageCount: 0,
      aiMessageCount: 0,
      lastMessageAt: null,
    });

    await logActivity({
      actorId: user.id,
      action: "conversation.created",
      targetType: "conversation",
      targetId: thread.thread_id,
      description: "Started a new conversation.",
    });

    return serializeConversation(conversation.toObject());
  } catch (error) {
    // Never leave an unowned LangGraph thread behind.
    await deleteLangGraphThread(thread.thread_id).catch(() => undefined);
    throw error;
  }
}

export async function syncConversation(
  threadId: string,
  user: SafeUser,
  model?: string | null
): Promise<SafeConversation> {
  const { thread, conversation } = await requireThreadAccess(threadId, user);

  // Prefer the authoritative live state; search results may omit `values`.
  const state = await getLangGraphState(threadId);
  const values =
    state?.values ??
    (thread.values as { messages?: unknown[] } | undefined) ??
    null;

  const stats = statsFromMessages(values);
  const hasMessages = Boolean(values && Array.isArray(values.messages));

  const update: Record<string, unknown> = {
    messageCount: stats.messageCount,
    humanMessageCount: stats.humanMessageCount,
    aiMessageCount: stats.aiMessageCount,
    lastMessageAt: stats.lastMessageAt ?? new Date(),
  };

  if (model) update.model = model;

  if (hasMessages && stats.humanMessageCount > 0) {
    update.title = stats.title;
  }

  const updated = await Conversation.findOneAndUpdate(
    { threadId },
    {
      $set: update,
      $setOnInsert: {
        threadId,
        userId: user.id,
      },
    },
    { upsert: true, returnDocument: "after" }
  ).lean();

  return updated
    ? serializeConversation(updated)
    : conversation ?? {
        id: threadId,
        threadId,
        userId: user.id,
        title: stats.title,
        messageCount: stats.messageCount,
        humanMessageCount: stats.humanMessageCount,
        aiMessageCount: stats.aiMessageCount,
        model: null,
        lastMessageAt: stats.lastMessageAt?.toISOString() ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
}

/**
 * Mirrors LangGraph's authoritative thread list into MongoDB. This keeps the
 * dashboard based on real threads (and repairs anything a failed sync missed).
 */
export async function reconcileConversations(
  userId?: string,
  limit = 200
): Promise<number> {
  await connectDB();

  const threads = await searchLangGraphThreads({
    metadata: userId ? { user_id: userId } : undefined,
    limit,
  });

  let changed = 0;

  for (const thread of threads) {
    const owner =
      typeof thread.metadata?.user_id === "string"
        ? thread.metadata.user_id
        : null;

    // Admin reconciliation skips threads with no owner rather than inventing one.
    if (!owner) continue;
    if (userId && owner !== userId) continue;

    const hasValues = Array.isArray(thread.values?.messages);
    const stats: ThreadStats = statsFromMessages(
      thread.values as { messages?: unknown[] } | undefined
    );

    const update: Record<string, unknown> = {};
    if (hasValues) {
      update.messageCount = stats.messageCount;
      update.humanMessageCount = stats.humanMessageCount;
      update.aiMessageCount = stats.aiMessageCount;
      update.lastMessageAt = new Date(thread.updated_at);
      if (stats.humanMessageCount > 0) update.title = stats.title;
    }

    const result = await Conversation.updateOne(
      { threadId: thread.thread_id },
      {
        ...(Object.keys(update).length ? { $set: update } : {}),
        $setOnInsert: {
          threadId: thread.thread_id,
          userId: owner,
          // Avoid writing `title` twice when the live thread already has one.
          ...(update.title ? {} : { title: "New chat" }),
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount || result.modifiedCount) changed += 1;
  }

  return changed;
}

export async function deleteConversation(
  threadId: string,
  user: SafeUser,
  { allowAdmin = false }: AccessOptions = {}
): Promise<void> {
  await requireThreadAccess(threadId, user, { allowAdmin });

  await deleteLangGraphThread(threadId);
  await Conversation.deleteOne({ threadId });

  await logActivity({
    actorId: user.id,
    action: allowAdmin && user.role === "admin"
      ? "admin.conversation.deleted"
      : "user.conversation.deleted",
    targetType: "conversation",
    targetId: threadId,
    description: `${user.email} deleted conversation ${threadId}.`,
  });
}

export type ConversationMessage = {
  id: string;
  type: string;
  content: string;
  name?: string;
};

export async function getConversationMessages(
  threadId: string,
  user: SafeUser,
  { allowAdmin = false }: AccessOptions = {}
): Promise<{ messages: ConversationMessage[]; title: string }> {
  const { thread } = await requireThreadAccess(threadId, user, { allowAdmin });
  const state = await getLangGraphState(threadId);
  const values =
    state?.values ??
    (thread.values as { messages?: unknown[] } | undefined) ??
    null;

  const rawMessages = Array.isArray(values?.messages) ? values.messages : [];
  const messages: ConversationMessage[] = rawMessages
    .filter((message): message is Record<string, unknown> => Boolean(message))
    .map((message, index) => {
      const content = message.content;
      let text = "";
      if (typeof content === "string") text = content;
      else if (Array.isArray(content)) {
        text = content
          .map((part) => {
            if (typeof part === "string") return part;
            if (part && typeof part === "object" && "text" in part) {
              const value = (part as { text?: unknown }).text;
              return typeof value === "string" ? value : "";
            }
            return "";
          })
          .join(" ");
      }

      return {
        id: typeof message.id === "string" ? message.id : `${threadId}:${index}`,
        type: typeof message.type === "string" ? message.type : "unknown",
        content: text,
        name: typeof message.name === "string" ? message.name : undefined,
      };
    });

  const stats = statsFromMessages(values);
  return { messages, title: stats.title };
}
