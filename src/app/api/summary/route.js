export async function GET() {
  const res = await fetch(`${process.env.API_BASE_URL}/assets/summary`, {
    headers: {
      "X-API-Key": process.env.API_KEY,
    },
    cache: "no-store",
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}