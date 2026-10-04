// Next.js App Router API Route — server-side proxy for /assets/summary
import { fetchBackend } from "@/lib/backend";

export async function GET(): Promise<Response> {
  return fetchBackend("/assets/summary");
}
