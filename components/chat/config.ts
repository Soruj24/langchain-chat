import type { StarterPrompt } from "./types";

/**
 * Every browser request goes through the authenticated Next.js proxy. The
 * real LangGraph URL is a server-only environment variable.
 */
export const API_URL = "/api/langgraph";

/** Public runtime settings passed from the server page into the chat shell. */
export type ChatRuntimeConfig = {
  appName: string;
  welcomeMessage: string;
  models: string[];
  defaultModel: string;
  modelSelectionEnabled: boolean;
  suggestionsEnabled: boolean;
};

/** Graph that answers the conversation. Registered in `server/langgraph.json`. */
export const CHAT_ASSISTANT_ID = "ai_elements";

/** Stateless graph that writes follow-up questions for a finished answer. */
export const SUGGESTIONS_ASSISTANT_ID = "suggestions";

export const SERIF = 'var(--font-serif), Georgia, "Times New Roman", serif';

/** Shared Claude-style class strings, kept in one place for every component. */
export const ui = {
  page: "bg-[#FAF9F5] text-[#141413] dark:bg-[#262624] dark:text-[#F5F4EE]",
  muted: "text-[#73726C] dark:text-[#A3A29B]",
  hover:
    "hover:bg-[#1414130D] hover:text-[#141413] dark:hover:bg-[#F5F4EE14] dark:hover:text-[#F5F4EE]",
  userBubble:
    "bg-[#F0EEE6] text-[#141413] dark:bg-[#30302E] dark:text-[#F5F4EE]",
  composer:
    "claude-composer rounded-[26px] border border-[#1414131F] bg-white shadow-[0_4px_24px_rgba(20,20,19,0.06)] " +
    "transition-shadow focus-within:shadow-[0_6px_30px_rgba(20,20,19,0.10)] " +
    "dark:border-[#F5F4EE1F] dark:bg-[#30302E] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)]",
  followUp:
    "h-auto whitespace-normal rounded-full border border-[#14141314] bg-white/60 px-3.5 py-1.5 " +
    "text-[13px] font-normal text-[#73726C] hover:border-[#1414132E] hover:bg-white " +
    "dark:border-[#F5F4EE14] dark:bg-[#30302E]/60 dark:hover:border-[#F5F4EE2E] " +
    "dark:hover:bg-[#30302E] dark:text-[#A3A29B]",
  disclaimer: "text-center text-xs",
};

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    label: "Explain a concept",
    prompt: "Explain how large language models learn, in simple terms.",
  },
  {
    label: "Write something",
    prompt: "Write a short, friendly email asking a teammate for feedback.",
  },
  {
    label: "Solve a calculation",
    prompt: "What is 128 × 47? Show the steps.",
  },
  {
    label: "Plan my day",
    prompt: "Help me plan a focused, realistic workday.",
  },
];
