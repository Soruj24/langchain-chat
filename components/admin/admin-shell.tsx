"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BotIcon,
  LayoutDashboardIcon,
  MenuIcon,
  MessagesSquareIcon,
  SettingsIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";

import { UserMenu } from "@/components/app/user-menu";
import { Spark } from "@/components/spark";
import { ThemeToggle } from "@/components/theme-toggle";
import type { SafeUser } from "@/lib/db/models/user";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/admin/users", label: "User Management", icon: UsersIcon },
  { href: "/admin/ai-settings", label: "AI Configuration", icon: BotIcon },
  {
    href: "/admin/conversations",
    label: "Conversations",
    icon: MessagesSquareIcon,
  },
  { href: "/admin/settings", label: "System Settings", icon: SettingsIcon },
] as const;

export function AdminShell({
  user,
  appName,
  children,
}: {
  user: SafeUser;
  appName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-[#F0EEE6] font-medium text-[#141413] dark:bg-[#30302E] dark:text-[#F5F4EE]"
                : "text-[#73726C] hover:bg-[#1414130D] hover:text-[#141413] dark:text-[#A3A29B] dark:hover:bg-[#F5F4EE14] dark:hover:text-[#F5F4EE]"
            }`}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh bg-[#FAF9F5] text-[#141413] dark:bg-[#262624] dark:text-[#F5F4EE]">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-[#E6E3D8] bg-[#F5F4ED] md:flex dark:border-[#33322F] dark:bg-[#1F1E1D]">
        <div className="flex h-14 items-center gap-2 px-5">
          <Spark className="size-4" />
          <span
            className="text-[17px] font-medium"
            style={{
              fontFamily:
                'var(--font-serif), Georgia, "Times New Roman", serif',
            }}
          >
            {appName}
          </span>
        </div>

        <div className="mx-3 mb-3 rounded-lg bg-[#D97757]/10 px-3 py-2 text-xs font-medium text-[#C6613F] dark:text-[#E8A184]">
          Admin control panel
        </div>

        {nav}

        <div className="border-t border-[#E6E3D8] p-3 dark:border-[#33322F]">
          <Link
            href="/chat"
            className="flex items-center justify-center rounded-lg border border-[#E6E3D8] bg-white px-3 py-2 text-sm text-[#73726C] hover:text-[#141413] dark:border-[#3F3E3A] dark:bg-[#30302E] dark:text-[#A3A29B] dark:hover:text-[#F5F4EE]"
          >
            Back to chat
          </Link>
        </div>
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/35"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col border-r border-[#E6E3D8] bg-[#F5F4ED] dark:border-[#33322F] dark:bg-[#1F1E1D]">
            <div className="flex h-14 items-center justify-between px-5">
              <div className="flex items-center gap-2">
                <Spark className="size-4" />
                <span
                  className="text-[17px] font-medium"
                  style={{
                    fontFamily:
                      'var(--font-serif), Georgia, "Times New Roman", serif',
                  }}
                >
                  {appName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-[#73726C] hover:bg-[#1414130D] dark:text-[#A3A29B] dark:hover:bg-[#F5F4EE14]"
              >
                <XIcon className="size-5" />
              </button>
            </div>
            <div className="mx-3 mb-3 rounded-lg bg-[#D97757]/10 px-3 py-2 text-xs font-medium text-[#C6613F] dark:text-[#E8A184]">
              Admin control panel
            </div>
            {nav}
            <div className="border-t border-[#E6E3D8] p-3 dark:border-[#33322F]">
              <Link
                href="/chat"
                className="flex items-center justify-center rounded-lg border border-[#E6E3D8] bg-white px-3 py-2 text-sm dark:border-[#3F3E3A] dark:bg-[#30302E]"
              >
                Back to chat
              </Link>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-[#E6E3D8] bg-[#FAF9F5]/90 px-4 backdrop-blur dark:border-[#33322F] dark:bg-[#262624]/90">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-[#73726C] hover:bg-[#1414130D] md:hidden dark:text-[#A3A29B] dark:hover:bg-[#F5F4EE14]"
          >
            <MenuIcon className="size-5" />
          </button>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu name={user.name} email={user.email} role={user.role} />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
