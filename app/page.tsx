"use client";

import { useStream } from "@langchain/react";
import {
  HumanMessage,
  AIMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";

function getReasoningText(msg: AIMessage) {
  const blocks = msg.contentBlocks as unknown as Array<Record<string, unknown>>;
  if (Array.isArray(blocks)) {
    const parts = blocks
      .filter((block) => block?.type === "reasoning" || block?.type === "thinking")
      .map((block) =>
        typeof block.reasoning === "string"
          ? block.reasoning
          : typeof block.text === "string"
            ? block.text
            : ""
      )
      .filter((part) => part.length > 0);
    if (parts.length > 0) return parts.join("");
  }

  // Fallback for providers (e.g. Ollama without `think`) that leave the
  // reasoning in additional_kwargs instead of content blocks.
  const kwargs = msg.additional_kwargs as Record<string, unknown> | undefined;
  if (typeof kwargs?.reasoning_content === "string") return kwargs.reasoning_content;
  if (typeof kwargs?.reasoning === "string") return kwargs.reasoning;
  return "";
}

function getTextContent(msg: AIMessage) {
  return msg.text;
}

function getToolCalls(msg: AIMessage, messages: BaseMessage[]) {
  const outputs = new Map<string, unknown>();
  for (const m of messages) {
    if (ToolMessage.isInstance(m) && m.tool_call_id) {
      outputs.set(m.tool_call_id, m.content);
    }
  }

  return (msg.tool_calls ?? []).map((tc) => {
    const output = tc.id ? outputs.get(tc.id) : undefined;
    return {
      id: tc.id,
      name: tc.name,
      args: tc.args,
      output,
      state: output === undefined ? ("input-available" as const) : ("output-available" as const),
    };
  });
}

export default function Chat() {
  const stream = useStream({
    apiUrl: "http://localhost:4000",
    assistantId: "ai_elements",
  });
  
  return (
    <div className="flex flex-col h-dvh">
      <Conversation className="flex-1">
        <ConversationContent>
          {stream.messages.map((msg, i) => {
            if (HumanMessage.isInstance(msg)) {
              return (
                <Message key={i} from="user">
                  <MessageContent>{msg.text}</MessageContent>
                </Message>
              );
            }
            if (AIMessage.isInstance(msg)) {
              const reasoningText = getReasoningText(msg);
              const isStreaming = stream.isLoading && i === stream.messages.length - 1;
              return (
                <div key={i}>
                  {/* Reasoning block (shows when model emits thinking tokens) */}
                  {reasoningText.length > 0 && (
                    <Reasoning isStreaming={isStreaming}>
                      <ReasoningTrigger />
                      <ReasoningContent>{reasoningText}</ReasoningContent>
                    </Reasoning>
                  )}

                  {/* Inline tool calls with input/output display */}
                  {getToolCalls(msg, stream.messages).map((tc, j) => (
                    <Tool key={tc.id ?? `${i}-${j}`} defaultOpen>
                      <ToolHeader type={`tool-${tc.name}`} state={tc.state} />
                      <ToolContent>
                        <ToolInput input={tc.args} />
                        {tc.output !== undefined && (
                          <ToolOutput output={tc.output} errorText={undefined} />
                        )}
                      </ToolContent>
                    </Tool>
                  ))}

                  {/* Streamed text response */}
                  <Message from="assistant">
                    <MessageContent>
                      <MessageResponse>{getTextContent(msg)}</MessageResponse>
                    </MessageContent>
                  </Message>
                </div>
              );
            }
          })}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput
        onSubmit={({ text }) =>
          stream.submit({ messages: [{ type: "human", content: text }] })
        }
      >
        <PromptInputBody>
          <PromptInputTextarea placeholder="Ask me something..." />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputSubmit
            status={stream.isLoading ? "streaming" : "ready"}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}    