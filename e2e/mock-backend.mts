// -------------------------------------------------------------------
// Stand-in for the RADA backend during the E2E tests, serving the
// unit-test fixtures (src/__fixtures__). The app runs unchanged and
// reaches it through its /api/* routes, like the real backend: the
// whole chain is tested, without the real API key or live data.
//
// Run by Playwright (playwright.config.ts) with Node's type stripping:
//   node e2e/mock-backend.mts
// -------------------------------------------------------------------
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { ServerResponse } from "node:http";

// Kept in sync with playwright.config.ts
const MOCK_BACKEND_PORT = 4010;
const MOCK_API_KEY = "e2e-api-key";

const fixture = (name: string) =>
  JSON.parse(readFileSync(new URL(`../src/__fixtures__/${name}.json`, import.meta.url), "utf8"));

const assets: { id: number; name: string; eic_code: string; asset_type: string }[] =
  fixture("assets");
const summary = fixture("summary");
const snapshot = fixture("asset-history-snapshot");
const range = fixture("asset-history-range");
const notFound = fixture("asset-not-found");

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${MOCK_BACKEND_PORT}`);

  // Readiness probe for Playwright, the only route without the key
  if (url.pathname === "/health") return send(res, 200, { status: "ok" });

  if (req.headers["x-api-key"] !== MOCK_API_KEY) {
    return send(res, 403, { detail: "Invalid API key" });
  }

  if (url.pathname === "/assetslist") return send(res, 200, assets);
  if (url.pathname === "/assets/summary") return send(res, 200, summary);

  // History of one asset: the fixture, relabelled for the requested asset
  const history = url.pathname.match(/^\/assets\/(\d+)\/soc$/);
  if (history) {
    const asset = assets.find((a) => a.id === Number(history[1]));
    if (!asset) return send(res, 404, notFound);

    const identity = {
      asset_id: asset.id,
      asset_name: asset.name,
      eic_code: asset.eic_code,
      asset_type: asset.asset_type,
    };
    if (url.searchParams.get("mode") === "S") return send(res, 200, { ...snapshot, ...identity });
    return send(res, 200, {
      ...range,
      ...identity,
      // Echo the requested period, like the backend
      from_ts: url.searchParams.get("from_ts") ?? range.from_ts,
      to_ts: url.searchParams.get("to_ts") ?? range.to_ts,
    });
  }

  send(res, 404, { detail: "Not Found" });
});

server.listen(MOCK_BACKEND_PORT, () => {
  console.log(`Mock backend listening on http://localhost:${MOCK_BACKEND_PORT}`);
});
