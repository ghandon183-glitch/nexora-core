import nodemailer from "nodemailer";

import { getEnv } from "@/lib/env";

interface SendCustomerEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email directly through the site owner's Gmail account via SMTP.
 *
 * Unlike the Resend integration (which can only send to the account owner's
 * own address until a custom domain is verified), this can send to any
 * recipient — so it's used specifically for customer-facing emails.
 *
 * Returns { sent: false } instead of throwing when Gmail credentials aren't
 * configured, so checkout never breaks because of missing email setup.
 *
 * Credentials are read through the centralized getEnv() helper
 * (lib/env.ts), which prefers Cloudflare Worker vars/secrets (read via the
 * request's Cloudflare context) and falls back to process.env for local
 * development. Server-only.
 */
export async function sendCustomerEmail({
  to,
  subject,
  html,
}: SendCustomerEmailParams): Promise<{ sent: boolean; error?: string }> {
  const env = await getEnv();

  const gmailUser = env.GMAIL_USER;
  const gmailAppPassword = env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    console.log(
      "[mailer] Gmail not configured. Would have sent to:",
      to,
      subject
    );

    return { sent: false, error: "Gmail not configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: `Nexora Core <${gmailUser}>`,
      to,
      subject,
      html,
    });

    return { sent: true };
  } catch (error) {
    console.error("[mailer] Failed to send customer email:", error);

    return {
      sent: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
