import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE_NAME = "nexora_admin_session";

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("ADMIN_PASSWORD is not configured.");
  }
  return secret;
}

/**
 * The session token is a deterministic HMAC derived from the admin
 * password. There's no separate session store — the cookie's own
 * expiration (set at login) is what limits session length, and the token
 * automatically becomes invalid for everyone if the password is rotated.
 */
export function createSessionToken(): string {
  return createHmac("sha256", getSecret()).update("nexora-admin-session").digest("hex");
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;

  try {
    const expected = Buffer.from(createSessionToken());
    const actual = Buffer.from(token);

    if (expected.length !== actual.length) return false;

    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function checkAdminPassword(candidate: string): boolean {
  try {
    const expected = Buffer.from(getSecret());
    const actual = Buffer.from(candidate);

    if (expected.length !== actual.length) return false;

    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
