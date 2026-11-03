"use client";

import { Suggestion } from "@/components/ai-elements/suggestion";

import { ui } from "../config";

type ChatSuggestionsProps = {
  items: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
};

export function ChatSuggestions({
  items,
  onSelect,
  disabled = false,
}: ChatSuggestionsProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span
        className={`text-[11px] font-medium uppercase tracking-wide ${ui.muted}`}
      >
        Follow-ups
      </span>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Suggestion
            key={item}
            suggestion={item}
            onClick={onSelect}
            disabled={disabled}
            className={ui.followUp}
          >
            {item}
          </Suggestion>
        ))}
      </div>
    </div>
  );
}
