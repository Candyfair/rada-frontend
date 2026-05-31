import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/lib/constants";

const DEFAULT_LIMIT = 30;

export function useAssetHistory() {
  const [histories, setHistories] = useState({});

  const fetchRecords = useCallback(async (assetId, fromTimestamp = null, toTimestamp = null) => {
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
      let url = `${API_BASE_URL}/assets/${assetId}/soc?mode=D`;

      if (fromTimestamp && toTimestamp) {
        url += `&from_ts=${encodeURIComponent(fromTimestamp)}`;
        url += `&to_ts=${encodeURIComponent(toTimestamp)}`;
      } else {
        url += `&limit=${DEFAULT_LIMIT}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const records = data.records ?? [];

      // Records arrive as UTC with +00:00 suffix — keep them as-is.
      // Conversion to Paris time happens at display time in the chart.
      records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

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
      setHistories((prev) => ({
        ...prev,
        [assetId]: {
          ...(prev[assetId] ?? {}),
          isLoading: false,
          error: err.message,
        },
      }));
    }
  }, []);

  const initAsset = useCallback((assetId) => {
    if (histories[assetId]?.records?.length > 0) return;

    const now = new Date();
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    // Send full UTC ISO strings with Z suffix as required by the API
    const toTs = now.toISOString();
    const fromTs = fiveHoursAgo.toISOString();

    fetchRecords(assetId, fromTs, toTs);
  }, [histories, fetchRecords]);

  const reloadAsset = useCallback((assetId, fromTimestamp, toTimestamp) => {
    fetchRecords(assetId, fromTimestamp, toTimestamp);
  }, [fetchRecords]);

  const removeAsset = useCallback((assetId) => {
    setHistories((prev) => {
      const next = { ...prev };
      delete next[assetId];
      return next;
    });
  }, []);

  return { histories, initAsset, reloadAsset, removeAsset };
}