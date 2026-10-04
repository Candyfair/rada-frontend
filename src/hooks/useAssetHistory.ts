import { useCallback, useRef, useState } from "react";
import { errorMessage, fetchJson } from "@/lib/fetchJson";
import type { AssetHistoryRange, SocRecord } from "@/types/api";

const DEFAULT_LIMIT = 30;
const INITIAL_WINDOW_MS = 5 * 60 * 60 * 1000;

export interface AssetHistory {
  records: SocRecord[];
  fromTs: string | null;
  toTs: string | null;
  isLoading: boolean;
  error: string | null;
}

export type AssetHistories = Partial<Record<number, AssetHistory>>;

export function useAssetHistory() {
  const [histories, setHistories] = useState<AssetHistories>({});

  // Latest request per asset: a response is applied only if it is still the
  // latest one, so a slow reply can't overwrite a newer range or bring back
  // an asset that was removed in the meantime.
  const latestRequest = useRef(new Map<number, symbol>());

  const fetchRecords = useCallback(
    async (
      assetId: number,
      fromTimestamp: string | null = null,
      toTimestamp: string | null = null
    ) => {
      const request = Symbol();
      latestRequest.current.set(assetId, request);
      const isLatest = () => latestRequest.current.get(assetId) === request;

      setHistories((prev) => ({
        ...prev,
        [assetId]: {
          records: prev[assetId]?.records ?? [],
          fromTs: null,
          toTs: null,
          isLoading: true,
          error: null,
        },
      }));

      try {
        // Build proxy URL with query params forwarded to the API Route
        const params = new URLSearchParams({ asset_id: String(assetId), mode: "D" });

        if (fromTimestamp && toTimestamp) {
          params.set("from_ts", fromTimestamp);
          params.set("to_ts", toTimestamp);
        } else {
          params.set("limit", String(DEFAULT_LIMIT));
        }

        const data = await fetchJson<AssetHistoryRange>(`/api/asset-history?${params.toString()}`);
        if (!isLatest()) return;

        // Records arrive as UTC with +00:00 suffix — keep them as-is.
        // Conversion to Paris time happens at display time in the chart.
        const records = [...(data.records ?? [])].sort(
          (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
        );

        setHistories((prev) => ({
          ...prev,
          [assetId]: {
            records,
            fromTs: data.from_ts ?? null,
            toTs: data.to_ts ?? null,
            isLoading: false,
            error: null,
          },
        }));
      } catch (err) {
        if (!isLatest()) return;
        setHistories((prev) => ({
          ...prev,
          [assetId]: {
            records: prev[assetId]?.records ?? [],
            fromTs: prev[assetId]?.fromTs ?? null,
            toTs: prev[assetId]?.toTs ?? null,
            isLoading: false,
            error: errorMessage(err),
          },
        }));
      }
    },
    []
  );

  // Loads the last 5 hours, unless records are already there
  const initAsset = useCallback(
    (assetId: number) => {
      if ((histories[assetId]?.records.length ?? 0) > 0) return;

      // Send full UTC ISO strings with Z suffix as required by the API
      const now = Date.now();
      fetchRecords(
        assetId,
        new Date(now - INITIAL_WINDOW_MS).toISOString(),
        new Date(now).toISOString()
      );
    },
    [histories, fetchRecords]
  );

  const reloadAsset = useCallback(
    (assetId: number, fromTimestamp: string | null, toTimestamp: string | null) => {
      fetchRecords(assetId, fromTimestamp, toTimestamp);
    },
    [fetchRecords]
  );

  const removeAsset = useCallback((assetId: number) => {
    latestRequest.current.delete(assetId);
    setHistories((prev) => {
      const next = { ...prev };
      delete next[assetId];
      return next;
    });
  }, []);

  return { histories, initAsset, reloadAsset, removeAsset };
}
