"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AlertCircleIcon,
  ExternalLinkIcon,
  MessageSquareIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { apiRequest } from "@/lib/client-api";
import { useAsyncEffect } from "@/lib/hooks/use-async-effect";
import type { SafeConversation } from "@/lib/db/models/conversation";

type ConversationList = {
  items: SafeConversation[];
  total: number;
  warning: string | null;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ConversationManager() {
  const router = useRouter();
  const [items, setItems] = useState<SafeConversation[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SafeConversation | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search.trim()) params.set("q", search.trim());
      const data = await apiRequest<ConversationList>(
        `/api/me/conversations?${params.toString()}`
      );
      setItems(data.items);
      setWarning(data.warning);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not load your conversations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInitial = useCallback(() => load(""), [load]);

  useAsyncEffect(loadInitial);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await apiRequest<{ deleted: boolean }>(
        `/api/me/conversations/${encodeURIComponent(pendingDelete.threadId)}`,
        { method: "DELETE" }
      );
      setItems((current) =>
        current.filter((item) => item.threadId !== pendingDelete.threadId)
      );
      setPendingDelete(null);
      router.refresh();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not delete that conversation."
      );
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete, router]);

  return (
    <div>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void load(query);
        }}
      >
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#73726C] dark:text-[#A3A29B]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your conversations…"
            className="h-10 pl-9"
            aria-label="Search conversations"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="outline" className="h-10">
            Search
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => void load(query)}
            aria-label="Refresh conversations"
            title="Refresh"
          >
            <RefreshCwIcon className="size-4" />
          </Button>
        </div>
      </form>

      {warning ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
          <AlertCircleIcon className="size-4" />
          {warning}
        </p>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-[#B4423A]/25 bg-[#B4423A]/8 px-3 py-2.5 text-sm text-[#B4423A] dark:border-[#E08A80]/30 dark:bg-[#E08A80]/10 dark:text-[#E08A80]"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5 space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl bg-[#F0EEE6] dark:bg-[#30302E]"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[#E6E3D8] px-6 py-12 text-center dark:border-[#3F3E3A]">
          <MessageSquareIcon className="mx-auto size-7 text-[#73726C] dark:text-[#A3A29B]" />
          <p className="mt-3 text-sm font-medium">
            {query ? "No conversations match your search." : "No conversations yet."}
          </p>
          <p className="mt-1 text-sm text-[#73726C] dark:text-[#A3A29B]">
            Start a chat and it will appear here automatically.
          </p>
          {!query ? (
            <Link
              href="/chat"
              className="mt-4 inline-flex h-9 items-center rounded-lg bg-[#D97757] px-3 text-sm font-medium text-white hover:bg-[#C6613F]"
            >
              Start chatting
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-[#E6E3D8] overflow-hidden rounded-xl border border-[#E6E3D8] bg-white dark:divide-[#3F3E3A] dark:border-[#3F3E3A] dark:bg-[#30302E]">
          {items.map((item) => (
            <li
              key={item.threadId}
              className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-[#73726C] dark:text-[#A3A29B]">
                  {item.messageCount} messages · {formatDate(item.lastMessageAt ?? item.updatedAt)}
                  {item.model ? ` · ${item.model}` : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={
                    <Link
                      href={`/chat?thread=${encodeURIComponent(item.threadId)}`}
                    />
                  }
                >
                  <ExternalLinkIcon className="size-3.5" />
                  Open
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setPendingDelete(item)}
                >
                  <Trash2Icon className="size-3.5" />
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete conversation?</DialogTitle>
            <DialogDescription>
              “{pendingDelete?.title}” and its messages will be permanently
              deleted from the AI server and this app.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? <Spinner className="size-4" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
