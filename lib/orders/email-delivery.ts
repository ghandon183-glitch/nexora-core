import { DOWNLOADS } from "@/lib/data/downloads";
import { enqueueOrderEmail, claimEmailOutbox, getDueEmailOutbox, markEmailOutboxFailed, markEmailOutboxSent, type Order } from "@/lib/orders/db";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function deliverConfirmedOrderEmails(
  order: Order,
  options: { transactionRef: string; eventId: string; orderUUID: string; amount: string; currency: string }
) {
  const env = await getEnv();
  const siteUrl = env.SITE_URL ?? "";
  const downloadToken = order.download_token ?? "";
  const downloadUrl = order.template_slug === "all-templates"
    ? siteUrl + "/en/download/bundle/" + downloadToken
    : siteUrl + "/download/" + downloadToken;
  const hasFile = order.template_slug === "all-templates" || Boolean(DOWNLOADS[order.template_slug]);
  const ownerEmail = env.NOTIFY_EMAIL ?? "ghandon183@gmail.com";

  const productTitle = escapeHtml(order.template_title);
  const orderId = escapeHtml(order.id);
  const buyerName = escapeHtml(order.buyer_name);
  const buyerEmail = escapeHtml(order.buyer_email);
  const amount = escapeHtml(options.amount);
  const currency = escapeHtml(options.currency);
  const orderUUID = escapeHtml(options.orderUUID);
  const transactionRef = escapeHtml(options.transactionRef);
  const eventId = escapeHtml(options.eventId);
  const safeDownloadUrl = escapeHtml(downloadUrl);

  await enqueueOrderEmail({
    id: order.id + ":owner",
    orderId: order.id,
    kind: "owner",
    toEmail: ownerEmail,
    subject: "NEXORA SALE — " + order.template_title + " — " + options.amount + " " + options.currency,
    html:
      "<h2>New Paymegate payment confirmed</h2><p><strong>A customer has completed a verified payment.</strong></p><hr>" +
      "<p><strong>Product:</strong> " + productTitle + "</p>" +
      "<p><strong>Internal order ID:</strong> <code>" + orderId + "</code></p>" +
      "<p><strong>Customer:</strong> " + buyerName + "</p>" +
      "<p><strong>Customer email:</strong> " + buyerEmail + "</p>" +
      "<p><strong>Amount:</strong> " + amount + " " + currency + "</p>" +
      "<p><strong>Paymegate order UUID:</strong> <code>" + orderUUID + "</code></p>" +
      "<p><strong>Transaction reference:</strong> <code>" + transactionRef + "</code></p>" +
      "<p><strong>Webhook/event ID:</strong> <code>" + eventId + "</code></p>" +
      "<p><strong>Confirmed at:</strong> " + new Date().toISOString() + "</p><hr>" +
      "<p>NEXORA CORE recorded this payment as confirmed after validating the signed provider event, order, amount, currency, and customer email.</p>",
  });

  await enqueueOrderEmail({
    id: order.id + ":customer",
    orderId: order.id,
    kind: "customer",
    toEmail: order.buyer_email,
    subject: "Payment confirmed — download " + order.template_title,
    html:
      "<h2>Payment confirmed, " + buyerName + "!</h2>" +
      "<p>We received your payment for <strong>" + productTitle + "</strong>.</p>" +
      (hasFile ? "<p><a href=\"" + safeDownloadUrl + "\">Click here to download your template</a></p>" : "<p>Your access is unlocked — the download is available in your dashboard.</p>") +
      "<p>Payment reference: <code>" + transactionRef + "</code></p><p>— Nexora Core</p>",
  });
}

export async function processEmailOutbox(limit = 10): Promise<{
  claimed: number;
  sent: number;
  failed: number;
}> {
  const due = await getDueEmailOutbox(limit);
  const result = { claimed: 0, sent: 0, failed: 0 };

  for (const candidate of due) {
    const item = await claimEmailOutbox(candidate.id);
    if (!item) continue;

    result.claimed += 1;

    try {
      const { sendCustomerEmail } = await import("@/lib/mailer");
      const emailResult = await sendCustomerEmail({
        to: item.to_email,
        subject: item.subject,
        html: item.html,
      });

      if (!emailResult.sent) {
        throw new Error(emailResult.error || "Email was not sent");
      }

      await markEmailOutboxSent(item.id);
      result.sent += 1;
    } catch (error) {
      await markEmailOutboxFailed(
        item.id,
        error instanceof Error ? error.message : "Unknown email delivery error"
      );
      result.failed += 1;
      console.error("[email-outbox] Delivery failed:", item.id, error);
    }
  }

  return result;
}
