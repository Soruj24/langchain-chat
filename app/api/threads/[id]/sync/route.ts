import {
  apiOk,
  parseJson,
  requireApiUser,
  withApi,
} from "@/lib/api";
import { syncConversation } from "@/lib/conversations";
import { getAiSettings } from "@/lib/db/settings";
import { threadIdSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteParams = { id: string };

/**
 * Mirrors the authoritative LangGraph thread state into MongoDB after a run.
 * Ownership is checked before the LangGraph state is read.
 */
export const POST = withApi<RouteParams>(async (request, context) => {
  const user = await requireApiUser();
  const { id } = await context.params;
  const threadId = threadIdSchema.parse(id);

  let requestedModel: string | null = null;
  try {
    const body = (await parseJson(request)) as { model?: unknown };
    if (typeof body?.model === "string") requestedModel = body.model;
  } catch {
    // The sync endpoint treats an empty body as "do not change the model".
  }

  let model: string | null = null;
  if (requestedModel) {
    const ai = await getAiSettings();
    if (ai.models.includes(requestedModel)) model = requestedModel;
  }

  const conversation = await syncConversation(threadId, user, model);
  return apiOk({ conversation });
});
