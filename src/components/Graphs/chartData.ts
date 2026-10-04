import { format, parseISO } from "date-fns";
import type { AssetHistories } from "@/hooks/useAssetHistory";
import { bucketTimestamp } from "@/lib/dateUtils";
import type { SocRecord } from "@/types/api";

// Numeric record fields that can be drawn on the Y axis
export type MetricKey = {
  [K in keyof SocRecord]: SocRecord[K] extends number ? K : never;
}[keyof SocRecord];

export interface Metric {
  key: MetricKey;
  label: string;
  unit: string;
}

/**
 * One point in time, shared by every line of the chart.
 * `timestamp` is a Paris-time bucket without offset ("2026-10-03T17:50:00");
 * the other keys are asset ids, null where an asset has no record.
 */
export type ChartPoint = { timestamp: string } & Record<string, number | null | string>;

// Recharts expects a single flat array where each entry is a point in time.
// All selected assets' records are merged by timestamp so lines share the same X axis.
// Result shape: [{ timestamp: "...", 1: 1.23, 3: -0.45 }, ...]
export function mergeRecords(
  assetIds: number[],
  histories: AssetHistories,
  metric: MetricKey
): ChartPoint[] {
  // One lookup per asset, keyed on the 10-minute bucket
  const lookups = new Map<number, Map<string, number>>();
  const timestamps = new Set<string>();

  for (const id of assetIds) {
    const lookup = new Map<string, number>();
    for (const record of histories[id]?.records ?? []) {
      const bucket = bucketTimestamp(record.timestamp);
      lookup.set(bucket, record[metric]);
      timestamps.add(bucket);
    }
    lookups.set(id, lookup);
  }

  // Bucket keys share one fixed format, so a string sort is chronological
  return [...timestamps].sort().map((timestamp) => {
    const point: ChartPoint = { timestamp };
    for (const id of assetIds) {
      // undefined becomes null so Recharts renders a gap instead of zero
      point[String(id)] = lookups.get(id)?.get(timestamp) ?? null;
    }
    return point;
  });
}

// Time covered by the chart, in hours
export function spanInHours(data: ChartPoint[]): number {
  const first = data[0];
  const last = data[data.length - 1];
  if (!first || !last) return 0;
  return (parseISO(last.timestamp).getTime() - parseISO(first.timestamp).getTime()) / 3_600_000;
}

// Explicit tick positions, so no label is ever repeated:
// - over 24 hours: first point, one per day change, last point
// - otherwise: the first point of each hour
export function buildXTicks(data: ChartPoint[]): string[] {
  const multiDay = spanInHours(data) > 24;
  const bucketOf = (timestamp: string) =>
    format(parseISO(timestamp), multiDay ? "yyyy-MM-dd" : "yyyy-MM-dd HH");

  const ticks: string[] = [];
  let lastBucket: string | null = null;
  for (const { timestamp } of data) {
    const bucket = bucketOf(timestamp);
    if (bucket !== lastBucket) {
      ticks.push(timestamp);
      lastBucket = bucket;
    }
  }

  const last = data[data.length - 1]?.timestamp;
  if (multiDay && last && last !== ticks[ticks.length - 1]) ticks.push(last);
  return ticks;
}
