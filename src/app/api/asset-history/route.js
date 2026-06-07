export async function GET(request) {
  // Extract query params forwarded by the client hook
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get("asset_id");
  const mode = searchParams.get("mode");
  const fromTs = searchParams.get("from_ts");
  const toTs = searchParams.get("to_ts");

  // Build the upstream URL — from_ts and to_ts are optional
  const upstream = new URL(
    `${process.env.API_BASE_URL}/assets/${assetId}/soc`
  );
  upstream.searchParams.set("mode", mode);
  if (fromTs) upstream.searchParams.set("from_ts", fromTs);
  if (toTs) upstream.searchParams.set("to_ts", toTs);

  const res = await fetch(upstream.toString(), {
    headers: {
      "X-API-Key": process.env.API_KEY,
    },
    cache: "no-store",
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}