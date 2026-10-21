import { NextResponse } from "next/server";
import { Resend } from "resend";
import { sendCustomerEmail } from "@/lib/mailer";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getEnv } from "@/lib/env";
import { getOrderById, type Order } from "@/lib/orders/db";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface NotifyPurchaseBody {
  orderId: string;
  buyerEmail: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * "I have paid" acknowledgement for a crypto checkout.
 *
 * The order is the source of truth: the notification is only sent when it
 * references a real, still-pending order whose buyer email matches. Without
 * that binding this endpoint was an unauthenticated relay that could mail an
 * arbitrary address from the owner's mailbox, and it trusted client-supplied
 * product/price fields.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);

  const { allowed, retryAfterSeconds } = checkRateLimit(
    `notify-purchase:${ip}`,
    { max: 10, windowMs: 10 * 60 * 1000 } // 10 confirmations per 10 minutes per IP
  );

  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds ?? 60) },
      }
    );
  }

  let body: NotifyPurchaseBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const claimedEmail =
    typeof body.buyerEmail === "string" ? body.buyerEmail.trim().toLowerCase() : "";

  if (!UUID_RE.test(orderId) || !claimedEmail) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid fields" },
      { status: 400 }
    );
  }

  let order: Order | null;
  try {
    order = await getOrderById(orderId);
  } catch (error) {
    console.error("[notify-purchase] Failed to load order:", error);
    return NextResponse.json(
      { ok: false, error: "Could not load order" },
      { status: 500 }
    );
  }

  if (!order || order.buyer_email.toLowerCase() !== claimedEmail) {
    return NextResponse.json(
      { ok: false, error: "Order not found" },
      { status: 404 }
    );
  }

  if (order.status !== "pending" || order.payment_provider === "paymegate") {
    // Already confirmed/expired, or handled by the provider's own flow: the
    // real confirmation emails are authoritative.
    return NextResponse.json({ ok: true, skipped: true });
  }

  const env = await getEnv();
  const templateTitle = escapeHtml(order.template_title);
  const templateSlug = escapeHtml(order.template_slug);
  const buyerName = escapeHtml(order.buyer_name);
  const price = order.base_price_usd.toFixed(2);
  const currency = escapeHtml(order.currency);

  let ownerEmailSent = false;
  let customerEmailSent = false;

  // 1. Notify the site owner (via Resend — works today because the owner's
  // own address is the Resend account's verified address).
  const apiKey = env.RESEND_API_KEY;
  const notifyEmail = env.NOTIFY_EMAIL;

  if (apiKey && notifyEmail) {
    try {
      const resend = new Resend(apiKey);

      await resend.emails.send({
        from: "Nexora Core <onboarding@resend.dev>",
        to: notifyEmail,
        subject: `New payment confirmation: ${order.template_title} ($${price})`,
        html: `
          <h2>A customer says they've completed a payment</h2>
          <p><strong>Template:</strong> ${templateTitle} (${templateSlug})</p>
          <p><strong>Price:</strong> $${price}</p>
          <p><strong>Paid with:</strong> ${currency}</p>
          <p><strong>Buyer name:</strong> ${buyerName}</p>
          <p><strong>Internal order ID:</strong> ${escapeHtml(order.id)}</p>
          <p>Check the wallet for a matching incoming transaction before
          delivering the template.</p>
        `,
      });

      ownerEmailSent = true;
    } catch (error) {
      console.error("[notify-purchase] Failed to email owner:", error);
    }
  } else {
    // Never log the buyer's details: the order ID is enough for support.
    console.log(
      "[notify-purchase] Resend not configured; owner notification skipped for order",
      order.id
    );
  }

  // 2. Confirm receipt to the customer (via Gmail SMTP — can send to any
  // recipient, unlike the Resend test address). Recipient comes from the
  // stored order, never from the request body.
  const siteUrl = env.SITE_URL?.replace(/\/+$/, "");

  const dashboardLine = siteUrl
    ? `We'll make the download available in your <a href="${escapeHtml(siteUrl)}/dashboard">dashboard</a> shortly.`
    : `We'll make the download available in your dashboard shortly.`;

  const customerResult = await sendCustomerEmail({
    to: order.buyer_email,
    subject: `We've received your payment confirmation for ${order.template_title}`,
    html: `
      <h2>Thanks, ${buyerName}!</h2>
      <p>We've received your confirmation that you sent payment for
      <strong>${templateTitle}</strong> ($${price} in ${currency}).</p>
      <p>Your payment is detected automatically on-chain, so this isn't an
      automatic unlock triggered by this email — we're matching the exact
      amount against the blockchain.
      ${dashboardLine}
      If you have any questions in the meantime, just reply to this email
      or use the contact page.</p>
      <p>— Nexora Core</p>
    `,
  });

  customerEmailSent = customerResult.sent;

  return NextResponse.json({
    ok: true,
    ownerEmailSent,
    customerEmailSent,
  });
}
