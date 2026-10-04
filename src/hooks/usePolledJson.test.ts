import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assets, summary } from "@/__fixtures__";
import { useAssets } from "./useAssets";
import { useFleetSummary } from "./useFleetSummary";
import { POLL_INTERVAL_MS } from "./usePolledJson";
import { mockFetch } from "./testUtils";

// Lets pending fetch promises settle under fake timers
const flush = () => act(() => vi.advanceTimersByTimeAsync(0));
const tick = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useAssets", () => {
  it("starts loading with an empty list", () => {
    mockFetch(() => ({ body: assets }));

    const { result } = renderHook(() => useAssets());

    expect(result.current).toEqual({ assets: [], loading: true, error: null });
  });

  it("returns the assets from /api/assets", async () => {
    const fetchMock = mockFetch(() => ({ body: assets }));

    const { result } = renderHook(() => useAssets());
    await flush();

    expect(result.current).toEqual({ assets, loading: false, error: null });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("/api/assets");
  });

  it("keeps the same empty array between renders while loading", () => {
    mockFetch(() => ({ body: assets }));

    const { result, rerender } = renderHook(() => useAssets());
    const first = result.current.assets;
    rerender();

    expect(result.current.assets).toBe(first);
  });

  it("reports an HTTP error", async () => {
    mockFetch(() => ({ body: { detail: "boom" }, status: 502 }));

    const { result } = renderHook(() => useAssets());
    await flush();

    expect(result.current).toEqual({ assets: [], loading: false, error: "HTTP 502" });
  });

  it("reports a network error", async () => {
    mockFetch(() => new TypeError("Failed to fetch"));

    const { result } = renderHook(() => useAssets());
    await flush();

    expect(result.current.error).toBe("Failed to fetch");
  });

  it("refreshes every 5 minutes", async () => {
    const fetchMock = mockFetch(() => ({ body: assets }));

    renderHook(() => useAssets());
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await tick(POLL_INTERVAL_MS - 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await tick(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await tick(POLL_INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("keeps the last good data when a refresh fails, and clears the error on recovery", async () => {
    let status = 200;
    mockFetch(() => ({ body: status === 200 ? assets : {}, status }));

    const { result } = renderHook(() => useAssets());
    await flush();

    status = 503;
    await tick(POLL_INTERVAL_MS);
    expect(result.current).toEqual({ assets, loading: false, error: "HTTP 503" });

    status = 200;
    await tick(POLL_INTERVAL_MS);
    expect(result.current).toEqual({ assets, loading: false, error: null });
  });

  it("stops polling and aborts the request on unmount", async () => {
    const fetchMock = mockFetch(() => ({ body: assets }));

    const { unmount } = renderHook(() => useAssets());
    const signal = fetchMock.mock.calls[0]?.[1]?.signal;
    unmount();
    await tick(POLL_INTERVAL_MS * 3);

    expect(signal?.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("useFleetSummary", () => {
  it("returns the summary from /api/summary", async () => {
    const fetchMock = mockFetch(() => ({ body: summary }));

    const { result } = renderHook(() => useFleetSummary());
    expect(result.current).toEqual({ summary: null, loading: true, error: null });
    await flush();

    expect(result.current).toEqual({ summary, loading: false, error: null });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("/api/summary");
  });

  it("refreshes every 5 minutes", async () => {
    const fetchMock = mockFetch(() => ({ body: summary }));

    renderHook(() => useFleetSummary());
    await tick(POLL_INTERVAL_MS);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
