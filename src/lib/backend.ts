// -------------------------------------------------------------------
// Server-only helper shared by the /api/* routes: calls the backend
// with the API key and turns every failure into a JSON error the
// client hooks can handle, instead of an unhandled exception.
// -------------------------------------------------------------------
import type { ApiError } from "@/types/api";

function errorResponse(detail: string, status: number): Response {
  return Response.json({ detail } satisfies ApiError, { status });
}

/**
 * GET `path` on the backend and relay its JSON body and status.
 *
 * - 500 when API_BASE_URL or API_KEY is not configured, or when
 *   API_BASE_URL is not a valid URL (e.g. missing "https://")
 * - 502 when the backend is unreachable or does not answer with JSON
 */
export async function fetchBackend(
  path: string,
  params?: Record<string, string | null | undefined>
): Promise<Response> {
  const baseUrl = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;
  if (!baseUrl || !apiKey) {
    console.error("[api] API_BASE_URL or API_KEY is not set");
    return errorResponse("Server misconfigured", 500);
  }

  let url: URL;
  try {
    url = new URL(`${baseUrl}${path}`);
  } catch {
    // The URL embeds the base URL only, never the API key
    console.error(`[api] API_BASE_URL is not a valid URL: ${baseUrl}`);
    return errorResponse("Server misconfigured", 500);
  }
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) url.searchParams.set(key, value);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "X-API-Key": apiKey },
      // Disable Next.js fetch cache — we always want live data
      cache: "no-store",
    });
  } catch (err) {
    console.error(`[api] backend unreachable: ${path}`, err);
    return errorResponse("Backend unreachable", 502);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    // e.g. an HTML error page from the reverse proxy
    console.error(`[api] non-JSON response (HTTP ${res.status}): ${path}`);
    return errorResponse("Invalid response from backend", 502);
  }
  return Response.json(data, { status: res.status });
}
