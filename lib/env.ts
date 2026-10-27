import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * The subset of runtime configuration read by server code. These are the
 * Cloudflare Worker vars/secrets the application actually consumes.
 */
export interface CloudflareEnv {
  ADMIN_PASSWORD?: string;
  CRON_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  NOTIFY_EMAIL?: string;
  SITE_URL?: string;
  GOOGLE_SITE_VERIFICATION?: string;
  BING_SITE_VERIFICATION?: string;
  GA_MEASUREMENT_ID?: string;
  TRONGRID_API_KEY?: string;
  GMAIL_USER?: string;
  GMAIL_CLIENT_ID?: string;
  GMAIL_CLIENT_SECRET?: string;
  GMAIL_REFRESH_TOKEN?: string;
  GMAIL_APP_PASSWORD?: string;
  PAYMEGATE_API_KEY?: string;
  PAYMEGATE_WEBHOOK_SECRET?: string;
}

export type Env = NodeJS.ProcessEnv & CloudflareEnv;

const CF_ENV_KEYS = [
  "ADMIN_PASSWORD",
  "CRON_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "NOTIFY_EMAIL",
  "SITE_URL",
  "GOOGLE_SITE_VERIFICATION",
  "BING_SITE_VERIFICATION",
  "GA_MEASUREMENT_ID",
  "TRONGRID_API_KEY",
  "GMAIL_USER",
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET",
  "GMAIL_REFRESH_TOKEN",
  "GMAIL_APP_PASSWORD",
  "PAYMEGATE_API_KEY",
  "PAYMEGATE_WEBHOOK_SECRET",
] as const;

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
    // No Cloudflare request context (e.g. plain next dev).
  }

  return env;
}
