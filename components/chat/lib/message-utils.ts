import type { BaseMessage } from "@langchain/core/messages";

/**
 * Reads a message's visible text from `content`, which may be a plain string
 * or an array of content blocks. Only `type: "text"` blocks are joined, so
 * reasoning/thinking blocks can never become answer text.
 */
export function textOf(message: BaseMessage): string {
  const content = message.content;

  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((block) => {
      if (typeof block === "string") return block;
      if (
        block &&
        typeof block === "object" &&
        (block as { type?: unknown }).type === "text"
      ) {
        const text = (block as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      }
      return "";
    })
    .join("");
}

/** Turns anything thrown by the SDK into a short, human-readable message. */
export function readError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return "The assistant could not be reached.";
}

/**
 * The SDK reconciles optimistic input with the server echo by message id,
 * but a dedupe pass here keeps the render stable even if a reconnect
 * replays a snapshot.
 */
export function dedupeMessages(messages: BaseMessage[]): BaseMessage[] {
  const seen = new Set<string>();
  const unique: BaseMessage[] = [];

  for (const message of messages) {
    const id =
      typeof message.id === "string" && message.id.length > 0
        ? message.id
        : null;

    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }

    unique.push(message);
  }

  return unique;
}

export function findLastHumanIndex(messages: BaseMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].type === "human") return i;
  }
  return -1;
}

/** The newest AI message with visible text after the last human turn. */
export function getCurrentAnswer(
  messages: BaseMessage[],
  lastHumanIndex: number
): BaseMessage | null {
  for (let i = messages.length - 1; i > lastHumanIndex; i -= 1) {
    const message = messages[i];
    if (message.type === "ai" && textOf(message).trim().length > 0) {
      return message;
    }
  }
  return null;
}

export type FinalAnswerCheck = {
  ok: boolean;
  lastType: string | null;
  lastTextLength: number;
};

/**
 * Verifies the agent ended the turn with a written AI answer rather than an
 * empty or malformed message. Used to surface an empty answer instead of
 * silently hiding a broken run.
 */
export function checkFinalAnswer(messages: BaseMessage[]): FinalAnswerCheck {
  const last = messages[messages.length - 1];

  if (!last) {
    return { ok: false, lastType: null, lastTextLength: 0 };
  }

  const lastTextLength = textOf(last).length;

  return {
    ok: last.type === "ai" && lastTextLength > 0,
    lastType: last.type,
    lastTextLength,
  };
}

export type MessageSummary = {
  type: string;
  id: string | null;
  textLength: number;
};

/** Compact, serializable view of a run for the browser console. */
export function summarizeMessages(messages: BaseMessage[]): MessageSummary[] {
  return messages.map((message) => ({
    type: message.type,
    id: typeof message.id === "string" ? message.id : null,
    textLength: textOf(message).length,
  }));
}
