import { useState, useEffect } from "react";

// Fetches the latest SOC record for a single asset
// endpoint: GET /assets/{asset_id}/soc?mode=S
export function useAssetDetail(assetId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!assetId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/asset-history?asset_id=${assetId}&mode=S`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    }, [assetId]);

  return { data, loading, error };
}