import { getEnv } from "@/lib/env";

export type PaymegateOrderStatus = {
  status: string | null;
  transactionUuid: string;
  transactionRef: string;
  raw: Record<string, unknown> | null;
};

export async function getPaymegateOrderStatus(
  orderUuid: string
): Promise<PaymegateOrderStatus> {
  const env = await getEnv();
  if (!env.PAYMEGATE_API_KEY) {
    throw new Error("PAYMEGATE_API_KEY is not configured");
  }

  const response = await fetch(
    `https://api.paymegate.com/v1/orders/${encodeURIComponent(orderUuid)}`,
    {
      method: "GET",
      headers: {
        "X-API-Key": env.PAYMEGATE_API_KEY,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | { data?: Record<string, unknown>; status?: string; error?: string; message?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        `Paymegate order lookup failed with HTTP ${response.status}`
    );
  }

  const data = (payload?.data ?? payload ?? {}) as Record<string, unknown>;
  const transaction = typeof data.transaction === "object" && data.transaction
    ? (data.transaction as Record<string, unknown>)
    : null;

  return {
    status: typeof data.status === "string" ? data.status.toUpperCase() : null,
    transactionUuid:
      typeof data.transactionUUID === "string"
        ? data.transactionUUID
        : typeof transaction?.uuid === "string"
          ? transaction.uuid
          : "",
    transactionRef:
      typeof data.transactionRef === "string"
        ? data.transactionRef
        : typeof transaction?.ref === "string"
          ? transaction.ref
          : "",
    raw: data,
  };
}
