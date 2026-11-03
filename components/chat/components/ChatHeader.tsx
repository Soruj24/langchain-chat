"use client";

import { PanelLeftIcon, PlusIcon } from "lucide-react";

import { Spark } from "@/components/spark";
import { ThemeToggle } from "@/components/theme-toggle";

import { SERIF, ui } from "../config";

type ChatHeaderProps = {
  /** On desktop the open sidebar owns the brand, so only actions render here. */
  showBrand: boolean;
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
};

export function ChatHeader({
  showBrand,
  sidebarVisible,
  onToggleSidebar,
  onNewChat,
}: ChatHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center px-4">
      {showBrand ? (
        <div className="flex items-center gap-1">
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

          <div className="ml-1 flex items-center gap-2">
            <Spark />
            <span
              className="text-[17px] font-medium"
              style={{ fontFamily: SERIF }}
            >
              Assistant
            </span>
          </div>
        </div>
      ) : null}

      <div className="ml-auto flex items-center gap-1">
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
      </div>
    </header>
  );
}
