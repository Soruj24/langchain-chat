"use client";

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";

import { ui } from "../config";

type ChatComposerProps = {
  isEmpty: boolean;
  isLoading: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
};

export function ChatComposer({
  isEmpty,
  isLoading,
  onSend,
  onStop,
}: ChatComposerProps) {
  return (
    <PromptInput
      className={ui.composer}
      onSubmit={({ text }) => onSend(text)}
    >
      <PromptInputBody>
        <PromptInputTextarea
          placeholder={
            isEmpty ? "How can I help you today?" : "Reply to the assistant…"
          }
          aria-label="Message"
          className="min-h-[52px] bg-transparent px-5 pt-4 text-[16px] placeholder:text-[#73726C] focus-visible:ring-0 dark:placeholder:text-[#A3A29B]"
          onKeyDown={(event) => {
            // Keep the draft when Enter is pressed mid-response.
            if (event.key === "Enter" && !event.shiftKey && isLoading) {
              event.preventDefault();
            }
          }}
        />
      </PromptInputBody>
      <PromptInputFooter className="px-3 pb-3">
        <span className={`ml-2 hidden text-xs sm:inline ${ui.muted}`}>
          Enter to send · Shift+Enter for a new line
        </span>
        <PromptInputSubmit
          status={isLoading ? "streaming" : "ready"}
          onStop={onStop}
          className="rounded-xl bg-[#D97757] text-white hover:bg-[#C6613F]"
        />
      </PromptInputFooter>
    </PromptInput>
  );
}
