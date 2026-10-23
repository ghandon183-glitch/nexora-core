export type MailFailureDiagnostic = {
  code: "gmail_credentials_missing" | "gmail_auth_rejected" | "smtp_connection_failed" | "smtp_message_rejected" | "smtp_send_failed";
  message: string;
};

/**
 * Translate provider errors into actionable, non-secret diagnostics for the
 * authenticated admin test endpoint. Never return raw SMTP responses because
 * providers can include addresses or other operational details.
 */
export function diagnoseMailFailure(error?: string): MailFailureDiagnostic {
  const value = (error ?? "").toLowerCase();

  if (!value || value.includes("gmail not configured")) {
    return {
      code: "gmail_credentials_missing",
      message: "Gmail SMTP credentials are missing from the Worker runtime. Verify GMAIL_USER and GMAIL_APP_PASSWORD.",
    };
  }

  if (
    value.includes("eauth") ||
    value.includes("invalid login") ||
    value.includes("username and password not accepted") ||
    value.includes("application-specific password required") ||
    /\b(534|535)\b/.test(value)
  ) {
    return {
      code: "gmail_auth_rejected",
      message: "Gmail rejected the login. Check that GMAIL_USER is the full Gmail address and GMAIL_APP_PASSWORD is a current 16-character Google App Password for that same account (not the normal account password).",
    };
  }

  if (
    /\b(econn|enotfound|etimedout|esocket|ehostunreach|eai_again)\b/.test(value) ||
    value.includes("connection timeout") ||
    value.includes("certificate") ||
    value.includes("tls")
  ) {
    return {
      code: "smtp_connection_failed",
      message: "The Worker could not establish a secure SMTP connection to Gmail. Check the SMTP transport/runtime configuration and retry.",
    };
  }

  if (/\b(550|552|553|554)\b/.test(value) || value.includes("message rejected") || value.includes("recipient address rejected")) {
    return {
      code: "smtp_message_rejected",
      message: "Gmail or the recipient server rejected the message after login. Check the configured owner email address and Gmail's sending restrictions.",
    };
  }

  return {
    code: "smtp_send_failed",
    message: "Gmail SMTP failed for an undetermined reason. Check the Worker logs for the mailer error and retry.",
  };
}
