"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useStream } from "@langchain/react";

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
  /** Called whenever a run ends, so thread history can refresh. */
  onRunCompleted?: () => void;
};

/**
 * Owns the LangGraph run: thread id, messages, submit/stop, and the flags
 * the UI needs to render one Thinking indicator and one final answer.
 */
export function useChatStream({
  onRunCompleted,
}: UseChatStreamOptions = {}) {
  // Only user actions change this. During a run the SDK owns the thread, so
  // the `threadId` prop never changes mid-stream and cannot re-hydrate.
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [completion, setCompletion] = useState<ChatCompletion | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Synchronous guard: two clicks in one tick would both see the old
  // `isLoading`; the token stops an old settle from unlocking a new run.
  const sendingRef = useRef(0);

  const stream = useStream({
    apiUrl: API_URL,
    assistantId: CHAT_ASSISTANT_ID,
    threadId: selectedThreadId,
    onCompleted: (info) => {
      setCompletion({ ok: info.reason === "success" });
      onRunCompleted?.();
    },
  });

  // The SDK-generated id is readable directly; keep new chats uncontrolled.
  const activeThreadId = selectedThreadId ?? stream.threadId;

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
    ? (currentAnswer.id ?? `${activeThreadId ?? "new"}:${lastHuman}`)
    : null;

  const finalAnswer = useMemo(() => checkFinalAnswer(messages), [messages]);

  useRunLog({ completion, isLoading: stream.isLoading, messages });

  const displayError =
    submitError ?? (stream.error ? readError(stream.error) : null);

  // The single Thinking row shows only until the first answer token.
  const waitingForFirstToken =
    stream.isLoading && !displayError && currentAnswer === null;

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

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || stream.isLoading || sendingRef.current !== 0) return;

      const submitToken = ++sendingRef.current;
      setCompletion(null);
      setSubmitError(null);

      void stream
        .submit(
          { messages: [{ type: "human", content, id: createId() }] },
          {
            onError: (streamError) =>
              setSubmitError(readError(streamError)),
          }
        )
        .catch((failure: unknown) => setSubmitError(readError(failure)))
        .finally(() => {
          if (sendingRef.current === submitToken) sendingRef.current = 0;
        });
    },
    [stream]
  );

  const stop = useCallback(() => {
    void stream.stop();
  }, [stream]);

  /** Opening an existing thread is the only history reload. */
  const openThread = useCallback((id: string) => {
    setSelectedThreadId(id);
  }, []);

  /** A fresh client id makes the SDK tear down the previous thread. */
  const startNewChat = useCallback(() => {
    setSelectedThreadId(createId());
  }, []);

  return {
    threadId: activeThreadId,
    messages,
    isLoading: stream.isLoading,
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
