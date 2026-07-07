import { NextResponse } from "next/server";
import { Resend } from "resend";
import { sendCustomerEmail } from "@/lib/mailer";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

interface NotifyPurchaseBody {
  templateTitle: string;
  templateSlug: string;
  price: number;
  buyerName: string;
  buyerEmail: string;
  currency?: string;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const { allowed, retryAfterSeconds } = checkRateLimit(
    `notify-purchase:${ip}`,
    { max: 10, windowMs: 10 * 60 * 1000 } // 10 confirmations per 10 minutes per IP
  );

  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds ?? 60) },
      }
    );
  }

  let body: NotifyPurchaseBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { templateTitle, templateSlug, price, buyerName, buyerEmail, currency } = body;

  if (!templateTitle || !templateSlug || !price || !buyerEmail) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  let ownerEmailSent = false;
  let customerEmailSent = false;

  // 1. Notify the site owner (via Resend — works today because the owner's
  // own address is the Resend account's verified address).
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;

  if (apiKey && notifyEmail) {
    try {
      const resend = new Resend(apiKey);

      await resend.emails.send({
        from: "Nexora Core <onboarding@resend.dev>",
        to: notifyEmail,
        subject: `New payment confirmation: ${templateTitle} ($${price})`,
        html: `
          <h2>A customer says they've completed a payment</h2>
          <p><strong>Template:</strong> ${templateTitle} (${templateSlug})</p>
          <p><strong>Price:</strong> $${price}</p>
          <p><strong>Paid with:</strong> ${currency || "not specified"}</p>
          <p><strong>Buyer name:</strong> ${buyerName}</p>
          <p><strong>Buyer email:</strong> ${buyerEmail}</p>
          <p>Check the wallet for a matching incoming transaction before
          delivering the template.</p>
        `,
      });

      ownerEmailSent = true;
    } catch (error) {
      console.error("[notify-purchase] Failed to email owner:", error);
    }
  } else {
    console.log(
      "[notify-purchase] Resend not configured. Purchase details:",
      { templateTitle, templateSlug, price, buyerName, buyerEmail, currency }
    );
  }

  // 2. Confirm receipt to the customer (via Gmail SMTP — can send to any
  // recipient, unlike the Resend test address).
  const siteUrl = process.env.SITE_URL;

  const dashboardLine = siteUrl
    ? `We'll make the download available in your <a href="${siteUrl}/dashboard">dashboard</a> shortly.`
    : `We'll make the download available in your dashboard shortly.`;

  const customerResult = await sendCustomerEmail({
    to: buyerEmail,
    subject: `We've received your payment confirmation for ${templateTitle}`,
    html: `
      <h2>Thanks, ${buyerName}!</h2>
      <p>We've received your confirmation that you sent payment for
      <strong>${templateTitle}</strong> ($${price}${currency ? ` in ${currency}` : ""}).</p>
      <p>Purchases are verified manually, so this isn't an automatic
      unlock — we're checking the wallet for a matching transaction.
      ${dashboardLine}
      If you have any questions in the meantime, just reply to this email
      or use the contact page.</p>
      <p>— Nexora Core</p>
    `,
  });

  customerEmailSent = customerResult.sent;

  return NextResponse.json({
    ok: true,
    ownerEmailSent,
    customerEmailSent,
  });
}
