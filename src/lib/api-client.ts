/**
 * Reads a JSON response, without assuming there is one.
 *
 * A route that crashes hard can answer with an empty body, and calling
 * res.json() on that throws "Unexpected end of JSON input" — which then
 * surfaces to the user in place of the actual problem. This turns any
 * non-JSON response into a message that says what really happened.
 */
// `any` mirrors what res.json() returns, so this is a drop-in replacement
// at call sites that read fields off the body.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readJson<T = any>(res: Response): Promise<T> {
  const text = await res.text();

  if (!text) {
    throw new Error(
      res.ok
        ? "The server sent an empty response. Try again."
        : `The server hit an error (${res.status}) and sent no details. If this keeps happening, check the deployment logs.`
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    // An HTML error page from the platform rather than one of our routes.
    throw new Error(`The server returned an unexpected response (${res.status}). Try again shortly.`);
  }

  if (!res.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : `Request failed (${res.status}).`;
    throw new Error(message);
  }

  return body as T;
}

/** SWR fetcher with the same protection. */
export const fetchJson = <T,>(url: string): Promise<T> => fetch(url).then((res) => readJson<T>(res));

/** POSTs JSON and reads the reply, with the same protection. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function postJson<T = any>(url: string, data: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return readJson<T>(res);
}
