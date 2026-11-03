"use client";

import { useState } from "react";

import { Spark } from "@/components/spark";

import { ThreadList } from "./ThreadList";
import { ThreadSearch } from "./ThreadSearch";
import type { ThreadItem } from "./types";

const SERIF = 'var(--font-serif), Georgia, "Times New Roman", serif';

type ThreadSidebarProps = {
  threads: ThreadItem[];
  loading: boolean;
  error: boolean;
  activeId: string | null;
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
};

export function ThreadSidebar({
  threads,
  loading,
  error,
  activeId,
  open,
  onClose,
  onSelect,
  onNew,
  onDelete,
}: ThreadSidebarProps) {
  const [query, setQuery] = useState("");

  if (!open) return null;

  return (
    <>
      {/* Backdrop on small screens */}
      <button
        aria-label="Close sidebar"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] md:hidden"
      />

      <aside
        className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[#E6E3D8] bg-[#F5F4ED] md:static dark:border-[#33322F] dark:bg-[#1F1E1D]"
        aria-label="Chat history"
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-3">
          <div className="flex items-center gap-2 pl-1">
            <Spark className="size-4" />
            <span
              className="text-[17px] font-medium"
              style={{ fontFamily: SERIF }}
            >
              Assistant
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            title="Close sidebar"
            className="rounded-lg p-2 text-[#73726C] hover:bg-[#1414130D] hover:text-[#141413] dark:text-[#A3A29B] dark:hover:bg-[#F5F4EE14] dark:hover:text-[#F5F4EE]"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
              <path d="M9.5 4.5v15" />
            </svg>
          </button>
        </div>

        <div className="space-y-2 px-3 pb-2">
          <button
            onClick={onNew}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[15px] font-medium text-[#C6613F] transition-colors hover:bg-[#D977571A] dark:text-[#E8A184] dark:hover:bg-[#D9775724]"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New chat
          </button>

          <ThreadSearch value={query} onChange={setQuery} />
        </div>

        <ThreadList
          threads={threads}
          activeId={activeId}
          loading={loading}
          error={error}
          query={query}
          onSelect={onSelect}
          onDelete={onDelete}
        />

        <div className="border-t border-[#E6E3D8] px-4 py-3 text-[11px] text-[#73726C] dark:border-[#33322F] dark:text-[#A3A29B]">
          Local · LangGraph + Ollama
        </div>
      </aside>
    </>
  );
}
