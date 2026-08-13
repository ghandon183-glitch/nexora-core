import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * The subset of runtime configuration read by server code. These are the
 * Cloudflare Worker vars/secrets the application actually consumes
 * (see `.env.example`).
 */
export interface CloudflareEnv {
  ADMIN_PASSWORD?: string;
  CRON_SECRET?: string;
  RESEND_API_KEY?: string;
  NOTIFY_EMAIL?: string;
  SITE_URL?: string;
  TRONGRID_API_KEY?: string;
}

export type Env = NodeJS.ProcessEnv & CloudflareEnv;

// Explicit allow-list rather than enumerating the Worker `env` proxy, which
// is not reliably enumerable. Cloudflare values take precedence over
// process.env so dashboard secrets/vars win in production.
const CF_ENV_KEYS = [
  "ADMIN_PASSWORD",
  "CRON_SECRET",
  "RESEND_API_KEY",
  "NOTIFY_EMAIL",
  "SITE_URL",
  "TRONGRID_API_KEY",
] as const;

/**
 * Returns the effective environment for the current request.
 *
 * On Cloudflare Workers, vars/secrets configured in the dashboard are not
 * reliably exposed through `process.env` (they show up fine in `wrangler`
 * local dev / `next dev`). This reads them via the request's Cloudflare
 * context first and falls back to `process.env` for local development.
 *
 * Server-only — must never be imported by client code.
 */
export async function getEnv(): Promise<Env> {
  const env: Env = { ...process.env } as Env;

  try {
    const { env: cfEnv } = await getCloudflareContext({ async: true });
    const cf = cfEnv as unknown as CloudflareEnv;

    for (const key of CF_ENV_KEYS) {
      const value = cf[key];
      if (value !== undefined) {
        (env as Record<string, string | undefined>)[key] = value;
      }
    }
  } catch {
    // No Cloudflare request context (e.g. plain `next dev` without bindings).
    // process.env alone is used, matching prior local-dev behavior.
  }

  return env;
}
