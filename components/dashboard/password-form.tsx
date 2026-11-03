"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/client-api";

export function PasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setSaving(true);
    setError(null);

    try {
      await apiRequest<{ signedOut: boolean }>("/api/me/password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: data.get("currentPassword"),
          newPassword: data.get("newPassword"),
          confirmPassword: data.get("confirmPassword"),
        }),
      });

      setDone(true);
      form.reset();
      // Every existing session is invalidated by the sessionVersion bump.
      await signOut({ callbackUrl: "/login?passwordChanged=1" });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not change your password."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="currentPassword" className="text-sm font-medium">
          Current password
        </label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="h-10"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="newPassword" className="text-sm font-medium">
            New password
          </label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm new password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            className="h-10"
          />
        </div>
      </div>

      <p className="text-xs text-[#73726C] dark:text-[#A3A29B]">
        Use at least 8 characters with a letter and a number. You will be signed
        out of every device after changing your password.
      </p>

      {error ? (
        <p role="alert" className="text-sm text-[#B4423A] dark:text-[#E08A80]">
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          Password changed. Signing you out…
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={saving}
        variant="outline"
        className="border-[#E6E3D8] dark:border-[#3F3E3A]"
      >
        {saving ? "Updating…" : "Change password"}
      </Button>
    </form>
  );
}
