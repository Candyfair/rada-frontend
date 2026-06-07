// Next.js App Router API Route — server-side proxy for /assetslist
// The API key is read from environment variables and never exposed to the client

export async function GET() {
  const res = await fetch(`${process.env.API_BASE_URL}/assetslist`, {
    headers: {
      "X-API-Key": process.env.API_KEY,
    },
    // Disable Next.js fetch cache — we always want live data
    cache: "no-store",
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}