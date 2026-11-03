"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIcon,
  MessageSquareIcon,
  RefreshCwIcon,
  ShieldIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiRequest } from "@/lib/client-api";
import type { SafeActivity } from "@/lib/db/models/activity";
import type { SafeUser } from "@/lib/db/models/user";

import {
  AdminPageHeader,
  ErrorBanner,
  SkeletonRows,
  StatCard,
  WarningBanner,
  formatDate,
} from "./ui";

type Overview = {
  stats: {
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    newUsersThisWeek: number;
    totalConversations: number;
    conversationsToday: number;
    totalMessages: number;
  };
  modelUsage: Array<{ model: string; count: number }>;
  recentActivity: SafeActivity[];
  recentUsers: SafeUser[];
  warning: string | null;
};

export function AdminOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiRequest<Overview>("/api/admin/overview"));
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not load overview."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        title="Overview"
        description="A live snapshot of users, conversations, and recent admin activity."
        action={
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? <Spinner className="size-4" /> : <RefreshCwIcon className="size-3.5" />}
            Refresh
          </Button>
        }
      />

      {error ? <ErrorBanner message={error} /> : null}
      {data?.warning ? (
        <div className="mt-3">
          <WarningBanner message={data.warning} />
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5">
          <SkeletonRows rows={4} />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Total users"
              value={data.stats.totalUsers}
              hint={`${data.stats.activeUsers} active · ${data.stats.adminUsers} admins`}
              icon={<UsersIcon className="size-4" />}
            />
            <StatCard
              label="New this week"
              value={data.stats.newUsersThisWeek}
              hint="Accounts created in the last 7 days"
              icon={<UserCheckIcon className="size-4" />}
            />
            <StatCard
              label="Conversations"
              value={data.stats.totalConversations}
              hint={`${data.stats.conversationsToday} active today`}
              icon={<MessageSquareIcon className="size-4" />}
            />
            <StatCard
              label="Messages"
              value={data.stats.totalMessages}
              hint="Across all saved conversations"
              icon={<ActivityIcon className="size-4" />}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <section className="rounded-xl border border-[#E6E3D8] bg-white p-5 lg:col-span-2 dark:border-[#3F3E3A] dark:bg-[#30302E]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-medium">Recent activity</h2>
                <Link
                  href="/admin/users"
                  className="text-xs text-[#C6613F] hover:underline dark:text-[#E8A184]"
                >
                  Manage users
                </Link>
              </div>

              {data.recentActivity.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#73726C] dark:text-[#A3A29B]">
                  No activity recorded yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.recentActivity.map((entry) => (
                    <li key={entry.id} className="flex gap-3">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#D97757]" />
                      <div className="min-w-0">
                        <p className="text-sm leading-5">
                          {entry.description || entry.action}
                        </p>
                        <p className="mt-0.5 text-xs text-[#73726C] dark:text-[#A3A29B]">
                          {entry.actorEmail ?? "System"} · {formatDate(entry.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="space-y-4">
              <section className="rounded-xl border border-[#E6E3D8] bg-white p-5 dark:border-[#3F3E3A] dark:bg-[#30302E]">
                <h2 className="mb-3 text-base font-medium">Model usage</h2>
                {data.modelUsage.length === 0 ? (
                  <p className="text-sm text-[#73726C] dark:text-[#A3A29B]">
                    No model usage recorded yet.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {data.modelUsage.map((entry) => {
                      const max = data.modelUsage[0]?.count || 1;
                      return (
                        <li key={entry.model}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="truncate font-medium">
                              {entry.model}
                            </span>
                            <span className="text-[#73726C] dark:text-[#A3A29B]">
                              {entry.count}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#F0EEE6] dark:bg-[#3A3937]">
                            <div
                              className="h-full rounded-full bg-[#D97757]"
                              style={{
                                width: `${Math.max(8, (entry.count / max) * 100)}%`,
                              }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="rounded-xl border border-[#E6E3D8] bg-white p-5 dark:border-[#3F3E3A] dark:bg-[#30302E]">
                <h2 className="mb-3 text-base font-medium">Newest users</h2>
                {data.recentUsers.length === 0 ? (
                  <p className="text-sm text-[#73726C] dark:text-[#A3A29B]">
                    No users yet.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {data.recentUsers.map((entry) => (
                      <li key={entry.id} className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-full bg-[#F0EEE6] text-[10px] font-semibold dark:bg-[#3A3937]">
                          {entry.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm">{entry.name}</p>
                          <p className="truncate text-xs text-[#73726C] dark:text-[#A3A29B]">
                            {entry.email}
                          </p>
                        </div>
                        {entry.role === "admin" ? (
                          <ShieldIcon className="ml-auto size-3.5 text-[#D97757]" />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
