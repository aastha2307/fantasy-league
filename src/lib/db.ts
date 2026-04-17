import cuid from "cuid";
import { Pool, type PoolClient } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 15,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

export type Queryable = Pool | PoolClient;

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const r = await pool.query(text, params);
  return r.rows as T[];
}

export async function queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function queryWith<T extends Record<string, unknown> = Record<string, unknown>>(
  client: Queryable,
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const r = await client.query(text, params);
  return r.rows as T[];
}

export async function queryOneWith<T extends Record<string, unknown> = Record<string, unknown>>(
  client: Queryable,
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await queryWith<T>(client, text, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export function newId(): string {
  return cuid();
}

export function isPgUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "23505";
}

export { pool };
