import { ApiError, apiOk, requireApiUser, withApi } from "@/lib/api";
import { createConversationForUser } from "@/lib/conversations";
import { getSystemSettings } from "@/lib/db/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Creates a chat thread on the LangGraph server with server-written ownership
 * metadata, then mirrors it into MongoDB. The browser never creates raw
 * LangGraph threads (the proxy rejects that).
 */
export const POST = withApi<Record<string, string>>(async () => {
  const user = await requireApiUser();
  const system = await getSystemSettings();

  if (system.maintenanceMode && user.role !== "admin") {
    throw new ApiError(
      503,
      "The assistant is temporarily unavailable for maintenance.",
      "maintenance"
    );
  }

  const conversation = await createConversationForUser(user);
  return apiOk({ conversation }, 201);
});
