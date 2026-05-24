// src/hooks/useAssetHistory.js

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
      let url = `${API_BASE_URL}/assets/${assetId}/soc?mode=D&limit=${DEFAULT_LIMIT}`;

      // Append optional date range parameters when provided
      if (fromTimestamp) url += `&from_ts=${encodeURIComponent(fromTimestamp)}`;
      if (toTimestamp) url += `&to_ts=${encodeURIComponent(toTimestamp)}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const records = data.records ?? [];

      // Sort ascending by timestamp so Recharts receives chronological data
      records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Replace existing records entirely — date range changes are not incremental
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

  // Initial load for an asset — called when an asset is added to the comparison
  const initAsset = useCallback(
    (assetId) => {
      if (histories[assetId]?.records?.length > 0) return;
      fetchRecords(assetId);
    },
    [histories, fetchRecords]
  );

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