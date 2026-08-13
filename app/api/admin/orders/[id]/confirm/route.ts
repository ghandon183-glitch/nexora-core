import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/admin/auth";
import { adminForceConfirm, getOrderById } from "@/lib/orders/db";
import { sendCustomerEmail } from "@/lib/mailer";
import { DOWNLOADS } from "@/lib/data/downloads";
import { getEnv } from "@/lib/env";

/**
 * Manual override for edge cases the automatic checker can't resolve on its
 * own — e.g. a buyer who slightly overpaid or underpaid, or sent from an
 * exchange wallet that batches transactions. Used sparingly; the normal
 * path is fully automatic.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!(await isValidSessionToken(token))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    const downloadToken = randomUUID();
    await adminForceConfirm(id, downloadToken);

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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/orders/confirm] Failed:", error);
    return NextResponse.json({ ok: false, error: "Could not confirm order" }, { status: 500 });
  }
}
