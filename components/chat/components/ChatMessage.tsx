"use client";

import type { BaseMessage } from "@langchain/core/messages";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

import { SERIF, ui } from "../config";
import { textOf } from "../lib/message-utils";
import { CopyButton } from "./CopyButton";

type ChatMessageProps = {
  message: BaseMessage;
  isStreaming: boolean;
};

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  if (message.type === "human") {
    return (
      <Message
        from="user"
        className="max-w-full animate-in fade-in slide-in-from-bottom-1 duration-300"
      >
        <MessageContent
          className={`rounded-2xl px-4 py-2.5 text-[16px] leading-relaxed whitespace-pre-wrap ${ui.userBubble}`}
          style={{ fontSize: "16px" }}
        >
          {textOf(message)}
        </MessageContent>
      </Message>
    );
  }

  if (message.type === "ai") {
    // Never read `additional_kwargs.reasoning_content` or reasoning blocks:
    // `textOf` returns only `type: "text"` blocks, i.e. the final answer.
    const text = textOf(message);

    if (text.trim().length === 0) return null;

    return (
      <div className="group/msg flex flex-col gap-3 animate-in fade-in duration-300">
        <Message from="assistant" className="max-w-full">
          <MessageContent
            className="claude-prose text-[16px] leading-[1.7] text-[#141413] dark:text-[#F5F4EE]"
            style={{ fontFamily: SERIF, fontSize: "16px" }}
          >
            <MessageResponse>{text}</MessageResponse>
          </MessageContent>
          {!isStreaming && <CopyButton text={text} />}
        </Message>
      </div>
    );
  }

  // Historical threads may still contain tool messages, but the app no longer
  // has tools, so there is no tool UI to render them with.
  if (message.type === "tool") return null;

  // Unknown message types are shown instead of dropped, so a malformed turn
  // is visible in the UI rather than looking like a missing assistant answer.
  return (
    <div className="rounded-xl border border-dashed border-amber-400/60 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
      <div className="mb-1 font-medium">
        Unhandled message type: {message.type}
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">
        {JSON.stringify(
          {
            id: typeof message.id === "string" ? message.id : null,
            type: message.type,
            content: message.content,
          },
          null,
          2
        )}
      </pre>
    </div>
  );
}
