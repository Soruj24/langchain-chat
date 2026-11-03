import type { ReactNode } from "react";

import { Spark } from "@/components/spark";
import { ThemeToggle } from "@/components/theme-toggle";
import { logoutAction } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth/session";
import { getSystemSettings } from "@/lib/db/settings";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const system = await getSystemSettings();

  if (system.maintenanceMode && user.role !== "admin") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#FAF9F5] px-6 text-center text-[#141413] dark:bg-[#262624] dark:text-[#F5F4EE]">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Spark className="size-9" />
        <div>
          <h1
            className="text-3xl font-medium"
            style={{
              fontFamily:
                'var(--font-serif), Georgia, "Times New Roman", serif',
            }}
          >
            {system.appName} is under maintenance
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#73726C] dark:text-[#A3A29B]">
            The assistant is temporarily unavailable while an administrator
            makes changes. Please check back shortly.
          </p>
        </div>
        <div className="text-sm text-[#73726C] dark:text-[#A3A29B]">
          Signed in as {user.email}
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-[#E6E3D8] bg-white px-4 py-2 text-sm font-medium hover:bg-[#F0EEE6] dark:border-[#3F3E3A] dark:bg-[#30302E] dark:hover:bg-[#3A3937]"
          >
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
