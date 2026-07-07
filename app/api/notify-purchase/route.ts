import { NextResponse } from "next/server";
import { Resend } from "resend";

interface NotifyPurchaseBody {
  templateTitle: string;
  templateSlug: string;
  price: number;
  buyerName: string;
  buyerEmail: string;
  currency?: string;
}

export async function POST(request: Request) {
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

  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;

  // If email isn't configured yet, don't fail the checkout flow — just log
  // it on the server so local/demo usage keeps working without setup.
  if (!apiKey || !notifyEmail) {
    console.log(
      "[notify-purchase] Email not configured. Purchase details:",
      { templateTitle, templateSlug, price, buyerName, buyerEmail, currency }
    );

    return NextResponse.json({ ok: true, emailSent: false });
  }

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

    return NextResponse.json({ ok: true, emailSent: true });
  } catch (error) {
    console.error("[notify-purchase] Failed to send email:", error);

    // Still return ok so the customer's checkout flow isn't blocked by an
    // email provider hiccup — the purchase is already recorded locally.
    return NextResponse.json({ ok: true, emailSent: false });
  }
}
