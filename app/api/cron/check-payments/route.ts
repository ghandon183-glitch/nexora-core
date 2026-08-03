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

/**
 * Polled on a schedule (see docs/PAYMENT_VERIFICATION.md — a GitHub Actions
 * cron job calls this every 5 minutes) to check pending orders against the
 * blockchain and automatically unlock downloads for matching payments.
 *
 * Protected by a shared secret so it can't be triggered by anyone who finds
 * the URL.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const results = { confirmed: 0, expired: 0, review: 0, checked: 0, errors: [] as string[] };

  try {
    const pendingOrders = await getPendingOrders();
    results.checked = pendingOrders.length;

    for (const order of pendingOrders) {
      try {
        const now = Date.now();

        const match = await checkPayment(order);

        if (match.matched && match.txHash) {
          const downloadToken = randomUUID();
          await markOrderConfirmed(order.id, match.txHash, downloadToken);
          results.confirmed += 1;

          const siteUrl = process.env.SITE_URL ?? "";
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
          await markOrderExpired(order.id);
          results.expired += 1;
        }
      } catch (orderError) {
        // One bad order (e.g. a transient upstream API error) shouldn't
        // stop the whole batch — flag it for manual review and move on.
        console.error(`[cron/check-payments] Error checking order ${order.id}:`, orderError);
        await markOrderReview(order.id).catch(() => {});
        results.review += 1;
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
