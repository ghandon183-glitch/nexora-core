import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getPendingOrders,
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

async function sendOrderConfirmationEmail(
  order: Awaited<ReturnType<typeof getPendingOrders>>[number],
  downloadToken: string,
  txReference: string
) {
  const env = await getEnv();
  const siteUrl = env.SITE_URL ?? "";
  const downloadUrl = `${siteUrl}/download/${downloadToken}`;
  const hasFile = Boolean(DOWNLOADS[order.template_slug]);

  await sendCustomerEmail({
    to: order.buyer_email,
    subject: `Your payment was confirmed — download ${order.template_title}`,
    html: `
      <h2>Payment confirmed, ${order.buyer_name}!</h2>
      <p>We detected your payment for <strong>${order.template_title}</strong>.</p>
      ${
        hasFile
          ? `<p><a href="${downloadUrl}">Click here to download your template</a></p>`
          : `<p>Your access is unlocked — the download will appear in your dashboard shortly.</p>`
      }
      <p>Transaction: <code>${txReference}</code></p>
      <p>— Nexora Core</p>
    `,
  });
}

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
          await sendOrderConfirmationEmail(order, downloadToken, match.txHash);
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
          await sendOrderConfirmationEmail(order, downloadToken, txReference);
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

    return NextResponse.json({ ok: true, ...results });
  } catch (error) {
    console.error("[cron/check-payments] Fatal error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to run payment check", ...results },
      { status: 500 }
    );
  }
}
