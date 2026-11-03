"use client";

import { API_URL, ui } from "../config";

type ChatErrorProps = {
  title: string;
  message: string;
  /** Adds the "is the LangGraph server running?" hint. */
  serverHint?: boolean;
};

export function ChatError({ title, message, serverHint }: ChatErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-[#C6613F55] bg-[#C6613F14] px-4 py-3 text-sm"
    >
      <p className="font-medium">{title}</p>
      <p className={`mt-1 ${ui.muted}`}>{message}</p>
      {serverHint ? (
        <p className={`mt-1 ${ui.muted}`}>
          Make sure the LangGraph server at{" "}
          <span className="font-medium">{API_URL}</span> is running, then try
          again.
        </p>
      ) : null}
    </div>
  );
}
