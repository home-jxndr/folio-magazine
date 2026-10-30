import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SCHEMA } from "./schema";
import { seedDatabase } from "./seed";
import type { D1DatabaseLike, D1Result, D1Stmt } from "./d1";

export type { D1DatabaseLike };

/**
 * Local SQLite data layer built on Node's built-in `node:sqlite` module.
 *
 * It exposes the same surface the Cloudflare D1 binding did — prepare/bind,
 * first/all/run and batch — so lib/queries.ts, lib/schema.ts and lib/seed.ts
 * run unchanged against a database file on disk. Requires Node 22.5+ (built-in
 * SQLite); set FOLIO_DB_PATH to move the file, which defaults to .data/folio.db.
 */

type SqlValue = string | number | bigint | null | Uint8Array;

const DB_PATH = process.env.FOLIO_DB_PATH?.trim() || ".data/folio.db";

/** Normalise a JS value to something node:sqlite accepts as a bound parameter. */
function toParam(value: unknown): SqlValue {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") return value;
  if (value instanceof Uint8Array) return value;
  if (value instanceof Date) return value.toISOString().slice(0, 19).replace("T", " ");
  return String(value);
}

/** node:sqlite returns null-prototype rows; copy them to plain objects. */
function plain<T>(row: unknown): T {
  return { ...(row as Record<string, unknown>) } as T;
}

class SqliteStatement implements D1Stmt {
  constructor(
    private readonly db: DatabaseSync,
    private readonly sql: string,
    private readonly params: SqlValue[] = [],
  ) {}

  bind(...values: unknown[]): D1Stmt {
    return new SqliteStatement(this.db, this.sql, values.map(toParam));
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...this.params);
    return row === undefined ? null : plain<T>(row);
  }

  async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    const rows = this.db.prepare(this.sql).all(...this.params);
    return { results: rows.map((row) => plain<T>(row)), success: true, meta: { rows: rows.length } };
  }

  async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    const info = this.db.prepare(this.sql).run(...this.params);
    return {
      results: [] as T[],
      success: true,
      meta: { changes: Number(info.changes), last_row_id: Number(info.lastInsertRowid) },
    };
  }
}

class SqliteDatabase implements D1DatabaseLike {
  constructor(readonly raw: DatabaseSync) {}

  prepare(query: string): D1Stmt {
    return new SqliteStatement(this.raw, query);
  }

  async batch<T = Record<string, unknown>>(statements: D1Stmt[]): Promise<D1Result<T>[]> {
    const results: D1Result<T>[] = [];
    this.raw.exec("BEGIN");
    try {
      for (const statement of statements) results.push(await statement.run<T>());
      this.raw.exec("COMMIT");
    } catch (error) {
      this.raw.exec("ROLLBACK");
      throw error;
    }
    return results;
  }

  async exec(query: string): Promise<unknown> {
    this.raw.exec(query);
    return { success: true };
  }
}

async function bootstrap(): Promise<D1DatabaseLike> {
  const file = resolve(process.cwd(), DB_PATH);
  mkdirSync(dirname(file), { recursive: true });

  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 5000");

  // Schema is idempotent (every statement is CREATE ... IF NOT EXISTS).
  db.exec(SCHEMA);

  const adapter = new SqliteDatabase(db);
  const row = await adapter.prepare("SELECT COUNT(*) AS n FROM users").first<{ n: number }>();
  if (!row || Number(row.n) === 0) {
    await seedDatabase(adapter);
  }
  return adapter;
}

// Cached on globalThis so Next's dev server does not open a new handle per reload.
const globalForDb = globalThis as typeof globalThis & { __folioDb?: Promise<D1DatabaseLike> };

export function getDb(): Promise<D1DatabaseLike> {
  if (!globalForDb.__folioDb) {
    globalForDb.__folioDb = bootstrap().catch((error) => {
      globalForDb.__folioDb = undefined;
      throw error;
    });
  }
  return globalForDb.__folioDb;
}

export async function all<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T[]> {
  const db = await getDb();
  const result = await db.prepare(sql).bind(...params).all<T>();
  return result.results;
}

export async function one<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T | null> {
  const db = await getDb();
  return db.prepare(sql).bind(...params).first<T>();
}

export async function run(sql: string, ...params: unknown[]): Promise<void> {
  const db = await getDb();
  await db.prepare(sql).bind(...params).run();
}
