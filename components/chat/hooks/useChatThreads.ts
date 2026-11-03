"use client";

import { useCallback } from "react";

type UseChatThreadsOptions = {
  /** Id of the thread currently shown (SDK-owned until the user picks one). */
  activeThreadId: string | null;
  isLoading: boolean;
  stop: () => void;
  /** Swaps the stream to a brand-new, client-generated thread id. */
  startNewChat: () => void;
  /** Opens an existing thread; this is the only path that reloads history. */
  openThread: (id: string) => void;
  /** Clears run completion/error state. */
  resetRun: () => void;
  /** Clears follow-up suggestions. */
  resetSuggestions: () => void;
  /** Deletes a thread on the server and in the sidebar list. */
  remove: (id: string) => Promise<void>;
  closeSidebarOnMobile: () => void;
};

/**
 * Session actions that cross both the stream and the thread list.
 * Thread *data* lives in `useThreads`; this hook only orchestrates actions.
 */
export function useChatThreads({
  activeThreadId,
  isLoading,
  stop,
  startNewChat,
  openThread,
  resetRun,
  resetSuggestions,
  remove,
  closeSidebarOnMobile,
}: UseChatThreadsOptions) {
  const reset = useCallback(() => {
    resetRun();
    resetSuggestions();
  }, [resetRun, resetSuggestions]);

  const newChat = useCallback(() => {
    if (isLoading) stop();
    reset();
    startNewChat();
    closeSidebarOnMobile();
  }, [closeSidebarOnMobile, isLoading, reset, startNewChat, stop]);

  const selectThread = useCallback(
    (id: string) => {
      if (isLoading) stop();
      reset();
      openThread(id);
      closeSidebarOnMobile();
    },
    [closeSidebarOnMobile, isLoading, openThread, reset, stop]
  );

  const deleteThread = useCallback(
    async (id: string) => {
      try {
        if (id === activeThreadId && isLoading) stop();
        await remove(id);
        if (id === activeThreadId) {
          reset();
          startNewChat();
        }
      } catch {
        // The sidebar keeps the item so the user can retry.
      }
    },
    [activeThreadId, isLoading, remove, reset, startNewChat, stop]
  );

  return { newChat, selectThread, deleteThread };
}
