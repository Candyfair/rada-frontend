import { useEffect, useState } from "react";
import { errorMessage, fetchJson, isAbortError } from "@/lib/fetchJson";
import type { AssetSnapshot } from "@/types/api";

interface DetailResult {
  assetId: number;
  data: AssetSnapshot | null;
  error: string | null;
}

// Fetches the latest SOC record for a single asset
// endpoint: GET /assets/{asset_id}/soc?mode=S
//
// The result is stored with the id it belongs to, so `loading` is derived:
// it is true until a result for the current id arrives. This avoids setting
// state synchronously in the effect and never shows another asset's data.
export function useAssetDetail(assetId: number | null | undefined) {
  const [result, setResult] = useState<DetailResult | null>(null);

  useEffect(() => {
    if (assetId == null) return;
    const controller = new AbortController();

    fetchJson<AssetSnapshot>(`/api/asset-history?asset_id=${assetId}&mode=S`, controller.signal)
      .then((data) => setResult({ assetId, data, error: null }))
      .catch((err: unknown) => {
        if (!isAbortError(err)) setResult({ assetId, data: null, error: errorMessage(err) });
      });

    return () => controller.abort();
  }, [assetId]);

  const current = assetId != null && result?.assetId === assetId ? result : null;
  return {
    data: current?.data ?? null,
    loading: assetId != null && current === null,
    error: current?.error ?? null,
  };
}
