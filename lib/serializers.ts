import type {
  ActivityDocument,
  SafeActivity,
} from "@/lib/db/models/activity";
import type {
  ConversationDocument,
  SafeConversation,
} from "@/lib/db/models/conversation";
import type {
  SafeUser,
  UserDocument,
  UserRole,
} from "@/lib/db/models/user";

type LeanUser = Partial<UserDocument> & { _id: unknown };
type LeanConversation = Partial<ConversationDocument> & { _id: unknown };
type LeanActivity = Partial<ActivityDocument> & {
  _id: unknown;
  actorId?: unknown;
};

function iso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function serializeUser(user: LeanUser): SafeUser {
  return {
    id: String(user._id),
    name: user.name ?? "",
    email: user.email ?? "",
    role: (user.role as UserRole) ?? "user",
    isActive: Boolean(user.isActive),
    sessionVersion: user.sessionVersion ?? 0,
    lastLoginAt: iso(user.lastLoginAt),
    createdAt: iso(user.createdAt) ?? new Date(0).toISOString(),
    updatedAt: iso(user.updatedAt) ?? new Date(0).toISOString(),
  };
}

export function serializeConversation(
  conversation: LeanConversation
): SafeConversation {
  return {
    id: String(conversation._id),
    threadId: conversation.threadId ?? "",
    userId: String(conversation.userId ?? ""),
    title: conversation.title ?? "New chat",
    messageCount: conversation.messageCount ?? 0,
    humanMessageCount: conversation.humanMessageCount ?? 0,
    aiMessageCount: conversation.aiMessageCount ?? 0,
    model: conversation.model ?? null,
    lastMessageAt: iso(conversation.lastMessageAt),
    createdAt: iso(conversation.createdAt) ?? new Date(0).toISOString(),
    updatedAt: iso(conversation.updatedAt) ?? new Date(0).toISOString(),
  };
}

export function serializeActivity(
  activity: LeanActivity,
  actor?: LeanUser | null
): SafeActivity {
  return {
    id: String(activity._id),
    actorId: activity.actorId ? String(activity.actorId) : null,
    actorName: actor?.name ?? null,
    actorEmail: actor?.email ?? null,
    action: activity.action ?? "",
    targetType: activity.targetType ?? null,
    targetId: activity.targetId ?? null,
    description: activity.description ?? "",
    createdAt: iso(activity.createdAt) ?? new Date(0).toISOString(),
  };
}
