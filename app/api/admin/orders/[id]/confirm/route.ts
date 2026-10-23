import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/admin/auth";
import { adminForceConfirm, getOrderById } from "@/lib/orders/db";
import {
  ensureConfirmedOrderEmails,
  processEmailOutbox,
} from "@/lib/orders/email-delivery";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`admin-confirm:${ip}`, {
    max: 30,
    windowMs: 60 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds ?? 60),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { id } = await params;

  if (!id || id.length > 80) {
    return NextResponse.json(
      { ok: false, error: "Invalid order" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Order not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const downloadToken = randomUUID();
    const claimed = await adminForceConfirm(id, downloadToken);

    if (!claimed) {
      return NextResponse.json(
        { ok: true, alreadyConfirmed: true },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // Manual confirmations use the same outbox as every other payment path so
    // the owner is alerted, a failed send is retried, and the order can never
    // be emailed again by the recovery pass.
    const confirmedOrder = (await getOrderById(id)) ?? {
      ...order,
      status: "confirmed" as const,
      download_token: downloadToken,
    };

    await ensureConfirmedOrderEmails(
      confirmedOrder,
      {
        paymentSource: "manual",
        verificationDescription:
          "NEXORA CORE recorded this order as confirmed manually by an authenticated administrator after an off-chain payment review.",
      }
    );

    const emailOutbox = await processEmailOutbox(10);

    return NextResponse.json(
      { ok: true, emailDelivery: emailOutbox },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[admin/orders/confirm] Failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not confirm order" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
