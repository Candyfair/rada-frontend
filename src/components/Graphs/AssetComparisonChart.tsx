import { useState, useEffect, useRef, useMemo } from "react";
import type { KeyboardEvent } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ChevronDown, X } from "lucide-react";
import { useAssetHistory } from "@/hooks/useAssetHistory";
import { parisInputToUtcIso, utcToParisInput } from "@/lib/dateUtils";
import type { Asset } from "@/types/api";
import { buildXTicks, mergeRecords, spanInHours } from "./chartData";
import type { Metric } from "./chartData";
import styles from "./AssetComparisonChart.module.css";

// Metrics available for Y axis — label shown in the UI, key in the record object,
// and unit displayed on the axis
const METRICS: Metric[] = [
  { key: "power_mw", label: "Power", unit: "MW" },
  { key: "energy_mwh", label: "Energy", unit: "MWh" },
  { key: "reactive_power_mvar", label: "Reactive Power", unit: "MVAr" },
  { key: "power_factor", label: "Power factor", unit: "%" },
  { key: "temperature_celsius", label: "Temperature", unit: "°C" },
  { key: "voltage", label: "Voltage", unit: "V" },
  { key: "current_amps", label: "Current amps", unit: "A" },
];

// One distinct color per line — drawn from the existing design token palette
const LINE_COLORS = [
  "hsl(189, 18%, 58%)", // --hsl-battery (teal)
  "hsl(15, 71%, 66%)", // --hsl-wind (orange)
  "hsl(134, 23%, 57%)", // --hsl-solar (green)
  "hsl(351, 35%, 30%)", // --hsl-fault (dark red)
  "hsl(217, 89%, 61%)", // --color-value-negative (blue)
];

const AXIS_TICK = { fontFamily: "var(--font-mono)", fontSize: 10 };

// Format a parsed date, falling back to the raw value if it is not a date
function safeFormat(timestamp: string, pattern: string): string {
  try {
    return format(parseISO(timestamp), pattern);
  } catch {
    return timestamp;
  }
}

interface AssetComparisonChartProps {
  /** Asset shown when the chart opens. Remount the chart to change it. */
  initialAssetId: number | null;
  /** Assets offered in the selector */
  assets: Asset[];
}

export default function AssetComparisonChart({
  initialAssetId,
  assets,
}: AssetComparisonChartProps) {
  const { histories, initAsset, reloadAsset, removeAsset } = useAssetHistory();

  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    initialAssetId == null ? [] : [initialAssetId]
  );
  const [activeMetric, setActiveMetric] = useState<Metric>(METRICS[0]!);
  // null until the user edits a date: the input then shows the range
  // of the first selected asset
  const [fromInput, setFromInput] = useState<string | null>(null);
  const [toInput, setToInput] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load the pre-selected asset. initAsset is stable and skips an asset
  // already requested, so this runs once even in Strict Mode.
  useEffect(() => {
    if (initialAssetId != null) initAsset(initialAssetId);
  }, [initialAssetId, initAsset]);

  useEffect(() => {
    if (!isDropdownOpen) return;
    function handleOutsideClick(e: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isDropdownOpen]);

  const firstSelectedId = selectedIds[0];
  const firstHistory = firstSelectedId == null ? undefined : histories[firstSelectedId];
  const from = fromInput ?? utcToParisInput(firstHistory?.fromTs);
  const to = toInput ?? utcToParisInput(firstHistory?.toTs);

  const nameOf = (id: number | string) =>
    assets.find((a) => String(a.id) === String(id))?.name ?? `Asset ${id}`;

  // ------------------------------------------------------------------
  // HANDLERS
  // ------------------------------------------------------------------
  // Load the given assets over the range shown in the inputs.
  // The range is kept as typed, so it does not move while the data loads.
  function loadRange(ids: number[]) {
    setFromInput(from);
    setToInput(to);
    for (const id of ids) reloadAsset(id, parisInputToUtcIso(from), parisInputToUtcIso(to));
  }

  function handleAddAsset(id: number) {
    if (selectedIds.includes(id)) return;
    const newIds = [...selectedIds, id];
    setSelectedIds(newIds);

    // Same range for every line: reload them all over the current range
    if (from && to) loadRange(newIds);
    else initAsset(id);

    setIsDropdownOpen(false);
  }

  function handleRemoveAsset(id: number) {
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    removeAsset(id);
  }

  function handleApplyDateRange() {
    if (from && to) loadRange(selectedIds);
  }

  function handleSelectorKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    // Keys pressed on a tag's remove button are not for the selector
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsDropdownOpen((prev) => !prev);
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  }

  // ------------------------------------------------------------------
  // RECHARTS
  // ------------------------------------------------------------------
  const data = useMemo(
    () => mergeRecords(selectedIds, histories, activeMetric.key),
    [selectedIds, histories, activeMetric]
  );
  const xTicks = useMemo(() => buildXTicks(data), [data]);
  const multiDay = spanInHours(data) > 24;

  const isAnyLoading = selectedIds.some((id) => histories[id]?.isLoading);
  const failed = selectedIds.filter((id) => histories[id]?.error);
  // Only once every request has answered: before that the chart keeps
  // showing the previous data
  const isEmpty =
    selectedIds.length > 0 &&
    data.length === 0 &&
    !isAnyLoading &&
    failed.length < selectedIds.length;

  return (
    <div className={styles.wrapper}>
      {/* ---- Metric chips ---- */}
      <div className={styles.metricRow}>
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            className={`${styles.metricChip} ${activeMetric.key === m.key ? styles.active : ""}`}
            aria-pressed={activeMetric.key === m.key}
            onClick={() => setActiveMetric(m)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ---- Date range ---- */}
      <div className={styles.dateRow}>
        <input
          type="datetime-local"
          className={styles.dateInput}
          aria-label="Start date"
          value={from}
          onChange={(e) => setFromInput(e.target.value)}
        />
        <input
          type="datetime-local"
          className={styles.dateInput}
          aria-label="End date"
          value={to}
          onChange={(e) => setToInput(e.target.value)}
        />
        <button
          type="button"
          className={styles.applyButton}
          onClick={handleApplyDateRange}
          disabled={!from || !to || selectedIds.length === 0}
        >
          Apply
        </button>
      </div>

      {/* ---- Asset selector ---- */}
      <div className={styles.selectorWrapper} ref={dropdownRef}>
        <div
          className={styles.selectorBox}
          role="button"
          tabIndex={0}
          aria-label="Select assets"
          aria-haspopup="true"
          aria-expanded={isDropdownOpen}
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          onKeyDown={handleSelectorKeyDown}
        >
          {selectedIds.length === 0 && <span className={styles.placeholder}>Select assets...</span>}
          {selectedIds.map((id) => (
            <span key={id} className={styles.tag}>
              {nameOf(id)}
              <button
                type="button"
                className={styles.tagRemove}
                // Prevent the click from bubbling up to selectorBox
                // which would toggle the dropdown
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveAsset(id);
                }}
                aria-label={`Remove ${nameOf(id)}`}
              >
                ×
              </button>
            </span>
          ))}
          <ChevronDown
            size={16}
            className={`${styles.chevron} ${isDropdownOpen ? styles.open : ""}`}
          />
        </div>

        {isDropdownOpen && (
          <div className={styles.dropdown}>
            {assets.map((asset) => {
              const isSelected = selectedIds.includes(asset.id);
              return (
                <button
                  key={asset.id}
                  type="button"
                  className={`${styles.dropdownItem} ${isSelected ? styles.selected : ""}`}
                  aria-pressed={isSelected}
                  onClick={() =>
                    isSelected ? handleRemoveAsset(asset.id) : handleAddAsset(asset.id)
                  }
                >
                  <span>{asset.name}</span>
                  {isSelected && <X size={12} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Chart ---- */}
      {isAnyLoading && <p className={styles.loadingText}>Loading data...</p>}

      {selectedIds.length === 0 && (
        <p className={styles.emptyText}>Select an asset to display the chart.</p>
      )}

      {isEmpty && <p className={styles.emptyText}>No data for this period.</p>}

      {failed.map((id) => (
        <p key={id} className={styles.errorText} role="alert">
          Could not load {nameOf(id)}: {histories[id]?.error}
        </p>
      ))}

      {selectedIds.length > 0 && (
        <div className={styles.chartWrapper}>
          <div className={`${styles.chartInner} ${isAnyLoading ? styles.loading : ""}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="timestamp"
                  ticks={xTicks}
                  tickFormatter={(value: string) => safeFormat(value, multiDay ? "dd/MM" : "HH:00")}
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tickFormatter={(value: number) => `${value} ${activeMetric.unit}`}
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                />
                {/* Reference line at zero — useful for power_mw where
                  positive means charging, negative means discharging */}
                <ReferenceLine y={0} stroke="var(--color-toggle-bg)" strokeDasharray="3 3" />
                <Tooltip
                  labelFormatter={(label) => safeFormat(String(label), "dd MMM HH:mm")}
                  contentStyle={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    backgroundColor: "var(--color-bg)",
                    border: "1px solid var(--color-icon)",
                    borderRadius: 6,
                  }}
                  labelStyle={{ color: "var(--color-text-secondary)" }}
                  formatter={(value, name) => [
                    `${String(value)} ${activeMetric.unit}`,
                    nameOf(String(name)),
                  ]}
                />
                {selectedIds.map((id, index) => (
                  <Line
                    key={id}
                    type="monotone"
                    dataKey={String(id)}
                    stroke={LINE_COLORS[index % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    // connectNulls false = gaps in the line when data is missing
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {isAnyLoading && (
            <div className={styles.chartLoaderOverlay}>
              <div className={styles.spinner} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
