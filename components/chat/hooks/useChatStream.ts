"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useStream } from "@langchain/react";

import { apiRequest } from "@/lib/client-api";

import { API_URL, CHAT_ASSISTANT_ID } from "../config";
import { createId } from "../lib/ids";
import {
  checkFinalAnswer,
  dedupeMessages,
  findLastHumanIndex,
  getCurrentAnswer,
  readError,
  textOf,
} from "../lib/message-utils";
import type { ChatCompletion } from "../types";
import { useRunLog } from "./useRunLog";

type UseChatStreamOptions = {
  /** Model selected in the UI. The server validates it again. */
  model?: string | null;
  /** Thread to hydrate when arriving from the dashboard. */
  initialThreadId?: string | null;
  /** Called when a run ends, with the thread that should be synced. */
  onRunCompleted?: (threadId: string | null) => void;
};

type CreatedConversation = {
  conversation: { threadId: string };
};

/**
 * Owns the LangGraph run: thread id, messages, submit/stop, and the flags
 * the UI needs to render one Thinking indicator and one final answer.
 *
 * Threads are always created by the server (`POST /api/threads`) so ownership
 * metadata cannot be spoofed, then the run targets that explicit thread id.
 */
export function useChatStream({
  model,
  initialThreadId = null,
  onRunCompleted,
}: UseChatStreamOptions = {}) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialThreadId
  );
  const [completion, setCompletion] = useState<ChatCompletion | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [creatingThread, setCreatingThread] = useState(false);

  // Synchronous guards: two clicks in one tick would both see the old
  // `isLoading`; the token stops an old settle from unlocking a new run.
  const sendingRef = useRef(0);
  const threadIdRef = useRef<string | null>(initialThreadId);

  const stream = useStream({
    apiUrl: API_URL,
    assistantId: CHAT_ASSISTANT_ID,
    threadId: selectedThreadId,
    onCompleted: (info) => {
      setCompletion({ ok: info.reason === "success" });
      onRunCompleted?.(threadIdRef.current);
    },
  });

  const messages = useMemo(
    () => dedupeMessages(stream.messages),
    [stream.messages]
  );

  const lastHuman = useMemo(() => findLastHumanIndex(messages), [messages]);

  const currentAnswer = useMemo(
    () => getCurrentAnswer(messages, lastHuman),
    [messages, lastHuman]
  );

  const currentAnswerText = currentAnswer ? textOf(currentAnswer) : null;

  const currentAnswerKey = currentAnswer
    ? (currentAnswer.id ?? `${selectedThreadId ?? "new"}:${lastHuman}`)
    : null;

  const finalAnswer = useMemo(() => checkFinalAnswer(messages), [messages]);

  useRunLog({
    completion,
    isLoading: stream.isLoading || creatingThread,
    messages,
  });

  const displayError =
    submitError ?? (stream.error ? readError(stream.error) : null);

  // The single Thinking row shows only until the first answer token.
  const waitingForFirstToken =
    (stream.isLoading || creatingThread) &&
    !displayError &&
    currentAnswer === null;

  // A successful run must end with a written AI answer.
  const showEmptyAnswer =
    completion?.ok === true &&
    !stream.isLoading &&
    !displayError &&
    lastHuman >= 0 &&
    !finalAnswer.ok;

  const resetRun = useCallback(() => {
    sendingRef.current = 0;
    setCompletion(null);
    setSubmitError(null);
  }, []);

  const ensureThread = useCallback(async (): Promise<string> => {
    if (threadIdRef.current) return threadIdRef.current;

    setCreatingThread(true);
    try {
      const created = await apiRequest<CreatedConversation>("/api/threads", {
        method: "POST",
      });
      const threadId = created.conversation.threadId;
      threadIdRef.current = threadId;
      setSelectedThreadId(threadId);
      return threadId;
    } finally {
      setCreatingThread(false);
    }
  }, []);

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || stream.isLoading || sendingRef.current !== 0) return;

      const submitToken = ++sendingRef.current;
      setCompletion(null);
      setSubmitError(null);

      void (async () => {
        try {
          const threadId = await ensureThread();
          await stream.submit(
            { messages: [{ type: "human", content, id: createId() }] },
            {
              threadId,
              ...(model
                ? { config: { configurable: { model } } }
                : {}),
              onError: (streamError) =>
                setSubmitError(readError(streamError)),
            }
          );
        } catch (failure) {
          setSubmitError(readError(failure));
        } finally {
          if (sendingRef.current === submitToken) sendingRef.current = 0;
        }
      })();
    },
    [ensureThread, model, stream]
  );

  const stop = useCallback(() => {
    void stream.stop();
  }, [stream]);

  /** Opening an existing thread is the only history reload. */
  const openThread = useCallback((id: string) => {
    threadIdRef.current = id;
    setSelectedThreadId(id);
  }, []);

  /** The next message creates a fresh server-owned thread. */
  const startNewChat = useCallback(() => {
    threadIdRef.current = null;
    setSelectedThreadId(null);
  }, []);

  return {
    threadId: selectedThreadId,
    messages,
    isLoading: stream.isLoading || creatingThread,
    isThreadLoading: stream.isThreadLoading,
    completion,
    displayError,
    currentAnswerText,
    currentAnswerKey,
    waitingForFirstToken,
    showEmptyAnswer,
    send,
    stop,
    resetRun,
    openThread,
    startNewChat,
  };
}
