import { NextResponse } from "next/server";
import { getVerificationById, incrementAttempts, markVerified } from "@/lib/verification/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 5;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CODE_RE = /^\d{6}$/;

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

  const verificationId = body.verificationId?.trim() ?? "";
  const code = body.code?.trim() ?? "";

  if (!UUID_RE.test(verificationId) || !CODE_RE.test(code)) {
    return NextResponse.json({ ok: false, error: "Invalid verification request" }, { status: 400 });
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
      const incremented = await incrementAttempts(verificationId, MAX_ATTEMPTS);
      const attemptsAfter = Math.min(MAX_ATTEMPTS, record.attempts + (incremented ? 1 : 0));
      const remaining = MAX_ATTEMPTS - attemptsAfter;
      return NextResponse.json(
        {
          ok: false,
          error: remaining > 0
            ? `Incorrect code. ${remaining} attempt(s) left.`
            : "Incorrect code. Please request a new one.",
        },
        { status: 400 }
      );
    }

    const verified = await markVerified(verificationId, MAX_ATTEMPTS);
    if (!verified) {
      return NextResponse.json({ ok: false, error: "This verification is no longer valid. Please request a new code." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[verify-email/confirm] Failed:", error);
    return NextResponse.json({ ok: false, error: "Could not verify code" }, { status: 500 });
  }
}
