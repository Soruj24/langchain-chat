"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EyeIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import type { SafeConversation } from "@/lib/db/models/conversation";

import {
  AdminPageHeader,
  EmptyState,
  ErrorBanner,
  Pagination,
  SkeletonRows,
  WarningBanner,
  formatDate,
} from "./ui";

type AdminConversation = SafeConversation & {
  owner: { name: string; email: string } | null;
};

type ConversationsResponse = {
  items: AdminConversation[];
  total: number;
  page: number;
  limit: number;
  warning: string | null;
};

type ConversationDetail = {
  title: string;
  messages: Array<{
    id: string;
    type: string;
    content: string;
    name?: string;
  }>;
};

const LIMIT = 20;

function messageLabel(type: string): string {
  if (type === "human") return "User";
  if (type === "ai") return "Assistant";
  if (type === "tool") return "Tool";
  if (type === "system") return "System";
  return type;
}

export function ConversationsManager() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ConversationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<AdminConversation | null>(null);
  const [detailData, setDetailData] = useState<ConversationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<AdminConversation | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async (searchValue: string, nextPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(LIMIT),
      });
      if (searchValue.trim()) params.set("q", searchValue.trim());

      const result = await apiRequest<ConversationsResponse>(
        `/api/admin/conversations?${params.toString()}`
      );
      setData(result);
      setSearch(searchValue);
      setPage(nextPage);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not load conversations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("", 1);
  }, [load]);

  const openDetail = useCallback(async (conversation: AdminConversation) => {
    setDetail(conversation);
    setDetailData(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      setDetailData(
        await apiRequest<ConversationDetail>(
          `/api/admin/conversations/${encodeURIComponent(conversation.threadId)}`
        )
      );
    } catch (failure) {
      setDetailError(
        failure instanceof Error
          ? failure.message
          : "Could not load this conversation."
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      await apiRequest<{ deleted: boolean }>(
        `/api/admin/conversations/${encodeURIComponent(pendingDelete.threadId)}`,
        { method: "DELETE" }
      );
      setSuccess(`Deleted “${pendingDelete.title}”.`);
      if (detail?.threadId === pendingDelete.threadId) {
        setDetail(null);
        setDetailData(null);
      }
      setPendingDelete(null);

      const remaining = (data?.total ?? 1) - 1;
      const lastPage = Math.max(1, Math.ceil(remaining / LIMIT));
      await load(search, Math.min(page, lastPage));
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not delete that conversation."
      );
    } finally {
      setDeleting(false);
    }
  }, [data?.total, detail?.threadId, load, page, pendingDelete, search]);

  return (
    <div>
      <AdminPageHeader
        title="Conversation Management"
        description="Browse every conversation stored on the AI server, inspect messages, and remove content."
        action={
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => void load(search, page)}
          >
            {loading ? (
              <Spinner className="size-4" />
            ) : (
              <RefreshCwIcon className="size-3.5" />
            )}
            Refresh
          </Button>
        }
      />

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void load(query, 1);
        }}
      >
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#73726C] dark:text-[#A3A29B]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations by title…"
            className="h-10 pl-9"
            aria-label="Search conversations"
          />
        </div>
        <Button type="submit" variant="outline" className="h-10">
          Search
        </Button>
      </form>

      <div className="mt-4 space-y-3">
        {error ? <ErrorBanner message={error} /> : null}
        {data?.warning ? <WarningBanner message={data.warning} /> : null}
        {success ? (
          <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {success}
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-4">
          <SkeletonRows />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No conversations found"
            description={
              search
                ? "Try a different search term."
                : "Conversations appear here once users start chatting."
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-xl border border-[#E6E3D8] bg-white dark:border-[#3F3E3A] dark:bg-[#30302E]">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-[#E6E3D8] text-xs text-[#73726C] dark:border-[#3F3E3A] dark:text-[#A3A29B]">
                <tr>
                  <th className="px-4 py-3 font-medium">Conversation</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Messages</th>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Last message</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E3D8] dark:divide-[#3F3E3A]">
                {data.items.map((item) => (
                  <tr key={item.threadId} className="align-middle">
                    <td className="max-w-[280px] px-4 py-3">
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="truncate font-mono text-[11px] text-[#73726C] dark:text-[#A3A29B]">
                        {item.threadId}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {item.owner ? (
                        <div className="min-w-0">
                          <p className="truncate">{item.owner.name}</p>
                          <p className="truncate text-xs text-[#73726C] dark:text-[#A3A29B]">
                            {item.owner.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-[#73726C] dark:text-[#A3A29B]">
                          Unknown
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="secondary">{item.messageCount}</Badge>
                        <span className="text-xs text-[#73726C] dark:text-[#A3A29B]">
                          {item.humanMessageCount} user · {item.aiMessageCount} AI
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#73726C] dark:text-[#A3A29B]">
                      {item.model ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#73726C] dark:text-[#A3A29B]">
                      {formatDate(item.lastMessageAt ?? item.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void openDetail(item)}
                        >
                          <EyeIcon className="size-3.5" />
                          View
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSuccess(null);
                            setPendingDelete(item);
                          }}
                        >
                          <Trash2Icon className="size-3.5" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={data.page}
            total={data.total}
            limit={data.limit}
            onPage={(nextPage) => void load(search, nextPage)}
          />
        </>
      )}

      <Dialog
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetail(null);
            setDetailData(null);
          }
        }}
      >
        <DialogContent className="flex max-h-[85dvh] max-w-2xl flex-col">
          <DialogHeader>
            <DialogTitle>{detail?.title ?? "Conversation"}</DialogTitle>
            <DialogDescription>
              {detail?.owner
                ? `${detail.owner.name} · ${detail.owner.email}`
                : "Owner unknown"}
              {detail ? ` · ${detail.messageCount} messages` : ""}
            </DialogDescription>
          </DialogHeader>

          {detailError ? <ErrorBanner message={detailError} /> : null}

          <div className="min-h-40 overflow-y-auto rounded-lg border border-[#E6E3D8] bg-[#FAF9F5] p-3 dark:border-[#3F3E3A] dark:bg-[#262624]">
            {detailLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-[#73726C] dark:text-[#A3A29B]">
                <Spinner className="mr-2 size-4" />
                Loading messages…
              </div>
            ) : !detailData || detailData.messages.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#73726C] dark:text-[#A3A29B]">
                This conversation has no messages yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {detailData.messages.map((message) => (
                  <li key={message.id}>
                    <p className="text-[11px] font-medium tracking-wide text-[#73726C] uppercase dark:text-[#A3A29B]">
                      {messageLabel(message.type)}
                      {message.name ? ` · ${message.name}` : ""}
                    </p>
                    <p className="mt-1 text-sm break-words whitespace-pre-wrap">
                      {message.content || (
                        <span className="text-[#73726C] dark:text-[#A3A29B]">
                          (empty)
                        </span>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setDetail(null);
                setDetailData(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              deleted from the AI server and this app. This cannot be undone.
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
