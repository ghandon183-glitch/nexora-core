import { NextResponse } from "next/server";
import { getVerificationById, incrementAttempts, markVerified } from "@/lib/verification/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const ipLimit = checkRateLimit(`verify-confirm-ip:${ip}`, {
    max: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (!ipLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds ?? 60) } }
    );
  }

  let body: { verificationId?: string; code?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const verificationId = body.verificationId ?? "";
  const code = (body.code ?? "").trim();

  if (!verificationId || !code) {
    return NextResponse.json({ ok: false, error: "Missing verification ID or code" }, { status: 400 });
  }

  try {
    const record = await getVerificationById(verificationId);

    if (!record) {
      return NextResponse.json({ ok: false, error: "Verification not found. Please request a new code." }, { status: 404 });
    }

    if (record.used) {
      return NextResponse.json({ ok: false, error: "This verification was already used. Please request a new code." }, { status: 400 });
    }

    if (Date.now() > record.expires_at) {
      return NextResponse.json({ ok: false, error: "This code expired. Please request a new one." }, { status: 400 });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ ok: false, error: "Too many incorrect attempts. Please request a new code." }, { status: 400 });
    }

    if (record.code !== code) {
      await incrementAttempts(verificationId);
      const remaining = MAX_ATTEMPTS - (record.attempts + 1);
      return NextResponse.json(
        {
          ok: false,
          error: remaining > 0 ? `Incorrect code. ${remaining} attempt(s) left.` : "Incorrect code. Please request a new one.",
        },
        { status: 400 }
      );
    }

    await markVerified(verificationId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[verify-email/confirm] Failed:", error);
    return NextResponse.json({ ok: false, error: "Could not verify code" }, { status: 500 });
  }
}
