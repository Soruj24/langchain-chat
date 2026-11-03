"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckIcon, RotateCcwIcon, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/client-api";
import type { AiSettingsData } from "@/lib/db/settings";

import {
  AdminPageHeader,
  ErrorBanner,
  SkeletonRows,
  Toggle,
} from "./ui";

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function parseModels(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((model) => model.trim())
        .filter(Boolean)
    )
  );
}

export function AiSettingsForm() {
  const [settings, setSettings] = useState<AiSettingsData | null>(null);
  const [modelsText, setModelsText] = useState("");
  const [defaultModel, setDefaultModel] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [toolsEnabled, setToolsEnabled] = useState(true);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [modelSelectionEnabled, setModelSelectionEnabled] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const models = useMemo(() => parseModels(modelsText), [modelsText]);

  const apply = useCallback((data: AiSettingsData) => {
    setSettings(data);
    setModelsText(data.models.join("\n"));
    setDefaultModel(data.defaultModel);
    setSystemPrompt(data.systemPrompt);
    setTemperature(data.temperature);
    setMaxTokens(data.maxTokens);
    setToolsEnabled(data.toolsEnabled);
    setSuggestionsEnabled(data.suggestionsEnabled);
    setModelSelectionEnabled(data.modelSelectionEnabled);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ settings: AiSettingsData }>(
        "/api/admin/ai-settings"
      );
      apply(data.settings);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not load AI settings."
      );
    } finally {
      setLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (models.length && !models.includes(defaultModel)) {
      setDefaultModel(models[0]);
    }
  }, [defaultModel, models]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (!models.length) {
      setError("Add at least one model.");
      setSaving(false);
      return;
    }

    try {
      const data = await apiRequest<{ settings: AiSettingsData }>(
        "/api/admin/ai-settings",
        {
          method: "PATCH",
          body: JSON.stringify({
            models,
            defaultModel,
            systemPrompt,
            temperature,
            maxTokens,
            toolsEnabled,
            suggestionsEnabled,
            modelSelectionEnabled,
          }),
        }
      );
      apply(data.settings);
      setSuccess("AI configuration saved. New runs use it immediately.");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not save AI settings."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="AI Configuration"
        description="Control the models users can pick, the system prompt, generation limits, tools, and follow-up suggestions."
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
            <h2 className="text-base font-medium">Models</h2>
            <p className="mt-1 mb-4 text-sm text-[#73726C] dark:text-[#A3A29B]">
              Ollama model names available to the chat UI, one per line.
            </p>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-1.5">
                <label htmlFor="models" className="text-sm font-medium">
                  Available models
                </label>
                <Textarea
                  id="models"
                  value={modelsText}
                  onChange={(event) => setModelsText(event.target.value)}
                  rows={4}
                  placeholder={"ornith:latest\nllama3.2:latest"}
                  className="min-h-28 font-mono text-xs"
                />
                <p className="text-xs text-[#73726C] dark:text-[#A3A29B]">
                  {models.length} model{models.length === 1 ? "" : "s"} configured.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="defaultModel" className="text-sm font-medium">
                  Default model
                </label>
                <select
                  id="defaultModel"
                  value={defaultModel}
                  onChange={(event) => setDefaultModel(event.target.value)}
                  className={selectClass}
                >
                  {models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#73726C] dark:text-[#A3A29B]">
                  Used when model selection is disabled or the default is
                  overridden by system settings.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Toggle
                checked={modelSelectionEnabled}
                onChange={setModelSelectionEnabled}
                label="Allow users to choose a model"
                description="Shows a model picker in the chat header."
              />
            </div>
          </section>

          <section className="rounded-xl border border-[#E6E3D8] bg-white p-5 dark:border-[#3F3E3A] dark:bg-[#30302E]">
            <h2 className="text-base font-medium">Behavior</h2>
            <p className="mt-1 mb-4 text-sm text-[#73726C] dark:text-[#A3A29B]">
              These values are read by the LangGraph server on every new run.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="systemPrompt" className="text-sm font-medium">
                System prompt
              </label>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                rows={7}
                className="min-h-40"
                required
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="temperature" className="text-sm font-medium">
                  Temperature: {temperature.toFixed(1)}
                </label>
                <input
                  id="temperature"
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  onChange={(event) =>
                    setTemperature(Number(event.target.value))
                  }
                  className="w-full accent-[#D97757]"
                />
                <p className="text-xs text-[#73726C] dark:text-[#A3A29B]">
                  Lower is more deterministic, higher is more creative.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="maxTokens" className="text-sm font-medium">
                  Max output tokens
                </label>
                <Input
                  id="maxTokens"
                  type="number"
                  min={64}
                  max={32768}
                  value={maxTokens}
                  onChange={(event) =>
                    setMaxTokens(Number(event.target.value))
                  }
                  className="h-10"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Toggle
                checked={toolsEnabled}
                onChange={setToolsEnabled}
                label="Enable tools"
                description="Allows the agent to call the built-in calculator tool."
              />
              <Toggle
                checked={suggestionsEnabled}
                onChange={setSuggestionsEnabled}
                label="Follow-up suggestions"
                description="Generates three suggested questions after each answer."
              />
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
              Save configuration
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
