import { getEnv } from "@/lib/env";

export type PaymegateOrderStatus = {
  status: string | null;
  amount: string | null;
  currency: string | null;
  customerEmail: string | null;
  externalId: string | null;
  transactionUuid: string;
  transactionRef: string;
  raw: Record<string, unknown> | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

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
  const order = asRecord(data.order) ?? data;
  const transaction = asRecord(order.transaction);

  return {
    status: typeof order.status === "string" ? order.status.toUpperCase() : null,
    amount: typeof order.amount === "string" ? order.amount : null,
    currency: typeof order.currency === "string" ? order.currency.toUpperCase() : null,
    customerEmail:
      typeof order.customerEmail === "string"
        ? order.customerEmail.toLowerCase()
        : typeof asRecord(order.customer)?.email === "string"
          ? String(asRecord(order.customer)?.email).toLowerCase()
          : null,
    externalId: typeof order.externalId === "string" ? order.externalId : null,
    transactionUuid:
      typeof order.transactionUUID === "string"
        ? order.transactionUUID
        : typeof transaction?.uuid === "string"
          ? transaction.uuid
          : "",
    transactionRef:
      typeof order.transactionRef === "string"
        ? order.transactionRef
        : typeof transaction?.ref === "string"
          ? transaction.ref
          : "",
    raw: order,
  };
}
