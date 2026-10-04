import { describe, expect, it } from "vitest";
import { historyRange } from "@/__fixtures__";
import type { AssetHistories, AssetHistory } from "@/hooks/useAssetHistory";
import type { SocRecord } from "@/types/api";
import { buildXTicks, mergeRecords, spanInHours } from "./chartData";
import type { ChartPoint } from "./chartData";

const history = (records: SocRecord[]): AssetHistory => ({
  records,
  fromTs: null,
  toTs: null,
  isLoading: false,
  error: null,
});

const record = (timestamp: string, power_mw: number): SocRecord => ({
  ...historyRange.records[0]!,
  timestamp,
  power_mw,
});

const points = (...timestamps: string[]): ChartPoint[] =>
  timestamps.map((timestamp) => ({ timestamp }));

describe("mergeRecords", () => {
  it("returns no point without a selected asset", () => {
    expect(mergeRecords([], { 1: history(historyRange.records) }, "power_mw")).toEqual([]);
  });

  it("buckets UTC records to 10 minutes in Paris time, oldest first", () => {
    // The fixture is newest first, recorded at hh:x9:51 UTC
    const data = mergeRecords([1], { 1: history(historyRange.records) }, "power_mw");

    expect(data).toEqual([
      { timestamp: "2026-10-03T17:10:00", 1: -0.515 },
      { timestamp: "2026-10-03T17:20:00", 1: -0.411 },
      { timestamp: "2026-10-03T17:30:00", 1: -0.311 },
      { timestamp: "2026-10-03T17:40:00", 1: -0.246 },
      { timestamp: "2026-10-03T17:50:00", 1: -0.149 },
      { timestamp: "2026-10-03T18:00:00", 1: -0.074 },
    ]);
  });

  it("reads the requested metric", () => {
    const data = mergeRecords([1], { 1: history(historyRange.records) }, "energy_mwh");

    expect(data.map((p) => p[1])).toEqual(
      [...historyRange.records].reverse().map((r) => r.energy_mwh)
    );
  });

  it("aligns assets recorded a few seconds apart on the same point", () => {
    const histories: AssetHistories = {
      1: history([record("2026-10-03T15:00:02Z", 1)]),
      23: history([record("2026-10-03T14:59:58Z", 2)]),
    };

    expect(mergeRecords([1, 23], histories, "power_mw")).toEqual([
      { timestamp: "2026-10-03T17:00:00", 1: 1, 23: 2 },
    ]);
  });

  it("leaves a gap (null), not a zero, where an asset has no record", () => {
    const histories: AssetHistories = {
      1: history([record("2026-10-03T15:00:00Z", 1), record("2026-10-03T15:10:00Z", 0)]),
      23: history([record("2026-10-03T15:10:00Z", 2)]),
    };

    expect(mergeRecords([1, 23], histories, "power_mw")).toEqual([
      { timestamp: "2026-10-03T17:00:00", 1: 1, 23: null },
      { timestamp: "2026-10-03T17:10:00", 1: 0, 23: 2 },
    ]);
  });

  it("gives an asset still without history only gaps", () => {
    const data = mergeRecords([1, 23], { 1: history(historyRange.records) }, "power_mw");

    expect(data).toHaveLength(6);
    expect(data.every((p) => p[23] === null)).toBe(true);
  });
});

describe("spanInHours", () => {
  it("is 0 with less than two points", () => {
    expect(spanInHours([])).toBe(0);
    expect(spanInHours(points("2026-10-03T17:00:00"))).toBe(0);
  });

  it("measures from the first to the last point", () => {
    expect(spanInHours(points("2026-10-03T17:00:00", "2026-10-04T05:30:00"))).toBe(12.5);
  });
});

describe("buildXTicks", () => {
  it("has no tick without data", () => {
    expect(buildXTicks([])).toEqual([]);
  });

  it("puts one tick per hour on a short range", () => {
    const data = points(
      "2026-10-03T17:10:00",
      "2026-10-03T17:50:00",
      "2026-10-03T18:00:00",
      "2026-10-03T18:10:00",
      "2026-10-03T19:30:00"
    );

    expect(buildXTicks(data)).toEqual([
      "2026-10-03T17:10:00",
      "2026-10-03T18:00:00",
      "2026-10-03T19:30:00",
    ]);
  });

  it("puts one tick per day, plus the last point, past 24 hours", () => {
    const data = points(
      "2026-10-01T12:00:00",
      "2026-10-01T18:00:00",
      "2026-10-02T00:00:00",
      "2026-10-02T12:00:00",
      "2026-10-03T00:10:00",
      "2026-10-03T06:00:00"
    );

    expect(buildXTicks(data)).toEqual([
      "2026-10-01T12:00:00",
      "2026-10-02T00:00:00",
      "2026-10-03T00:10:00",
      "2026-10-03T06:00:00",
    ]);
  });

  it("does not repeat the last point when it starts a new day", () => {
    const data = points("2026-10-01T12:00:00", "2026-10-02T12:00:00", "2026-10-03T00:00:00");

    expect(buildXTicks(data)).toEqual(data.map((p) => p.timestamp));
  });
});
