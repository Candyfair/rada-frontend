import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assetNotFound as notFound, historySnapshot as snapshot } from "@/__fixtures__";
import { GET } from "./route";

const BACKEND = "https://backend.test";

function request(query: string) {
  return new Request(`http://localhost/api/asset-history?${query}`);
}

function mockBackend(body: unknown, status = 200) {
  const fetchMock = vi.fn<typeof fetch>(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// URL actually requested from the backend
const calledUrl = (fetchMock: ReturnType<typeof mockBackend>) =>
  new URL(String(fetchMock.mock.calls[0]?.[0]));

beforeEach(() => {
  vi.stubEnv("API_BASE_URL", BACKEND);
  vi.stubEnv("API_KEY", "secret-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/asset-history", () => {
  it("forwards a snapshot request with the API key", async () => {
    const fetchMock = mockBackend(snapshot);

    const res = await GET(request("asset_id=1&mode=S"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(snapshot);
    const url = calledUrl(fetchMock);
    expect(url.origin + url.pathname).toBe(`${BACKEND}/assets/1/soc`);
    expect(url.searchParams.get("mode")).toBe("S");
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual({ "X-API-Key": "secret-key" });
  });

  it("forwards the optional time range", async () => {
    const fetchMock = mockBackend({ records: [] });

    await GET(
      request("asset_id=12&mode=D&from_ts=2026-10-03T15:00:00.000Z&to_ts=2026-10-03T16:00:00Z")
    );

    const url = calledUrl(fetchMock);
    expect(url.searchParams.get("from_ts")).toBe("2026-10-03T15:00:00.000Z");
    expect(url.searchParams.get("to_ts")).toBe("2026-10-03T16:00:00Z");
  });

  it("propagates the backend status and body", async () => {
    mockBackend(notFound, 404);

    const res = await GET(request("asset_id=999999&mode=S"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual(notFound);
  });

  describe("rejects input that could redirect the call to another backend endpoint", () => {
    it.each([
      ["path traversal", "asset_id=..%2Fsummary&mode=S"],
      ["nested traversal", "asset_id=1%2F..%2F..%2Fassetslist&mode=S"],
      ["query injection", "asset_id=summary%3F&mode=S"],
      ["fragment injection", "asset_id=1%23&mode=S"],
      ["non-numeric id", "asset_id=abc&mode=S"],
      ["decimal id", "asset_id=1.5&mode=S"],
      ["negative id", "asset_id=-1&mode=S"],
      ["padded id", "asset_id=%201&mode=S"],
      ["empty id", "asset_id=&mode=S"],
      ["missing id", "mode=S"],
      ["unknown mode", "asset_id=1&mode=X"],
      ["missing mode", "asset_id=1"],
      ["invalid from_ts", "asset_id=1&mode=D&from_ts=yesterday&to_ts=2026-10-03T16:00:00Z"],
      ["invalid to_ts", "asset_id=1&mode=D&from_ts=2026-10-03T15:00:00Z&to_ts=2026-10-03"],
    ])("%s → 400 without calling the backend", async (_, query) => {
      const fetchMock = mockBackend({});

      const res = await GET(request(query));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ detail: expect.any(String) });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
