/**
 * Minimal NextResponse double: only the `.json()` helper the tested route
 * handlers use. Returns a real Response so status/body assertions are
 * performed against standard Fetch API behaviour.
 */
export class NextResponse extends Response {
  static json(body, init = {}) {
    const headers = new Headers(init.headers ?? {});
    if (!headers.has("content-type")) headers.set("content-type", "application/json");

    return new NextResponse(JSON.stringify(body), { ...init, headers });
  }
}
