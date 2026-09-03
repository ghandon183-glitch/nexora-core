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
 * shared secret. Orders are checked in small parallel batches so one slow
 * blockchain/API response cannot hold the whole queue behind it.
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
    // getPendingOrders is intentionally capped at 15. With one blockchain
    // lookup per order, this stays comfortably inside the Workers Free
    // external-subrequest ceiling while making progress on a busy queue.
    const pendingOrders = await getPendingOrders(undefined, 15);
    results.checked = pendingOrders.length;

    const processOrder = async (order: (typeof pendingOrders)[number]) => {
      try {
        const now = Date.now();
        const match = await checkPayment(order);

        if (match.matched && match.txHash) {
          const downloadToken = randomUUID();
          const claimed = await markOrderConfirmed(order.id, match.txHash, downloadToken);

          // Only the run that wins the conditional UPDATE sends the email.
          if (!claimed) return;

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

          return;
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
    };

    // Promise.allSettled means one failed order never aborts the other checks.
    await Promise.allSettled(pendingOrders.map(processOrder));

    return NextResponse.json({ ok: true, ...results });
  } catch (error) {
    console.error("[cron/check-payments] Fatal error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to run payment check", ...results },
      { status: 500 }
    );
  }
}
