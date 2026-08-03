import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/orders/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      status: order.status,
      downloadToken: order.status === "confirmed" ? order.download_token : null,
      expiresAt: order.expires_at,
    });
  } catch (error) {
    console.error("[orders/status] Failed to fetch order:", error);
    return NextResponse.json({ ok: false, error: "Could not fetch order" }, { status: 500 });
  }
}
