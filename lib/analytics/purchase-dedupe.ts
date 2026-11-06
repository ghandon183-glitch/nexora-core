export interface PurchaseEventStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const PURCHASE_EVENT_PREFIX = "nexora:ga4:purchase:";

/**
 * Prevent a confirmed order from emitting GA4 purchase more than once in the
 * same browser session, including when the buyer reloads or revisits checkout.
 * GA4 transaction_id remains the server-independent deduplication key too.
 */
export function shouldTrackPurchase(
  orderId: string,
  storage?: PurchaseEventStorage,
): boolean {
  const normalizedId = orderId.trim();
  if (!normalizedId) return false;

  const key = `${PURCHASE_EVENT_PREFIX}${normalizedId}`;

  try {
    const resolvedStorage =
      storage ?? (typeof window !== "undefined" ? window.sessionStorage : undefined);
    if (!resolvedStorage) return true;
    if (resolvedStorage.getItem(key) === "1") return false;
    resolvedStorage.setItem(key, "1");
    return true;
  } catch {
    // Storage may be blocked by browser privacy settings. The component-level
    // ref still prevents duplicate events during the current mount.
    return true;
  }
}
