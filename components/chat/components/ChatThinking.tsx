"use client";

import { Spark } from "@/components/spark";

import { ui } from "../config";

/** The single waiting indicator, shown only before the first answer token. */
export function ChatThinking() {
  return (
    <div className={`flex items-center gap-2 text-sm ${ui.muted}`}>
      <Spark spinning />
      <span>Thinking…</span>
    </div>
  );
}
