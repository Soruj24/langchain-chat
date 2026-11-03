"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { ui } from "../config";

/** Copies the final answer. Local state only; no parent re-renders. */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be denied by the browser.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy response"}
      className={`inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-xs [transition:opacity_150ms,background-color_150ms,color_150ms] md:opacity-0 md:group-hover/msg:opacity-100 md:focus-visible:opacity-100 ${ui.muted} ${ui.hover}`}
    >
      {copied ? (
        <CheckIcon className="size-3.5" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
