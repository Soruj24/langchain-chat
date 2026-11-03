import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import type { SafeUser } from "@/lib/db/models/user";
import { LangGraphError } from "@/lib/langgraph";
import { firstZodError } from "@/lib/validation";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    status: number,
    message: string,
    code = "request_failed",
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: error.code, message: error.message, details: error.details },
      },
      { status: error.status }
    );
  }

  if (error instanceof LangGraphError) {
    const message =
      error.status === 404
        ? "Conversation not found."
        : "The AI service could not complete this request.";
    return NextResponse.json(
      { ok: false, error: { code: "langgraph_error", message } },
      { status: error.status === 404 ? 404 : 502 }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "validation_error",
          message: firstZodError(error),
          details: error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  console.error("Unhandled API error:", error);
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "internal_error",
        message: "Something went wrong. Please try again.",
      },
    },
    { status: 500 }
  );
}

export async function requireApiUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError(401, "You must be signed in.", "unauthorized");
  }
  return user;
}

export async function requireApiAdmin(): Promise<SafeUser> {
  const user = await requireApiUser();
  if (user.role !== "admin") {
    throw new ApiError(403, "Admin access is required.", "forbidden");
  }
  return user;
}

export async function parseJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.", "invalid_json");
  }
}

/** Wraps a route handler so every failure has the same JSON shape. */
export function withApi<P extends Record<string, string>>(
  handler: (
    request: Request,
    context: { params: Promise<P> }
  ) => Promise<Response>
) {
  return async (request: Request, context: { params: Promise<P> }) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return apiError(error);
    }
  };
}
