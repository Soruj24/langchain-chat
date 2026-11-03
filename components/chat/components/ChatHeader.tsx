"use client";

import { PanelLeftIcon, PlusIcon } from "lucide-react";

import { UserMenu } from "@/components/app/user-menu";
import { Spark } from "@/components/spark";
import { ThemeToggle } from "@/components/theme-toggle";
import type { UserRole } from "@/lib/db/models/user";

import { SERIF, ui } from "../config";

type ChatHeaderProps = {
  appName: string;
  /** On desktop the open sidebar owns the brand, so only actions render here. */
  showBrand: boolean;
  sidebarVisible: boolean;
  user: { name: string; email: string; role: UserRole };
  models: string[];
  model: string;
  modelSelectionEnabled: boolean;
  onModelChange: (model: string) => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
};

export function ChatHeader({
  appName,
  showBrand,
  sidebarVisible,
  user,
  models,
  model,
  modelSelectionEnabled,
  onModelChange,
  onToggleSidebar,
  onNewChat,
}: ChatHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-4">
      {showBrand ? (
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={sidebarVisible ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarVisible}
            title={sidebarVisible ? "Close sidebar" : "Open sidebar"}
            className={`rounded-lg p-2 ${ui.muted} ${ui.hover}`}
          >
            <PanelLeftIcon className="size-5" />
          </button>

          <div className="ml-1 flex min-w-0 items-center gap-2">
            <Spark />
            <span
              className="truncate text-[17px] font-medium"
              style={{ fontFamily: SERIF }}
            >
              {appName}
            </span>
          </div>
        </div>
      ) : null}

      <div className="ml-auto flex items-center gap-1.5">
        {modelSelectionEnabled && models.length > 1 ? (
          <label className="flex items-center gap-1.5 text-xs text-[#73726C] dark:text-[#A3A29B]">
            <span className="sr-only">Model</span>
            <select
              value={model}
              onChange={(event) => onModelChange(event.target.value)}
              className="max-w-40 rounded-lg border border-[#1414131F] bg-white/70 px-2 py-1.5 text-xs text-[#141413] outline-none focus:border-[#D97757] dark:border-[#F5F4EE1F] dark:bg-[#30302E]/70 dark:text-[#F5F4EE]"
            >
              {models.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <ThemeToggle />
        <button
          type="button"
          onClick={onNewChat}
          aria-label="New chat"
          title="New chat"
          className={`rounded-lg p-2 ${ui.muted} ${ui.hover}`}
        >
          <PlusIcon className="size-5" />
        </button>
        <div className="ml-1">
          <UserMenu {...user} />
        </div>
      </div>
    </header>
  );
}
