interface CronEnvironment {
  SITE_URL: string;
  CRON_SECRET: string;
}

interface ScheduledControllerLike {
  cron: string;
  scheduledTime: number;
}

interface PaymentCheckPayload {
  ok?: boolean;
  checked?: number;
  confirmed?: number;
  expired?: number;
  review?: number;
  emailsRetried?: number;
  errors?: unknown[];
  paymegateErrors?: unknown[];
  emailOutbox?: { failed?: number };
}

async function runPaymentCheck(
  controller: ScheduledControllerLike,
  env: CronEnvironment,
): Promise<void> {
  if (!env.SITE_URL || !env.CRON_SECRET) {
    throw new Error("Payment reconciliation cron is missing required configuration");
  }

  const endpoint = new URL("/api/cron/check-payments", env.SITE_URL).toString();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      "x-cron-secret": env.CRON_SECRET,
    },
    signal: AbortSignal.timeout(55_000),
  });

  if (!response.ok) {
    throw new Error(`Payment reconciliation endpoint returned HTTP ${response.status}`);
  }

  let payload: PaymentCheckPayload;
  try {
    payload = (await response.json()) as PaymentCheckPayload;
  } catch {
    throw new Error("Payment reconciliation endpoint returned invalid JSON");
  }

  const failures: string[] = [];
  if (payload.ok !== true) failures.push("endpoint did not report ok=true");
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    failures.push(`${payload.errors.length} order-processing error(s)`);
  }
  if (Array.isArray(payload.paymegateErrors) && payload.paymegateErrors.length > 0) {
    failures.push(`${payload.paymegateErrors.length} PayMeGate reconciliation error(s)`);
  }
  if (Number(payload.emailOutbox?.failed ?? 0) > 0) {
    failures.push(`${payload.emailOutbox?.failed} email outbox delivery failure(s)`);
  }

  const summary = {
    cron: controller.cron,
    scheduledTime: new Date(controller.scheduledTime).toISOString(),
    ok: failures.length === 0,
    checked: payload.checked ?? null,
    confirmed: payload.confirmed ?? null,
    expired: payload.expired ?? null,
    review: payload.review ?? null,
    emailsRetried: payload.emailsRetried ?? null,
    failures,
  };

  if (failures.length > 0) {
    console.error(JSON.stringify(summary));
    // Do not log raw provider errors, order IDs, buyer emails, or the shared secret.
    throw new Error("Payment reconciliation reported processing errors");
  }

  console.log(JSON.stringify(summary));
}

export default {
  async fetch(): Promise<Response> {
    return new Response("Not found", {
      status: 404,
      headers: { "cache-control": "no-store" },
    });
  },

  async scheduled(
    controller: ScheduledControllerLike,
    env: CronEnvironment,
  ): Promise<void> {
    await runPaymentCheck(controller, env);
  },
};
