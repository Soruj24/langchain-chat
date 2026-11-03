type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error?: { code?: string; message?: string } };

/**
 * Browser fetch helper for the app's own JSON API. It unwraps the
 * `{ ok, data }` envelope and throws a readable error for failed requests.
 */
export async function apiRequest<T>(
  input: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(input, {
    ...init,
    headers,
    cache: "no-store",
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.ok !== true) {
    const message =
      payload && payload.ok === false
        ? payload.error?.message
        : undefined;
    throw new Error(message || `Request failed (${response.status}).`);
  }

  return payload.data;
}
