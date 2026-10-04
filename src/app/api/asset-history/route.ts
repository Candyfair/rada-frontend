import { fetchBackend } from "@/lib/backend";
import { HISTORY_MODES, type ApiError } from "@/types/api";

// Every query param is validated against a strict whitelist before being
// forwarded: asset_id is interpolated into the upstream path, and the request
// carries the API key, so a crafted value ("../x", "x?") could otherwise reach
// any backend endpoint.
const ASSET_ID_PATTERN = /^\d{1,10}$/;
const LIMIT_PATTERN = /^[1-9]\d{0,3}$/; // 1 to 9999
const MODES: readonly string[] = HISTORY_MODES;
// ISO 8601 date-time, with optional seconds, fraction and offset
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/;

function isValidTimestamp(value: string): boolean {
  return TIMESTAMP_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}

function badRequest(detail: string): Response {
  return Response.json({ detail } satisfies ApiError, { status: 400 });
}

export async function GET(request: Request): Promise<Response> {
  // Extract query params forwarded by the client hook
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get("asset_id");
  const mode = searchParams.get("mode");
  const fromTs = searchParams.get("from_ts");
  const toTs = searchParams.get("to_ts");
  const limit = searchParams.get("limit");

  if (!assetId || !ASSET_ID_PATTERN.test(assetId)) {
    return badRequest("asset_id must be a positive integer");
  }
  if (!mode || !MODES.includes(mode)) {
    return badRequest(`mode must be one of: ${MODES.join(", ")}`);
  }
  if ((fromTs && !isValidTimestamp(fromTs)) || (toTs && !isValidTimestamp(toTs))) {
    return badRequest("from_ts and to_ts must be ISO 8601 date-times");
  }
  if (limit && !LIMIT_PATTERN.test(limit)) {
    return badRequest("limit must be an integer between 1 and 9999");
  }

  // from_ts, to_ts and limit are optional
  return fetchBackend(`/assets/${encodeURIComponent(assetId)}/soc`, {
    mode,
    from_ts: fromTs,
    to_ts: toTs,
    limit,
  });
}
