"use client";

import { useCallback, useState } from "react";

import { ChatComposer } from "./components/ChatComposer";
import { ChatEmptyState } from "./components/ChatEmptyState";
import { ChatHeader } from "./components/ChatHeader";
import { ChatMessages } from "./components/ChatMessages";
import { API_URL, ui } from "./config";
import { useChatStream } from "./hooks/useChatStream";
import { useChatSuggestions } from "./hooks/useChatSuggestions";
import { useChatThreads } from "./hooks/useChatThreads";
import { useIsDesktop } from "./hooks/useIsDesktop";
import { ThreadSidebar } from "./thread-sidebar/ThreadSidebar";
import { useThreads } from "./thread-sidebar/hooks/useThreads";

export default function Chat() {
  const isDesktop = useIsDesktop();
  const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(null);
  const sidebarVisible = sidebarOpen ?? isDesktop;

  // On desktop the open sidebar owns the brand + collapse control, so the main
  // header shows only its actions. On mobile the sidebar is an overlay, so the
  // main header keeps the brand even while the overlay is open.
  const showHeaderBrand = !isDesktop || !sidebarVisible;

  const closeSidebarOnMobile = useCallback(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const { threads, loading, error, refresh, remove } = useThreads(API_URL);

  const {
    threadId,
    messages,
    isLoading,
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
    onRunCompleted: refresh,
  });

  const { suggestions, reset: resetSuggestions } = useChatSuggestions({
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
          showBrand={showHeaderBrand}
          sidebarVisible={sidebarVisible}
          onToggleSidebar={() => setSidebarOpen(!sidebarVisible)}
          onNewChat={newChat}
        />

        {isEmpty ? (
          <ChatEmptyState composer={composer} onSelectPrompt={handleSend} />
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
                Assistant can make mistakes. Please double-check responses.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
