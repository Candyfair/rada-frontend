"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BatteryFull, Zap, Thermometer, Unplug } from "lucide-react";
import { getModeColor, getStatusColor, getValueColor } from "@/lib/assetUtils";

// -------------------------------------------------------------------
// SUB-COMPONENTS
// -------------------------------------------------------------------

function IconBlock({ icon: Icon }) {
  return (
    <div style={styles.iconBlock}>
      <Icon size={20} color="var(--color-detail-text)" />
    </div>
  );
}

function DataRow({ label, value, valueColor }) {
  return (
    <div style={styles.dataRow}>
      <span style={styles.dataLabel}>{label}</span>
      <span style={{ ...styles.dataValue, color: valueColor ?? "var(--color-detail-text)" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function DataBlock({ icon, children }) {
  return (
    <div style={styles.dataBlock}>
      <IconBlock icon={icon} />
      {children}
    </div>
  );
}

// -------------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------------
export default function AssetDetailPage({ asset, detail, loading, error, onBack }) {
  const record = detail?.record ?? null;
  const isBattery = asset?.asset_type === "battery";

  const dc = "var(--color-detail-text)"; // dc = defaultColor

  return (
    <div style={styles.root}>
      <div style={styles.inner}>
        {/* ---- BACK BUTTON ---- */}
        <div style={styles.backRow}>
          <button style={styles.backButton} onClick={onBack} aria-label="Go back">
            <ArrowLeft size={22} color="var(--color-icon)" />
          </button>
        </div>

        {/* ---- SCROLLABLE CONTENT ---- */}
        <div style={styles.scrollArea}>
          {/* Asset name — yellow panel block */}
          <div style={styles.nameBlock}>
            <span style={styles.nameText}>{asset?.name ?? "—"}</span>
          </div>

          {/* EIC code */}
          <div style={styles.eicBlock}>
            <span style={styles.eicText}>EIC code: {asset?.eic_code ?? "—"}</span>
          </div>

          {loading && (
            <div style={styles.loadingRow}>
              <span style={styles.loadingText}>Loading...</span>
            </div>
          )}

          {error && (
            <div style={styles.loadingRow}>
              <span style={{ ...styles.loadingText, color: "var(--color-status-fault)" }}>
                Error: {error}
              </span>
            </div>
          )}

          {/* ---- CAPACITY BLOCK — batteries only ---- */}
          {isBattery && (
            <DataBlock icon={BatteryFull}>
              <DataRow label="Capacity" value={record ? `${detail.max_capacity_mwh} MWh` : "—"} />
              <DataRow
                label="Current capacity"
                value={record ? `${record.energy_mwh} MWh` : "—"}
                valueColor={record ? getValueColor(record.energy_mwh, dc) : undefined}
              />
              <DataRow
                label="Battery state"
                value={record ? `${record.power_mw < 0 ? "Charging" : "Discharging"}` : "—"}
                valueColor={record ? getValueColor(record.energy_mwh, dc) : undefined}
              />
            </DataBlock>
          )}

          {/* ---- POWER BLOCK ---- */}
          <DataBlock icon={Zap}>
            <DataRow
              label="Active power"
              value={record ? `${record.power_mw} MW` : "—"}
              valueColor={record ? getValueColor(record.power_mw, dc) : undefined}
            />
            <DataRow
              label="Reactive power"
              value={record ? `${record.reactive_power_mvar} MVAr` : "—"}
              valueColor={record ? getValueColor(record.reactive_power_mvar, dc) : undefined}
            />
            <DataRow
              label="Voltage"
              value={record ? `${record.voltage} V` : "—"}
              valueColor={record ? getValueColor(record.voltage, dc) : undefined}
            />
            <DataRow
              label="Current Amps"
              value={record ? `${record.current_amps} A` : "—"}
              valueColor={record ? getValueColor(record.current_amps, dc) : undefined}
            />
          </DataBlock>

          {/* ---- TEMPERATURE BLOCK ---- */}
          <DataBlock icon={Thermometer}>
            <DataRow
              label="Temperature"
              value={record ? `${record.temperature_celsius} C°` : "—"}
              valueColor={record ? getValueColor(record.temperature_celsius, dc) : undefined}
            />
          </DataBlock>

          {/* ---- STATUS BLOCK ---- */}
          <DataBlock icon={Unplug}>
            <DataRow
              label="Operational mode"
              value={record?.operational_mode ?? "—"}
              valueColor={record ? getModeColor(record.operational_mode, dc) : undefined}
            />
            <DataRow
              label="Telemetric status"
              value={record?.asset_status ?? "—"}
              valueColor={record ? getStatusColor(record.asset_status, dc) : undefined}
            />
          </DataBlock>

          {/* ---- LAST UPDATED ---- */}
          <div style={styles.lastUpdatedBlock}>
            <span style={styles.lastUpdatedText}>Last updated time</span>
            <span style={styles.lastUpdatedText}>
              {record
                ? new Date(record.timestamp).toLocaleString("fr-FR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// STYLES
// -------------------------------------------------------------------
const styles = {
  root: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "transparent",
    zIndex: 50,
  },

  inner: {
    width: "100%",
    maxWidth: 600,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflowY: "hidden",
  },

  // Back button row — sits above the scrollable content
  // zIndex 60 ensures it stays above the blur overlay
  backRow: {
    position: "relative",
    zIndex: 60,
    padding: "12px 16px 0",
    flexShrink: 0,
  },

  backButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
  },

  scrollArea: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 16px 32px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  nameBlock: {
    backgroundColor: "var(--color-panel-bg)",
    border: "1px solid var(--color-panel-border)",
    borderRadius: 12,
    padding: "14px 16px",
  },

  nameText: {
    fontSize: 20,
    fontWeight: "700",
    color: "var(--color-panel-title)",
    lineHeight: 1.3,
  },

  eicBlock: {
    backgroundColor: "var(--color-panel-bg)",
    border: "1px solid var(--color-panel-border)",
    borderRadius: 12,
    padding: "10px 16px",
  },

  eicText: {
    fontSize: 18,
    fontWeight: "500",
    color: "var(--color-panel-title)",
    fontFamily: "var(--font-mono)",
  },

  dataBlock: {
    backgroundColor: "var(--color-detail-block-bg)",
    borderRadius: 12,
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  iconBlock: {
    width: 36,
    height: 36,
    backgroundColor: "var(--color-detail-icon-bg)",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  dataRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dataLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "var(--color-detail-text)",
  },

  dataValue: {
    fontSize: 16,
    fontWeight: "600",
  },

  lastUpdatedBlock: {
    backgroundColor: "var(--color-detail-block-bg)",
    borderRadius: 12,
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },

  lastUpdatedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "var(--color-detail-text)",
  },

  loadingRow: {
    padding: "8px 0",
  },

  loadingText: {
    fontSize: 13,
    color: "var(--color-detail-text)",
  },
};
