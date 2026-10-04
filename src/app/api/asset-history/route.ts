import { HISTORY_MODES, type ApiError } from "@/types/api";

// Every query param is validated against a strict whitelist before being
// forwarded: asset_id is interpolated into the upstream path, and the request
// carries the API key, so a crafted value ("../x", "x?") could otherwise reach
// any backend endpoint.
const ASSET_ID_PATTERN = /^\d{1,10}$/;
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

  if (!assetId || !ASSET_ID_PATTERN.test(assetId)) {
    return badRequest("asset_id must be a positive integer");
  }
  if (!mode || !MODES.includes(mode)) {
    return badRequest(`mode must be one of: ${MODES.join(", ")}`);
  }
  if ((fromTs && !isValidTimestamp(fromTs)) || (toTs && !isValidTimestamp(toTs))) {
    return badRequest("from_ts and to_ts must be ISO 8601 date-times");
  }

  // Build the upstream URL — from_ts and to_ts are optional
  const upstream = new URL(`${process.env.API_BASE_URL}/assets/${encodeURIComponent(assetId)}/soc`);
  upstream.searchParams.set("mode", mode);
  if (fromTs) upstream.searchParams.set("from_ts", fromTs);
  if (toTs) upstream.searchParams.set("to_ts", toTs);

  const res = await fetch(upstream.toString(), {
    headers: {
      // An unset key used to be sent as the string "undefined": an empty
      // value is rejected by the backend all the same
      "X-API-Key": process.env.API_KEY ?? "",
    },
    cache: "no-store",
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
