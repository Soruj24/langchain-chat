"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  ChevronDownIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  ShieldIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserRole } from "@/lib/db/models/user";

type UserMenuProps = {
  name: string;
  email: string;
  role: UserRole;
};

function initials(name: string, email: string): string {
  const source = name.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function UserMenu({ name, email, role }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-[#1414131F] bg-white/70 py-1 pr-2 pl-1 text-sm transition-colors hover:bg-white dark:border-[#F5F4EE1F] dark:bg-[#30302E]/70 dark:hover:bg-[#30302E]">
        <span className="flex size-7 items-center justify-center rounded-full bg-[#D97757] text-[11px] font-semibold text-white">
          {initials(name, email)}
        </span>
        <span className="hidden max-w-32 truncate sm:block">{name}</span>
        <ChevronDownIcon className="size-3.5 text-[#73726C] dark:text-[#A3A29B]" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5">
            <span className="block truncate text-sm font-medium text-foreground">
              {name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuItem nativeButton={false} render={<Link href="/dashboard" />}>
          <LayoutDashboardIcon />
          Dashboard
        </DropdownMenuItem>

        {role === "admin" ? (
          <DropdownMenuItem nativeButton={false} render={<Link href="/admin" />}>
            <ShieldIcon />
            Admin panel
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => void signOut({ callbackUrl: "/login" })}
        >
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
