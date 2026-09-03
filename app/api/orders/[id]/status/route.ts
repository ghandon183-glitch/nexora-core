import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/orders/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const STATUS_CACHE_SECONDS = 45;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request);
  const { allowed, retryAfterSeconds } = checkRateLimit(`order-status:${ip}`, {
    max: 120,
    windowMs: 10 * 60 * 1000,
  });

  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many status checks. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds ?? 60) } }
    );
  }

  const { id } = await params;

  // UUIDs are intentionally used for order IDs. Do not expose any buyer data
  // from this endpoint; only the minimum state needed by checkout is returned.
  try {
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        status: order.status,
        downloadToken: order.status === "confirmed" ? order.download_token : null,
        expiresAt: order.expires_at,
      },
      {
        headers: {
          // Checkout currently polls this endpoint frequently. A short browser
          // cache prevents hundreds of identical D1 reads while still allowing
          // confirmation to appear quickly.
          "Cache-Control": `private, max-age=${STATUS_CACHE_SECONDS}`,
        },
      }
    );
  } catch (error) {
    console.error("[orders/status] Failed to fetch order:", error);
    return NextResponse.json({ ok: false, error: "Could not fetch order" }, { status: 500 });
  }
}
