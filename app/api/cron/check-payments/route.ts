import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getPendingOrders,
  getOrderById,
  getOrdersNeedingEmailDelivery,
  markOrderConfirmed,
  markOrderExpired,
  markOrderReview,
  markPaymegateConfirmed,
} from "@/lib/orders/db";
import { checkPayment } from "@/lib/orders/verify";
import { getPaymegateOrderStatus } from "@/lib/orders/paymegate";
import { DOWNLOADS } from "@/lib/data/downloads";
import { sendCustomerEmail } from "@/lib/mailer";
import { getEnv } from "@/lib/env";
import { deliverConfirmedOrderEmails } from "@/lib/orders/email-delivery";

/**
 * Polled every 5 minutes by GitHub Actions. The endpoint is protected by a
 * shared secret.
 *
 * Crypto orders use the blockchain verifier.
 * Paymegate orders are reconciled through the merchant API as a fallback to
 * signed webhooks. This keeps card/PayPal fulfillment working even when the
 * provider has not exposed a webhook signing secret.
 */
export async function POST(request: Request) {
  const env = await getEnv();
  const secret = request.headers.get("x-cron-secret");

  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    confirmed: 0,
    expired: 0,
    review: 0,
    checked: 0,
    paymegateChecked: 0,
    paymegateErrors: [] as string[],
    emailsRetried: 0,
    errors: [] as string[],
  };

  try {
    const cryptoOrders = await getPendingOrders(undefined, 15, "crypto");
    const paymegateOrders = await getPendingOrders(undefined, 15, "paymegate");
    results.checked = cryptoOrders.length + paymegateOrders.length;
    results.paymegateChecked = paymegateOrders.length;

    const processCryptoOrder = async (order: (typeof cryptoOrders)[number]) => {
      try {
        const now = Date.now();
        const match = await checkPayment(order);

        if (match.matched && match.txHash) {
          const downloadToken = randomUUID();
          const claimed = await markOrderConfirmed(order.id, match.txHash, downloadToken);

          if (!claimed) return;

          results.confirmed += 1;
          const confirmedOrder = await getOrderById(order.id);
          if (confirmedOrder) await deliverConfirmedOrderEmails(confirmedOrder, { transactionRef: match.txHash, eventId: "crypto:" + order.id, orderUUID: "crypto:" + order.id, amount: order.base_price_usd.toFixed(2), currency: "USD" });
          return;
        }

        if (now > order.expires_at) {
          const expired = await markOrderExpired(order.id);
          if (expired) results.expired += 1;
        }
      } catch (orderError) {
        console.error(
          `[cron/check-payments] Error checking crypto order ${order.id}:`,
          orderError
        );

        const reviewed = await markOrderReview(order.id).catch(() => false);
        if (reviewed) results.review += 1;

        results.errors.push(
          `${order.id}: ${orderError instanceof Error ? orderError.message : "unknown error"}`
        );
      }
    };

    const processPaymegateOrder = async (order: (typeof paymegateOrders)[number]) => {
      try {
        if (!order.paymegate_order_uuid) {
          const reviewed = await markOrderReview(order.id).catch(() => false);
          if (reviewed) results.review += 1;
          results.paymegateErrors.push(`${order.id}: missing Paymegate order UUID`);
          return;
        }

        const provider = await getPaymegateOrderStatus(order.paymegate_order_uuid);
        const status = provider.status;

        if (status === "PAID" || status === "CONFIRMED" || status === "COMPLETED") {
          // The polling fallback must enforce the same reconciliation invariants
          // as the signed webhook before it can fulfill a local order.
          if (
            provider.externalId !== order.id ||
            provider.amount !== order.base_price_usd.toFixed(2) ||
            provider.currency !== "USD" ||
            provider.customerEmail !== order.buyer_email.toLowerCase()
          ) {
            throw new Error("Paymegate paid order failed local amount/currency/customer correlation");
          }

          const txReference =
            provider.transactionRef ||
            provider.transactionUuid ||
            `paymegate:${order.paymegate_order_uuid}`;
          const transactionUuid = provider.transactionUuid || txReference;
          const downloadToken = randomUUID();

          const claimed = await markPaymegateConfirmed(
            order.id,
            transactionUuid,
            txReference,
            `poll:${order.paymegate_order_uuid}`,
            downloadToken
          );

          if (!claimed) return;

          results.confirmed += 1;
          const confirmedOrder = await getOrderById(order.id);
          if (confirmedOrder) await deliverConfirmedOrderEmails(confirmedOrder, { transactionRef: txReference, eventId: "poll:" + order.paymegate_order_uuid, orderUUID: order.paymegate_order_uuid, amount: order.base_price_usd.toFixed(2), currency: "USD" });
          return;
        }

        if (
          status === "EXPIRED" ||
          status === "CANCELLED" ||
          status === "CANCELED" ||
          status === "FAILED"
        ) {
          const expired = await markOrderExpired(order.id);
          if (expired) results.expired += 1;
          return;
        }

        if (Date.now() > order.expires_at) {
          const expired = await markOrderExpired(order.id);
          if (expired) results.expired += 1;
        }
      } catch (orderError) {
        console.error(
          `[cron/check-payments] Paymegate reconciliation failed for ${order.id}:`,
          orderError
        );
        results.paymegateErrors.push(
          `${order.id}: ${orderError instanceof Error ? orderError.message : "unknown error"}`
        );
      }
    };

    await Promise.allSettled([
      ...cryptoOrders.map(processCryptoOrder),
      ...paymegateOrders.map(processPaymegateOrder),
    ]);

    const emailOrders = await getOrdersNeedingEmailDelivery(25);
    for (const order of emailOrders) {
      await deliverConfirmedOrderEmails(order, {
        transactionRef: order.paymegate_transaction_ref || order.paymegate_transaction_uuid || order.tx_hash || order.id,
        eventId: order.paymegate_event_id || "retry:" + order.id,
        orderUUID: order.paymegate_order_uuid || "crypto:" + order.id,
        amount: order.base_price_usd.toFixed(2),
        currency: order.payment_provider === "paymegate" ? "USD" : order.currency,
      });
      results.emailsRetried += 1;
    }

    return NextResponse.json({ ok: true, ...results });
  } catch (error) {
    console.error("[cron/check-payments] Fatal error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to run payment check", ...results },
      { status: 500 }
    );
  }
}
