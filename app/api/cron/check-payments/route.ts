import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getPendingOrders,
  getRecentlyExpiredCryptoOrders,
  getRecentlyExpiredPaymegateOrders,
  getOrderById,
  markOrderConfirmed,
  markOrderExpired,
  markOrderReview,
  markPaymegateConfirmed,
} from "@/lib/orders/db";
import { checkPayment } from "@/lib/orders/verify";
import { getPaymegateOrderStatus } from "@/lib/orders/paymegate";
import { getEnv } from "@/lib/env";
import {
  deliverConfirmedOrderEmails,
  processEmailOutbox,
  reconcileConfirmedOrderEmails,
} from "@/lib/orders/email-delivery";

/**
 * How long after the local checkout window an on-chain transfer may still be
 * accepted. Blockchains index transfers with a delay, so a buyer who paid just
 * before expiry must not lose their download. The verifier still requires the
 * order's exact fingerprinted amount and a transfer timestamp inside this gap.
 */
const LATE_CRYPTO_GRACE_MS = 60 * 60 * 1000;

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
    lateCryptoChecked: 0,
    ordersRequeued: 0,
    emailsRetried: 0,
    errors: [] as string[],
  };

  try {
    const cryptoOrders = await getPendingOrders(undefined, 15, "crypto");
    const expiredCryptoOrders = await getRecentlyExpiredCryptoOrders(15);
    const pendingPaymegateOrders = await getPendingOrders(undefined, 15, "paymegate");
    const expiredPaymegateOrders = await getRecentlyExpiredPaymegateOrders(15);
    const pendingIds = new Set(pendingPaymegateOrders.map((order) => order.id));
    const paymegateOrders = [
      ...pendingPaymegateOrders,
      ...expiredPaymegateOrders.filter((order) => !pendingIds.has(order.id)),
    ];
    results.checked = cryptoOrders.length + expiredCryptoOrders.length + paymegateOrders.length;
    results.paymegateChecked = paymegateOrders.length;
    results.lateCryptoChecked = expiredCryptoOrders.length;

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

    // Late on-chain payments are reconciled before pending orders so a single
    // transfer can never confirm two orders (the expired one is the rightful
    // owner of that fingerprint).
    const processLateCryptoOrder = async (order: (typeof expiredCryptoOrders)[number]) => {
      try {
        // The verifier itself refuses transfers outside the late-payment
        // window, so a reused amount fingerprint can never be credited here
        // and an in-window transfer is still found when the wallet also holds
        // a newer, unrelated transfer of the same amount.
        const windowEnd = order.expires_at + LATE_CRYPTO_GRACE_MS;
        const match = await checkPayment(order, { notAfterMs: windowEnd });
        if (!match.matched || !match.txHash) return;

        const txTimestampMs = match.txTimestampMs;
        if (txTimestampMs === undefined || txTimestampMs > windowEnd) {
          // The amount fingerprint was recycled by a later order; the transfer
          // is not evidence for this expired order.
          console.warn(
            `[cron/check-payments] Ignoring on-chain match for expired order ${order.id}: transfer is outside the late-payment window`
          );
          return;
        }

        const downloadToken = randomUUID();
        const claimed = await markOrderConfirmed(order.id, match.txHash, downloadToken, {
          includeExpired: true,
        });
        // markOrderConfirmed also refuses a transaction hash already attached
        // to another order, so one transfer can never fulfil two orders.
        if (!claimed) return;

        results.confirmed += 1;
        const confirmedOrder = await getOrderById(order.id);
        if (confirmedOrder) {
          await deliverConfirmedOrderEmails(confirmedOrder, {
            transactionRef: match.txHash,
            eventId: "crypto:" + order.id,
            orderUUID: "crypto:" + order.id,
            amount: order.base_price_usd.toFixed(2),
            currency: "USD",
          });
        }
      } catch (orderError) {
        console.error(
          `[cron/check-payments] Error reconciling late crypto order ${order.id}:`,
          orderError
        );
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

    await Promise.allSettled(expiredCryptoOrders.map(processLateCryptoOrder));

    await Promise.allSettled([
      ...cryptoOrders.map(processCryptoOrder),
      ...paymegateOrders.map(processPaymegateOrder),
    ]);

    // A confirmed order whose emails were never queued (D1 failure, worker
    // shutdown) is still owed its download link. Re-queue before draining.
    results.ordersRequeued = await reconcileConfirmedOrderEmails(15);

    const emailOutbox = await processEmailOutbox(15);
    results.emailsRetried = emailOutbox.sent;

    return NextResponse.json({
      ok: true,
      ...results,
      emailOutbox,
    });
  } catch (error) {
    console.error("[cron/check-payments] Fatal error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to run payment check", ...results },
      { status: 500 }
    );
  }
}
