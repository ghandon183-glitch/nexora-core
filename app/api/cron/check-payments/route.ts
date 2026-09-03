import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getPendingOrders,
  markOrderConfirmed,
  markOrderExpired,
  markOrderReview,
} from "@/lib/orders/db";
import { checkPayment } from "@/lib/orders/verify";
import { DOWNLOADS } from "@/lib/data/downloads";
import { sendCustomerEmail } from "@/lib/mailer";
import { getEnv } from "@/lib/env";

/**
 * Polled every 5 minutes by GitHub Actions. The endpoint is protected by a
 * shared secret. Order state transitions are guarded in D1 so overlapping
 * cron runs cannot confirm/expire the same order twice.
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
    errors: [] as string[],
  };

  try {
    const pendingOrders = await getPendingOrders();
    results.checked = pendingOrders.length;

    for (const order of pendingOrders) {
      try {
        const now = Date.now();
        const match = await checkPayment(order);

        if (match.matched && match.txHash) {
          const downloadToken = randomUUID();
          const claimed = await markOrderConfirmed(
            order.id,
            match.txHash,
            downloadToken
          );

          // Another overlapping run may have claimed this order already.
          // Only the run that wins the conditional UPDATE sends the email.
          if (!claimed) continue;

          results.confirmed += 1;

          const siteUrl = env.SITE_URL ?? "";
          const downloadUrl = `${siteUrl}/download/${downloadToken}`;
          const hasFile = Boolean(DOWNLOADS[order.template_slug]);

          await sendCustomerEmail({
            to: order.buyer_email,
            subject: `Your payment was confirmed — download ${order.template_title}`,
            html: `
              <h2>Payment confirmed, ${order.buyer_name}!</h2>
              <p>We detected your on-chain payment for <strong>${order.template_title}</strong>.</p>
              ${
                hasFile
                  ? `<p><a href="${downloadUrl}">Click here to download your template</a></p>`
                  : `<p>Your access is unlocked — the download will appear in your dashboard shortly.</p>`
              }
              <p>Transaction: <code>${match.txHash}</code></p>
              <p>— Nexora Core</p>
            `,
          });

          continue;
        }

        if (now > order.expires_at) {
          const expired = await markOrderExpired(order.id);
          if (expired) results.expired += 1;
        }
      } catch (orderError) {
        console.error(
          `[cron/check-payments] Error checking order ${order.id}:`,
          orderError
        );

        const reviewed = await markOrderReview(order.id).catch(() => false);
        if (reviewed) results.review += 1;

        results.errors.push(
          `${order.id}: ${orderError instanceof Error ? orderError.message : "unknown error"}`
        );
      }
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
