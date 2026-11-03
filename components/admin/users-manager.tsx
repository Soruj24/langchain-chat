"use client";

import { useCallback, useState } from "react";
import {
  RefreshCwIcon,
  SearchIcon,
  ShieldIcon,
  UserCogIcon,
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
import { useAsyncEffect } from "@/lib/hooks/use-async-effect";
import type { SafeUser, UserRole } from "@/lib/db/models/user";

import {
  AdminPageHeader,
  EmptyState,
  ErrorBanner,
  Pagination,
  SkeletonRows,
  formatDate,
} from "./ui";

type AdminUser = SafeUser & { conversationCount: number };
type UsersResponse = {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
};

type Filters = {
  q: string;
  role: "all" | UserRole;
  active: "all" | "active" | "inactive";
  page: number;
};

const LIMIT = 20;

const selectClass =
  "h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function UsersManager({ currentUserId }: { currentUserId: string }) {
  const [filters, setFilters] = useState<Filters>({
    q: "",
    role: "all",
    active: "all",
    page: 1,
  });
  const [query, setQuery] = useState("");
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<UserRole>("user");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async (next: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(next.page),
        limit: String(LIMIT),
      });
      if (next.q.trim()) params.set("q", next.q.trim());
      if (next.role !== "all") params.set("role", next.role);
      if (next.active !== "all") params.set("active", next.active);

      const result = await apiRequest<UsersResponse>(
        `/api/admin/users?${params.toString()}`
      );
      setData(result);
      setFilters(next);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not load users."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInitial = useCallback(
    () => load({ q: "", role: "all", active: "all", page: 1 }),
    [load]
  );

  useAsyncEffect(loadInitial);

  function openManage(user: AdminUser) {
    setSelected(user);
    setRole(user.role);
    setIsActive(user.isActive);
    setDialogError(null);
    setSuccess(null);
  }

  async function saveUser() {
    if (!selected) return;
    setSaving(true);
    setDialogError(null);
    setSuccess(null);

    try {
      await apiRequest<{ user: SafeUser }>(
        `/api/admin/users/${encodeURIComponent(selected.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ role, isActive }),
        }
      );
      setSelected(null);
      setSuccess(`Updated ${selected.email}.`);
      await load(filters);
    } catch (failure) {
      setDialogError(
        failure instanceof Error ? failure.message : "Could not update user."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="User Management"
        description="Search accounts, change roles, and activate or suspend access."
        action={
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => void load(filters)}
          >
            {loading ? <Spinner className="size-4" /> : <RefreshCwIcon className="size-3.5" />}
            Refresh
          </Button>
        }
      />

      <form
        className="flex flex-col gap-2 lg:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void load({ ...filters, q: query, page: 1 });
        }}
      >
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#73726C] dark:text-[#A3A29B]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email…"
            className="h-10 pl-9"
            aria-label="Search users"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Filter by role"
            value={filters.role}
            onChange={(event) =>
              void load({
                ...filters,
                role: event.target.value as Filters["role"],
                page: 1,
              })
            }
            className={selectClass}
          >
            <option value="all">All roles</option>
            <option value="admin">Admins</option>
            <option value="user">Users</option>
          </select>

          <select
            aria-label="Filter by status"
            value={filters.active}
            onChange={(event) =>
              void load({
                ...filters,
                active: event.target.value as Filters["active"],
                page: 1,
              })
            }
            className={selectClass}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <Button type="submit" variant="outline" className="h-10">
            Search
          </Button>
        </div>
      </form>

      <div className="mt-4 space-y-3">
        {error ? <ErrorBanner message={error} /> : null}
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
            title="No users found"
            description={
              filters.q || filters.role !== "all" || filters.active !== "all"
                ? "Try clearing your search or filters."
                : "Registered users will appear here."
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-xl border border-[#E6E3D8] bg-white dark:border-[#3F3E3A] dark:bg-[#30302E]">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-[#E6E3D8] text-xs text-[#73726C] dark:border-[#3F3E3A] dark:text-[#A3A29B]">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Conversations</th>
                  <th className="px-4 py-3 font-medium">Last sign-in</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E3D8] dark:divide-[#3F3E3A]">
                {data.items.map((user) => (
                  <tr key={user.id} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F0EEE6] text-[11px] font-semibold dark:bg-[#3A3937]">
                          {user.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate font-medium">
                            {user.name}
                            {user.id === currentUserId ? (
                              <span className="text-xs font-normal text-[#73726C] dark:text-[#A3A29B]">
                                (you)
                              </span>
                            ) : null}
                          </p>
                          <p className="truncate text-xs text-[#73726C] dark:text-[#A3A29B]">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role === "admin" ? (
                          <ShieldIcon className="size-3" />
                        ) : null}
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isActive ? "outline" : "destructive"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{user.conversationCount}</td>
                    <td className="px-4 py-3 text-xs text-[#73726C] dark:text-[#A3A29B]">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#73726C] dark:text-[#A3A29B]">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openManage(user)}
                      >
                        <UserCogIcon className="size-3.5" />
                        Manage
                      </Button>
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
            onPage={(page) => void load({ ...filters, page })}
          />
        </>
      )}

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open && !saving) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage user</DialogTitle>
            <DialogDescription>
              {selected?.name} · {selected?.email}
            </DialogDescription>
          </DialogHeader>

          {dialogError ? <ErrorBanner message={dialogError} /> : null}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="user-role" className="text-sm font-medium">
                Role
              </label>
              <select
                id="user-role"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                disabled={selected?.id === currentUserId}
                className={`${selectClass} w-full`}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <p className="text-xs text-[#73726C] dark:text-[#A3A29B]">
                Admins can access this control panel and all conversations.
              </p>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-[#E6E3D8] px-3.5 py-3 dark:border-[#3F3E3A]">
              <span>
                <span className="block text-sm font-medium">Account active</span>
                <span className="block text-xs text-[#73726C] dark:text-[#A3A29B]">
                  Inactive users are signed out and cannot log in.
                </span>
              </span>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                disabled={selected?.id === currentUserId}
                className="size-4 accent-[#D97757]"
              />
            </label>

            {selected?.id === currentUserId ? (
              <p className="text-xs text-[#73726C] dark:text-[#A3A29B]">
                You cannot change your own role or deactivate your own account.
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setSelected(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void saveUser()}
              className="bg-[#D97757] text-white hover:bg-[#C6613F]"
            >
              {saving ? <Spinner className="size-4" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
