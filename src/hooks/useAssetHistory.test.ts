import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { assetNotFound, historyRange } from "@/__fixtures__";
import type { AssetHistoryRange } from "@/types/api";
import { useAssetHistory } from "./useAssetHistory";
import { deferred, mockFetch } from "./testUtils";

const FROM = "2026-10-03T10:00:00.000Z";
const TO = "2026-10-03T15:00:00.000Z";

// The backend sends records newest first
const ascending = [...historyRange.records].reverse();

const params = (fetchMock: ReturnType<typeof mockFetch>, call = 0) =>
  new URL(String(fetchMock.mock.calls[call]?.[0]), "http://localhost").searchParams;

const rangeFor = (assetId: number, overrides: Partial<AssetHistoryRange> = {}) => ({
  ...historyRange,
  asset_id: assetId,
  ...overrides,
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useAssetHistory", () => {
  it("initAsset loads the last 5 hours", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(TO));
    const fetchMock = mockFetch(() => ({ body: rangeFor(1) }));

    const { result } = renderHook(() => useAssetHistory());
    act(() => result.current.initAsset(1));

    expect(result.current.histories[1]).toMatchObject({
      records: [],
      fromTs: FROM,
      toTs: TO,
      isLoading: true,
    });
    await waitFor(() => expect(result.current.histories[1]?.isLoading).toBe(false));

    const query = params(fetchMock);
    expect(Object.fromEntries(query)).toEqual({
      asset_id: "1",
      mode: "D",
      from_ts: FROM,
      to_ts: TO,
    });
    expect(result.current.histories[1]).toEqual({
      records: ascending,
      fromTs: historyRange.from_ts,
      toTs: historyRange.to_ts,
      isLoading: false,
      error: null,
    });
  });

  it("initAsset skips an asset that already has records", async () => {
    const fetchMock = mockFetch(() => ({ body: rangeFor(1) }));

    const { result } = renderHook(() => useAssetHistory());
    act(() => result.current.initAsset(1));
    await waitFor(() => expect(result.current.histories[1]?.isLoading).toBe(false));
    act(() => result.current.initAsset(1));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("initAsset skips an asset that is still loading", async () => {
    const reply = deferred<{ body: unknown }>();
    const fetchMock = mockFetch(() => reply.promise);

    const { result } = renderHook(() => useAssetHistory());
    act(() => result.current.initAsset(1));
    act(() => result.current.initAsset(1));
    await act(async () => reply.resolve({ body: rangeFor(1) }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("initAsset keeps the same identity across renders", async () => {
    mockFetch(() => ({ body: rangeFor(1) }));

    const { result } = renderHook(() => useAssetHistory());
    const first = result.current.initAsset;
    act(() => first(1));
    await waitFor(() => expect(result.current.histories[1]?.isLoading).toBe(false));

    expect(result.current.initAsset).toBe(first);
  });

  it("initAsset loads an asset again after it was removed", async () => {
    const fetchMock = mockFetch(() => ({ body: rangeFor(1) }));

    const { result } = renderHook(() => useAssetHistory());
    act(() => result.current.initAsset(1));
    await waitFor(() => expect(result.current.histories[1]?.isLoading).toBe(false));
    act(() => result.current.removeAsset(1));
    act(() => result.current.initAsset(1));
    await waitFor(() => expect(result.current.histories[1]?.isLoading).toBe(false));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reloadAsset requests the given range", async () => {
    const fetchMock = mockFetch(() => ({ body: rangeFor(1) }));

    const { result } = renderHook(() => useAssetHistory());
    act(() => result.current.reloadAsset(1, FROM, TO));
    await waitFor(() => expect(result.current.histories[1]?.isLoading).toBe(false));

    expect(params(fetchMock).get("from_ts")).toBe(FROM);
    expect(params(fetchMock).get("to_ts")).toBe(TO);
    expect(params(fetchMock).has("limit")).toBe(false);
  });

  it("falls back to the last 30 records without a full range", async () => {
    const fetchMock = mockFetch(() => ({ body: rangeFor(1) }));

    const { result } = renderHook(() => useAssetHistory());
    act(() => result.current.reloadAsset(1, FROM, null));
    await waitFor(() => expect(result.current.histories[1]?.isLoading).toBe(false));

    expect(params(fetchMock).get("limit")).toBe("30");
    expect(params(fetchMock).has("from_ts")).toBe(false);
  });

  it("sorts records oldest first", async () => {
    const shuffled = [3, 0, 5, 1, 4, 2].map((i) => historyRange.records[i]!);
    mockFetch(() => ({ body: rangeFor(1, { records: shuffled }) }));

    const { result } = renderHook(() => useAssetHistory());
    act(() => result.current.reloadAsset(1, FROM, TO));
    await waitFor(() => expect(result.current.histories[1]?.isLoading).toBe(false));

    expect(result.current.histories[1]?.records).toEqual(ascending);
  });

  it("keeps the previous records when a reload fails", async () => {
    let status = 200;
    mockFetch(() => ({ body: status === 200 ? rangeFor(1) : {}, status }));

    const { result } = renderHook(() => useAssetHistory());
    act(() => result.current.reloadAsset(1, FROM, TO));
    await waitFor(() => expect(result.current.histories[1]?.isLoading).toBe(false));

    status = 500;
    act(() => result.current.reloadAsset(1, FROM, TO));
    await waitFor(() => expect(result.current.histories[1]?.isLoading).toBe(false));

    expect(result.current.histories[1]).toMatchObject({
      records: ascending,
      error: "HTTP 500",
    });
  });

  it("treats a 404 as a range without records, not as an error", async () => {
    let status = 200;
    mockFetch(() => ({ body: status === 200 ? rangeFor(1) : assetNotFound, status }));

    const { result } = renderHook(() => useAssetHistory());
    act(() => result.current.reloadAsset(1, FROM, TO));
    await waitFor(() => expect(result.current.histories[1]?.isLoading).toBe(false));

    status = 404;
    act(() => result.current.reloadAsset(1, "2026-08-01T00:00:00.000Z", TO));
    await waitFor(() => expect(result.current.histories[1]?.isLoading).toBe(false));

    // The requested range stays, so the date inputs keep showing it
    expect(result.current.histories[1]).toEqual({
      records: [],
      fromTs: "2026-08-01T00:00:00.000Z",
      toTs: TO,
      isLoading: false,
      error: null,
    });
  });

  it("keeps the histories of other assets apart", async () => {
    mockFetch((url) => ({ body: rangeFor(url.includes("asset_id=1&") ? 1 : 31) }));

    const { result } = renderHook(() => useAssetHistory());
    act(() => {
      result.current.reloadAsset(1, FROM, TO);
      result.current.reloadAsset(31, FROM, TO);
    });
    await waitFor(() => expect(result.current.histories[31]?.isLoading).toBe(false));
    act(() => result.current.removeAsset(1));

    expect(Object.keys(result.current.histories)).toEqual(["31"]);
  });

  it("ignores a response for an asset removed while it was loading", async () => {
    const reply = deferred<{ body: unknown }>();
    mockFetch(() => reply.promise);

    const { result } = renderHook(() => useAssetHistory());
    act(() => result.current.reloadAsset(1, FROM, TO));
    act(() => result.current.removeAsset(1));
    await act(async () => reply.resolve({ body: rangeFor(1) }));

    expect(result.current.histories).toEqual({});
  });

  it("applies only the latest of two overlapping reloads", async () => {
    const slow = deferred<{ body: unknown }>();
    const fastRecords = ascending.slice(0, 2);
    mockFetch((url) =>
      url.includes("from_ts=old") ? slow.promise : { body: rangeFor(1, { records: fastRecords }) }
    );

    const { result } = renderHook(() => useAssetHistory());
    act(() => result.current.reloadAsset(1, "old", TO));
    act(() => result.current.reloadAsset(1, FROM, TO));
    await waitFor(() => expect(result.current.histories[1]?.isLoading).toBe(false));
    await act(async () => slow.resolve({ body: rangeFor(1) }));

    expect(result.current.histories[1]?.records).toEqual(fastRecords);
  });
});
