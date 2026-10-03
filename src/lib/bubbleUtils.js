// -------------------------------------------------------------------
// Centralises all bubble colour logic so neither BubbleChart nor
// BubbleNode need to know about business rules.
// Priority order (highest → lowest):
//   1. operational_mode !== "active"  →  fault red
//   2. asset_status === "unreachable" →  unreachable grey
//   3. asset_type                     →  type colour
// -------------------------------------------------------------------

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
};

/**
 * Returns the fill colour for a bubble.
 *
 * @param {Object} asset - the full asset object from the API
 * @returns {string} - a CSS hex colour string
 */
export function getBubbleColor(asset) {
  // Priority 1 — operational mode overrides everything
  if (asset.operational_mode !== "active") {
    return COLORS.fault;
  }

  // Priority 2 — unreachable overrides type colour
  if (asset.asset_status === "unreachable") {
    return COLORS.unreachable;
  }

  // Priority 3 — colour by asset type
  return COLORS[asset.asset_type] ?? COLORS.unknown;
}

/**
 * Returns the radius to use for D3 collision and SVG rendering.
 * For power_mw, the absolute value is used so negative values
 * still produce a visible, correctly-sized bubble.
 *
 * @param {Object} asset
 * @param {string} metric - "power_mw" | "energy_mwh"
 * @returns {number}
 */
export function getMetricValue(asset, metric) {
  const raw = asset[metric] ?? 0;
  return Math.abs(raw);
}
