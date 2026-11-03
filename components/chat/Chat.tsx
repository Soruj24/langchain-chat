"use client";

import { useCallback, useState } from "react";

import { Spinner } from "@/components/ui/spinner";
import { apiRequest } from "@/lib/client-api";
import type { UserRole } from "@/lib/db/models/user";

import { ChatComposer } from "./components/ChatComposer";
import { ChatEmptyState } from "./components/ChatEmptyState";
import { ChatHeader } from "./components/ChatHeader";
import { ChatMessages } from "./components/ChatMessages";
import type { ChatRuntimeConfig } from "./config";
import { ui } from "./config";
import { useChatStream } from "./hooks/useChatStream";
import { useChatSuggestions } from "./hooks/useChatSuggestions";
import { useChatThreads } from "./hooks/useChatThreads";
import { useIsDesktop } from "./hooks/useIsDesktop";
import { ThreadSidebar } from "./thread-sidebar/ThreadSidebar";
import { useThreads } from "./thread-sidebar/hooks/useThreads";

type ChatProps = {
  user: { name: string; email: string; role: UserRole };
  config: ChatRuntimeConfig;
  initialThreadId?: string | null;
};

export default function Chat({ user, config, initialThreadId = null }: ChatProps) {
  const isDesktop = useIsDesktop();
  const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(null);
  const sidebarVisible = sidebarOpen ?? isDesktop;

  const [model, setModel] = useState(() =>
    config.models.includes(config.defaultModel)
      ? config.defaultModel
      : (config.models[0] ?? config.defaultModel)
  );

  // On desktop the open sidebar owns the brand + collapse control, so the main
  // header shows only its actions. On mobile the sidebar is an overlay, so the
  // main header keeps the brand even while the overlay is open.
  const showHeaderBrand = !isDesktop || !sidebarVisible;

  const closeSidebarOnMobile = useCallback(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const { threads, loading, error, refresh, remove } = useThreads();

  const handleRunCompleted = useCallback(
    async (threadId: string | null) => {
      if (threadId) {
        try {
          await apiRequest<{ conversation: unknown }>(
            `/api/threads/${encodeURIComponent(threadId)}/sync`,
            {
              method: "POST",
              body: JSON.stringify({ model }),
            }
          );
        } catch {
          // The list reconciliation will repair this thread on the next load.
        }
      }
      await refresh();
    },
    [model, refresh]
  );

  const {
    threadId,
    messages,
    isLoading,
    isThreadLoading,
    completion,
    displayError,
    currentAnswerText,
    currentAnswerKey,
    waitingForFirstToken,
    showEmptyAnswer,
    send,
    stop,
    resetRun,
    openThread,
    startNewChat,
  } = useChatStream({
    model,
    initialThreadId,
    onRunCompleted: handleRunCompleted,
  });

  const { suggestions, reset: resetSuggestions } = useChatSuggestions({
    enabled: config.suggestionsEnabled,
    completed: completion?.ok === true,
    isLoading,
    hasError: displayError !== null,
    answerText: currentAnswerText,
    answerKey: currentAnswerKey,
  });

  const { newChat, selectThread, deleteThread } = useChatThreads({
    activeThreadId: threadId,
    isLoading,
    stop,
    startNewChat,
    openThread,
    resetRun,
    resetSuggestions,
    remove,
    closeSidebarOnMobile,
  });

  // Suggestions belong to the previous answer, so clear them before sending.
  const handleSend = useCallback(
    (text: string) => {
      resetSuggestions();
      send(text);
    },
    [resetSuggestions, send]
  );

  const isEmpty = messages.length === 0;

  const composer = (
    <ChatComposer
      isEmpty={isEmpty}
      isLoading={isLoading}
      onSend={handleSend}
      onStop={stop}
    />
  );

  return (
    <div className={`flex h-dvh ${ui.page}`}>
      <ThreadSidebar
        appName={config.appName}
        threads={threads}
        loading={loading}
        error={error}
        activeId={threadId}
        open={sidebarVisible}
        onClose={() => setSidebarOpen(false)}
        onSelect={selectThread}
        onNew={newChat}
        onDelete={deleteThread}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ChatHeader
          appName={config.appName}
          showBrand={showHeaderBrand}
          sidebarVisible={sidebarVisible}
          user={user}
          models={config.models}
          model={model}
          modelSelectionEnabled={config.modelSelectionEnabled}
          onModelChange={setModel}
          onToggleSidebar={() => setSidebarOpen(!sidebarVisible)}
          onNewChat={newChat}
        />

        {isThreadLoading && isEmpty ? (
          <main className="flex flex-1 items-center justify-center">
            <span className={`flex items-center gap-2 text-sm ${ui.muted}`}>
              <Spinner className="size-4" />
              Loading conversation…
            </span>
          </main>
        ) : isEmpty ? (
          <ChatEmptyState
            composer={composer}
            title={config.welcomeMessage}
            onSelectPrompt={handleSend}
          />
        ) : (
          <>
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              waitingForFirstToken={waitingForFirstToken}
              displayError={displayError}
              showEmptyAnswer={showEmptyAnswer}
              suggestions={suggestions}
              onSuggestion={handleSend}
            />

            <div className="mx-auto w-full max-w-[44rem] px-4 pb-5">
              {composer}
              <p className={`mt-2 ${ui.disclaimer} ${ui.muted}`}>
                {config.appName} can make mistakes. Please double-check
                responses.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
