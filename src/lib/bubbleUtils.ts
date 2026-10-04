// -------------------------------------------------------------------
// Centralises all bubble colour logic so neither BubbleChart nor
// BubbleNode need to know about business rules.
// Priority order (highest → lowest):
//   1. operational_mode !== "active"  →  fault red
//   2. asset_status === "unreachable" →  unreachable grey
//   3. asset_type                     →  type colour
// -------------------------------------------------------------------

import type { Asset, BubbleMetric } from "@/types/api";

const COLORS = {
  // Asset type colours
  battery: "#7AA5AB",
  solar: "#78AB84",
  wind: "#E68B6D",

  // State overrides
  fault: "#683138", // any operational_mode that is not "active"
  unreachable: "#E3E2DF", // asset_status === "unreachable", only if mode is active

  // Fallback if asset_type is unknown
  unknown: "#8E9AA0",
} as const;

/**
 * Returns the fill colour for a bubble.
 *
 * Returns a CSS hex colour string.
 */
export function getBubbleColor(
  asset: Pick<Asset, "asset_type" | "operational_mode" | "asset_status">
): string {
  // Priority 1 — operational mode overrides everything
  if (asset.operational_mode !== "active") {
    return COLORS.fault;
  }

  // Priority 2 — unreachable overrides type colour
  if (asset.asset_status === "unreachable") {
    return COLORS.unreachable;
  }

  // Priority 3 — colour by asset type (the API may send a type this app
  // does not know yet, hence the fallback)
  return COLORS[asset.asset_type] ?? COLORS.unknown;
}

/**
 * Returns the radius to use for D3 collision and SVG rendering.
 * For power_mw, the absolute value is used so negative values
 * still produce a visible, correctly-sized bubble.
 */
export function getMetricValue(
  asset: Partial<Record<BubbleMetric, number | null>>,
  metric: BubbleMetric
): number {
  const raw = asset[metric] ?? 0;
  return Math.abs(raw);
}
