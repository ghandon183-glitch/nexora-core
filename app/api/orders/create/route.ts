import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { insertOrder, getPendingOrderCount, hasPendingPayAmount } from "@/lib/orders/db";
import { WALLETS, ORDER_EXPIRY_MS, generatePayAmount, type CurrencyKey } from "@/lib/orders/pricing";
import { getTemplate } from "@/lib/data/get-template";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getVerificationById, markUsed } from "@/lib/verification/db";

interface CreateOrderBody {
  templateSlug: string;
  templateTitle?: string;
  currency: CurrencyKey;
  buyerName: string;
  buyerEmail: string;
  verificationId: string;
}

// Direct-wallet matching uses an exact payment amount as the order reference.
// Keep a bounded number of active orders per currency so the small fingerprint
// space remains collision-resistant and the payment checker cannot be flooded.
const MAX_PENDING_PER_CURRENCY = 100;
const MAX_QUOTE_ATTEMPTS = 12;

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const { allowed, retryAfterSeconds } = checkRateLimit(`order-create:${ip}`, {
    max: 8,
    windowMs: 10 * 60 * 1000,
  });

  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds ?? 60) } }
    );
  }

  let body: CreateOrderBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const { templateSlug, currency, buyerName, buyerEmail, verificationId } = body;

  if (
    !templateSlug ||
    !buyerEmail ||
    !buyerName ||
    !verificationId ||
    (currency !== "USDT" && currency !== "BTC")
  ) {
    return NextResponse.json({ ok: false, error: "Missing or invalid fields" }, { status: 400 });
  }

  // Resolve the canonical catalog price/title before doing any payment work.
  const template = getTemplate(templateSlug);

  if (!template) {
    return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 });
  }

  const normalizedEmail = buyerEmail.trim().toLowerCase();

  try {
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

    const pendingCount = await getPendingOrderCount(currency);
    if (pendingCount >= MAX_PENDING_PER_CURRENCY) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Crypto checkout is temporarily at capacity. Your account is safe — please try again in a few minutes.",
        },
        { status: 429, headers: { "Retry-After": "300" } }
      );
    }

    // Consume the one-time verification only after all cheap validation and
    // capacity checks have passed. Quote collisions are retried below without
    // requiring the buyer to repeat email verification.
    await markUsed(verificationId);

    let lastError: unknown = null;

    for (let attempt = 0; attempt < MAX_QUOTE_ATTEMPTS; attempt += 1) {
      const payAmount = await generatePayAmount(currency, template.price);

      // Avoid normal collisions before touching the database. The final INSERT
      // is still allowed to fail safely in the extremely small race window.
      if (await hasPendingPayAmount(currency, payAmount)) continue;

      const wallet = WALLETS[currency];
      const now = Date.now();

      const order = {
        id: randomUUID(),
        template_slug: template.slug,
        template_title: template.title,
        base_price_usd: template.price,
        currency,
        wallet_address: wallet.address,
        pay_amount: payAmount,
        buyer_name: buyerName.trim().slice(0, 120),
        buyer_email: normalizedEmail,
        status: "pending" as const,
        tx_hash: null,
        download_token: null,
        created_at: now,
        expires_at: now + ORDER_EXPIRY_MS,
        confirmed_at: null,
      };

      try {
        await insertOrder(order);

        return NextResponse.json({
          ok: true,
          order: {
            id: order.id,
            payAmount,
            walletAddress: wallet.address,
            network: wallet.network,
            currency,
            expiresAt: order.expires_at,
            status: order.status,
          },
        });
      } catch (error) {
        lastError = error;
        // A concurrent request may have selected the same exact fingerprint.
        // Generate another one rather than failing the buyer immediately.
      }
    }

    console.error("[orders/create] Could not allocate a unique payment quote:", lastError);
    return NextResponse.json(
      { ok: false, error: "Could not allocate a unique payment amount. Please try again shortly." },
      { status: 503 }
    );
  } catch (error) {
    console.error("[orders/create] Failed to create order:", error);
    return NextResponse.json({ ok: false, error: "Could not create order" }, { status: 500 });
  }
}
