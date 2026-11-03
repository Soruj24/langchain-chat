"use client";

import { useEffect, useMemo, useState } from "react";

import { ThreadItem } from "./ThreadItem";
import type { ThreadItem as ThreadItemType } from "./types";

function groupLabel(iso: string): string {
  const date = new Date(iso);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDate = new Date(date);
  startOfDate.setHours(0, 0, 0, 0);

  const days = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000
  );

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 7) return "Previous 7 days";
  return "Older";
}

type ThreadListProps = {
  threads: ThreadItemType[];
  activeId: string | null;
  loading: boolean;
  error: boolean;
  query: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ThreadList({
  threads,
  activeId,
  loading,
  error,
  query,
  onSelect,
  onDelete,
}: ThreadListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Clear the inline confirmation with Escape.
  useEffect(() => {
    if (!confirmId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirmId(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmId]);

  const groups = useMemo(() => {
    const filtered = threads.filter((thread) =>
      thread.title.toLowerCase().includes(query.toLowerCase())
    );
    const grouped = new Map<string, ThreadItemType[]>();
    for (const thread of filtered) {
      const label = groupLabel(thread.updatedAt);
      grouped.set(label, [...(grouped.get(label) ?? []), thread]);
    }
    return grouped;
  }, [threads, query]);

  const empty = !loading && !error && groups.size === 0;

  return (
    <nav className="claude-scroll flex-1 overflow-y-auto px-3 pb-4">
      {loading && (
        <p className="px-3 py-2 text-sm text-[#73726C] dark:text-[#A3A29B]">
          Loading chats…
        </p>
      )}

      {error && !loading && (
        <p className="px-3 py-2 text-sm text-[#73726C] dark:text-[#A3A29B]">
          Couldn’t load chats. Check that the server is running.
        </p>
      )}

      {empty && (
        <p className="px-3 py-2 text-sm text-[#73726C] dark:text-[#A3A29B]">
          {query
            ? "No chats match your search."
            : "Your chats will show up here."}
        </p>
      )}

      {[...groups.entries()].map(([label, items]) => (
        <div key={label} className="mt-3 first:mt-1">
          <h3 className="px-3 pb-1 text-xs font-medium text-[#73726C] dark:text-[#A3A29B]">
            {label}
          </h3>
          <ul>
            {items.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                active={thread.id === activeId}
                confirming={confirmId === thread.id}
                onSelect={() => onSelect(thread.id)}
                onRequestDelete={() => setConfirmId(thread.id)}
                onCancelDelete={() => setConfirmId(null)}
                onConfirmDelete={() => {
                  setConfirmId(null);
                  onDelete(thread.id);
                }}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
