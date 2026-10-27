export type MailFailureDiagnostic = {
  code:
    | "gmail_oauth_credentials_missing"
    | "gmail_oauth_rejected"
    | "gmail_api_rejected"
    | "smtp_connection_failed"
    | "gmail_api_send_failed";
  message: string;
};

/**
 * Translate provider errors into actionable, non-secret diagnostics for the
 * authenticated admin test endpoint. Never return raw provider responses.
 */
export function diagnoseMailFailure(error?: string): MailFailureDiagnostic {
  const value = (error ?? "").toLowerCase();

  if (
    !value ||
    value.includes("gmail api oauth credentials not configured")
  ) {
    return {
      code: "gmail_oauth_credentials_missing",
      message:
        "Gmail API OAuth settings are missing. Configure GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN as Cloudflare Worker secrets/variables.",
    };
  }

  if (
    value.includes("invalid_grant") ||
    value.includes("invalid_client") ||
    value.includes("unauthorized_client") ||
    value.includes("gmail oauth token request failed")
  ) {
    return {
      code: "gmail_oauth_rejected",
      message:
        "Google rejected the Gmail OAuth credentials. Recheck the OAuth client ID/secret and refresh token, and confirm the OAuth consent setup is still valid.",
    };
  }

  if (
    value.includes("gmail api send failed") ||
    value.includes("gmail api returned no message id")
  ) {
    return {
      code: "gmail_api_rejected",
      message:
        "Gmail API did not accept the message. Check that the OAuth grant includes the Gmail send permission and that the sender account is active.",
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
        "The previous SMTP transport could not connect from Cloudflare Workers. The new path uses Google's HTTPS API; confirm that the new deployment is active.",
    };
  }

  return {
    code: "gmail_api_send_failed",
    message:
      "Gmail API delivery failed. Check the Worker logs for the non-sensitive error category, then verify OAuth credentials and Gmail API access.",
  };
}
