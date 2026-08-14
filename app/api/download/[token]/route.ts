import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { getOrderByToken } from "@/lib/orders/db";
import { getDownloadAssetPath } from "@/lib/data/downloads";

/**
 * Token-authorized download endpoint.
 *
 * The order's `download_token` is the sole authorization credential for
 * downloading a purchased template package. This route:
 *   1. Looks up the order by token (parameterized D1 query).
 *   2. Denies invalid tokens / nonexistent orders.
 *   3. Denies orders that are not `confirmed`.
 *   4. Resolves the purchased template slug to its ZIP asset.
 *   5. Streams the ZIP back via the Cloudflare `ASSETS` binding with
 *      `Content-Type: application/zip` and a forced-download
 *      `Content-Disposition`.
 *
 * The file is streamed (not buffered), so the ~13.7 MB largest package is
 * served without exceeding Worker memory limits. The asset path is internal
 * — direct `/downloads/<slug>.zip` access is denied in production by
 * `middleware.ts` + `wrangler.jsonc` `assets.run_worker_first`.
 *
 * Error responses are deliberately generic and leak no order details.
 */

const ASSETS_ORIGIN = "https://assets.local";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Reject obviously invalid tokens before hitting the database.
  if (!token || typeof token !== "string" || token.length === 0) {
    return deny();
  }

  let order;
  try {
    order = await getOrderByToken(token);
  } catch (error) {
    console.error("[download] Failed to look up order by token:", error);
    return deny();
  }

  if (!order) {
    return deny();
  }

  // Only confirmed orders may download. Pending/expired/review orders are
  // denied with the same generic response to avoid leaking order state.
  if (order.status !== "confirmed") {
    return deny();
  }

  const assetPath = getDownloadAssetPath(order.template_slug);
  if (!assetPath) {
    // No package built yet for this template — return a generic not-ready
    // response without revealing whether the order exists.
    return deny(404);
  }

  // Fetch the asset through the Cloudflare `ASSETS` binding (the same
  // mechanism OpenNext uses internally to serve static assets). This is an
  // internal binding subrequest, so it is unaffected by the public
  // `run_worker_first` deny rule on `/downloads/*`.
  let assetResponse: Response;
  try {
    const { env } = await getCloudflareContext({ async: true });
    const ASSETS = (env as unknown as { ASSETS?: Fetcher }).ASSETS;

    if (!ASSETS) {
      console.error("[download] ASSETS binding unavailable");
      return deny(500);
    }

    const assetUrl = new URL(assetPath, ASSETS_ORIGIN);
    assetResponse = await ASSETS.fetch(new Request(assetUrl, { method: "GET" }));
  } catch (error) {
    console.error("[download] Failed to fetch asset via ASSETS binding:", error);
    return deny(500);
  }

  if (!assetResponse.ok || !assetResponse.body) {
    console.error(
      "[download] Asset not served via ASSETS binding:",
      assetResponse.status
    );
    return deny(404);
  }

  const filename = `${order.template_slug}.zip`;

  // Stream the asset body straight through — no buffering, so large packages
  // (incl. ~13.7 MB) are served within Worker limits.
  return new Response(assetResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": assetResponse.headers.get("Content-Length") ?? "",
      "Cache-Control": "private, no-store",
    },
  });
}

/** Generic denial response that leaks no order/file information. */
function deny(status = 404): NextResponse {
  return new NextResponse(null, { status });
}
