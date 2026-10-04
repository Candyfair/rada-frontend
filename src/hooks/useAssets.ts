import type { Asset } from "@/types/api";
import { usePolledJson } from "./usePolledJson";

// Stable reference so consumers' memos don't recompute while loading
const NO_ASSETS: Asset[] = [];

// Asset list, refreshed every 5 minutes
export function useAssets() {
  const { data, loading, error } = usePolledJson<Asset[]>("/api/assets");
  return { assets: data ?? NO_ASSETS, loading, error };
}
