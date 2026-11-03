import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareTextIcon, ShieldCheckIcon } from "lucide-react";

import { UserMenu } from "@/components/app/user-menu";
import { ConversationManager } from "@/components/dashboard/conversation-manager";
import { PasswordForm } from "@/components/dashboard/password-form";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { Spark } from "@/components/spark";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireUser } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/connect";
import { Conversation } from "@/lib/db/models/conversation";
import { getSystemSettings } from "@/lib/db/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — Assistant",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const system = await getSystemSettings();
  await connectDB();

  const [conversationCount, messageTotals] = await Promise.all([
    Conversation.countDocuments({ userId: user.id }),
    Conversation.aggregate<{ total: number }>([
      { $match: { userId: { $in: [user.id] } } },
      { $group: { _id: null, total: { $sum: "$messageCount" } } },
    ]),
  ]);

  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const stats = [
    { label: "Conversations", value: conversationCount },
    { label: "Messages", value: messageTotals[0]?.total ?? 0 },
    { label: "Member since", value: memberSince },
    { label: "Role", value: user.role === "admin" ? "Administrator" : "User" },
  ];

  return (
    <div className="min-h-dvh bg-[#FAF9F5] text-[#141413] dark:bg-[#262624] dark:text-[#F5F4EE]">
      <header className="sticky top-0 z-20 border-b border-[#E6E3D8] bg-[#FAF9F5]/90 backdrop-blur dark:border-[#33322F] dark:bg-[#262624]/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/chat" className="flex items-center gap-2">
            <Spark className="size-4" />
            <span
              className="text-[17px] font-medium"
              style={{
                fontFamily:
                  'var(--font-serif), Georgia, "Times New Roman", serif',
              }}
            >
              {system.appName}
            </span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 text-sm sm:flex">
            <Link
              href="/chat"
              className="rounded-lg px-3 py-1.5 text-[#73726C] hover:bg-[#1414130D] hover:text-[#141413] dark:text-[#A3A29B] dark:hover:bg-[#F5F4EE14] dark:hover:text-[#F5F4EE]"
            >
              Chat
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-[#F0EEE6] px-3 py-1.5 font-medium dark:bg-[#30302E]"
            >
              Dashboard
            </Link>
            {user.role === "admin" ? (
              <Link
                href="/admin"
                className="rounded-lg px-3 py-1.5 text-[#73726C] hover:bg-[#1414130D] hover:text-[#141413] dark:text-[#A3A29B] dark:hover:bg-[#F5F4EE14] dark:hover:text-[#F5F4EE]"
              >
                Admin
              </Link>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu name={user.name} email={user.email} role={user.role} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-2">
          <h1
            className="text-3xl font-medium tracking-tight"
            style={{
              fontFamily:
                'var(--font-serif), Georgia, "Times New Roman", serif',
            }}
          >
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-[#73726C] dark:text-[#A3A29B]">
            Manage your profile, password, and conversation history.
          </p>
        </div>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#E6E3D8] bg-white px-4 py-3.5 dark:border-[#3F3E3A] dark:bg-[#30302E]"
            >
              <p className="text-xs text-[#73726C] dark:text-[#A3A29B]">
                {stat.label}
              </p>
              <p className="mt-1 truncate text-lg font-medium">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-[#E6E3D8] bg-white p-5 lg:col-span-2 dark:border-[#3F3E3A] dark:bg-[#30302E]">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquareTextIcon className="size-5 text-[#D97757]" />
              <h2 className="text-lg font-medium">Your conversations</h2>
            </div>
            <ConversationManager />
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-[#E6E3D8] bg-white p-5 dark:border-[#3F3E3A] dark:bg-[#30302E]">
              <h2 className="text-lg font-medium">Profile</h2>
              <p className="mt-1 mb-4 text-sm text-[#73726C] dark:text-[#A3A29B]">
                How your name appears in the app.
              </p>
              <ProfileForm user={user} />
            </section>

            <section className="rounded-2xl border border-[#E6E3D8] bg-white p-5 dark:border-[#3F3E3A] dark:bg-[#30302E]">
              <h2 className="text-lg font-medium">Password</h2>
              <p className="mt-1 mb-4 text-sm text-[#73726C] dark:text-[#A3A29B]">
                Update the password used to sign in.
              </p>
              <PasswordForm />
            </section>

            {user.role === "admin" ? (
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-2xl border border-[#D97757]/30 bg-[#D97757]/8 px-5 py-4 transition-colors hover:bg-[#D97757]/12"
              >
                <ShieldCheckIcon className="size-5 text-[#C6613F] dark:text-[#E8A184]" />
                <div>
                  <p className="text-sm font-medium">Admin control panel</p>
                  <p className="text-xs text-[#73726C] dark:text-[#A3A29B]">
                    Users, AI settings, conversations, and system controls.
                  </p>
                </div>
              </Link>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
