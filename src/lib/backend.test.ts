import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchBackend } from "./backend";

beforeEach(() => {
  vi.stubEnv("API_BASE_URL", "https://backend.test");
  vi.stubEnv("API_KEY", "secret-key");
  // Failures are logged on purpose: keep the test output clean
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubFetch(impl: typeof fetch) {
  const fetchMock = vi.fn<typeof fetch>(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchBackend", () => {
  it("calls the backend with the API key and without cache", async () => {
    const fetchMock = stubFetch(async () => Response.json([]));

    await fetchBackend("/assetslist");

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://backend.test/assetslist");
    expect(init).toEqual({ headers: { "X-API-Key": "secret-key" }, cache: "no-store" });
  });

  it("sets the given query params and skips empty ones", async () => {
    const fetchMock = stubFetch(async () => Response.json({}));

    await fetchBackend("/x", { mode: "D", from_ts: null, to_ts: undefined, limit: "" });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://backend.test/x?mode=D");
  });

  it.each([200, 403, 404, 422])("relays the JSON body with status %i", async (status) => {
    stubFetch(async () => Response.json({ detail: "x" }, { status }));

    const res = await fetchBackend("/x");

    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ detail: "x" });
  });

  it.each(["API_BASE_URL", "API_KEY"])("returns 500 when %s is not set", async (name) => {
    vi.stubEnv(name, "");
    const fetchMock = stubFetch(async () => Response.json({}));

    const res = await fetchBackend("/x");

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ detail: "Server misconfigured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 502 when the backend is unreachable", async () => {
    stubFetch(async () => {
      throw new TypeError("fetch failed");
    });

    const res = await fetchBackend("/x");

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ detail: "Backend unreachable" });
  });

  it("returns 502 when the backend answers with something else than JSON", async () => {
    stubFetch(async () => new Response("<html>Bad Gateway</html>", { status: 502 }));

    const res = await fetchBackend("/x");

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ detail: "Invalid response from backend" });
  });
});
