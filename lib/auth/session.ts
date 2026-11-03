import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { connectDB } from "@/lib/db/connect";
import { User, type UserRole } from "@/lib/db/models/user";
import { serializeUser } from "@/lib/serializers";
import type { SafeUser } from "@/lib/db/models/user";

/**
 * Authoritative user lookup. The JWT only tells us *who* is asking; the role,
 * active flag, and session version are always read from MongoDB.
 */
export const getCurrentUser = cache(
  async (): Promise<SafeUser | null> => {
    const session = await auth();
    if (!session?.user?.id) return null;

    await connectDB();
    const user = await User.findById(session.user.id).lean();
    if (!user) return null;

    if (!user.isActive) return null;
    if ((user.sessionVersion ?? 0) !== session.user.sessionVersion) return null;

    return serializeUser(user);
  }
);

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

export function isAdmin(user: Pick<SafeUser, "role"> | null): boolean {
  return user?.role === ("admin" satisfies UserRole);
}
