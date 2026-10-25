import { Resend } from "resend";

import { getEnv } from "@/lib/env";

interface SendCustomerEmailParams {
  to: string;
  subject: string;
  html: string;
  messageId?: string;
}

/**
 * Sends customer-facing email through Resend's HTTPS API.
 *
 * Cloudflare Workers should not use a raw SMTP transport such as Nodemailer:
 * outbound SMTP/TCP connections are not a reliable/supported Worker transport.
 * Resend's HTTPS API is compatible with the Workers runtime.
 *
 * RESEND_FROM_EMAIL must be an address on a domain verified in Resend. Do not
 * silently fall back to onboarding@resend.dev: that test sender cannot deliver
 * to arbitrary customers and would make production email appear configured
 * when it is not.
 */
export async function sendCustomerEmail({
  to,
  subject,
  html,
  messageId,
}: SendCustomerEmailParams): Promise<{ sent: boolean; error?: string }> {
  const env = await getEnv();
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey) {
    return { sent: false, error: "Resend API key not configured" };
  }

  if (!from) {
    return { sent: false, error: "Resend sender address not configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      ...(messageId
        ? { headers: { "X-Nexora-Message-ID": messageId } }
        : {}),
    });

    if (error) {
      console.error("[mailer] Resend API failed to send customer email:", {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
      });
      return {
        sent: false,
        error: `${error.name || "ResendError"}: ${error.message}`,
      };
    }

    if (!data?.id) {
      console.error("[mailer] Resend API returned no email id.");
      return { sent: false, error: "Resend API returned no email id" };
    }

    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[mailer] Resend API request failed:", {
      name: error instanceof Error ? error.name : "UnknownError",
      message,
    });
    return { sent: false, error: message };
  }
}
