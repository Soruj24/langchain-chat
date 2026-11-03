"use client";

import type { BaseMessage } from "@langchain/core/messages";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";

import { ChatError } from "./ChatError";
import { ChatMessage } from "./ChatMessage";
import { ChatSuggestions } from "./ChatSuggestions";
import { ChatThinking } from "./ChatThinking";

type ChatMessagesProps = {
  messages: BaseMessage[];
  isLoading: boolean;
  waitingForFirstToken: boolean;
  displayError: string | null;
  showEmptyAnswer: boolean;
  suggestions: string[];
  onSuggestion: (suggestion: string) => void;
};

export function ChatMessages({
  messages,
  isLoading,
  waitingForFirstToken,
  displayError,
  showEmptyAnswer,
  suggestions,
  onSuggestion,
}: ChatMessagesProps) {
  return (
    <Conversation className="flex-1">
      <ConversationContent className="claude-scroll mx-auto w-full max-w-[44rem] gap-8 px-4 py-6">
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id ?? `${message.type}-${index}`}
            message={message}
            isStreaming={isLoading && index === messages.length - 1}
          />
        ))}

        <ChatSuggestions
          items={suggestions}
          onSelect={onSuggestion}
          disabled={isLoading}
        />

        {waitingForFirstToken ? <ChatThinking /> : null}

        {displayError ? (
          <ChatError
            title="The assistant could not finish."
            message={displayError}
            serverHint
          />
        ) : null}

        {showEmptyAnswer ? (
          <ChatError
            title="The assistant finished without a written answer."
            message="Please try rephrasing your message or ask again."
          />
        ) : null}
      </ConversationContent>

      <ConversationScrollButton className="border-[#E6E3D8] bg-white dark:border-[#3F3E3A] dark:bg-[#30302E]" />
    </Conversation>
  );
}
