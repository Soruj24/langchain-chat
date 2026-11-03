import type { ReactNode } from "react";

import { Spark } from "@/components/spark";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-[#FAF9F5] text-[#141413] dark:bg-[#262624] dark:text-[#F5F4EE]">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-5 py-10">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden lg:block">
            <div className="flex items-center gap-3">
              <Spark className="size-8" />
              <span
                className="text-2xl font-medium"
                style={{
                  fontFamily:
                    'var(--font-serif), Georgia, "Times New Roman", serif',
                }}
              >
                Assistant
              </span>
            </div>
            <h1
              className="mt-10 max-w-lg text-4xl leading-tight tracking-tight"
              style={{
                fontFamily:
                  'var(--font-serif), Georgia, "Times New Roman", serif',
              }}
            >
              A focused place to think, write, and build with AI.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-[#73726C] dark:text-[#A3A29B]">
              Sign in to keep your conversations private and pick up exactly
              where you left off. Your chat history stays tied to your account.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-[#73726C] dark:text-[#A3A29B]">
              <li className="flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-[#D97757]" />
                Private, account-scoped conversation history
              </li>
              <li className="flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-[#D97757]" />
                Streaming answers with follow-up suggestions
              </li>
              <li className="flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-[#D97757]" />
                Admin controls for models, users, and settings
              </li>
            </ul>
          </div>

          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
