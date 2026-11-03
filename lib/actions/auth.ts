"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";
import { logActivity } from "@/lib/activity";
import { hashPassword } from "@/lib/auth/password";
import { connectDB } from "@/lib/db/connect";
import { getSystemSettings } from "@/lib/db/settings";
import { User } from "@/lib/db/models/user";
import {
  fieldErrors,
  firstZodError,
  loginSchema,
  registerSchema,
} from "@/lib/validation";

export type AuthActionState = {
  error: string | null;
  fields?: Record<string, string>;
};

const INITIAL: AuthActionState = { error: null };

function safeCallbackUrl(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/chat";
  if (!value.startsWith("/") || value.startsWith("//")) return "/chat";
  return value;
}

export async function loginAction(
  _previous: AuthActionState = INITIAL,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: safeCallbackUrl(formData.get("callbackUrl")),
  });

  if (!parsed.success) {
    return {
      error: firstZodError(parsed.error),
      fields: fieldErrors(parsed.error),
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: parsed.data.callbackUrl ?? "/chat",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          error.type === "CredentialsSignin"
            ? "Invalid email or password."
            : "Unable to sign in right now. Please try again.",
      };
    }
    throw error;
  }

  return { error: null };
}

export async function registerAction(
  _previous: AuthActionState = INITIAL,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: firstZodError(parsed.error),
      fields: fieldErrors(parsed.error),
    };
  }

  const system = await getSystemSettings();
  if (!system.registrationEnabled) {
    return { error: "Registration is currently disabled." };
  }

  await connectDB();

  const existing = await User.findOne({ email: parsed.data.email })
    .select("_id")
    .lean();
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  try {
    await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: "user",
      isActive: true,
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return { error: "An account with that email already exists." };
    }
    throw error;
  }

  await logActivity({
    action: "user.registered",
    description: `${parsed.data.email} created an account.`,
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/chat",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?registered=1");
    }
    throw error;
  }

  return { error: null };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
