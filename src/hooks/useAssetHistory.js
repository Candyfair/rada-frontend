import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/lib/constants";

// 5 hours at 10-minute intervals = 30 points
const DEFAULT_LIMIT = 30;

export function useAssetHistory() {
  const [histories, setHistories] = useState({});

  const fetchRecords = useCallback(async (assetId, fromTimestamp = null, toTimestamp = null) => {
    // Mark this asset as loading, preserving any existing data during the request
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
        // Date range provided — let the API determine the appropriate resolution
        // Do not pass a limit so the backend returns all points for this range
        url += `&from_ts=${encodeURIComponent(fromTimestamp)}`;
        url += `&to_ts=${encodeURIComponent(toTimestamp)}`;
      } else {
        // Initial load without dates — limit to last 30 points (approx. 5 hours)
        url += `&limit=${DEFAULT_LIMIT}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const records = data.records ?? [];

      // Strip timezone suffix from timestamps so date-fns treats them
      // as local time, consistent with from_ts / to_ts from the API
      const normalizedRecords = records.map((r) => ({
        ...r,
        timestamp: r.timestamp.slice(0, 19),
      }));

      normalizedRecords.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Replace existing records entirely — date range changes are not incremental
      setHistories((prev) => ({
        ...prev,
        [assetId]: {
          records: normalizedRecords,
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

  // Initial load for an asset — called when an asset is added to the comparison
  const initAsset = useCallback((assetId) => {
    if (histories[assetId]?.records?.length > 0) return;

    // Compute default 5-hour window from current time
    const now = new Date();
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    // Format as "YYYY-MM-DDTHH:mm:ss" without timezone suffix
    // The backend expects local-style ISO strings without offset
    const toTs = now.toISOString().slice(0, 19);
    const fromTs = fiveHoursAgo.toISOString().slice(0, 19);

    fetchRecords(assetId, fromTs, toTs);
  }, [histories, fetchRecords]);

  // Reload an asset's data for a specific date range (driven by the date picker)
  const reloadAsset = useCallback(
    (assetId, fromTimestamp, toTimestamp) => {
      fetchRecords(assetId, fromTimestamp, toTimestamp);
    },
    [fetchRecords]
  );

  // Remove an asset from state when the user deselects it
  const removeAsset = useCallback((assetId) => {
    setHistories((prev) => {
      const next = { ...prev };
      delete next[assetId];
      return next;
    });
  }, []);

  return { histories, initAsset, reloadAsset, removeAsset };
}