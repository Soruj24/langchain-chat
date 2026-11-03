export type ChatCompletion = {
  ok: boolean;
};

export type FollowUpsState = {
  items: string[];
  forId: string | null;
};

export type StarterPrompt = {
  label: string;
  prompt: string;
};
