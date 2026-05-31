import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import styles from "./AssetComparisonChart.module.css";
import { toZonedTime, format as formatTz } from "date-fns-tz";

const TIMEZONE = "Europe/Paris";

// Metrics available for Y axis — label shown in the UI, key in the record object,
// and unit displayed on the axis
const METRICS = [
  { key: "power_mw",              label: "Power",           unit: "MW"  },
  { key: "energy_mwh",            label: "Energy",          unit: "MWh" },
  { key: "reactive_power_mvar",   label: "Reactive Power",  unit: "MVAr"},
  { key: "power_factor",          label: "Power factor",    unit: "%"   },
  { key: "temperature_celsius",  label: "Cell temperature",unit: "°C"  },
  { key: "voltage",               label: "Voltage",         unit: "V"  },
  { key: "current_amps",          label: "Current amps",    unit: "A" },
];

// One distinct color per line — drawn from the existing design token palette
const LINE_COLORS = [
  "hsl(189, 18%, 58%)", // --hsl-battery (teal)
  "hsl(15, 71%, 66%)",  // --hsl-wind (orange)
  "hsl(134, 23%, 57%)", // --hsl-solar (green)
  "hsl(351, 35%, 30%)", // --hsl-fault (dark red)
  "hsl(217, 89%, 61%)", // --color-value-negative (blue)
];

// Convert a UTC timestamp to Paris time, then round to nearest 10-minute bucket.
// This ensures records from different assets align on the same X axis
// regardless of sub-minute recording offsets.
function bucketTimestamp(isoString) {
  const parisDate = toZonedTime(new Date(isoString), TIMEZONE);
  const minutes = parisDate.getMinutes();
  parisDate.setMinutes(Math.round(minutes / 10) * 10, 0, 0);
  // Return a plain ISO-like string without offset for consistent key usage
  return formatTz(parisDate, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: TIMEZONE });
}

// initialAssetId — pre-selected asset id or null
// batteries      — array of battery assets from useAssets()
export default function AssetComparisonChart({ initialAssetId, assets }) {
  useEffect(() => {
    if (assets?.length > 0) {
      console.log("asset id type:", typeof assets[0].id, assets[0].id);
    }
  }, [assets]);

  useEffect(() => {
    if (initialAssetId != null) {
      console.log("initialAssetId type:", typeof initialAssetId, initialAssetId);
    }
  }, [initialAssetId]);


  const batteries = assets ?? [];

  const { histories, initAsset, reloadAsset, removeAsset } = useAssetHistory();

  const [selectedIds, setSelectedIds] = useState([]);
  const [activeMetric, setActiveMetric] = useState(METRICS[0]);
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  // When the modal opens with a pre-selected asset, add it to selectedIds
  // and trigger its initial data fetch
  useEffect(() => {
    if (initialAssetId == null) return;
    setSelectedIds([initialAssetId]);
    initAsset(initialAssetId);
  }, [initialAssetId]);

  // When the first asset's data loads, populate the date inputs
  // with the actual from_ts / to_ts returned by the API
  useEffect(() => {
  if (selectedIds.length === 0) return;
  const firstHistory = histories[selectedIds[0]];

  // Wait until data has loaded and fromTs is available
  if (!firstHistory || firstHistory.isLoading || !firstHistory.fromTs) return;

  const toLocalInput = (isoString) => {
    if (!isoString) return "";
    // from_ts and to_ts are UTC without suffix — append Z before parsing
    const date = new Date(isoString.includes("Z") || isoString.includes("+")
      ? isoString
      : isoString + "Z"
    );
    if (isNaN(date.getTime())) return "";
    const parisDate = toZonedTime(date, TIMEZONE);
    return formatTz(parisDate, "yyyy-MM-dd'T'HH:mm", { timeZone: TIMEZONE });
  };

  setFromInput(toLocalInput(firstHistory.fromTs));
  setToInput(toLocalInput(firstHistory.toTs));

  // Re-run whenever the first asset's history updates —
  // including after a date range reload
}, [histories, selectedIds]);

   useEffect(() => {
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isDropdownOpen]);


  // ------------------------------------------------------------------
  // HANDLERS
  // ------------------------------------------------------------------
  const handleAddBattery = useCallback((id) => {
    if (selectedIds.includes(id)) return;
    setSelectedIds((prev) => [...prev, id]);

    // If a date range is already set, apply it to the new asset immediately
    // instead of loading its default range
    if (fromInput && toInput) {
      reloadAsset(id, fromInput, toInput);
    } else {
      initAsset(id);
    }

    setIsDropdownOpen(false);
  }, [selectedIds, fromInput, toInput, initAsset, reloadAsset]);

  const handleRemoveBattery = useCallback((id) => {
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    removeAsset(id);
  }, [removeAsset]);

  // Apply the date range to all currently selected assets
  const handleApplyDateRange = useCallback(() => {
    if (!fromInput || !toInput) return;

    // datetime-local inputs return Paris local time — convert back to UTC ISO
    // before sending to the API which expects UTC
    const toUtcIso = (localDateTimeString) => {
      const parisDate = toZonedTime(new Date(localDateTimeString), TIMEZONE);
      return parisDate.toISOString();
    };

    selectedIds.forEach((id) => {
      reloadAsset(id, toUtcIso(fromInput), toUtcIso(toInput));
    });
  }, [fromInput, toInput, selectedIds, reloadAsset]);

  // ------------------------------------------------------------------
  // RECHARTS
  // ------------------------------------------------------------------
  // Recharts expects a single flat array where each entry is a point in time.
  // All selected assets' records are merged by timestamp so lines share the same X axis.
  // Result shape: [{ timestamp: "...", 1: 1.23, 3: -0.45 }, ...]

  const chartData = useCallback(() => {
    if (selectedIds.length === 0) return [];

    // Collect all unique timestamps across all selected assets
    const timestampSet = new Set();
    selectedIds.forEach((id) => {
      (histories[id]?.records ?? []).forEach((r) => {
        timestampSet.add(bucketTimestamp(r.timestamp));
      });
    });

    // Build a lookup map per asset for O(1) access during merge
    const lookups = {};
    selectedIds.forEach((id) => {
      lookups[id] = {};
      (histories[id]?.records ?? []).forEach((r) => {
        lookups[id][bucketTimestamp(r.timestamp)] = r[activeMetric.key];
      });
    });

    // Assemble the merged array, sorted chronologically
    return Array.from(timestampSet)
      .sort()
      .map((ts) => {
        const point = { timestamp: ts };
        selectedIds.forEach((id) => {
          // undefined becomes null so Recharts renders a gap instead of zero
          point[String(id)] = lookups[id][ts] ?? null;
        });
        return point;
      });
  }, [selectedIds, histories, activeMetric]);

  const data = chartData();
  const isAnyLoading = selectedIds.some((id) => histories[id]?.isLoading);

  // Determine the total time range covered by the chart data, in hours
  const totalHours = data.length > 1
    ? (new Date(data[data.length - 1].timestamp) - new Date(data[0].timestamp))
      / (1000 * 60 * 60)
    : 0;

  // Build explicit tick positions: first point, one per day change, last point.
  // This guarantees no duplicate day labels regardless of data density.
  const xTicks = useMemo(() => {
    if (data.length === 0) return [];

    if (totalHours > 24) {
      // One tick per day change + first and last point
      const ticks = [data[0].timestamp];
      let lastDay = format(parseISO(data[0].timestamp), "yyyy-MM-dd");

      for (let i = 1; i < data.length - 1; i++) {
        const day = format(parseISO(data[i].timestamp), "yyyy-MM-dd");
        if (day !== lastDay) {
          ticks.push(data[i].timestamp);
          lastDay = day;
        }
      }

      const lastTs = data[data.length - 1].timestamp;
      if (lastTs !== ticks[ticks.length - 1]) ticks.push(lastTs);
      return ticks;

    } else {
      // One tick per full hour — find data points closest to each hour boundary
      const ticks = [];
      let lastHour = null;

      for (const point of data) {
        const date = parseISO(point.timestamp);
        const hour = format(date, "yyyy-MM-dd HH");
        if (hour !== lastHour) {
          ticks.push(point.timestamp);
          lastHour = hour;
        }
      }

      return ticks;
    }
  }, [data, totalHours]);

  // Format a tick — date only when it's a day boundary, time only for first/last
  const formatXTick = useCallback((timestamp) => {
    try {
      const parisDate = toZonedTime(new Date(timestamp), TIMEZONE);
      if (totalHours > 24) {
        return formatTz(parisDate, "dd/MM", { timeZone: TIMEZONE });
      }
      return formatTz(parisDate, "HH:00", { timeZone: TIMEZONE });
    } catch {
      return timestamp;
    }
  }, [totalHours]);

  // Tooltip label — full date and time
  const formatTooltipLabel = (timestamp) => {
    try {
      const parisDate = toZonedTime(new Date(timestamp), TIMEZONE);
      return formatTz(parisDate, "dd MMM HH:mm", { timeZone: TIMEZONE });
    } catch {
      return timestamp;
    }
  };

  // Y axis — append the unit
  const formatYTick = (value) => `${value} ${activeMetric.unit}`;

  return (
    <div className={styles.wrapper}>

      {/* ---- Metric chips ---- */}
      <div className={styles.metricRow}>
        {METRICS.map((m) => (
          <button
            key={m.key}
            className={`${styles.metricChip} ${activeMetric.key === m.key ? styles.active : ""}`}
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
          value={fromInput}
          onChange={(e) => setFromInput(e.target.value)}
        />
        <input
          type="datetime-local"
          className={styles.dateInput}
          value={toInput}
          onChange={(e) => setToInput(e.target.value)}
        />
        <button className={styles.applyButton} onClick={handleApplyDateRange}>
          Apply
        </button>
      </div>

      {/* ---- Battery selector ---- */}
      <div className={styles.selectorWrapper} ref={dropdownRef}>
        <div
          className={styles.selectorBox}
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          {selectedIds.length === 0 && (
            <span className={styles.placeholder}>Select batteries...</span>
          )}
          {selectedIds.map((id) => {
            const battery = batteries.find((b) => String(b.id) === String(id));
            return (
              <span key={id} className={styles.tag}>
                {battery?.name ?? `Asset ${id}`}
                <button
                  className={styles.tagRemove}
                  // Prevent the click from bubbling up to selectorBox
                  // which would toggle the dropdown
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveBattery(id);
                  }}
                  aria-label={`Remove ${battery?.name}`}
                >
                  ×
                </button>
              </span>
            );
          })}
          <ChevronDown
            size={16}
            className={`${styles.chevron} ${isDropdownOpen ? styles.open : ""}`}
          />
        </div>

        {isDropdownOpen && (
          <div className={styles.dropdown}>
            {batteries.map((battery) => {
              const isSelected = selectedIds.map(String).includes(String(battery.id));
              return (
                <div
                  key={battery.id}
                  className={`${styles.dropdownItem} ${isSelected ? styles.selected : ""}`}
                  onClick={() => {
                    if (isSelected) {
                      handleRemoveBattery(battery.id);
                    } else {
                      handleAddBattery(battery.id);
                    }
                  }}
                >
                  <span>{battery.name}</span>
                  {isSelected && <X size={12} />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Chart ---- */}
      {isAnyLoading && (
        <p className={styles.loadingText}>Loading data...</p>
      )}

      {/* Show empty state only when no asset is selected and nothing is loading */}
      {selectedIds.length === 0 && (
        <p className={styles.emptyText}>Select an asset to display the chart.</p>
      )}

      {selectedIds.length > 0 && (
        <div className={styles.chartWrapper}>
        <div className={`${styles.chartInner} ${isAnyLoading ? styles.loading : ""}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <XAxis
                dataKey="timestamp"
                ticks={xTicks}
                tickFormatter={(value, index) => formatXTick(value, index)}
                tick={{ fontFamily: "var(--font-mono)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <YAxis
                tickFormatter={formatYTick}
                tick={{ fontFamily: "var(--font-mono)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={64}
              />
              {/* Reference line at zero — useful for power_mw where
                  positive means charging, negative means discharging */}
              <ReferenceLine y={0} stroke="var(--color-toggle-bg)" strokeDasharray="3 3" />
              <Tooltip
                labelFormatter={formatTooltipLabel}
                contentStyle={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  backgroundColor: "var(--color-bg)",
                  border: "1px solid var(--color-panel-border)",
                  borderRadius: 6,
                }}
                formatter={(value, name) => {
                  const battery = batteries.find((b) => String(b.id) === String(name));
                  const label = battery?.name ?? `Asset ${name}`;
                  return [`${value} ${activeMetric.unit}`, label];
                }}
              />
              {selectedIds.map((id, index) => (
                <Line
                  key={String(id)}
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