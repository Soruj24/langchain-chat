"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@langchain/langgraph-sdk";

import { API_URL } from "../config";
import { requestSuggestions } from "../lib/suggestion-utils";
import type { FollowUpsState } from "../types";

const EMPTY: FollowUpsState = { items: [], forId: null };

type UseChatSuggestionsOptions = {
  /** True only after a run ended with reason `success`. */
  completed: boolean;
  isLoading: boolean;
  hasError: boolean;
  /** Text of the finished final answer, or null. */
  answerText: string | null;
  /** Stable identity of that answer, used to discard stale responses. */
  answerKey: string | null;
};

/**
 * Generates three follow-up questions once per finished answer.
 *
 * It waits for a completed run, so it never fires during generation, and it
 * keys results to the answer they belong to, so switching turns/threads can
 * never show stale pills.
 */
export function useChatSuggestions({
  completed,
  isLoading,
  hasError,
  answerText,
  answerKey,
}: UseChatSuggestionsOptions) {
  const client = useMemo(() => new Client({ apiUrl: API_URL }), []);
  const [state, setState] = useState<FollowUpsState>(EMPTY);
  const requestId = useRef(0);
  const requestedKey = useRef<string | null>(null);

  const reset = useCallback(() => {
    requestId.current += 1;
    requestedKey.current = null;
    setState(EMPTY);
  }, []);

  useEffect(() => {
    if (!completed || isLoading || hasError) return;
    if (!answerText || !answerKey) return;
    if (requestedKey.current === answerKey) return;

    requestedKey.current = answerKey;
    const currentRequest = ++requestId.current;

    void requestSuggestions(client, answerText).then((items) => {
      if (currentRequest !== requestId.current) return;
      setState({ items, forId: answerKey });
    });
  }, [answerKey, answerText, client, completed, hasError, isLoading]);

  const visible =
    !isLoading &&
    !hasError &&
    answerKey !== null &&
    state.forId === answerKey;

  return { suggestions: visible ? state.items : [], reset };
}
