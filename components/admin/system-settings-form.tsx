"use client";

import { useCallback, useState } from "react";
import { CheckIcon, RotateCcwIcon, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/client-api";
import { useAsyncEffect } from "@/lib/hooks/use-async-effect";
import type { SystemSettingsData } from "@/lib/db/settings";

import {
  AdminPageHeader,
  ErrorBanner,
  SkeletonRows,
  Toggle,
} from "./ui";

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

type PublicConfig = {
  ai: { models: string[]; defaultModel: string };
};

export function SystemSettingsForm() {
  const [settings, setSettings] = useState<SystemSettingsData | null>(null);
  const [appName, setAppName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [defaultUserModel, setDefaultUserModel] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [models, setModels] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const apply = useCallback((data: SystemSettingsData) => {
    setSettings(data);
    setAppName(data.appName);
    setLogoUrl(data.logoUrl);
    setMaintenanceMode(data.maintenanceMode);
    setRegistrationEnabled(data.registrationEnabled);
    setDefaultUserModel(data.defaultUserModel);
    setWelcomeMessage(data.welcomeMessage);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsData, config] = await Promise.all([
        apiRequest<{ settings: SystemSettingsData }>(
          "/api/admin/system-settings"
        ),
        apiRequest<PublicConfig>("/api/config"),
      ]);
      apply(settingsData.settings);
      setModels(config.ai.models);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not load system settings."
      );
    } finally {
      setLoading(false);
    }
  }, [apply]);

  useAsyncEffect(load);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await apiRequest<{ settings: SystemSettingsData }>(
        "/api/admin/system-settings",
        {
          method: "PATCH",
          body: JSON.stringify({
            appName,
            logoUrl,
            maintenanceMode,
            registrationEnabled,
            defaultUserModel,
            welcomeMessage,
          }),
        }
      );
      apply(data.settings);
      setSuccess(
        "System settings saved. Changes apply across the app immediately."
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not save system settings."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="System Settings"
        description="Branding, sign-ups, maintenance mode, and the default model new chats start with."
      />

      {loading ? (
        <SkeletonRows rows={5} />
      ) : (
        <form onSubmit={save} className="space-y-5">
          {error ? <ErrorBanner message={error} /> : null}
          {success ? (
            <p className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckIcon className="size-4" />
              {success}
            </p>
          ) : null}

          <section className="rounded-xl border border-[#E6E3D8] bg-white p-5 dark:border-[#3F3E3A] dark:bg-[#30302E]">
            <h2 className="text-base font-medium">Branding</h2>
            <p className="mt-1 mb-4 text-sm text-[#73726C] dark:text-[#A3A29B]">
              Shown in the app shell, admin panel, and sign-in pages.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="appName" className="text-sm font-medium">
                  App name
                </label>
                <Input
                  id="appName"
                  value={appName}
                  onChange={(event) => setAppName(event.target.value)}
                  maxLength={60}
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="logoUrl" className="text-sm font-medium">
                  Logo URL <span className="font-normal text-[#73726C] dark:text-[#A3A29B]">(optional)</span>
                </label>
                <Input
                  id="logoUrl"
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                  placeholder="/logo.svg or https://…"
                  className="h-10"
                />
                <p className="text-xs text-[#73726C] dark:text-[#A3A29B]">
                  Leave empty to use the built-in spark mark.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <label htmlFor="welcomeMessage" className="text-sm font-medium">
                Chat welcome message
              </label>
              <Textarea
                id="welcomeMessage"
                value={welcomeMessage}
                onChange={(event) => setWelcomeMessage(event.target.value)}
                rows={2}
                maxLength={160}
                required
              />
              <p className="text-xs text-[#73726C] dark:text-[#A3A29B]">
                {welcomeMessage.length}/160 characters
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-[#E6E3D8] bg-white p-5 dark:border-[#3F3E3A] dark:bg-[#30302E]">
            <h2 className="text-base font-medium">Access</h2>
            <p className="mt-1 mb-4 text-sm text-[#73726C] dark:text-[#A3A29B]">
              Control who can create accounts and whether the app is available.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle
                checked={registrationEnabled}
                onChange={setRegistrationEnabled}
                label="Allow registration"
                description="When off, only existing accounts can sign in."
              />
              <Toggle
                checked={maintenanceMode}
                onChange={setMaintenanceMode}
                label="Maintenance mode"
                description="Non-admin users see a maintenance notice instead of the app."
              />
            </div>
          </section>

          <section className="rounded-xl border border-[#E6E3D8] bg-white p-5 dark:border-[#3F3E3A] dark:bg-[#30302E]">
            <h2 className="text-base font-medium">Default model</h2>
            <p className="mt-1 mb-4 text-sm text-[#73726C] dark:text-[#A3A29B]">
              Model a new chat uses when the user has not chosen one. Models come
              from AI configuration.
            </p>

            <div className="max-w-sm space-y-1.5">
              <label htmlFor="defaultUserModel" className="text-sm font-medium">
                New-chat model
              </label>
              <select
                id="defaultUserModel"
                value={defaultUserModel}
                onChange={(event) => setDefaultUserModel(event.target.value)}
                className={selectClass}
              >
                <option value="">Use the AI configuration default</option>
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving || !settings}
              onClick={() => settings && apply(settings)}
            >
              <RotateCcwIcon className="size-3.5" />
              Reset changes
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#D97757] text-white hover:bg-[#C6613F]"
            >
              {saving ? <Spinner className="size-4" /> : <SaveIcon className="size-3.5" />}
              Save settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
