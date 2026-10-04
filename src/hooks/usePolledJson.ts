import { useEffect, useState } from "react";
import { errorMessage, fetchJson, isAbortError } from "@/lib/fetchJson";

export const POLL_INTERVAL_MS = 5 * 60 * 1000;

interface PolledState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Fetches `url` on mount, then again every POLL_INTERVAL_MS.
// The last good data is kept when a refresh fails, and the error clears
// on the next successful refresh.
export function usePolledJson<T>(url: string): PolledState<T> {
  const [state, setState] = useState<PolledState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const data = await fetchJson<T>(url, controller.signal);
        setState({ data, loading: false, error: null });
      } catch (err) {
        if (isAbortError(err)) return;
        setState((prev) => ({ ...prev, loading: false, error: errorMessage(err) }));
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [url]);

  return state;
}
