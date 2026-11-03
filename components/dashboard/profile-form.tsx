"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/client-api";
import type { SafeUser } from "@/lib/db/models/user";

export function ProfileForm({ user }: { user: SafeUser }) {
  const router = useRouter();
  const { update } = useSession();
  const [name, setName] = useState(user.name);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setStatus(null);

    try {
      const data = await apiRequest<{ user: SafeUser }>("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      await update({ name: data.user.name });
      setStatus("Profile updated.");
      router.refresh();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not save changes."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="profile-name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={80}
            required
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="profile-email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="profile-email"
            value={user.email}
            disabled
            className="h-10"
          />
          <p className="text-xs text-[#73726C] dark:text-[#A3A29B]">
            Email changes are managed by an administrator.
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[#B4423A] dark:text-[#E08A80]">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckIcon className="size-4" />
          {status}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={saving || name.trim() === user.name}
        className="bg-[#D97757] text-white hover:bg-[#C6613F]"
      >
        {saving ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
