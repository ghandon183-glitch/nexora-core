/**
 * A simple in-memory, per-IP rate limiter for API routes.
 *
 * Honest limitation: this state lives in the server process's memory, not a
 * shared database. On serverless hosts (like Netlify Functions), each
 * invocation *can* run in a fresh container with its own memory, so this
 * doesn't guarantee a hard global limit — a determined abuser spread across
 * many cold starts could get around it. What it reliably stops is the common
 * case: a script or bot hammering the same warm endpoint in a tight loop, or
 * someone repeatedly clicking a button.
 *
 * For a stronger guarantee later, a shared store like Upstash Redis (free
 * tier available, works well with serverless) would enforce the limit
 * globally across all instances.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically clear old entries so this map doesn't grow forever on a
// long-running warm instance.
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();

  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  lastCleanup = now;

  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > windowMs) {
      store.delete(key);
    }
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

/** Best-effort client IP extraction behind a proxy/CDN like Netlify. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-nf-client-connection-ip") || "unknown";
}
