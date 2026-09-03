/**
 * A lightweight in-memory, per-IP rate limiter for API routes.
 *
 * Workers may run multiple isolates, so this is not a global limiter.
 * Cloudflare edge-level rate limiting/WAF should be the global protection
 * once traffic grows materially.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > windowMs) store.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): { allowed: boolean; retryAfterSeconds?: number } {
  cleanup(windowMs);

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= max) {
    const retryAfterSeconds = Math.ceil(
      (entry.windowStart + windowMs - now) / 1000
    );
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true };
}

/**
 * Cloudflare supplies CF-Connecting-IP with the original client IP.
 * Fall back to common proxy headers for local/staging environments.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
