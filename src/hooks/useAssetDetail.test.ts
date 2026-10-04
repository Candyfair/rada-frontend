import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { historySnapshot } from "@/__fixtures__";
import type { AssetSnapshot } from "@/types/api";
import { useAssetDetail } from "./useAssetDetail";
import { deferred, mockFetch } from "./testUtils";

const snapshotFor = (assetId: number): AssetSnapshot => ({ ...historySnapshot, asset_id: assetId });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useAssetDetail", () => {
  it("does nothing without an asset id", () => {
    const fetchMock = mockFetch(() => ({ body: historySnapshot }));

    const { result } = renderHook(() => useAssetDetail(null));

    expect(result.current).toEqual({ data: null, loading: false, error: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads the latest snapshot of the asset", async () => {
    const fetchMock = mockFetch(() => ({ body: historySnapshot }));

    const { result } = renderHook(() => useAssetDetail(1));
    expect(result.current).toEqual({ data: null, loading: true, error: null });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toEqual({ data: historySnapshot, loading: false, error: null });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("/api/asset-history?asset_id=1&mode=S");
  });

  it("reports an HTTP error", async () => {
    mockFetch(() => ({ body: { detail: "Asset 999999 not found" }, status: 404 }));

    const { result } = renderHook(() => useAssetDetail(999999));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toEqual({ data: null, loading: false, error: "HTTP 404" });
  });

  it("never shows the previous asset's data while the next one loads", async () => {
    const second = deferred<{ body: unknown }>();
    mockFetch((url) => (url.includes("asset_id=1&") ? { body: snapshotFor(1) } : second.promise));

    const { result, rerender } = renderHook(({ id }) => useAssetDetail(id), {
      initialProps: { id: 1 },
    });
    await waitFor(() => expect(result.current.data?.asset_id).toBe(1));

    rerender({ id: 31 });
    expect(result.current).toEqual({ data: null, loading: true, error: null });

    second.resolve({ body: snapshotFor(31) });
    await waitFor(() => expect(result.current.data?.asset_id).toBe(31));
  });

  it("ignores a late response for an asset that is no longer selected", async () => {
    const first = deferred<{ body: unknown }>();
    const fetchMock = mockFetch((url) =>
      url.includes("asset_id=1&") ? first.promise : { body: snapshotFor(31) }
    );

    const { result, rerender } = renderHook(({ id }) => useAssetDetail(id), {
      initialProps: { id: 1 },
    });
    rerender({ id: 31 });
    await waitFor(() => expect(result.current.data?.asset_id).toBe(31));

    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    first.resolve({ body: snapshotFor(1) });
    await Promise.resolve();
    expect(result.current.data?.asset_id).toBe(31);
  });

  it("clears the data when the id goes back to null", async () => {
    mockFetch(() => ({ body: historySnapshot }));

    const { result, rerender } = renderHook(({ id }) => useAssetDetail(id), {
      initialProps: { id: 1 as number | null },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ id: null });
    expect(result.current).toEqual({ data: null, loading: false, error: null });
  });
});
