import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { getOrderByToken } from "@/lib/orders/db";
import { getDownloadAssetPath } from "@/lib/data/downloads";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ASSETS_ORIGIN = "https://assets.local";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`download:${ip}`, {
    max: 30,
    windowMs: 60 * 60 * 1000,
  });

  if (!rate.allowed) {
    return new NextResponse(null, {
      status: 429,
      headers: {
        "Retry-After": String(rate.retryAfterSeconds ?? 60),
        "Cache-Control": "no-store",
      },
    });
  }

  const { token } = await params;

  if (!token || !UUID_RE.test(token)) {
    return deny();
  }

  let order;
  try {
    order = await getOrderByToken(token);
  } catch (error) {
    console.error("[download] Failed to look up order by token:", error);
    return deny();
  }

  if (!order || order.status !== "confirmed") {
    return deny();
  }

  const assetPath = getDownloadAssetPath(order.template_slug);
  if (!assetPath) {
    return deny(404);
  }

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
    console.error("[download] Asset not served via ASSETS binding:", assetResponse.status);
    return deny(404);
  }

  const filename = `${order.template_slug}.zip`;
  const headers = new Headers({
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });

  const contentLength = assetResponse.headers.get("Content-Length");
  if (contentLength) headers.set("Content-Length", contentLength);

  return new Response(assetResponse.body, { status: 200, headers });
}

function deny(status = 404): NextResponse {
  return new NextResponse(null, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
