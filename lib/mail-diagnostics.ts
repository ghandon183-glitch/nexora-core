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

  if (value.includes("invalid_client")) {
    return {
      code: "gmail_oauth_rejected",
      message:
        "Google returned invalid_client during OAuth token exchange. Verify that GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET belong to the same OAuth client in the intended Google Cloud project, and that the client has not been deleted. No credential values were logged.",
    };
  }

  if (value.includes("invalid_grant")) {
    return {
      code: "gmail_oauth_rejected",
      message:
        "Google returned invalid_grant during OAuth token exchange. The refresh token may be expired, revoked, or issued for a different OAuth client. Check the OAuth consent publishing status; Gmail-scope refresh tokens issued while an external app is in Testing expire after 7 days. No token values were logged.",
    };
  }

  if (value.includes("unauthorized_client")) {
    return {
      code: "gmail_oauth_rejected",
      message:
        "Google returned unauthorized_client during OAuth token exchange. Check the OAuth client configuration and whether this client is permitted to use the refresh-token grant.",
    };
  }

  if (value.includes("gmail oauth token request failed")) {
    return {
      code: "gmail_oauth_rejected",
      message:
        "Google's OAuth token endpoint rejected the refresh-token exchange. Check the sanitized oauthError and httpStatus fields in Cloudflare Worker logs; no OAuth credential or token values are recorded.",
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
