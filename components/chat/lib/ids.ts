/**
 * Client-generated ids for optimistic messages and fresh chat threads.
 *
 * A stable id lets the SDK reconcile the optimistic human turn with the
 * server echo instead of appending a second copy. A fresh thread id lets
 * "New Chat" swap away from an SDK-owned thread without hydrating history.
 *
 * `crypto.randomUUID` is unavailable in some non-secure contexts, so fall
 * back to a timestamp + random suffix. Both are unique enough for chat ids.
 */
export function createId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
