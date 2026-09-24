import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { attachPaymegateOrder, insertOrder } from "@/lib/orders/db";
import { getTemplate } from "@/lib/data/get-template";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getVerificationById, markUsed } from "@/lib/verification/db";
import { getEnv } from "@/lib/env";

const MAX_REQUEST_BYTES = 16 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCALE_RE = /^[a-z]{2}(?:-[A-Z]{2})?$/;

interface Body {
  templateSlug: string;
  buyerName: string;
  buyerEmail: string;
  verificationId: string;
  locale?: string;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterSeconds } = checkRateLimit(`paymegate-create:${ip}`, {
    max: 8,
    windowMs: 10 * 60 * 1000,
  });

  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds ?? 60) } }
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ ok: false, error: "Request body is too large" }, { status: 413 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const { templateSlug, buyerName, buyerEmail, verificationId } = body;
  const locale = body.locale && LOCALE_RE.test(body.locale) ? body.locale : "en";

  if (
    typeof templateSlug !== "string" ||
    typeof buyerName !== "string" ||
    typeof buyerEmail !== "string" ||
    typeof verificationId !== "string" ||
    !templateSlug ||
    !buyerName ||
    !buyerEmail ||
    !verificationId ||
    !UUID_RE.test(verificationId) ||
    templateSlug.length > 120 ||
    buyerName.length > 120 ||
    buyerEmail.length > 254
  ) {
    return NextResponse.json({ ok: false, error: "Missing or invalid fields" }, { status: 400 });
  }

  const normalizedEmail = buyerEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(normalizedEmail)) {
    return NextResponse.json({ ok: false, error: "Invalid email address" }, { status: 400 });
  }

  const template = getTemplate(templateSlug);
  if (!template) {
    return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 });
  }

  const env = await getEnv();
  if (!env.PAYMEGATE_API_KEY) {
    console.error("[paymegate/create] PAYMEGATE_API_KEY is not configured");
    return NextResponse.json({ ok: false, error: "Payment provider is not configured" }, { status: 503 });
  }

  const verification = await getVerificationById(verificationId);
  if (
    !verification ||
    !verification.verified ||
    verification.used ||
    verification.email !== normalizedEmail ||
    Date.now() > verification.expires_at + 30 * 60 * 1000
  ) {
    return NextResponse.json(
      { ok: false, error: "Email verification is missing or expired. Please verify your email again." },
      { status: 400 }
    );
  }

  try {
    const consumed = await markUsed(verificationId);
    if (!consumed) {
      return NextResponse.json(
        { ok: false, error: "Email verification is missing or already used. Please verify again." },
        { status: 400 }
      );
    }

    const orderId = randomUUID();
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000;

    await insertOrder({
      id: orderId,
      template_slug: template.slug,
      template_title: template.title,
      base_price_usd: template.price,
      currency: "USDT",
      wallet_address: "",
      pay_amount: template.price.toFixed(2),
      buyer_name: buyerName.trim().slice(0, 120),
      buyer_email: normalizedEmail,
      status: "pending",
      tx_hash: null,
      download_token: null,
      created_at: now,
      expires_at: expiresAt,
      confirmed_at: null,
      payment_provider: "paymegate",
    });

    const origin = new URL(request.url).origin;
    const returnUrl = `${origin}/${locale}/checkout/${encodeURIComponent(template.slug)}?payment=paymegate&order=${encodeURIComponent(orderId)}`;

    const providerResponse = await fetch("https://api.paymegate.com/v1/orders", {
      method: "POST",
      headers: {
        "X-API-Key": env.PAYMEGATE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        externalId: orderId,
        amount: template.price.toFixed(2),
        currency: "USD",
        paymentMethodsKeys: ["*"],
        returnUrl,
        customer: {
          email: normalizedEmail,
          fullName: buyerName.trim().slice(0, 120),
        },
        metadata: {
          productSlug: template.slug,
          orderId,
        },
      }),
    });

    const providerJson = (await providerResponse.json().catch(() => null)) as
      | { success?: boolean; data?: { orderUUID?: string; checkoutUrl?: string } }
      | null;

    const checkoutUrl = providerJson?.data?.checkoutUrl;
    const orderUUID = providerJson?.data?.orderUUID;

    if (!providerResponse.ok || !checkoutUrl || !orderUUID) {
      console.error("[paymegate/create] Provider order creation failed:", providerResponse.status, providerJson);
      return NextResponse.json(
        { ok: false, error: "Could not start card checkout. Please try again." },
        { status: 502 }
      );
    }

    const attached = await attachPaymegateOrder(orderId, orderUUID, checkoutUrl);
    if (!attached) {
      console.error("[paymegate/create] Local order could not be linked:", orderId);
      return NextResponse.json(
        { ok: false, error: "Could not link payment order. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, checkoutUrl, orderId, expiresAt });
  } catch (error) {
    console.error("[paymegate/create] Failed to create payment order:", error);
    return NextResponse.json(
      { ok: false, error: "Could not start card checkout. Please try again." },
      { status: 500 }
    );
  }
}
