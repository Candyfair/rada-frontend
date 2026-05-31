import { toZonedTime, format as formatTz } from "date-fns-tz";

const TIMEZONE = "Europe/Paris";

// Convert a datetime-local input value (Paris local time) to a UTC ISO string
// suitable for sending to the API
export function parisInputToUtcIso(localDateTimeString) {
  const date = new Date(localDateTimeString);
  if (isNaN(date.getTime())) return localDateTimeString;
  return date.toISOString();
}

// Convert a UTC ISO string to a Paris time string formatted for datetime-local inputs
// "2026-05-31T10:44:40" or "2026-05-31T10:44:40Z" → "2026-05-31T12:44"
export function utcToParisInput(isoString) {
  if (!isoString) return "";
  const normalized = isoString.includes("Z") || isoString.includes("+")
    ? isoString
    : isoString + "Z";
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return "";
  const parisDate = toZonedTime(date, TIMEZONE);
  return formatTz(parisDate, "yyyy-MM-dd'T'HH:mm", { timeZone: TIMEZONE });
}

// Convert a UTC ISO string to a Paris-time Date object
export function utcToParisDate(isoString) {
  const normalized = isoString.includes("Z") || isoString.includes("+")
    ? isoString
    : isoString + "Z";
  return toZonedTime(new Date(normalized), TIMEZONE);
}

// Format a Paris-zoned Date object to a plain ISO-like string without offset
// Used for bucketing timestamps into consistent keys
export function formatParisDate(parisDate, pattern) {
  return formatTz(parisDate, pattern, { timeZone: TIMEZONE });
}

// Format a zoned date to a plain ISO-like string using its local time components.
// Uses getFullYear/getMonth etc. to avoid any timezone re-conversion.
export function formatZonedToIsoString(zonedDate) {
  const year  = zonedDate.getFullYear();
  const month = String(zonedDate.getMonth() + 1).padStart(2, "0");
  const day   = String(zonedDate.getDate()).padStart(2, "0");
  const hours = String(zonedDate.getHours()).padStart(2, "0");
  const mins  = String(zonedDate.getMinutes()).padStart(2, "0");
  const secs  = String(zonedDate.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${mins}:${secs}`;
}