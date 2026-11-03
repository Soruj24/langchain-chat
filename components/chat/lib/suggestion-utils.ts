import type { Client } from "@langchain/langgraph-sdk";

import { SUGGESTIONS_ASSISTANT_ID } from "../config";

const MAX_SUGGESTIONS = 3;

/** Keeps only clean, unique strings and caps the list at three. */
export function normalizeSuggestions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") continue;

    const text = item.replace(/\s+/g, " ").trim();
    if (!text) continue;

    const key = text.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    suggestions.push(text);

    if (suggestions.length === MAX_SUGGESTIONS) break;
  }

  return suggestions;
}

/**
 * Runs the stateless `suggestions` graph. It creates no thread, touches no
 * checkpoint, and never throws: follow-ups are optional, so any failure
 * simply renders no pills.
 */
export async function requestSuggestions(
  client: Client,
  answer: string
): Promise<string[]> {
  const text = answer.trim();
  if (!text) return [];

  try {
    const state = (await client.runs.wait(null, SUGGESTIONS_ASSISTANT_ID, {
      input: { answer: text },
    })) as { suggestions?: unknown };

    return normalizeSuggestions(state?.suggestions);
  } catch {
    return [];
  }
}
