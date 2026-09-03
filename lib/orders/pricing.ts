import { randomInt } from "crypto";

export const WALLETS = {
  USDT: {
    label: "USDT",
    network: "TRC20 (Tron network)",
    address: "TTs2YMrifwWhiEPWVxhqqHd7v5DZNu477R",
    decimals: 6,
  },
  BTC: {
    label: "Bitcoin",
    network: "Bitcoin network",
    address: "bc1qky4uvdn0v9kyha9v9wns5893f62djd8ssa04u0",
    decimals: 8,
  },
} as const;

export type CurrencyKey = keyof typeof WALLETS;

/** How long a buyer has to send the exact quoted amount. */
export const ORDER_EXPIRY_MS = 45 * 60 * 1000;

/**
 * Customer-first crypto pricing policy.
 *
 * The site price remains the canonical USD price, but the on-chain amount is
 * deliberately below it so the buyer has room for wallet/network costs.
 * This is a merchant-funded crypto discount; direct wallet transfers do not
 * let us know the buyer's final wallet fee, so we must not pretend that a
 * particular fee amount is guaranteed.
 */
const MIN_CRYPTO_DISCOUNT_USD = 1.01;
const MAX_BTC_CRYPTO_DISCOUNT_USD = 2.0;

async function fetchBtcUsdRate(): Promise<number> {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    { cf: { cacheTtl: 30 } } as RequestInit
  );

  if (!response.ok) {
    throw new Error(`CoinGecko price fetch failed: ${response.status}`);
  }

  const data = (await response.json()) as { bitcoin?: { usd?: number } };
  const rate = data.bitcoin?.usd;

  if (!rate || rate <= 0) {
    throw new Error("CoinGecko returned an invalid BTC/USD rate");
  }

  return rate;
}

/**
 * Generates a customer-friendly exact amount.
 *
 * USDT: quote is between $1.001 and $1.009 below the catalogue price.
 * BTC: quote is between $1.01 and $2.00 below the catalogue price.
 *
 * The random fingerprint is kept inside that discount window, so the exact
 * crypto amount can never exceed the advertised USD price. The order creator
 * retries if a rare active-order amount collision is detected.
 */
export async function generatePayAmount(
  currency: CurrencyKey,
  basePriceUsd: number
): Promise<string> {
  if (basePriceUsd <= MIN_CRYPTO_DISCOUNT_USD) {
    throw new Error("Template price is too low for the crypto fee-credit policy");
  }

  if (currency === "USDT") {
    // Keep a little over $1 of room for wallet/network costs while using the
    // six USDT decimals for an order fingerprint.
    const fingerprintMicros = randomInt(1_000, 10_000); // $0.001000–$0.009999
    const amount = basePriceUsd - MIN_CRYPTO_DISCOUNT_USD + fingerprintMicros / 1_000_000;
    return amount.toFixed(6);
  }

  const btcUsdRate = await fetchBtcUsdRate();
  const minPayUsd = basePriceUsd - MAX_BTC_CRYPTO_DISCOUNT_USD;
  const maxPayUsd = basePriceUsd - MIN_CRYPTO_DISCOUNT_USD;

  // Pick a satoshi offset whose USD value is always inside the discount
  // window. This keeps the quoted BTC amount below the advertised price even
  // when BTC moves substantially.
  const windowUsd = maxPayUsd - minPayUsd;
  const maxFingerprintSats = Math.max(1, Math.floor((windowUsd * 1e8) / btcUsdRate));
  const fingerprintSats = randomInt(1, maxFingerprintSats + 1);
  const amountBtc = minPayUsd / btcUsdRate + fingerprintSats / 1e8;

  if (amountBtc <= 0) {
    throw new Error("Calculated BTC payment amount is invalid");
  }

  return amountBtc.toFixed(8);
}

/** Converts a decimal-string amount into the integer smallest-unit form used on-chain. */
export function toSmallestUnit(amount: string, decimals: number): bigint {
  const [whole, frac = ""] = amount.split(".");
  const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFrac || "0");
}
