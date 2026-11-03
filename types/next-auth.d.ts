import type { DefaultSession } from "next-auth";

import type { UserRole } from "@/lib/db/models/user";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      isActive: boolean;
      sessionVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    isActive: boolean;
    sessionVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    isActive?: boolean;
    sessionVersion?: number;
  }
}
