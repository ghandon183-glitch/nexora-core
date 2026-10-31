import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual, randomUUID } from "crypto";
import { getOrderById, getOrderByPaymegateUuid, markPaymegateConfirmed } from "@/lib/orders/db";
import { customerEmailMatches, sameUsdAmount } from "@/lib/orders/money";
import { getEnv } from "@/lib/env";
import { deliverConfirmedOrderEmails } from "@/lib/orders/email-delivery";

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
  if (Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > MAX_CLOCK_SKEW_SECONDS) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("base64url");
  const candidates = signature.split(",").map((part) => part.trim()).filter(Boolean).flatMap((part) => {
    const separator = part.indexOf("=");
    return separator > -1 ? [part.slice(separator + 1)] : [part];
  });
  return candidates.some((candidate) => {
    const a = Buffer.from(candidate);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
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

  if (!timestamp || !signature || !verifySignature(rawBody, timestamp, signature, env.PAYMEGATE_WEBHOOK_SECRET)) {
    return NextResponse.json({ ok: false, error: "Invalid webhook signature" }, { status: 401 });
  }

  let event: PaymegatePaidEvent;
  try {
    event = JSON.parse(rawBody) as PaymegatePaidEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid webhook payload" }, { status: 400 });
  }

  const eventType = event.type || eventHeader;
  if (eventType !== "order.paid" || event.status !== "PAID") return NextResponse.json({ ok: true, ignored: true });
  if (!event.id || (eventIdHeader && event.id !== eventIdHeader) || !event.orderUUID) {
    return NextResponse.json({ ok: false, error: "Invalid webhook event" }, { status: 400 });
  }

  try {
    const order = (await getOrderByPaymegateUuid(event.orderUUID)) ??
      (event.externalId ? await getOrderById(event.externalId) : null);
    if (!order || order.payment_provider !== "paymegate") {
      console.warn("[paymegate/webhook] Unknown order:", event.orderUUID, event.externalId);
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Validate every signed paid event before either confirming an order or
    // retrying its email delivery. A duplicate event must not bypass correlation.
    if (
      (event.externalId && event.externalId !== order.id) ||
      (order.paymegate_order_uuid && order.paymegate_order_uuid !== event.orderUUID) ||
      !sameUsdAmount(event.amount, order.base_price_usd) ||
      event.currency !== "USD"
    ) {
      console.warn("[paymegate/webhook] Order mismatch:", {
        orderId: order.id, status: order.status, externalId: event.externalId,
        orderUUID: event.orderUUID, amount: event.amount,
        expected: order.base_price_usd, currency: event.currency,
      });
      return NextResponse.json({ ok: false, error: "Order mismatch" }, { status: 409 });
    }

    if (!customerEmailMatches(event.customerEmail, order.buyer_email)) {
      return NextResponse.json({ ok: false, error: "Customer mismatch" }, { status: 409 });
    }

    if (order.status === "confirmed") {
      await deliverConfirmedOrderEmails(order, {
        transactionRef: order.paymegate_transaction_ref || order.paymegate_transaction_uuid || event.transactionRef || event.transactionUUID || event.id,
        eventId: order.paymegate_event_id || event.id,
        orderUUID: order.paymegate_order_uuid || event.orderUUID,
        amount: event.amount,
        currency: event.currency,
      });
      return NextResponse.json({ ok: true, duplicate: true, emailDeliveryRetried: true });
    }

    // A verified provider payment may arrive after Nexora's local 24-hour expiry.
    // Expiry closes the checkout locally; it must not strand money already paid.
    if (!["pending", "expired"].includes(order.status)) {
      return NextResponse.json({ ok: false, error: "Order mismatch" }, { status: 409 });
    }

    const downloadToken = randomUUID();
    const claimed = await markPaymegateConfirmed(
      order.id, event.transactionUUID ?? "", event.transactionRef ?? "", event.id, downloadToken
    );
    if (!claimed) {
      const currentOrder = await getOrderById(order.id);
      if (currentOrder?.status === "confirmed") {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      // A valid provider event must never let one transaction fulfil multiple
      // orders. Return a non-2xx response so the mismatch remains visible for
      // reconciliation instead of silently acknowledging a second entitlement.
      console.warn("[paymegate/webhook] Confirmation claim rejected", { orderId: order.id });
      return NextResponse.json(
        { ok: false, error: "Transaction already used or order state changed" },
        { status: 409 }
      );
    }

    await deliverConfirmedOrderEmails(
      { ...order, status: "confirmed", download_token: downloadToken },
      { transactionRef: event.transactionRef ?? event.transactionUUID ?? event.id, eventId: event.id,
        orderUUID: event.orderUUID, amount: event.amount, currency: event.currency }
    );
    return NextResponse.json({ ok: true, processed: true });
  } catch (error) {
    console.error("[paymegate/webhook] Processing failed:", error);
    return NextResponse.json({ ok: false, error: "Webhook processing failed" }, { status: 500 });
  }
}
