import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { describe, test } from "node:test";

/**
 * Exercises the pending-quote migration against realistic pre-existing data.
 * The production D1 database already contains rows when a migration runs, so a
 * migration must never drop or rewrite an order, and must not leave the table
 * unprotected when it cannot be applied.
 */
const MIGRATIONS_DIRECTORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../migrations"
);

const ALL_MIGRATIONS = fs
  .readdirSync(MIGRATIONS_DIRECTORY)
  .filter((file) => file.endsWith(".sql"))
  .sort();

const SCOPE_MIGRATION = "0007_scope_pending_payment_quote_to_crypto.sql";

function applyMigrations(db: DatabaseSync, files: string[]): void {
  for (const file of files) {
    db.exec(fs.readFileSync(path.join(MIGRATIONS_DIRECTORY, file), "utf8"));
  }
}

interface OrderRow {
  id: string;
  payment_provider: "crypto" | "paymegate";
  currency: "USDT" | "BTC";
  pay_amount: string;
  status: "pending" | "confirmed" | "expired" | "review";
  tx_hash?: string | null;
  download_token?: string | null;
  buyer_email?: string;
  paymegate_order_uuid?: string | null;
}

function insertOrder(db: DatabaseSync, order: OrderRow): void {
  db.prepare(
    `INSERT INTO orders (
       id, template_slug, template_title, base_price_usd, currency,
       wallet_address, pay_amount, buyer_name, buyer_email, status,
       tx_hash, download_token, created_at, expires_at, confirmed_at,
       payment_provider, paymegate_order_uuid
     ) VALUES (?, 'modern-saas', 'Modern SaaS', 49, ?, '', ?, 'Buyer', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    order.id,
    order.currency,
    order.pay_amount,
    order.buyer_email ?? "buyer@example.com",
    order.status,
    order.tx_hash ?? null,
    order.download_token ?? null,
    1_700_000_000_000,
    1_700_003_600_000,
    order.status === "confirmed" ? 1_700_000_100_000 : null,
    order.payment_provider,
    order.paymegate_order_uuid ?? null
  );
}

function indexNames(db: DatabaseSync): string[] {
  return (
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'orders'")
      .all() as { name: string }[]
  ).map((row) => row.name);
}

function rows(db: DatabaseSync): Record<string, unknown>[] {
  return db
    .prepare("SELECT id, status, tx_hash, download_token, pay_amount, payment_provider FROM orders ORDER BY id")
    .all() as Record<string, unknown>[];
}

function legacyDatabaseWithoutScopeMigration(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  applyMigrations(
    db,
    ALL_MIGRATIONS.filter((file) => file !== SCOPE_MIGRATION)
  );
  return db;
}

describe("pending quote migration", () => {
  test("scopes the unique amount fingerprint to crypto orders without touching existing orders", () => {
    const db = legacyDatabaseWithoutScopeMigration();

    assert.ok(indexNames(db).includes("idx_orders_pending_currency_pay_amount"));

    // Representative production data: an active crypto quote, an active card
    // checkout that already stored the catalogue price, and a delivered order.
    insertOrder(db, {
      id: "pending-crypto",
      payment_provider: "crypto",
      currency: "USDT",
      pay_amount: "47.990123",
      status: "pending",
    });
    insertOrder(db, {
      id: "pending-card",
      payment_provider: "paymegate",
      currency: "USDT",
      pay_amount: "49.00",
      status: "pending",
      paymegate_order_uuid: "11111111-1111-4111-8111-111111111111",
    });
    insertOrder(db, {
      id: "delivered",
      payment_provider: "crypto",
      currency: "BTC",
      pay_amount: "0.00048123",
      status: "confirmed",
      tx_hash: "tx-delivered",
      download_token: "22222222-2222-4222-8222-222222222222",
    });

    const before = rows(db);

    applyMigrations(db, [SCOPE_MIGRATION]);

    // No order is deleted, rewritten, or stripped of its entitlement.
    assert.deepEqual(rows(db), before);

    const indexes = indexNames(db);
    assert.ok(indexes.includes("idx_orders_pending_crypto_pay_amount"));
    assert.equal(indexes.includes("idx_orders_pending_currency_pay_amount"), false);

    const scopedIndex = db
      .prepare("SELECT sql FROM sqlite_master WHERE type = 'index' AND name = ?")
      .get("idx_orders_pending_crypto_pay_amount") as { sql: string } | undefined;

    assert.ok(scopedIndex);
    assert.match(scopedIndex.sql, /payment_provider = 'crypto'/);
    assert.match(scopedIndex.sql, /status = 'pending'/);
  });

  test("allows independent pending card checkouts for the same template price", () => {
    const db = new DatabaseSync(":memory:");
    applyMigrations(db, ALL_MIGRATIONS);

    for (const id of ["card-a", "card-b", "card-c"]) {
      insertOrder(db, {
        id,
        payment_provider: "paymegate",
        currency: "USDT",
        pay_amount: "49.00",
        status: "pending",
        paymegate_order_uuid: `${id}-uuid`,
      });
    }

    assert.equal(rows(db).filter((row) => row.status === "pending").length, 3);
  });

  test("still refuses two pending crypto quotes with the same currency and amount", () => {
    const db = new DatabaseSync(":memory:");
    applyMigrations(db, ALL_MIGRATIONS);

    insertOrder(db, {
      id: "crypto-a",
      payment_provider: "crypto",
      currency: "USDT",
      pay_amount: "47.990123",
      status: "pending",
    });

    assert.throws(
      () =>
        insertOrder(db, {
          id: "crypto-b",
          payment_provider: "crypto",
          currency: "USDT",
          pay_amount: "47.990123",
          status: "pending",
        }),
      /UNIQUE constraint failed/
    );
  });

  test("does not constrain delivered orders that reused the same amount", () => {
    const db = new DatabaseSync(":memory:");
    applyMigrations(db, ALL_MIGRATIONS);

    insertOrder(db, {
      id: "delivered-old",
      payment_provider: "crypto",
      currency: "USDT",
      pay_amount: "47.990123",
      status: "confirmed",
      tx_hash: "tx-old",
      download_token: "33333333-3333-4333-8333-333333333333",
    });
    insertOrder(db, {
      id: "pending-new",
      payment_provider: "crypto",
      currency: "USDT",
      pay_amount: "47.990123",
      status: "pending",
    });

    assert.equal(rows(db).length, 2);
  });

  test("is re-runnable without duplicating the index", () => {
    const db = new DatabaseSync(":memory:");
    applyMigrations(db, ALL_MIGRATIONS);
    applyMigrations(db, [SCOPE_MIGRATION]);

    const matching = indexNames(db).filter(
      (name) => name === "idx_orders_pending_crypto_pay_amount"
    );
    assert.equal(matching.length, 1);
  });

  test("fails safely, leaving data intact, when a legacy database has duplicate pending crypto quotes", () => {
    // Simulates an environment where 0003 never ran: two active crypto orders
    // were allowed to share one amount before the unique index existed.
    const db = new DatabaseSync(":memory:");
    applyMigrations(
      db,
      ALL_MIGRATIONS.filter(
        (file) =>
          file !== SCOPE_MIGRATION && !file.startsWith("0003_unique_pending_payment_quotes")
      )
    );

    insertOrder(db, {
      id: "crypto-duplicate-a",
      payment_provider: "crypto",
      currency: "USDT",
      pay_amount: "47.990123",
      status: "pending",
    });
    insertOrder(db, {
      id: "crypto-duplicate-b",
      payment_provider: "crypto",
      currency: "USDT",
      pay_amount: "47.990123",
      status: "pending",
    });

    const before = rows(db);

    // The scoped index is created before the old index is dropped, so a failed
    // migration cannot leave the table with no quote constraint at all.
    assert.throws(() => applyMigrations(db, [SCOPE_MIGRATION]), /UNIQUE constraint failed/);

    assert.deepEqual(rows(db), before);
    assert.equal(indexNames(db).includes("idx_orders_pending_crypto_pay_amount"), false);
  });
});
