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

/** How long a buyer has to send the exact fingerprinted amount. */
export const ORDER_EXPIRY_MS = 45 * 60 * 1000; // 45 minutes

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
 * Generates the exact amount a buyer must send, with a small random
 * fingerprint added so no two pending orders ever share the same amount —
 * this is what lets automatic on-chain matching work without an order ID
 * field on the transaction itself.
 */
export async function generatePayAmount(
  currency: CurrencyKey,
  basePriceUsd: number
): Promise<string> {
  if (currency === "USDT") {
    // USDT is ~1:1 with USD. Add a fingerprint in the 6th decimal place
    // (a millionth of a dollar) so it's invisible in the UI's rounded
    // display but still unique on-chain.
    const fingerprint = Math.floor(Math.random() * 9000) + 1000; // 0.001000–0.009999
    const amount = basePriceUsd + fingerprint / 1_000_000;
    return amount.toFixed(6);
  }

  // BTC: convert USD to BTC at the current rate, then add a satoshi-level
  // fingerprint.
  const btcUsdRate = await fetchBtcUsdRate();
  const baseBtc = basePriceUsd / btcUsdRate;
  const fingerprintSats = Math.floor(Math.random() * 9000) + 1000; // 1000–9999 sats
  const amountBtc = baseBtc + fingerprintSats / 1e8;
  return amountBtc.toFixed(8);
}

/** Converts a decimal-string amount into the integer smallest-unit form used on-chain. */
export function toSmallestUnit(amount: string, decimals: number): bigint {
  const [whole, frac = ""] = amount.split(".");
  const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFrac || "0");
}
