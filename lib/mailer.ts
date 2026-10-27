import { getEnv } from "@/lib/env";

interface SendCustomerEmailParams {
  to: string;
  subject: string;
  html: string;
  messageId?: string;
}

function base64(bytes: Uint8Array): string {
  let binary = "";
  // Keep chunks small to avoid argument limits in String.fromCharCode.
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function base64Url(bytes: Uint8Array): string {
  return base64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function encodeHeader(value: string): string {
  return `=?UTF-8?B?${base64(new TextEncoder().encode(value))}?=`;
}

const SAFE_OAUTH_ERRORS = new Set([
  "invalid_client",
  "invalid_grant",
  "unauthorized_client",
  "invalid_scope",
  "invalid_request",
  "unsupported_grant_type",
]);

/**
 * Sends customer-facing email using Gmail API HTTPS, not SMTP.
 * This works from Cloudflare Workers without a custom domain or paid mail
 * provider. It requires OAuth credentials for a Gmail account owned by Nexora.
 *
 * Keep OAuth credentials in Worker secrets; never log access/refresh tokens.
 */
export async function sendCustomerEmail({
  to,
  subject,
  html,
  messageId,
}: SendCustomerEmailParams): Promise<{ sent: boolean; error?: string }> {
  const env = await getEnv();
  const gmailUser = env.GMAIL_USER?.trim();
  const clientId = env.GMAIL_CLIENT_ID?.trim();
  const clientSecret = env.GMAIL_CLIENT_SECRET?.trim();
  const refreshToken = env.GMAIL_REFRESH_TOKEN?.trim();

  if (!gmailUser || !clientId || !clientSecret || !refreshToken) {
    return {
      sent: false,
      error: "Gmail API OAuth credentials not configured",
    };
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      const tokenError = (await tokenResponse.json().catch(() => ({}))) as {
        error?: string;
      };
      // Only log Google's documented error enum and HTTP status. Never log
      // error_description, request bodies, client credentials, or tokens.
      const oauthError =
        tokenError.error && SAFE_OAUTH_ERRORS.has(tokenError.error)
          ? tokenError.error
          : "unknown";
      console.warn("[mailer] Gmail OAuth token exchange rejected", {
        stage: "token_exchange",
        httpStatus: tokenResponse.status,
        oauthError,
      });
      return {
        sent: false,
        error: `Gmail OAuth token request failed: ${oauthError}`,
      };
    }

    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      console.warn("[mailer] Gmail OAuth response contained no access token", {
        stage: "token_exchange",
        httpStatus: tokenResponse.status,
      });
      return { sent: false, error: "Gmail OAuth response contained no access token" };
    }

    const safeMessageId = messageId?.replace(/[\r\n<>]/g, "").slice(0, 180);
    const mime = [
      `From: Nexora Core <${gmailUser}>`,
      `To: ${to.replace(/[\r\n]/g, "")}`,
      `Subject: ${encodeHeader(subject)}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      ...(safeMessageId ? [`X-Nexora-Message-ID: ${safeMessageId}`] : []),
      "",
      base64(new TextEncoder().encode(html)),
    ].join("\r\n");

    const raw = base64Url(new TextEncoder().encode(mime));
    const sendResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      },
    );

    if (!sendResponse.ok) {
      const apiError = (await sendResponse.json().catch(() => ({}))) as {
        error?: { code?: number; status?: string };
      };
      const apiStatus = apiError.error?.status || "unknown";
      console.warn("[mailer] Gmail API send rejected", {
        stage: "gmail_send",
        httpStatus: sendResponse.status,
        apiStatus,
      });
      return {
        sent: false,
        error: `Gmail API send failed: ${apiStatus !== "unknown" ? apiStatus : apiError.error?.code || sendResponse.status}`,
      };
    }

    const sentMessage = (await sendResponse.json()) as { id?: string };
    if (!sentMessage.id) {
      console.warn("[mailer] Gmail API returned no message id", {
        stage: "gmail_send",
        httpStatus: sendResponse.status,
      });
      return { sent: false, error: "Gmail API returned no message id" };
    }

    return { sent: true };
  } catch (error) {
    const name = error instanceof Error ? error.name : "UnknownError";
    // Do not log request headers, OAuth credentials, tokens, or message content.
    console.error("[mailer] Gmail API HTTPS request failed:", { name });
    return { sent: false, error: `Gmail API request failed: ${name}` };
  }
}
