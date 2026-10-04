import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assets, summary } from "@/__fixtures__";
import { GET as getAssets } from "./assets/route";
import { GET as getSummary } from "./summary/route";

beforeEach(() => {
  vi.stubEnv("API_BASE_URL", "https://backend.test");
  vi.stubEnv("API_KEY", "secret-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe.each([
  ["/api/assets", getAssets, "/assetslist", assets],
  ["/api/summary", getSummary, "/assets/summary", summary],
])("GET %s", (_, GET, upstreamPath, body) => {
  it(`proxies ${upstreamPath}`, async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json(body));
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET();

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(`https://backend.test${upstreamPath}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(body);
  });
});
