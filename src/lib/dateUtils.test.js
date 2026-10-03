import { afterAll, beforeAll, describe, expect, it } from "vitest";
import history from "@/__fixtures__/asset-history-range.json";
import {
  bucketTimestamp,
  formatParisDate,
  formatZonedToIsoString,
  parisInputToUtcIso,
  utcToParisDate,
  utcToParisInput,
} from "./dateUtils";

// The app is used in Paris, but the browser of a user (or a CI runner) may
// run in any timezone: every conversion must give the same result everywhere.
const HOST_TIMEZONES = ["UTC", "Europe/Paris", "America/New_York", "Asia/Tokyo"];

describe.each(HOST_TIMEZONES)("with the host timezone set to %s", (tz) => {
  let previousTz;
  beforeAll(() => {
    previousTz = process.env.TZ;
    process.env.TZ = tz;
  });
  afterAll(() => {
    process.env.TZ = previousTz;
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
    ])("rounds %s to the Paris bucket %s", (input, expected) => {
      expect(bucketTimestamp(input)).toBe(expected);
    });

    it("gives one distinct bucket per record of a 10-minute history", () => {
      const buckets = history.records.map((r) => bucketTimestamp(r.timestamp));
      expect(new Set(buckets).size).toBe(history.records.length);
    });
  });

  describe("formatParisDate", () => {
    it("formats a Paris-zoned date with the given pattern", () => {
      const parisDate = utcToParisDate("2026-07-14T08:30:00Z");
      expect(formatParisDate(parisDate, "dd/MM HH:mm")).toBe("14/07 10:30");
    });
  });

  // Known bug: the datetime-local value is parsed in the *host* timezone,
  // not in Paris time, so it is only correct on a device set to Paris.
  // Replace with a plain `it` once fixed.
  const itOutsideParisFails = tz === "Europe/Paris" ? it : it.fails;
  itOutsideParisFails("parisInputToUtcIso converts a Paris time input to UTC", () => {
    expect(parisInputToUtcIso("2026-05-31T12:44")).toBe("2026-05-31T10:44:00.000Z");
  });
});

describe("parisInputToUtcIso", () => {
  it("returns invalid input unchanged", () => {
    expect(parisInputToUtcIso("")).toBe("");
    expect(parisInputToUtcIso("garbage")).toBe("garbage");
  });
});

describe("utcToParisDate", () => {
  it("returns a Date whose local fields hold the Paris wall-clock time", () => {
    const d = utcToParisDate("2026-01-15T10:00:00Z");
    expect([d.getHours(), d.getMinutes()]).toEqual([11, 0]);
  });

  // Known bug: unlike utcToParisInput, there is no guard on missing input.
  it.fails("does not throw on a missing timestamp", () => {
    expect(() => utcToParisDate(null)).not.toThrow();
  });
});

describe("formatZonedToIsoString", () => {
  it("formats the local fields with zero padding and no offset", () => {
    expect(formatZonedToIsoString(new Date(2026, 0, 5, 3, 4, 5))).toBe("2026-01-05T03:04:05");
  });
});
