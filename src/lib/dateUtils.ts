// -------------------------------------------------------------------
// Paris time conversions. The app shows every time in Paris time, but
// the device may run in any timezone: nothing here reads the host
// timezone. Paris wall-clock times are handled as "wall-clock ms", the
// Paris date and time fields read as if they were UTC.
// -------------------------------------------------------------------

const TIMEZONE = "Europe/Paris";

const HOUR_MS = 3_600_000;
const BUCKET_MS = 10 * 60_000;

const parisClock = new Intl.DateTimeFormat("en-US", {
  timeZone: TIMEZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

// Ends with "Z" or a "+01:00" / "-0500" style offset
const HAS_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i;

// Parse a backend timestamp, read as UTC when it has no offset.
// Returns null for a missing or invalid timestamp.
function parseUtc(isoString: string | null | undefined): number | null {
  if (!isoString) return null;
  const time = Date.parse(HAS_OFFSET.test(isoString) ? isoString : isoString + "Z");
  return isNaN(time) ? null : time;
}

// Paris wall clock at the given instant, in wall-clock ms
function parisWallClockAt(time: number): number {
  const field = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parisClock.formatToParts(time).find((p) => p.type === type)?.value);
  const wholeSeconds = Date.UTC(
    field("year"),
    field("month") - 1,
    field("day"),
    field("hour"),
    field("minute"),
    field("second")
  );
  // Intl drops the milliseconds
  return wholeSeconds + (time % 1000);
}

// Paris offset from UTC at the given instant: +1h in winter, +2h in summer
function parisOffsetAt(time: number): number {
  return parisWallClockAt(time) - time;
}

// Wall-clock ms as an ISO string without offset: "2026-05-31T12:44:40"
function formatWallClock(wallClock: number): string {
  return new Date(wallClock).toISOString().slice(0, 19);
}

// Convert a datetime-local input value (Paris local time) to a UTC ISO string
// suitable for sending to the API.
// "2026-05-31T12:44" → "2026-05-31T10:44:00.000Z"
//
// Around a DST change, it resolves like browsers and Temporal ("compatible"):
// - a time that occurs twice (25 Oct 02:30) gives the first one, summer time
// - a time that is skipped (29 Mar 02:30) moves forward by the gap (03:30)
export function parisInputToUtcIso(localDateTimeString: string): string {
  // The input fields read as if they were UTC: no host timezone involved
  const wallClock = Date.parse(localDateTimeString + "Z");
  if (isNaN(wallClock)) return localDateTimeString;

  // Paris offsets before and after a DST change near this time
  const offsetBefore = parisOffsetAt(wallClock - 12 * HOUR_MS);
  const offsetAfter = parisOffsetAt(wallClock + 12 * HOUR_MS);

  // An offset fits when Paris really shows this wall clock at that instant
  const matches = [offsetBefore, offsetAfter]
    .map((offset) => wallClock - offset)
    .filter((time) => parisWallClockAt(time) === wallClock);

  const utc = matches.length > 0 ? Math.min(...matches) : wallClock - offsetBefore;
  return new Date(utc).toISOString();
}

// Convert a UTC ISO string to a Paris time string formatted for datetime-local inputs
// "2026-05-31T10:44:40" or "2026-05-31T10:44:40Z" → "2026-05-31T12:44"
export function utcToParisInput(isoString: string | null | undefined): string {
  const time = parseUtc(isoString);
  if (time === null) return "";
  return formatWallClock(parisWallClockAt(time)).slice(0, 16);
}

// Convert a UTC timestamp to Paris time, then round to nearest 10-minute bucket.
// This ensures records from different assets align on the same X axis
// regardless of sub-minute recording offsets.
// "2026-10-03T12:05:00Z" → "2026-10-03T14:10:00"
// Returns null for a missing or invalid timestamp.
export function bucketTimestamp(isoString: string | null | undefined): string | null {
  const time = parseUtc(isoString);
  if (time === null) return null;
  const wallClock = parisWallClockAt(time);
  return formatWallClock(Math.round(wallClock / BUCKET_MS) * BUCKET_MS);
}
