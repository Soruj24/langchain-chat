"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  registerAction,
  type AuthActionState,
} from "@/lib/actions/auth";

const initialState: AuthActionState = { error: null };

export function RegisterForm() {
  const [state, action, pending] = useActionState(
    registerAction,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="rounded-2xl border border-[#E6E3D8] bg-white p-7 shadow-[0_18px_60px_rgba(20,20,19,0.06)] dark:border-[#3F3E3A] dark:bg-[#30302E]">
      <div className="mb-7">
        <h2
          className="text-2xl font-medium tracking-tight"
          style={{
            fontFamily:
              'var(--font-serif), Georgia, "Times New Roman", serif',
          }}
        >
          Create your account
        </h2>
        <p className="mt-2 text-sm text-[#73726C] dark:text-[#A3A29B]">
          Your conversations are private to you.
        </p>
      </div>

      {state.error ? (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-lg border border-[#B4423A]/25 bg-[#B4423A]/8 px-3 py-2.5 text-sm text-[#B4423A] dark:border-[#E08A80]/30 dark:bg-[#E08A80]/10 dark:text-[#E08A80]"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            placeholder="Your name"
            className="h-10 text-sm"
            aria-invalid={Boolean(state.fields?.name)}
          />
          {state.fields?.name ? (
            <p className="text-xs text-[#B4423A] dark:text-[#E08A80]">
              {state.fields.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="h-10 text-sm"
            aria-invalid={Boolean(state.fields?.email)}
          />
          {state.fields?.email ? (
            <p className="text-xs text-[#B4423A] dark:text-[#E08A80]">
              {state.fields.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="At least 8 characters"
              className="h-10 pr-10 text-sm"
              aria-invalid={Boolean(state.fields?.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-[#73726C] hover:bg-[#1414130D] dark:text-[#A3A29B] dark:hover:bg-[#F5F4EE14]"
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
          {state.fields?.password ? (
            <p className="text-xs text-[#B4423A] dark:text-[#E08A80]">
              {state.fields.password}
            </p>
          ) : (
            <p className="text-xs text-[#73726C] dark:text-[#A3A29B]">
              Use at least 8 characters with a letter and a number.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder="Repeat your password"
            className="h-10 text-sm"
            aria-invalid={Boolean(state.fields?.confirmPassword)}
          />
          {state.fields?.confirmPassword ? (
            <p className="text-xs text-[#B4423A] dark:text-[#E08A80]">
              {state.fields.confirmPassword}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="h-10 w-full bg-[#D97757] text-white hover:bg-[#C6613F]"
        >
          {pending ? "Creating account…" : "Create account"}
          {!pending ? <ArrowRightIcon className="size-4" /> : null}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#73726C] dark:text-[#A3A29B]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-[#C6613F] hover:underline dark:text-[#E8A184]"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
