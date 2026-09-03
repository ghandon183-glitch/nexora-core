import { createHmac, timingSafeEqual } from "crypto";
import { getEnv } from "@/lib/env";

export const ADMIN_COOKIE_NAME = "nexora_admin_session";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SESSION_VERSION = "v1";

async function getSecret(): Promise<string> {
  const env = await getEnv();
  const secret = env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("ADMIN_PASSWORD is not configured.");
  }
  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Creates a stateless, signed session containing its own server-validated
 * expiry. The previous implementation relied only on the browser cookie's
 * Max-Age, which meant a stolen cookie could remain valid indefinitely if an
 * attacker extended its client-side lifetime.
 */
export async function createSessionToken(): Promise<string> {
  const secret = await getSecret();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${SESSION_VERSION}.${expiresAt}`;
  return `${payload}.${sign(payload, secret)}`;
}

export async function isValidSessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== SESSION_VERSION) return false;

    const expiresAt = Number(parts[1]);
    const signature = parts[2];

    if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
      return false;
    }

    const secret = await getSecret();
    const payload = `${SESSION_VERSION}.${expiresAt}`;
    const expected = Buffer.from(sign(payload, secret), "utf8");
    const actual = Buffer.from(signature, "utf8");

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

export const ADMIN_SESSION_TTL_SECONDS = SESSION_TTL_SECONDS;
