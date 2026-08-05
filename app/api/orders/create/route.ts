import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { insertOrder } from "@/lib/orders/db";
import { WALLETS, ORDER_EXPIRY_MS, generatePayAmount, type CurrencyKey } from "@/lib/orders/pricing";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getVerificationById, markUsed } from "@/lib/verification/db";

interface CreateOrderBody {
  templateSlug: string;
  templateTitle: string;
  basePriceUsd: number;
  currency: CurrencyKey;
  buyerName: string;
  buyerEmail: string;
  verificationId: string;
}

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

  const { templateSlug, templateTitle, basePriceUsd, currency, buyerName, buyerEmail, verificationId } = body;

  if (
    !templateSlug ||
    !templateTitle ||
    !basePriceUsd ||
    !buyerEmail ||
    !buyerName ||
    !verificationId ||
    (currency !== "USDT" && currency !== "BTC")
  ) {
    return NextResponse.json({ ok: false, error: "Missing or invalid fields" }, { status: 400 });
  }

  // The download link goes to buyerEmail the moment payment is confirmed,
  // so an order can only be created against an email that was just proven
  // deliverable via a one-time code — never a raw, unverified string.
  try {
    const verification = await getVerificationById(verificationId);
    const normalizedEmail = buyerEmail.trim().toLowerCase();

    if (
      !verification ||
      !verification.verified ||
      verification.used ||
      verification.email !== normalizedEmail ||
      Date.now() > verification.expires_at + 30 * 60 * 1000 // grace period past code expiry to actually place the order
    ) {
      return NextResponse.json(
        { ok: false, error: "Email verification is missing or expired. Please verify your email again." },
        { status: 400 }
      );
    }

    await markUsed(verificationId);
  } catch (error) {
    console.error("[orders/create] Verification check failed:", error);
    return NextResponse.json({ ok: false, error: "Could not verify email status" }, { status: 500 });
  }

  try {
    const payAmount = await generatePayAmount(currency, basePriceUsd);
    const wallet = WALLETS[currency];
    const now = Date.now();

    const order = {
      id: randomUUID(),
      template_slug: templateSlug,
      template_title: templateTitle,
      base_price_usd: basePriceUsd,
      currency,
      wallet_address: wallet.address,
      pay_amount: payAmount,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      status: "pending" as const,
      tx_hash: null,
      download_token: null,
      created_at: now,
      expires_at: now + ORDER_EXPIRY_MS,
      confirmed_at: null,
    };

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
    console.error("[orders/create] Failed to create order:", error);
    return NextResponse.json({ ok: false, error: "Could not create order" }, { status: 500 });
  }
}
