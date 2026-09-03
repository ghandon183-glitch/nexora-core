import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/admin/auth";
import { adminForceConfirm, getOrderById } from "@/lib/orders/db";
import { sendCustomerEmail } from "@/lib/mailer";
import { DOWNLOADS } from "@/lib/data/downloads";
import { getEnv } from "@/lib/env";
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

    const env = await getEnv();
    const siteUrl = env.SITE_URL ?? "";
    const downloadUrl = `${siteUrl}/download/${downloadToken}`;
    const hasFile = Boolean(DOWNLOADS[order.template_slug]);

    await sendCustomerEmail({
      to: order.buyer_email,
      subject: `Your payment was confirmed — download ${order.template_title}`,
      html: `
        <h2>Payment confirmed, ${order.buyer_name}!</h2>
        <p>Your order for <strong>${order.template_title}</strong> has been manually verified.</p>
        ${
          hasFile
            ? `<p><a href="${downloadUrl}">Click here to download your template</a></p>`
            : `<p>Your access is unlocked — the download will appear shortly.</p>`
        }
        <p>— Nexora Core</p>
      `,
    });

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[admin/orders/confirm] Failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not confirm order" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
