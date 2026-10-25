export type MailFailureDiagnostic = {
  code:
    | "resend_credentials_missing"
    | "resend_sender_missing"
    | "resend_sender_unverified"
    | "resend_request_failed"
    | "smtp_connection_failed"
    | "smtp_send_failed";
  message: string;
};

/**
 * Translate provider errors into actionable, non-secret diagnostics for the
 * authenticated admin test endpoint. Never return raw provider responses:
 * they can contain recipient addresses or operational details.
 */
export function diagnoseMailFailure(error?: string): MailFailureDiagnostic {
  const value = (error ?? "").toLowerCase();

  if (!value || value.includes("resend api key not configured")) {
    return {
      code: "resend_credentials_missing",
      message:
        "RESEND_API_KEY is missing from the Cloudflare Worker. Add the API key from your Resend account as a Worker secret.",
    };
  }

  if (value.includes("resend sender address not configured")) {
    return {
      code: "resend_sender_missing",
      message:
        "RESEND_FROM_EMAIL is missing. Set it to an address on a domain that is verified in Resend.",
    };
  }

  if (
    value.includes("domain is not verified") ||
    value.includes("verify your domain") ||
    value.includes("not authorized to send")
  ) {
    return {
      code: "resend_sender_unverified",
      message:
        "Resend rejected the sender. Verify the sender's domain in Resend, then set RESEND_FROM_EMAIL to an address on that verified domain.",
    };
  }

  if (
    value.includes("proxy request failed") ||
    value.includes("cannot connect to the specified address") ||
    /\b(econn|enotfound|etimedout|esocket|ehostunreach|eai_again)\b/.test(value) ||
    value.includes("connection timeout") ||
    value.includes("certificate") ||
    value.includes("tls")
  ) {
    return {
      code: "smtp_connection_failed",
      message:
        "The current SMTP transport cannot establish a connection from the Cloudflare Worker. Customer email has been moved to the HTTPS Resend API; confirm the deployed version is current.",
    };
  }

  return {
    code: "resend_request_failed",
    message:
      "Resend could not send the email. Check the Worker logs for the sanitized Resend error, and verify the API key, sender domain, and recipient.",
  };
}
