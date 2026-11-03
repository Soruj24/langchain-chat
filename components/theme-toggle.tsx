"use client";

import { MoonIcon, SunIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const toggleTheme = () => {
    const root = document.documentElement;
    const nextIsDark = !root.classList.contains("dark");

    root.classList.toggle("dark", nextIsDark);
    root.style.colorScheme = nextIsDark ? "dark" : "light";

    try {
      localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    } catch {
      // Storage can be unavailable in private mode; the toggle still works.
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={cn(
        "rounded-lg p-2 text-[#73726C] transition-colors hover:bg-[#1414130d] hover:text-[#141413]",
        "dark:text-[#A3A29B] dark:hover:bg-[#F5F4EE14] dark:hover:text-[#F5F4EE]",
        className
      )}
    >
      <MoonIcon className="size-[18px] dark:hidden" />
      <SunIcon className="hidden size-[18px] dark:block" />
    </button>
  );
}
