import { DOWNLOADS } from "@/lib/data/downloads";
import { getEnv } from "@/lib/env";
import {
  claimEmailOutbox,
  enqueueOrderEmail,
  getDueEmailOutbox,
  getOrdersNeedingEmailDelivery,
  markEmailOutboxFailed,
  markEmailOutboxSent,
  type Order,
} from "@/lib/orders/db";

/**
 * Origin used for customer download links when SITE_URL is not configured.
 * Without it the queued email would contain a relative link the customer's
 * mail client cannot open, so the paid download would be unreachable.
 */
const PRODUCTION_SITE_URL = "https://nexora-core.nxora.workers.dev";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function resolveSiteUrl(configured: string | undefined): string {
  const normalized = (configured ?? "").trim().replace(/\/+$/, "");
  return normalized || PRODUCTION_SITE_URL;
}

export interface DeliveryMetadata {
  transactionRef: string;
  eventId: string;
  orderUUID: string;
  amount: string;
  currency: string;
  /** Human-readable payment source used in the owner alert. */
  paymentSource?: string;
  /** How this particular confirmation was verified. */
  verificationDescription?: string;
}

/**
 * Rebuilds the delivery facts from the persisted order. A confirmed order must
 * remain deliverable even when the original webhook/cron process died between
 * persisting the confirmation and queuing its emails.
 */
export function orderDeliveryMetadata(order: Order): DeliveryMetadata {
  const provider = order.payment_provider === "paymegate" ? "paymegate" : "crypto";
  return {
    transactionRef:
      order.tx_hash ||
      order.paymegate_transaction_ref ||
      order.paymegate_transaction_uuid ||
      `${provider}:${order.id}`,
    eventId: order.paymegate_event_id || `${provider}:${order.id}`,
    orderUUID: order.paymegate_order_uuid || `${provider}:${order.id}`,
    amount: order.base_price_usd.toFixed(2),
    currency: "USD",
  };
}

async function enqueueDeliveryEmails(
  order: Order,
  metadata: DeliveryMetadata,
  options: { createOnly?: boolean } = {}
): Promise<void> {
  const env = await getEnv();
  const siteUrl = resolveSiteUrl(env.SITE_URL);
  const downloadToken = order.download_token ?? "";
  const downloadUrl = order.template_slug === "all-templates"
    ? siteUrl + "/en/download/bundle/" + downloadToken
    : siteUrl + "/download/" + downloadToken;
  const hasFile = order.template_slug === "all-templates" || Boolean(DOWNLOADS[order.template_slug]);
  const ownerEmail = env.NOTIFY_EMAIL ?? "ghandon183@gmail.com";
  const paymentSource = metadata.paymentSource ??
    (order.payment_provider === "paymegate" ? "Paymegate" : "cryptocurrency");
  const verificationDescription = metadata.verificationDescription ??
    (order.payment_provider === "paymegate"
      ? "NEXORA CORE recorded this payment as confirmed after validating the signed Paymegate event, order, amount, currency, and customer email."
      : "NEXORA CORE recorded this payment as confirmed after validating the on-chain transaction against the order.");

  const productTitle = escapeHtml(order.template_title);
  const orderId = escapeHtml(order.id);
  const buyerName = escapeHtml(order.buyer_name);
  const buyerEmail = escapeHtml(order.buyer_email);
  const amount = escapeHtml(metadata.amount);
  const currency = escapeHtml(metadata.currency);
  const orderUUID = escapeHtml(metadata.orderUUID);
  const transactionRef = escapeHtml(metadata.transactionRef);
  const eventId = escapeHtml(metadata.eventId);
  const safeDownloadUrl = escapeHtml(downloadUrl);

  await enqueueOrderEmail({
    id: order.id + ":owner",
    orderId: order.id,
    kind: "owner",
    toEmail: ownerEmail,
    subject: "NEXORA SALE — " + order.template_title + " — " + metadata.amount + " " + metadata.currency,
    html:
      "<h2>New " + paymentSource + " payment confirmed</h2><p><strong>A customer has completed a verified payment.</strong></p><hr>" +
      "<p><strong>Product:</strong> " + productTitle + "</p>" +
      "<p><strong>Internal order ID:</strong> <code>" + orderId + "</code></p>" +
      "<p><strong>Customer:</strong> " + buyerName + "</p>" +
      "<p><strong>Customer email:</strong> " + buyerEmail + "</p>" +
      "<p><strong>Amount:</strong> " + amount + " " + currency + "</p>" +
      "<p><strong>Payment provider/order reference:</strong> <code>" + orderUUID + "</code></p>" +
      "<p><strong>Transaction reference:</strong> <code>" + transactionRef + "</code></p>" +
      "<p><strong>Payment verification event ID:</strong> <code>" + eventId + "</code></p>" +
      "<p><strong>Confirmed at:</strong> " + new Date().toISOString() + "</p><hr>" +
      "<p>" + verificationDescription + "</p>",
  }, options);

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
  }, options);
}

/**
 * Queues the owner alert and the customer download email for a confirmed order.
 * Every payment path (webhook, cron, admin) goes through the outbox so a failed
 * send is retried instead of being lost.
 */
export async function deliverConfirmedOrderEmails(
  order: Order,
  metadata: DeliveryMetadata
): Promise<void> {
  await enqueueDeliveryEmails(order, metadata);
}

/**
 * Makes sure an already-confirmed order has its outbox rows, without touching
 * rows that already exist (their wording and retry backoff are preserved).
 */
export async function ensureConfirmedOrderEmails(
  order: Order,
  overrides: Partial<DeliveryMetadata> = {}
): Promise<void> {
  await enqueueDeliveryEmails(order, { ...orderDeliveryMetadata(order), ...overrides }, { createOnly: true });
}

/**
 * Recovery path for confirmations whose email queueing failed (D1 error,
 * worker shutdown, or a confirmation written by an older deployment). Runs
 * before the outbox is drained so the customer still receives the download
 * link for a payment that is already confirmed.
 */
export async function reconcileConfirmedOrderEmails(limit = 15): Promise<number> {
  const orders = await getOrdersNeedingEmailDelivery(limit);
  let queued = 0;

  for (const order of orders) {
    if (!order.download_token) {
      // Never invent access for a confirmed row without a token.
      console.error("[email-outbox] Confirmed order has no download token:", order.id);
      continue;
    }

    await enqueueDeliveryEmails(order, orderDeliveryMetadata(order), { createOnly: true });
    queued += 1;
  }

  return queued;
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
        messageId: `<${item.id}@nexora-core.nxora.workers.dev>`,
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
