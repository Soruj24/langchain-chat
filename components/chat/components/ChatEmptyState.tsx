"use client";

import type { ReactNode } from "react";

import { Spark } from "@/components/spark";

import { SERIF, STARTER_PROMPTS, ui } from "../config";

type ChatEmptyStateProps = {
  /** The composer is owned by the page so it can be shared with the thread view. */
  composer: ReactNode;
  onSelectPrompt: (prompt: string) => void;
};

export function ChatEmptyState({
  composer,
  onSelectPrompt,
}: ChatEmptyStateProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 pb-20">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Spark className="size-9" />
        <h1
          className="text-[34px] leading-tight tracking-tight sm:text-[42px]"
          style={{ fontFamily: SERIF }}
        >
          What can I help you with?
        </h1>
      </div>

      <div className="w-full max-w-[44rem]">{composer}</div>

      <div className="mt-6 flex w-full max-w-[44rem] flex-wrap justify-center gap-2">
        {STARTER_PROMPTS.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            onClick={() => onSelectPrompt(suggestion.prompt)}
            className={`rounded-full border border-[#14141314] bg-white/60 px-3.5 py-1.5 text-[13px] transition-colors hover:border-[#1414132E] hover:bg-white dark:border-[#F5F4EE14] dark:bg-[#30302E]/60 dark:hover:border-[#F5F4EE2E] dark:hover:bg-[#30302E] ${ui.muted}`}
          >
            {suggestion.label}
          </button>
        ))}
      </div>

      <p className={`mt-8 ${ui.disclaimer} ${ui.muted}`}>
        Assistant can make mistakes. Please double-check responses.
      </p>
    </main>
  );
}
