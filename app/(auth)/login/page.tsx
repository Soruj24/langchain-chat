import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in — Assistant",
};

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    registered?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/chat");

  const params = await searchParams;
  const callbackUrl =
    params.callbackUrl?.startsWith("/") && !params.callbackUrl.startsWith("//")
      ? params.callbackUrl
      : "/chat";

  return (
    <div>
      {params.registered ? (
        <p className="mb-4 rounded-lg border border-[#D97757]/25 bg-[#D97757]/8 px-3 py-2 text-center text-sm text-[#C6613F] dark:text-[#E8A184]">
          Account created. Sign in to continue.
        </p>
      ) : null}
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}
