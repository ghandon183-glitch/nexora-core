import { NextResponse } from "next/server";
import { randomUUID, randomInt } from "crypto";
import { insertVerification } from "@/lib/verification/db";
import { sendCustomerEmail } from "@/lib/mailer";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function isValidEmail(email: string): boolean {
  // Deliberately simple — good enough to catch typos/garbage without
  // rejecting valid addresses a stricter regex might choke on.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Two limits: per-IP (stop scripted abuse) and per-email (stop someone
  // from spamming one inbox with codes even if they rotate IPs).
  const ipLimit = checkRateLimit(`verify-send-ip:${ip}`, {
    max: 8,
    windowMs: 10 * 60 * 1000,
  });

  if (!ipLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds ?? 60) } }
    );
  }

  let body: { email?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address" }, { status: 400 });
  }

  const emailLimit = checkRateLimit(`verify-send-email:${email}`, {
    max: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!emailLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many codes requested for this email. Please wait a bit." },
      { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSeconds ?? 60) } }
    );
  }

  try {
    const id = randomUUID();
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const now = Date.now();

    await insertVerification({
      id,
      email,
      code,
      created_at: now,
      expires_at: now + CODE_EXPIRY_MS,
    });

    const emailResult = await sendCustomerEmail({
      to: email,
      subject: `Your Nexora Core verification code: ${code}`,
      html: `
        <h2>Verify your email</h2>
        <p>Use this code to confirm your email address and continue checkout:</p>
        <p style="font-size: 32px; font-weight: 800; letter-spacing: 4px;">${code}</p>
        <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
        <p>— Nexora Core</p>
      `,
    });

    if (!emailResult.sent) {
      // Surfaced so the checkout UI can tell the buyer clearly, rather than
      // showing a code-entry screen for a code that was never delivered.
      return NextResponse.json(
        { ok: false, error: "Could not send verification email. Please try again shortly." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, verificationId: id });
  } catch (error) {
    console.error("[verify-email/send] Failed:", error);
    return NextResponse.json({ ok: false, error: "Could not send verification code" }, { status: 500 });
  }
}
