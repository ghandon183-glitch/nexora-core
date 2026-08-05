import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface EmailVerification {
  id: string;
  email: string;
  code: string;
  attempts: number;
  verified: number; // D1 has no boolean type — 0/1
  used: number;
  created_at: number;
  expires_at: number;
}

/**
 * Reuses the same ORDERS_DB binding as lib/orders/db.ts — this is one
 * database with multiple tables, not a second D1 instance to provision.
 */
async function getDb() {
  const { env } = await getCloudflareContext({ async: true });

  const db = (env as unknown as { ORDERS_DB?: D1Database }).ORDERS_DB;

  if (!db) {
    throw new Error(
      "ORDERS_DB binding is not available. This only works when deployed " +
        "to Cloudflare Workers (or via `wrangler dev`/`opennextjs-cloudflare preview`), " +
        "not plain `next dev`."
    );
  }

  return db;
}

export async function insertVerification(
  v: Pick<EmailVerification, "id" | "email" | "code" | "created_at" | "expires_at">
): Promise<void> {
  const db = await getDb();

  await db
    .prepare(
      `INSERT INTO email_verifications (id, email, code, attempts, verified, used, created_at, expires_at)
       VALUES (?, ?, ?, 0, 0, 0, ?, ?)`
    )
    .bind(v.id, v.email.trim().toLowerCase(), v.code, v.created_at, v.expires_at)
    .run();
}

export async function getVerificationById(id: string): Promise<EmailVerification | null> {
  const db = await getDb();

  const result = await db
    .prepare("SELECT * FROM email_verifications WHERE id = ?")
    .bind(id)
    .first<EmailVerification>();

  return result ?? null;
}

export async function incrementAttempts(id: string): Promise<void> {
  const db = await getDb();

  await db
    .prepare("UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?")
    .bind(id)
    .run();
}

export async function markVerified(id: string): Promise<void> {
  const db = await getDb();

  await db
    .prepare("UPDATE email_verifications SET verified = 1 WHERE id = ?")
    .bind(id)
    .run();
}

/** Consumes a verification so the same code+id can't be replayed onto a second order. */
export async function markUsed(id: string): Promise<void> {
  const db = await getDb();

  await db
    .prepare("UPDATE email_verifications SET used = 1 WHERE id = ?")
    .bind(id)
    .run();
}
