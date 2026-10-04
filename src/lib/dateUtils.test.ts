import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { historyRange as history } from "@/__fixtures__";
import { bucketTimestamp, parisInputToUtcIso, utcToParisInput } from "./dateUtils";

// The app is used in Paris, but the browser of a user (or a CI runner) may
// run in any timezone: every conversion must give the same result everywhere.
const HOST_TIMEZONES = ["UTC", "Europe/Paris", "America/New_York", "Asia/Tokyo"];

describe.each(HOST_TIMEZONES)("with the host timezone set to %s", (tz) => {
  let previousTz: string | undefined;
  beforeAll(() => {
    previousTz = process.env.TZ;
    process.env.TZ = tz;
  });
  afterAll(() => {
    if (previousTz === undefined) delete process.env.TZ;
    else process.env.TZ = previousTz;
  });

  describe("utcToParisInput", () => {
    it.each([
      ["2026-05-31T10:44:40", "2026-05-31T12:44"], // no suffix: treated as UTC
      ["2026-05-31T10:44:40Z", "2026-05-31T12:44"],
      ["2026-05-31T10:44:40.733458+00:00", "2026-05-31T12:44"],
      ["2026-01-15T10:00:00Z", "2026-01-15T11:00"], // winter time, UTC+1
      // Spring forward: 29 March 2026 at 02:00 Paris
      ["2026-03-29T00:59:00Z", "2026-03-29T01:59"],
      ["2026-03-29T01:00:00Z", "2026-03-29T03:00"],
      // Fall back: 25 October 2026 at 03:00 Paris
      ["2026-10-25T00:59:00Z", "2026-10-25T02:59"],
      ["2026-10-25T01:00:00Z", "2026-10-25T02:00"],
      ["2026-01-15T05:00:00-05:00", "2026-01-15T11:00"], // non-UTC offset
      // 02:30 in Paris while New York skips 02:00–02:59 (8 March 2026)
      ["2026-03-08T01:30:00Z", "2026-03-08T02:30"],
    ])("converts %s to %s", (input, expected) => {
      expect(utcToParisInput(input)).toBe(expected);
    });

    it.each(["", null, undefined, "not a date"])("returns an empty string for %s", (input) => {
      expect(utcToParisInput(input)).toBe("");
    });
  });

  describe("bucketTimestamp", () => {
    it.each([
      ["2026-10-03T12:04:59Z", "2026-10-03T14:00:00"],
      ["2026-10-03T12:05:00Z", "2026-10-03T14:10:00"],
      ["2026-10-03T15:59:51.743283+00:00", "2026-10-03T18:00:00"], // rolls over the hour
      ["2026-12-31T22:58:00Z", "2027-01-01T00:00:00"], // rolls over the year
      ["2026-03-08T01:30:00Z", "2026-03-08T02:30:00"], // New York DST gap
      ["2026-03-29T01:00:00Z", "2026-03-29T03:00:00"], // Paris spring forward
    ])("rounds %s to the Paris bucket %s", (input, expected) => {
      expect(bucketTimestamp(input)).toBe(expected);
    });

    it("gives one distinct bucket per record of a 10-minute history", () => {
      const buckets = history.records.map((r) => bucketTimestamp(r.timestamp));
      expect(new Set(buckets).size).toBe(history.records.length);
    });
  });

  describe("parisInputToUtcIso", () => {
    it.each([
      ["2026-05-31T12:44", "2026-05-31T10:44:00.000Z"], // summer time, UTC+2
      ["2026-01-15T11:00", "2026-01-15T10:00:00.000Z"], // winter time, UTC+1
      ["2026-05-31T12:44:30", "2026-05-31T10:44:30.000Z"], // with seconds
      // Spring forward: 02:00–02:59 doesn't exist, moved forward by one hour
      ["2026-03-29T01:59", "2026-03-29T00:59:00.000Z"],
      ["2026-03-29T02:30", "2026-03-29T01:30:00.000Z"],
      ["2026-03-29T03:00", "2026-03-29T01:00:00.000Z"],
      // Fall back: 02:00–02:59 happens twice, the first (summer) one is used
      ["2026-10-25T01:59", "2026-10-24T23:59:00.000Z"],
      ["2026-10-25T02:30", "2026-10-25T00:30:00.000Z"],
      ["2026-10-25T03:00", "2026-10-25T02:00:00.000Z"],
    ])("converts the Paris time %s to %s", (input, expected) => {
      expect(parisInputToUtcIso(input)).toBe(expected);
    });

    it("round-trips with utcToParisInput", () => {
      expect(utcToParisInput(parisInputToUtcIso("2026-10-03T17:00"))).toBe("2026-10-03T17:00");
    });
  });
});

describe("parisInputToUtcIso", () => {
  it("returns invalid input unchanged", () => {
    expect(parisInputToUtcIso("")).toBe("");
    expect(parisInputToUtcIso("garbage")).toBe("garbage");
  });
});

describe("bucketTimestamp", () => {
  it.each(["", null, undefined, "not a date"])("returns null for %s", (input) => {
    expect(bucketTimestamp(input)).toBeNull();
  });
});
