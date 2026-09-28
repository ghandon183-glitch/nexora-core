import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual, randomUUID } from "crypto";
import { getOrderById, getOrderByPaymegateUuid, markPaymegateConfirmed, claimOrderEmail, markOrderEmailSent, markOrderEmailFailed } from "@/lib/orders/db";
import { DOWNLOADS } from "@/lib/data/downloads";
import { sendCustomerEmail } from "@/lib/mailer";
import { getEnv } from "@/lib/env";

const MAX_CLOCK_SKEW_SECONDS = 5 * 60;

interface PaymegatePaidEvent {
  id: string;
  type: string;
  orderUUID: string;
  transactionUUID?: string;
  transactionRef?: string;
  status: string;
  amount: string;
  currency: string;
  customerEmail?: string;
  externalId?: string;
}

function verifySignature(rawBody: string, timestamp: string, signature: string, secret: string): boolean {
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > MAX_CLOCK_SKEW_SECONDS) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("base64url");

  const candidates = signature
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const separator = part.indexOf("=");
      return separator > -1 ? [part.slice(separator + 1)] : [part];
    });

  return candidates.some((candidate) => {
    const a = Buffer.from(candidate);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}


async function deliverPurchaseEmails(order: Awaited<ReturnType<typeof getOrderById>>, transactionRef: string, eventId: string, orderUUID: string, amount: string, currency: string, downloadToken: string) {
  if (!order) return;
  const env = await getEnv();
  const siteUrl = env.SITE_URL ?? "";
  const downloadUrl = siteUrl + "/download/" + downloadToken;
  const hasFile = Boolean(DOWNLOADS[order.template_slug]);
  const ownerEmail = env.NOTIFY_EMAIL ?? "ghandon183@gmail.com";

  const ownerClaimed = await claimOrderEmail(order.id, "owner");
  if (ownerClaimed) {
    try {
      const result = await sendCustomerEmail({
        to: ownerEmail,
        subject: "NEXORA SALE — " + order.template_title + " — " + amount + " " + currency,
        html:
          "<h2>New Paymegate payment confirmed</h2>" +
          "<p><strong>A customer has completed a verified payment.</strong></p><hr>" +
          "<p><strong>Product:</strong> " + order.template_title + "</p>" +
          "<p><strong>Internal order ID:</strong> <code>" + order.id + "</code></p>" +
          "<p><strong>Customer:</strong> " + order.buyer_name + "</p>" +
          "<p><strong>Customer email:</strong> " + order.buyer_email + "</p>" +
          "<p><strong>Amount:</strong> " + amount + " " + currency + "</p>" +
          "<p><strong>Paymegate order UUID:</strong> <code>" + orderUUID + "</code></p>" +
          "<p><strong>Transaction reference:</strong> <code>" + transactionRef + "</code></p>" +
          "<p><strong>Webhook event ID:</strong> <code>" + eventId + "</code></p>" +
          "<p><strong>Confirmed at:</strong> " + new Date().toISOString() + "</p>" +
          "<hr><p>NEXORA CORE recorded this payment as confirmed after validating the signed Paymegate webhook, order, amount, currency, and customer email.</p>",
      });
      if (!result.sent) throw new Error(result.error || "Owner email was not sent");
      await markOrderEmailSent(order.id, "owner");
    } catch (error) {
      await markOrderEmailFailed(order.id, error instanceof Error ? error.message : "Owner email failed");
      console.error("[paymegate/webhook] Owner email delivery failed:", error);
    }
  }

  const customerClaimed = await claimOrderEmail(order.id, "customer");
  if (customerClaimed) {
    try {
      const result = await sendCustomerEmail({
        to: order.buyer_email,
        subject: "Payment confirmed — download " + order.template_title,
        html:
          "<h2>Payment confirmed, " + order.buyer_name + "!</h2>" +
          "<p>We received your payment for <strong>" + order.template_title + "</strong>.</p>" +
          (hasFile ? "<p><a href="" + downloadUrl + "">Click here to download your template</a></p>" : "<p>Your access is unlocked — the download will appear in your dashboard shortly.</p>") +
          "<p>Payment reference: <code>" + transactionRef + "</code></p><p>— Nexora Core</p>",
      });
      if (!result.sent) throw new Error(result.error || "Customer email was not sent");
      await markOrderEmailSent(order.id, "customer");
    } catch (error) {
      await markOrderEmailFailed(order.id, error instanceof Error ? error.message : "Customer email failed");
      console.error("[paymegate/webhook] Customer email delivery failed:", error);
    }
  }
}

function sameMoney(amount: string, expected: number): boolean {
  const parsed = Number(amount);
  return Number.isFinite(parsed) && parsed.toFixed(2) === expected.toFixed(2);
}

export async function POST(request: Request) {
  const env = await getEnv();
  if (!env.PAYMEGATE_WEBHOOK_SECRET) {
    console.error("[paymegate/webhook] PAYMEGATE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ ok: false, error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const timestamp = request.headers.get("x-paymegate-timestamp") ?? "";
  const signature = request.headers.get("x-paymegate-signature") ?? "";
  const eventHeader = request.headers.get("x-paymegate-event") ?? "";
  const eventIdHeader = request.headers.get("x-paymegate-event-id") ?? "";

  if (
    !timestamp ||
    !signature ||
    !verifySignature(rawBody, timestamp, signature, env.PAYMEGATE_WEBHOOK_SECRET)
  ) {
    return NextResponse.json({ ok: false, error: "Invalid webhook signature" }, { status: 401 });
  }

  let event: PaymegatePaidEvent;
  try {
    event = JSON.parse(rawBody) as PaymegatePaidEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid webhook payload" }, { status: 400 });
  }

  const eventType = event.type || eventHeader;
  if (eventType !== "order.paid" || event.status !== "PAID") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!event.id || (eventIdHeader && event.id !== eventIdHeader) || !event.orderUUID) {
    return NextResponse.json({ ok: false, error: "Invalid webhook event" }, { status: 400 });
  }

  try {
    const order =
      (await getOrderByPaymegateUuid(event.orderUUID)) ??
      (event.externalId ? await getOrderById(event.externalId) : null);

    if (!order || order.payment_provider !== "paymegate") {
      console.warn("[paymegate/webhook] Unknown order:", event.orderUUID, event.externalId);
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (order.status === "confirmed") {
      await deliverPurchaseEmails(
        order,
        order.paymegate_transaction_ref || order.paymegate_transaction_uuid || event.transactionRef || event.transactionUUID || event.id,
        order.paymegate_event_id || event.id,
        order.paymegate_order_uuid || event.orderUUID,
        event.amount,
        event.currency,
        order.download_token || ""
      );
      return NextResponse.json({ ok: true, duplicate: true, emailDeliveryRetried: true });
    }

    if (
      order.status !== "pending" ||
      !sameMoney(event.amount, order.base_price_usd) ||
      event.currency !== "USD"
    ) {
      console.warn("[paymegate/webhook] Order mismatch:", {
        orderId: order.id,
        status: order.status,
        amount: event.amount,
        expected: order.base_price_usd,
        currency: event.currency,
      });
      return NextResponse.json({ ok: false, error: "Order mismatch" }, { status: 409 });
    }

    if (
      event.customerEmail &&
      event.customerEmail.toLowerCase() !== order.buyer_email.toLowerCase()
    ) {
      return NextResponse.json({ ok: false, error: "Customer mismatch" }, { status: 409 });
    }

    const downloadToken = randomUUID();
    const claimed = await markPaymegateConfirmed(
      order.id,
      event.transactionUUID ?? "",
      event.transactionRef ?? "",
      event.id,
      downloadToken
    );

    if (!claimed) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    await deliverPurchaseEmails(order, event.transactionRef ?? event.transactionUUID ?? event.id, event.id, event.orderUUID, event.amount, event.currency, downloadToken);

    return NextResponse.json({ ok: true, processed: true });
  } catch (error) {
    console.error("[paymegate/webhook] Processing failed:", error);
    return NextResponse.json({ ok: false, error: "Webhook processing failed" }, { status: 500 });
  }
}
