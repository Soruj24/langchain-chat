import "server-only";

const LANGGRAPH_URL = (
  process.env.LANGGRAPH_URL ??
  process.env.NEXT_PUBLIC_LANGGRAPH_URL ??
  "http://localhost:4000"
).replace(/\/+$/, "");

export const LANGGRAPH_BASE_URL = LANGGRAPH_URL;

type LangGraphThread = {
  thread_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  values?: { messages?: unknown[] } | Record<string, unknown>;
  status?: string;
};

type LangGraphMessage = {
  type?: string;
  content?: unknown;
};

export class LangGraphError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "LangGraphError";
    this.status = status;
  }
}

function headers(extra?: HeadersInit): Headers {
  const result = new Headers(extra);
  const apiKey = process.env.LANGGRAPH_API_KEY;
  if (apiKey) result.set("x-api-key", apiKey);
  return result;
}

export async function langGraphFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = `${LANGGRAPH_URL}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    return await fetch(url, {
      ...init,
      headers: headers(init.headers),
      cache: "no-store",
    });
  } catch (error) {
    console.error(`LangGraph request failed: ${init.method ?? "GET"} ${path}`, error);
    throw new LangGraphError(
      502,
      "The AI service is unavailable. Make sure the LangGraph server is running."
    );
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!response.ok) {
    throw new LangGraphError(
      response.status,
      text.slice(0, 500) || `LangGraph returned ${response.status}.`
    );
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export async function createLangGraphThread(input: {
  userId: string;
  userEmail: string;
  title?: string;
}): Promise<LangGraphThread> {
  const response = await langGraphFetch("/threads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      metadata: {
        user_id: input.userId,
        user_email: input.userEmail,
        title: input.title ?? "",
        created_from: "web",
      },
    }),
  });

  return readJson<LangGraphThread>(response);
}

export async function getLangGraphThread(
  threadId: string
): Promise<LangGraphThread | null> {
  const response = await langGraphFetch(
    `/threads/${encodeURIComponent(threadId)}`,
    { method: "GET" }
  );

  if (response.status === 404) return null;
  return readJson<LangGraphThread>(response);
}

export async function deleteLangGraphThread(threadId: string): Promise<void> {
  const response = await langGraphFetch(
    `/threads/${encodeURIComponent(threadId)}`,
    { method: "DELETE" }
  );

  // Deleting an already-missing thread is not an error for our callers.
  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new LangGraphError(
      response.status,
      text.slice(0, 500) || "Failed to delete LangGraph thread."
    );
  }
}

export async function getLangGraphState(
  threadId: string
): Promise<{ values?: { messages?: unknown[] } } | null> {
  const response = await langGraphFetch(
    `/threads/${encodeURIComponent(threadId)}/state`,
    { method: "GET" }
  );

  if (response.status === 404) return null;
  return readJson<{ values?: { messages?: unknown[] } }>(response);
}

export async function searchLangGraphThreads(input: {
  metadata?: Record<string, unknown>;
  limit?: number;
  offset?: number;
}): Promise<LangGraphThread[]> {
  const response = await langGraphFetch("/threads/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      metadata: input.metadata,
      limit: input.limit ?? 100,
      offset: input.offset ?? 0,
      sortBy: "updated_at",
      sortOrder: "desc",
      select: [
        "thread_id",
        "created_at",
        "updated_at",
        "metadata",
        "values",
        "status",
      ],
    }),
  });

  return readJson<LangGraphThread[]>(response);
}

export async function getAssistantInfo(
  assistantId: string
): Promise<Record<string, unknown> | null> {
  const response = await langGraphFetch(
    `/assistants/${encodeURIComponent(assistantId)}`,
    { method: "GET" }
  );
  if (response.status === 404) return null;
  return readJson<Record<string, unknown>>(response);
}

export function messageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part) {
        const text = (part as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      }
      return "";
    })
    .join(" ")
    .trim();
}

export type ThreadStats = {
  title: string;
  messageCount: number;
  humanMessageCount: number;
  aiMessageCount: number;
  lastMessageAt: Date | null;
};

export function statsFromMessages(
  values: { messages?: unknown[] } | null | undefined,
  fallbackTitle = "New chat"
): ThreadStats {
  const messages = Array.isArray(values?.messages) ? values.messages : [];

  let humanMessageCount = 0;
  let aiMessageCount = 0;
  let title = "";

  for (const raw of messages) {
    if (!raw || typeof raw !== "object") continue;
    const message = raw as LangGraphMessage;
    if (message.type === "human") {
      humanMessageCount += 1;
      if (!title) {
        title = messageText(message.content)
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 100);
      }
    } else if (message.type === "ai") {
      aiMessageCount += 1;
    }
  }

  return {
    title: title || fallbackTitle,
    messageCount: messages.length,
    humanMessageCount,
    aiMessageCount,
    lastMessageAt: messages.length ? new Date() : null,
  };
}
