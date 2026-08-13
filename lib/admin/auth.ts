import { createHmac, timingSafeEqual } from "crypto";
import { getEnv } from "@/lib/env";

export const ADMIN_COOKIE_NAME = "nexora_admin_session";

async function getSecret(): Promise<string> {
  const env = await getEnv();
  const secret = env.ADMIN_PASSWORD;
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
export async function createSessionToken(): Promise<string> {
  const secret = await getSecret();
  return createHmac("sha256", secret).update("nexora-admin-session").digest("hex");
}

export async function isValidSessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;

  try {
    const expected = Buffer.from(await createSessionToken());
    const actual = Buffer.from(token);

    if (expected.length !== actual.length) return false;

    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function checkAdminPassword(candidate: string): Promise<boolean> {
  try {
    const expected = Buffer.from(await getSecret());
    const actual = Buffer.from(candidate);

    if (expected.length !== actual.length) return false;

    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
