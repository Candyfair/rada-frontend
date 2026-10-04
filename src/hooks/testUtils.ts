import { vi } from "vitest";

type Reply = { body: unknown; status?: number } | Error;

// Stubs fetch with a handler keyed on the request URL
export function mockFetch(handler: (url: string) => Reply | Promise<Reply>) {
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    if (init?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const reply = await handler(String(input));
    if (reply instanceof Error) throw reply;
    return Response.json(reply.body, { status: reply.status ?? 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// A promise you resolve by hand, to control response order
export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}
