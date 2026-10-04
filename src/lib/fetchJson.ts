// Thrown on a non-2xx response. The message stays short ("HTTP 404") so
// hooks can show it as is, and `status` lets callers handle specific codes.
export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
    this.name = "HttpError";
  }
}

// Fetches a JSON payload from one of our /api routes.
export async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new HttpError(res.status);
  return (await res.json()) as T;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}
