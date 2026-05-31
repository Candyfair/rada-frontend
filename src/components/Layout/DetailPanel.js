"use client";

import { useState, useEffect } from "react";
import { ArrowRight, X, ChartColumnBig } from "lucide-react";
import { getModeColor, getStatusColor, getValueColor } from "@/lib/assetUtils";

// DetailPanel — slide-up panel showing summary data for the selected asset.
//
// Visible states :
//   - No asset selected     : hidden below screen (translateY 150%)
//   - Asset selected        : slides up into view (translateY 0)
//   - Detail page open      : slides out to the left (translateX -120%)
//     in sync with AssetDetailPage sliding in from the right
//
// The panel is never unmounted — visibility + transform handle
// show/hide so the slide animation always plays correctly.

export default function DetailPanel({
  selectedAsset,
  isDetailOpen,
  onDismiss,
  onOpenDetail,
  onOpenStats,
}) {

  // Keep the last selected asset in memory so the panel content
  // stays visible during the closing animation.
  const [lastAsset, setLastAsset] = useState(selectedAsset);

  if (selectedAsset && selectedAsset !== lastAsset) {
    setLastAsset(selectedAsset);
  }

  const displayedAsset = selectedAsset ?? lastAsset;

  // Derive the correct transform from the two state booleans
  const transform = isDetailOpen
    ? "translateX(calc(-50% - 120%))"
    : selectedAsset
      ? "translateX(-50%)"
      : "translateX(-50%) translateY(150%)";

  // Fade out when sliding to the left with the detail page
  const opacity = isDetailOpen ? 0 : 1;

  // visibility stays "visible" as long as an asset is selected —
  // hidden only when no asset is selected AND the panel is fully gone.
  // The transition delay on visibility matches the slide duration
  // so it only hides after the animation completes.
  const visibility = selectedAsset ? "visible" : "hidden";
  const visibilityTransition = selectedAsset
    ? "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease, visibility 0s"
    : "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease, visibility 0s 0.35s";

  return (
    <div
      style={{
        ...styles.panel,
        transform,
        opacity,
        visibility,
        transition: visibilityTransition,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {displayedAsset && (
        <>
          <button
              style={styles.closeButton}
              onClick={onDismiss}
              aria-label="Close panel"
          >
              <X />
          </button>

          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>{displayedAsset.name}</h2>
          </div>

          <div style={styles.panelBody}>
            <div style={styles.panelRowsBlock}>
              <DetailRow
                label="Type"
                value={displayedAsset.asset_type}
              />

              {/* Batteries only */}
              { displayedAsset.asset_type === "battery" && (
                <>
                  <DetailRow  
                    label="Maximum capacity"
                    value={`${displayedAsset.max_capacity_mwh} MWh`}
                    />
                  <DetailRow
                    label="Current power"
                    value={`${displayedAsset.energy_mwh?.toFixed(2)} MWh`}
                    valueColor={getValueColor(displayedAsset.energy_mwh)}
                    />
                </>
              )}

              {/* All assets */}
              <DetailRow
                label="Maximum charge"
                value={`${displayedAsset.max_charge_rate_mw} MW`}
              />
              <DetailRow
                label={`Current ${displayedAsset.power_mw <- 0 ? "discharge" : "charge"}`}
                value={`${displayedAsset.power_mw?.toFixed(2)} MW`}
                valueColor={getValueColor(displayedAsset.power_mw)}
              />
              <DetailRow
                label="Reactive power"
                value={`${displayedAsset.reactive_power_mvar?.toFixed(2)} MVAr`}
                valueColor={getValueColor(displayedAsset.reactive_power_mvar)}
              />
              <DetailRow
                label="Operational mode"
                value={displayedAsset.operational_mode}
                valueColor={getModeColor(displayedAsset.operational_mode)}
              />
              <DetailRow
                label="Status"
                value={displayedAsset.asset_status}
                valueColor={getStatusColor(displayedAsset.asset_status)}
              />
            </div>
          </div>

          {/* Bottom action row — stats icon + view details */}
          <div style={styles.bottomActions}>
            <button
              style={styles.statsButton}
              onClick={onOpenStats}
              aria-label="Open stats for this asset"
            >
              <ChartColumnBig size={20} />
            </button>

            <button
              style={styles.detailButton}
              onClick={onOpenDetail}
              aria-label="View asset details"
            >
              View details
              <ArrowRight size={14} style={{ marginLeft: 6 }} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// DETAIL ROW
// -------------------------------------------------------------------
function DetailRow({ label, value, valueColor }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={{
        ...styles.detailValue,
        color: valueColor ?? "var(--color-panel-value)",
      }}>{value}</span>
    </div>
  );
}

// -------------------------------------------------------------------
// STYLES
// -------------------------------------------------------------------
const styles = {
  panel: {
    position: "absolute",
    bottom: 60,
    left: "50%",
    transform: "translateX(-50%)",  // centering — will be overridden inline
    width: "calc(100% - 40px)",
    maxWidth: 600,
    height: "auto",
    maxHeight: "80%",
    backgroundColor: "var(--color-panel-bg)",
    border: "1px solid var(--color-panel-border)",
    borderRadius: 20,
    padding: "12px 18px",
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  },

  panelHeader: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  panelTitle: {
    margin: 0,
    paddingLeft: 2,
    fontSize: 18,
    fontWeight: "700",
    color: "var(--color-panel-title)",
    marginBottom: 12
  },

  closeButton: {
    background: "none",
    border: "none",
    color: "var(--color-panel-title)",
    fontSize: 24,
    cursor: "pointer",
    lineHeight: 1,
    textAlign: "right"
  },

  panelBody: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflowY: "auto",
  },

  panelRowsBlock: {
    backgroundColor: "var(--color-panel-row-bg)",
    borderRadius: 10,
    padding: "8px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  bottomActions: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",  
    gap: 8,                   
    position: "absolute",
    bottom: -50,
    right: 0,
    },

  detailButton: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "var(--color-panel-row-bg)",
    color: "var(--color-panel-value)",
    border: "solid 1px var(--color-icon)",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: 16,
    paddingTop: 11,
    paddingBottom: 11,
    paddingLeft: 18,
    paddingRight: 18,
    borderRadius: 12,
    letterSpacing: 0.3,
  },

  statsButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--color-panel-row-bg)",
    color: "var(--color-panel-value)",
    border: "solid 1px var(--color-icon)",
    cursor: "pointer",
    width: 42,
    height: 42,
    borderRadius: 12,
  },

  detailRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  detailLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "var(--color-panel-label)",
  },

  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "var(--color-panel-value)",
  },


};