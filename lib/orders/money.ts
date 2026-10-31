/**
 * Money comparison shared by the signed Paymegate webhook and the API
 * reconciliation cron. Both paths must accept exactly the same paid orders:
 * a provider that reports `49.0` instead of `49.00` is still a $49.00 payment,
 * while `49.004` is not evidence for a $49.00 order.
 */
export function sameUsdAmount(
  actual: string | null | undefined,
  expectedUsd: number
): boolean {
  // USD checkout amounts have cent precision. Do not accept values such as
  // "79.004" merely because floating-point rounding makes them display as 79.00.
  if (typeof actual !== "string" || !/^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.test(actual)) {
    return false;
  }

  const [whole, fraction = ""] = actual.split(".");
  const actualCents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  const expectedCents = Math.round(expectedUsd * 100);

  return (
    Number.isSafeInteger(actualCents) &&
    Number.isSafeInteger(expectedCents) &&
    actualCents === expectedCents
  );
}

/**
 * Paymegate does not always echo the customer email back on the order lookup
 * endpoint. The webhook has always treated a missing email as "not evidence
 * against the order" and a present-but-different email as a mismatch; the
 * polling fallback must apply the same rule, otherwise a paid order whose
 * provider response omits the field is never fulfilled.
 *
 * Callers must already have bound the provider order to the local order by
 * provider UUID/external id and amount before relying on this helper.
 */
export function customerEmailMatches(
  providerEmail: string | null | undefined,
  orderEmail: string
): boolean {
  if (!providerEmail) return true;
  return providerEmail.trim().toLowerCase() === orderEmail.trim().toLowerCase();
}
