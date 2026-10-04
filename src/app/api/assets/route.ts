// Next.js App Router API Route — server-side proxy for /assetslist
// The API key is read from environment variables and never exposed to the client
import { fetchBackend } from "@/lib/backend";

export async function GET(): Promise<Response> {
  return fetchBackend("/assetslist");
}
