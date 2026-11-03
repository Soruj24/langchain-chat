import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/api";
import { requireThreadAccess } from "@/lib/conversations";
import { LANGGRAPH_BASE_URL, langGraphFetch } from "@/lib/langgraph";
import { threadIdSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const ALLOWED_STATELESS_ASSISTANTS = new Set(["suggestions"]);

function jsonError(status: number, message: string) {
  return NextResponse.json(
    { ok: false, error: { code: "forbidden", message } },
    { status }
  );
}

async function readBody(request: Request): Promise<Buffer | undefined> {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const buffer = await request.arrayBuffer();
  return buffer.byteLength ? Buffer.from(buffer) : undefined;
}

function passThrough(upstream: Response): Response {
  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("cache-control", "no-cache, no-transform");
  headers.set("x-accel-buffering", "no");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

/**
 * Authenticated reverse proxy for the LangGraph server.
 *
 * The browser never receives the LangGraph URL. Every thread-scoped request is
 * checked against the user that owns it before anything is forwarded, so a
 * guessed thread id cannot be used to read or mutate another user's chat.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  return handle(request, context);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  return handle(request, context);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  return handle(request, context);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  return handle(request, context);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  return handle(request, context);
}

async function handle(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  let user;
  try {
    user = await requireApiUser();
  } catch {
    return jsonError(401, "You must be signed in.");
  }

  const { path: segments } = await context.params;
  if (!segments?.length) return jsonError(404, "Not found.");

  const method = request.method.toUpperCase();
  const body = await readBody(request);

  const [root, second] = segments;

  // ---- Assistants: read-only, required for graph metadata. -----------------
  if (root === "assistants") {
    if (method !== "GET") return jsonError(405, "Method not allowed.");
    return forward(request, body);
  }

  // ---- Stateless runs: suggestions only. ----------------------------------
  if (root === "runs") {
    if (method !== "POST" || segments.length !== 2) {
      return jsonError(403, "This run endpoint is not available.");
    }

    const parsed = parseJsonBody(body);
    const assistantId =
      parsed && typeof parsed.assistant_id === "string"
        ? parsed.assistant_id
        : "";
    const bodyThreadId =
      parsed && typeof parsed.thread_id === "string" ? parsed.thread_id : null;

    if (bodyThreadId) {
      try {
        await requireThreadAccess(bodyThreadId, user, { allowAdmin: true });
      } catch {
        return jsonError(404, "Conversation not found.");
      }
    }

    if (!ALLOWED_STATELESS_ASSISTANTS.has(assistantId) && !bodyThreadId) {
      return jsonError(403, "This run endpoint is not available.");
    }

    return forward(request, body);
  }

  if (root !== "threads") return jsonError(404, "Not found.");

  // ---- Thread collection ---------------------------------------------------
  if (segments.length === 1) {
    // Threads are created by POST /api/threads so ownership metadata is
    // always written by the server. Clients cannot create raw threads.
    return jsonError(403, "Create conversations through /api/threads.");
  }

  if (segments.length === 2 && (second === "search" || second === "count")) {
    if (second === "count") return jsonError(403, "Not available.");
    if (method !== "POST") return jsonError(405, "Method not allowed.");

    const parsed = parseJsonBody(body) ?? {};
    // Force the owner filter. A caller cannot widen it by sending metadata.
    const metadata =
      parsed.metadata && typeof parsed.metadata === "object"
        ? { ...(parsed.metadata as Record<string, unknown>) }
        : {};
    metadata.user_id = user.id;

    const nextBody = Buffer.from(JSON.stringify({ ...parsed, metadata }));
    return forward(request, nextBody);
  }

  if (segments.length === 2 && second === "prune") {
    return jsonError(403, "Not available.");
  }

  // ---- Individual thread ---------------------------------------------------
  const threadId = second;
  if (!threadIdSchema.safeParse(threadId).success) {
    return jsonError(404, "Conversation not found.");
  }

  try {
    await requireThreadAccess(threadId, user, { allowAdmin: true });
  } catch {
    // 404 for both missing and foreign threads: no existence leak.
    return jsonError(404, "Conversation not found.");
  }

  // Copying a thread would create a new thread with no owner metadata.
  if (segments[2] === "copy") return jsonError(403, "Not available.");

  // Metadata updates could reassign ownership; only `state` and run traffic
  // are allowed through for thread updates.
  if (segments.length === 2 && method === "PATCH") {
    return jsonError(403, "Thread metadata cannot be changed from the client.");
  }

  return forward(request, body);
}

function parseJsonBody(body: Buffer | undefined): Record<string, unknown> | null {
  if (!body) return null;
  try {
    const value: unknown = JSON.parse(body.toString("utf8"));
    return value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

async function forward(request: Request, body: Buffer | undefined) {
  const url = new URL(request.url);
  const path = `${url.pathname.replace(/^\/api\/langgraph/, "")}${url.search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);
  const lastEventId = request.headers.get("last-event-id");
  if (lastEventId) headers.set("last-event-id", lastEventId);

  const upstream = await langGraphFetch(path, {
    method: request.method,
    headers,
    body: body ? new Uint8Array(body) : undefined,
    signal: request.signal,
  });

  return passThrough(upstream);
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "X-LangGraph-Backend": LANGGRAPH_BASE_URL ? "configured" : "missing",
    },
  });
}
