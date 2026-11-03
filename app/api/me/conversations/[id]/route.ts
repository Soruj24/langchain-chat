import {
  apiOk,
  requireApiUser,
  withApi,
} from "@/lib/api";
import {
  deleteConversation,
  getConversationMessages,
} from "@/lib/conversations";
import { threadIdSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteParams = { id: string };

export const GET = withApi<RouteParams>(async (_request, context) => {
  const user = await requireApiUser();
  const { id } = await context.params;
  const threadId = threadIdSchema.parse(id);

  const detail = await getConversationMessages(threadId, user);
  return apiOk(detail);
});

export const DELETE = withApi<RouteParams>(async (_request, context) => {
  const user = await requireApiUser();
  const { id } = await context.params;
  const threadId = threadIdSchema.parse(id);

  await deleteConversation(threadId, user);
  return apiOk({ deleted: true });
});
