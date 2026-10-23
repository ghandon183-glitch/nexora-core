import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/admin/auth";
import { getEnv } from "@/lib/env";
import { sendCustomerEmail } from "@/lib/mailer";

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { ok: false, error: "Forbidden origin" },
      { status: 403, headers: NO_STORE },
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: NO_STORE },
    );
  }

  const env = await getEnv();
  const recipient = (env.NOTIFY_EMAIL || env.GMAIL_USER || "").trim();
  if (!recipient) {
    return NextResponse.json(
      {
        ok: false,
        error: "No owner inbox is configured. Set NOTIFY_EMAIL or GMAIL_USER.",
      },
      { status: 503, headers: NO_STORE },
    );
  }

  const sentAt = new Date().toISOString();
  const result = await sendCustomerEmail({
    to: recipient,
    subject: "NEXORA CORE production email test",
    html:
      "<h1>NEXORA CORE production email test</h1>" +
      "<p>This message was requested from the authenticated admin dashboard to verify the configured Gmail SMTP transport.</p>" +
      "<p><strong>No order was created and no payment was made.</strong></p>" +
      "<p>Test time: " + sentAt + "</p>" +
      "<p>If you received this message, the production SMTP send path is working. Please also check Spam if it is not in the inbox.</p>",
    messageId: `<nexora-email-test-${Date.now()}@nexora-core.nxora.workers.dev>`,
  });

  if (!result.sent) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Gmail SMTP did not accept the test email. Check the Gmail app password and Worker configuration.",
      },
      { status: 502, headers: NO_STORE },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      message:
        "Gmail SMTP accepted the test email. Check the configured owner inbox and Spam folder. No order or payment was created.",
    },
    { headers: NO_STORE },
  );
}
