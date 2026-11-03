"use client";

import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/lib/client-api";

import type { ThreadItem } from "../types";
import type { SafeConversation } from "@/lib/db/models/conversation";

type ConversationList = {
  items: SafeConversation[];
  total: number;
  warning: string | null;
};

/** Lists the signed-in user's conversations and lets you delete them. */
export function useThreads() {
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await apiRequest<ConversationList>(
        "/api/me/conversations?limit=50"
      );
      setThreads(
        data.items.map((conversation) => ({
          id: conversation.threadId,
          title: conversation.title,
          updatedAt:
            conversation.lastMessageAt ??
            conversation.updatedAt ??
            conversation.createdAt,
        }))
      );
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await apiRequest<{ deleted: boolean }>(
      `/api/me/conversations/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    setThreads((prev) => prev.filter((thread) => thread.id !== id));
  }, []);

  return { threads, loading, error, refresh, remove };
}
