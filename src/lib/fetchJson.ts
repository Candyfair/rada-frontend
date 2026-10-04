// Fetches a JSON payload from one of our /api routes.
// Throws "HTTP <status>" on a non-2xx response so hooks can show a short error.
export async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}
