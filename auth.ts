import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { logActivity } from "@/lib/activity";
import { verifyPassword } from "@/lib/auth/password";
import { connectDB } from "@/lib/db/connect";
import { User, type UserRole } from "@/lib/db/models/user";
import { loginSchema } from "@/lib/validation";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_MAX_AGE,
      },
    },
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
        });

        if (!parsed.success) return null;

        await connectDB();
        const user = await User.findOne({ email: parsed.data.email })
          .select("+passwordHash")
          .lean();

        // Same generic failure for unknown email and wrong password.
        if (!user?.passwordHash) return null;
        if (!user.isActive) return null;

        const valid = await verifyPassword(
          parsed.data.password,
          user.passwordHash
        );
        if (!valid) return null;

        await User.updateOne(
          { _id: user._id },
          { $set: { lastLoginAt: new Date() } }
        );

        await logActivity({
          actorId: String(user._id),
          action: "user.login",
          targetType: "user",
          targetId: String(user._id),
          description: `${user.email} signed in.`,
        });

        return {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          isActive: user.isActive,
          sessionVersion: user.sessionVersion ?? 0,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isActive = user.isActive;
        token.sessionVersion = user.sessionVersion;
      }

      // Only display fields are refreshed from the client. Authorization still
      // re-reads role/isActive/sessionVersion from MongoDB on every request.
      if (trigger === "update" && session?.user?.name) {
        token.name = session.user.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub ?? "");
        session.user.role = (token.role as UserRole) ?? "user";
        session.user.isActive = token.isActive !== false;
        session.user.sessionVersion =
          typeof token.sessionVersion === "number" ? token.sessionVersion : 0;
      }
      return session;
    },
  },
});
