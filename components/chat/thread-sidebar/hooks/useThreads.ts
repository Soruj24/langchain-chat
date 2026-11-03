"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@langchain/langgraph-sdk";

import type { ThreadItem } from "../types";

function titleOf(values: unknown): string | null {
  const msgs = (
    values as { messages?: Array<{ type?: string; content?: unknown }> } | null
  )?.messages;

  if (!Array.isArray(msgs) || msgs.length === 0) return null;

  const first = msgs.find((m) => m?.type === "human") ?? msgs[0];
  const content = first?.content;
  const text =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content
            .map((part) =>
              typeof part === "string"
                ? part
                : ((part as { text?: string })?.text ?? "")
            )
            .join(" ")
        : "";

  return text.trim().replace(/\s+/g, " ").slice(0, 80) || "Untitled chat";
}

/** Runs `fn` over `items` with at most `limit` requests in flight. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await fn(items[index]);
      }
    }
  );

  await Promise.all(workers);
  return results;
}

/** Lists threads from the LangGraph server and lets you delete them. */
export function useThreads(apiUrl: string) {
  const client = useMemo(() => new Client({ apiUrl }), [apiUrl]);
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // `threads.search` does not return state values, so each title is read from
  // the thread's state once and reused until that thread changes again.
  const titleCache = useRef(new Map<string, { title: string; stamp: string }>());

  const refresh = useCallback(async () => {
    try {
      const res = await client.threads.search({
        limit: 50,
        sortBy: "updated_at",
        sortOrder: "desc",
      });

      const items = await mapWithConcurrency(res, 8, async (thread) => {
        const cached = titleCache.current.get(thread.thread_id);
        let title =
          cached && cached.stamp === thread.updated_at
            ? cached.title
            : titleOf(thread.values);

        if (!title) {
          // Search results omit state; fetch it just to find the first question.
          try {
            const state = await client.threads.getState(thread.thread_id);
            title = titleOf(state.values);
          } catch {
            title = null;
          }
        }

        if (title) {
          titleCache.current.set(thread.thread_id, {
            title,
            stamp: thread.updated_at,
          });
        }

        return {
          id: thread.thread_id,
          title: title ?? "New chat",
          updatedAt: thread.updated_at,
        } satisfies ThreadItem;
      });

      // Forget threads that were deleted elsewhere.
      const liveIds = new Set(res.map((thread) => thread.thread_id));
      for (const id of titleCache.current.keys()) {
        if (!liveIds.has(id)) titleCache.current.delete(id);
      }

      setThreads(items);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    // Initial load; state updates happen after the request resolves.
    refresh();
  }, [refresh]);

  const remove = useCallback(
    async (id: string) => {
      await client.threads.delete(id);
      titleCache.current.delete(id);
      setThreads((prev) => prev.filter((thread) => thread.id !== id));
    },
    [client]
  );

  return { threads, loading, error, refresh, remove };
}
