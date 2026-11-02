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
  return msg.contentBlocks.find((block ) => block.type === "reasoning")?.reasoning ?? "";
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

  // TEMP DEBUG: expose stream for headless verification
  (globalThis as unknown as { __stream?: unknown }).__stream = stream;

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
              return (
                <div key={i}>
                  {/* Reasoning block (shows when model emits thinking tokens) */}
                  <Reasoning>
                    <ReasoningTrigger />
                    <ReasoningContent>{getReasoningText(msg)}</ReasoningContent>
                  </Reasoning>

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