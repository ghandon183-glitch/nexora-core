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

const MAX_PENDING_PER_CURRENCY = 100;
const MAX_QUOTE_ATTEMPTS = 12;
const MAX_REQUEST_BYTES = 16 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ ok: false, error: "Request body is too large" }, { status: 413 });
  }

  let body: CreateOrderBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const { templateSlug, currency, buyerName, buyerEmail, verificationId } = body;

  if (
    typeof templateSlug !== "string" ||
    typeof buyerEmail !== "string" ||
    typeof buyerName !== "string" ||
    typeof verificationId !== "string" ||
    !templateSlug ||
    !buyerEmail ||
    !buyerName ||
    !verificationId ||
    (currency !== "USDT" && currency !== "BTC") ||
    templateSlug.length > 120 ||
    buyerName.length > 120 ||
    buyerEmail.length > 254 ||
    verificationId.length > 80 ||
    !UUID_RE.test(verificationId)
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

    await markUsed(verificationId);

    let lastError: unknown = null;

    for (let attempt = 0; attempt < MAX_QUOTE_ATTEMPTS; attempt += 1) {
      const payAmount = await generatePayAmount(currency, template.price);

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
