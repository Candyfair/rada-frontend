// -------------------------------------------------------------------
// assetUtils.js — shared helpers for asset data display
// Used by DetailPanel and AssetDetailPage
// -------------------------------------------------------------------

// Returns the correct colour token for operational_mode values
export function getModeColor(mode, defaultColor = "var(--color-panel-value)") {
  switch (mode) {
    case "active":
      return "var(--color-status-active)";
    case "fault":
      return "var(--color-status-fault)";
    case "curtailed":
      return "var(--color-status-curtailed)";
    default:
      return defaultColor;
  }
}

// Returns the correct colour token for asset_status values
export function getStatusColor(status, defaultColor = "var(--color-panel-value)") {
  switch (status) {
    case "communicating":
      return "var(--color-status-active)";
    default:
      return defaultColor;
  }
}

// Negative numeric values are displayed in red
export function getValueColor(value, defaultColor = "var(--color-panel-value)") {
  return value < 0 ? "var(--color-value-negative)" : defaultColor;
}
