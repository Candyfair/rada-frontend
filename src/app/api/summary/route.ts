export async function GET(): Promise<Response> {
  const res = await fetch(`${process.env.API_BASE_URL}/assets/summary`, {
    headers: {
      // An unset key used to be sent as the string "undefined": an empty
      // value is rejected by the backend all the same
      "X-API-Key": process.env.API_KEY ?? "",
    },
    cache: "no-store",
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
