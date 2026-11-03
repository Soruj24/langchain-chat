"use client";

import { useEffect, useRef } from "react";
import type { BaseMessage } from "@langchain/core/messages";

import { checkFinalAnswer, summarizeMessages } from "../lib/message-utils";
import type { ChatCompletion } from "../types";

type UseRunLogOptions = {
  completion: ChatCompletion | null;
  isLoading: boolean;
  messages: BaseMessage[];
};

/**
 * Writes one compact console summary per finished run (type, id, text
 * length) and warns when the run did not end with an AI answer.
 * The short delay lets the final `values` snapshot land before logging.
 */
export function useRunLog({
  completion,
  isLoading,
  messages,
}: UseRunLogOptions) {
  const runCount = useRef(0);
  const logged = useRef<ChatCompletion | null>(null);

  useEffect(() => {
    if (!completion || isLoading) return;
    if (logged.current === completion) return;

    const timer = setTimeout(() => {
      logged.current = completion;
      runCount.current += 1;
      console.log(
        `[chat] run #${runCount.current}`,
        summarizeMessages(messages)
      );

      const finalAnswer = checkFinalAnswer(messages);
      if (!finalAnswer.ok) {
        console.warn("[chat] run did not end with an AI answer", finalAnswer);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [completion, isLoading, messages]);
}
