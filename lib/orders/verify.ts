import { toSmallestUnit, WALLETS } from "./pricing";
import type { Order } from "./db";
import { getEnv } from "@/lib/env";

// Official USDT (Tether) TRC20 contract address on Tron mainnet.
const USDT_TRC20_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

export interface MatchResult {
  matched: boolean;
  txHash?: string;
}

interface TronGridTrc20Transfer {
  transaction_id: string;
  token_info: { address: string };
  to: string;
  value: string; // integer string, smallest unit (6 decimals for USDT)
  block_timestamp?: number; // milliseconds since epoch
}

/**
 * Returns true when the transaction should be accepted, i.e. it occurred at
 * or after the order was created. A missing timestamp fails open (accepted)
 * so we never block a legitimate payment when the API omits the field.
 */
function isOnOrAfterOrder(txTimestampMs: number | undefined, order: Order): boolean {
  if (txTimestampMs === undefined || Number.isNaN(txTimestampMs)) return true;
  return txTimestampMs >= order.created_at;
}

/**
 * Checks TronGrid for a confirmed incoming USDT (TRC20) transfer matching
 * this order's exact fingerprinted amount.
 */
export async function checkUsdtPayment(order: Order): Promise<MatchResult> {
  const wanted = toSmallestUnit(order.pay_amount, WALLETS.USDT.decimals);

  const url = `https://api.trongrid.io/v1/accounts/${order.wallet_address}/transactions/trc20?limit=50&only_to=true&contract_address=${USDT_TRC20_CONTRACT}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  const { TRONGRID_API_KEY: tronApiKey } = await getEnv();
  if (tronApiKey) {
    headers["TRON-PRO-API-KEY"] = tronApiKey;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`TronGrid request failed: ${response.status}`);
  }

  const data = (await response.json()) as { data?: TronGridTrc20Transfer[] };
  const transfers = data.data ?? [];

  for (const transfer of transfers) {
    if (transfer.token_info?.address !== USDT_TRC20_CONTRACT) continue;
    if (transfer.to !== order.wallet_address) continue;
    // Reject transactions that predate this order — an old transfer that
    // happens to share the same fingerprinted amount cannot be replayed to
    // unlock a later order. Fail open only if the timestamp is absent.
    if (!isOnOrAfterOrder(transfer.block_timestamp, order)) continue;

    if (BigInt(transfer.value) === wanted) {
      return { matched: true, txHash: transfer.transaction_id };
    }
  }

  return { matched: false };
}

interface MempoolTx {
  txid: string;
  vout: { scriptpubkey_address?: string; value: number }[];
  status: { confirmed: boolean; block_time?: number }; // block_time in seconds
}

/**
 * Checks mempool.space for a confirmed incoming BTC transaction matching
 * this order's exact fingerprinted amount (in satoshis).
 */
export async function checkBtcPayment(order: Order): Promise<MatchResult> {
  const wantedSats = toSmallestUnit(order.pay_amount, WALLETS.BTC.decimals);

  const url = `https://mempool.space/api/address/${order.wallet_address}/txs`;

  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error(`mempool.space request failed: ${response.status}`);
  }

  const txs = (await response.json()) as MempoolTx[];

  for (const tx of txs) {
    if (!tx.status.confirmed) continue;
    // Reject transactions that predate this order. block_time is in seconds;
    // convert to ms for comparison. Fail open if the timestamp is absent.
    const blockTimeMs = tx.status.block_time
      ? tx.status.block_time * 1000
      : undefined;
    if (!isOnOrAfterOrder(blockTimeMs, order)) continue;

    for (const output of tx.vout) {
      if (output.scriptpubkey_address !== order.wallet_address) continue;

      if (BigInt(output.value) === wantedSats) {
        return { matched: true, txHash: tx.txid };
      }
    }
  }

  return { matched: false };
}

export async function checkPayment(order: Order): Promise<MatchResult> {
  if (order.currency === "USDT") {
    return checkUsdtPayment(order);
  }
  return checkBtcPayment(order);
}
