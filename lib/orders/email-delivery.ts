import { DOWNLOADS } from "@/lib/data/downloads";
import { sendCustomerEmail } from "@/lib/mailer";
import { claimOrderEmail, markOrderEmailFailed, markOrderEmailSent, type Order } from "@/lib/orders/db";
import { getEnv } from "@/lib/env";

export async function deliverConfirmedOrderEmails(
  order: Order,
  options: { transactionRef: string; eventId: string; orderUUID: string; amount: string; currency: string }
) {
  const env = await getEnv();
  const siteUrl = env.SITE_URL ?? "";
  const downloadToken = order.download_token ?? "";
  const downloadUrl = siteUrl + "/download/" + downloadToken;
  const hasFile = Boolean(DOWNLOADS[order.template_slug]);
  const ownerEmail = env.NOTIFY_EMAIL ?? "ghandon183@gmail.com";

  const ownerClaimed = await claimOrderEmail(order.id, "owner");
  if (ownerClaimed) {
    try {
      const result = await sendCustomerEmail({
        to: ownerEmail,
        subject: "NEXORA SALE — " + order.template_title + " — " + options.amount + " " + options.currency,
        html:
          "<h2>New Paymegate payment confirmed</h2><p><strong>A customer has completed a verified payment.</strong></p><hr>" +
          "<p><strong>Product:</strong> " + order.template_title + "</p>" +
          "<p><strong>Internal order ID:</strong> <code>" + order.id + "</code></p>" +
          "<p><strong>Customer:</strong> " + order.buyer_name + "</p>" +
          "<p><strong>Customer email:</strong> " + order.buyer_email + "</p>" +
          "<p><strong>Amount:</strong> " + options.amount + " " + options.currency + "</p>" +
          "<p><strong>Paymegate order UUID:</strong> <code>" + options.orderUUID + "</code></p>" +
          "<p><strong>Transaction reference:</strong> <code>" + options.transactionRef + "</code></p>" +
          "<p><strong>Webhook/event ID:</strong> <code>" + options.eventId + "</code></p>" +
          "<p><strong>Confirmed at:</strong> " + new Date().toISOString() + "</p><hr>" +
          "<p>NEXORA CORE recorded this payment as confirmed after validating the signed provider event, order, amount, currency, and customer email.</p>",
      });
      if (!result.sent) throw new Error(result.error || "Owner email was not sent");
      await markOrderEmailSent(order.id, "owner");
    } catch (error) {
      await markOrderEmailFailed(order.id, error instanceof Error ? error.message : "Owner email failed");
      console.error("[email-delivery] Owner email failed:", error);
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
          (hasFile ? "<p><a href=\"" + downloadUrl + "\">Click here to download your template</a></p>" : "<p>Your access is unlocked — the download is available in your dashboard.</p>") +
          "<p>Payment reference: <code>" + options.transactionRef + "</code></p><p>— Nexora Core</p>",
      });
      if (!result.sent) throw new Error(result.error || "Customer email was not sent");
      await markOrderEmailSent(order.id, "customer");
    } catch (error) {
      await markOrderEmailFailed(order.id, error instanceof Error ? error.message : "Customer email failed");
      console.error("[email-delivery] Customer email failed:", error);
    }
  }
}
