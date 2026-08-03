import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { insertOrder } from "@/lib/orders/db";
import { WALLETS, ORDER_EXPIRY_MS, generatePayAmount, type CurrencyKey } from "@/lib/orders/pricing";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

interface CreateOrderBody {
  templateSlug: string;
  templateTitle: string;
  basePriceUsd: number;
  currency: CurrencyKey;
  buyerName: string;
  buyerEmail: string;
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

  const { templateSlug, templateTitle, basePriceUsd, currency, buyerName, buyerEmail } = body;

  if (
    !templateSlug ||
    !templateTitle ||
    !basePriceUsd ||
    !buyerEmail ||
    !buyerName ||
    (currency !== "USDT" && currency !== "BTC")
  ) {
    return NextResponse.json({ ok: false, error: "Missing or invalid fields" }, { status: 400 });
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
