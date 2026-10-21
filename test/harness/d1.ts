import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

/**
 * A small D1-compatible shim over node:sqlite. It implements exactly the
 * surface `lib/orders/db.ts` uses (`prepare/bind/first/all/run` and `batch`)
 * so the production SQL — partial indexes, ON CONFLICT, CASE expressions —
 * is exercised as written instead of being re-implemented in the tests.
 */

type BindValue = string | number | null;

export interface D1Meta {
  changes: number;
  last_row_id: number;
}

interface RawResult {
  changes: number | bigint;
  lastInsertRowid: number | bigint;
}

class SqliteStatement {
  private readonly database: DatabaseSync;
  private readonly sql: string;
  private params: BindValue[] = [];

  constructor(database: DatabaseSync, sql: string) {
    this.database = database;
    this.sql = sql;
  }

  bind(...params: BindValue[]): this {
    this.params = params;
    return this;
  }

  execute(): RawResult {
    return this.database.prepare(this.sql).run(...this.params);
  }

  async first<T>(): Promise<T | null> {
    const row = this.database.prepare(this.sql).get(...this.params);
    return (row as T | undefined) ?? null;
  }

  async all<T>(): Promise<{ results: T[]; success: true }> {
    const rows = this.database.prepare(this.sql).all(...this.params) as T[];
    return { results: rows, success: true };
  }

  async run(): Promise<{ success: true; meta: D1Meta }> {
    const result = this.execute();
    return {
      success: true,
      meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) },
    };
  }
}

export class TestD1 {
  readonly database: DatabaseSync;

  constructor(database: DatabaseSync = new DatabaseSync(":memory:")) {
    this.database = database;
  }

  prepare(sql: string): SqliteStatement {
    return new SqliteStatement(this.database, sql);
  }

  async batch(statements: SqliteStatement[]): Promise<Array<{ success: true; meta: D1Meta }>> {
    const results: Array<{ success: true; meta: D1Meta }> = [];
    this.database.exec("BEGIN");
    try {
      for (const statement of statements) {
        const result = statement.execute();
        results.push({
          success: true,
          meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) },
        });
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return results;
  }

  async exec(sql: string): Promise<void> {
    this.database.exec(sql);
  }

  close(): void {
    this.database.close();
  }
}

const MIGRATIONS_DIRECTORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../migrations"
);

/** Applies every committed migration in filename order. */
export function createMigratedDatabase(): TestD1 {
  const db = new TestD1();
  const files = fs
    .readdirSync(MIGRATIONS_DIRECTORY)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    db.database.exec(fs.readFileSync(path.join(MIGRATIONS_DIRECTORY, file), "utf8"));
  }

  return db;
}
