import type { FleetSummary } from "@/types/api";
import { usePolledJson } from "./usePolledJson";

// Fleet totals, refreshed every 5 minutes
export function useFleetSummary() {
  const { data, loading, error } = usePolledJson<FleetSummary>("/api/summary");
  return { summary: data, loading, error };
}
