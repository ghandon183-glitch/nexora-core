import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/admin/auth";
import { getRecentOrders } from "@/lib/orders/db";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!(await isValidSessionToken(token))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await getRecentOrders(200);
    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    console.error("[admin/orders] Failed to fetch orders:", error);
    return NextResponse.json({ ok: false, error: "Could not fetch orders" }, { status: 500 });
  }
}
