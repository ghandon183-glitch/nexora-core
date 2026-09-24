import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/lib/admin/auth";
import { getEnv } from "@/lib/env";

const PAYMEGATE_WEBHOOK_URL = "https://nexora-core.nxora.workers.dev/api/paymegate/webhook";
const PAYMEGATE_WEBHOOK_API = "https://api.paymegate.com/v1/webhook";

type ProviderResponse = {
  success?: boolean;
  data?: Record<string, unknown>;
  message?: string;
  error?: string;
  secret?: string;
  signingSecret?: string;
  webhookSecret?: string;
  url?: string;
};

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return isValidSessionToken(token);
}

function extractSecret(payload: ProviderResponse | null): string | null {
  if (!payload) return null;

  const candidates = [
    payload.secret,
    payload.signingSecret,
    payload.webhookSecret,
    typeof payload.data?.secret === "string" ? payload.data.secret : undefined,
    typeof payload.data?.signingSecret === "string" ? payload.data.signingSecret : undefined,
    typeof payload.data?.webhookSecret === "string" ? payload.data.webhookSecret : undefined,
  ];

  return candidates.find((value): value is string => Boolean(value)) ?? null;
}

function extractUrl(payload: ProviderResponse | null): string | null {
  if (!payload) return null;
  const candidates = [
    payload.url,
    typeof payload.data?.url === "string" ? payload.data.url : undefined,
    typeof payload.data?.webhookUrl === "string" ? payload.data.webhookUrl : undefined,
  ];
  return candidates.find((value): value is string => Boolean(value)) ?? null;
}

async function paymegateRequest(method: "GET" | "PUT", apiKey: string) {
  const response = await fetch(PAYMEGATE_WEBHOOK_API, {
    method,
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    ...(method === "PUT"
      ? {
          body: JSON.stringify({
            url: PAYMEGATE_WEBHOOK_URL,
          }),
        }
      : {}),
  });

  const payload = (await response.json().catch(() => null)) as ProviderResponse | null;
  return { response, payload };
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const env = await getEnv();
  if (!env.PAYMEGATE_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "PAYMEGATE_API_KEY is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const { response, payload } = await paymegateRequest("GET", env.PAYMEGATE_API_KEY);
    const secret = extractSecret(payload);
    const configuredUrl = extractUrl(payload);

    return NextResponse.json(
      {
        ok: response.ok,
        providerStatus: response.status,
        configuredUrl,
        expectedUrl: PAYMEGATE_WEBHOOK_URL,
        providerReturnedSecret: Boolean(secret),
        // Only expose the secret through an authenticated admin session.
        // It is never logged and never returned to public/browser client code.
        signingSecret: secret,
        localSecretConfigured: Boolean(env.PAYMEGATE_WEBHOOK_SECRET),
        message: payload?.message ?? payload?.error ?? null,
      },
      { status: response.ok ? 200 : 502, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[admin/paymegate/webhook] GET failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not query Paymegate webhook settings" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}

/**
 * Re-saves the merchant webhook URL through the authenticated Paymegate API.
 * Paymegate may return the one-time signing secret when the webhook is created
 * or regenerated. If it does, this endpoint exposes it only to an authenticated
 * NEXORA admin so it can be copied into Cloudflare as PAYMEGATE_WEBHOOK_SECRET.
 */
export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const env = await getEnv();
  if (!env.PAYMEGATE_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "PAYMEGATE_API_KEY is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const { response, payload } = await paymegateRequest("PUT", env.PAYMEGATE_API_KEY);
    const secret = extractSecret(payload);
    const configuredUrl = extractUrl(payload);

    return NextResponse.json(
      {
        ok: response.ok,
        providerStatus: response.status,
        configuredUrl,
        expectedUrl: PAYMEGATE_WEBHOOK_URL,
        providerReturnedSecret: Boolean(secret),
        signingSecret: secret,
        localSecretConfigured: Boolean(env.PAYMEGATE_WEBHOOK_SECRET),
        message: payload?.message ?? payload?.error ?? null,
      },
      { status: response.ok ? 200 : 502, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[admin/paymegate/webhook] PUT failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not update Paymegate webhook settings" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
