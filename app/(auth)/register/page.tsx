import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getSystemSettings } from "@/lib/db/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create account — Assistant",
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/chat");

  const system = await getSystemSettings();

  if (!system.registrationEnabled) {
    return (
      <div className="rounded-2xl border border-[#E6E3D8] bg-white p-7 text-center shadow-[0_18px_60px_rgba(20,20,19,0.06)] dark:border-[#3F3E3A] dark:bg-[#30302E]">
        <h2
          className="text-2xl font-medium"
          style={{
            fontFamily:
              'var(--font-serif), Georgia, "Times New Roman", serif',
          }}
        >
          Registration closed
        </h2>
        <p className="mt-3 text-sm text-[#73726C] dark:text-[#A3A29B]">
          New accounts are disabled by an administrator. If you already have an
          account, you can sign in.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-[#D97757] px-4 text-sm font-medium text-white hover:bg-[#C6613F]"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return <RegisterForm />;
}
