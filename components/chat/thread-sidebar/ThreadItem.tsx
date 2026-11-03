"use client";

import { cn } from "@/lib/utils";

import type { ThreadItem as ThreadItemType } from "./types";

type ThreadItemProps = {
  thread: ThreadItemType;
  active: boolean;
  confirming: boolean;
  onSelect: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

export function ThreadItem({
  thread,
  active,
  confirming,
  onSelect,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: ThreadItemProps) {
  if (confirming) {
    return (
      <li className="py-0.5">
        <div className="flex items-center justify-between gap-2 rounded-xl bg-[#C6613F14] px-2.5 py-1.5">
          <span className="min-w-0 truncate text-[13px] text-[#C6613F] dark:text-[#E8A184]">
            Delete this chat?
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={onCancelDelete}
              className="rounded-md px-2 py-1 text-xs text-[#73726C] hover:bg-[#1414130D] hover:text-[#141413] dark:text-[#A3A29B] dark:hover:bg-[#F5F4EE14] dark:hover:text-[#F5F4EE]"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmDelete}
              className="rounded-md bg-[#C6613F] px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-[#B4512F]"
            >
              Delete
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="group relative">
      <button
        onClick={onSelect}
        aria-current={active ? "page" : undefined}
        className={cn(
          "block w-full truncate rounded-xl px-3 py-2 pr-9 text-left text-[15px] transition-colors",
          active
            ? "bg-[#E8E5DA] dark:bg-[#30302E]"
            : "hover:bg-[#1414130D] dark:hover:bg-[#F5F4EE14]"
        )}
      >
        {thread.title}
      </button>
      <button
        aria-label={`Delete chat: ${thread.title}`}
        title="Delete chat"
        onClick={onRequestDelete}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#73726C] opacity-0 transition-opacity hover:bg-[#1414131A] hover:text-[#C6613F] focus:opacity-100 group-hover:opacity-100 dark:text-[#A3A29B] dark:hover:bg-[#F5F4EE1A] dark:hover:text-[#E8A184]"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" />
        </svg>
      </button>
    </li>
  );
}
