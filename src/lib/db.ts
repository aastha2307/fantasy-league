import cuid from "cuid";
import { Pool, type PoolClient } from "pg";

export type Queryable = Pool | PoolClient;

// Lazily initialized — supports both local pg (DATABASE_URL) and
// Cloud Run + Cloud SQL connector (CLOUD_SQL_INSTANCE env var).
let _poolPromise: Promise<Pool> | null = null;

async function createPool(): Promise<Pool> {
  const instanceConnectionName = process.env.CLOUD_SQL_INSTANCE?.trim();

  if (instanceConnectionName) {
    // Cloud Run / Firebase App Hosting: connect via Cloud SQL connector.
    // No socket mount required; uses IAM + TLS tunnel automatically.
    const { Connector } = await import("@google-cloud/cloud-sql-connector");
    const connector = new Connector();
    const clientOpts = await connector.getOptions({ instanceConnectionName });
    return new Pool({
      ...clientOpts,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "ipl-fantasy-league-71959-database",
      max: 15,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 20_000,
    });
  }

  // Local development: standard DATABASE_URL (localhost Postgres).
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 15,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 20_000,
  });
}

function getPool(): Promise<Pool> {
  if (!_poolPromise) {
    _poolPromise = createPool();
  }
  return _poolPromise;
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = await getPool();
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
  const pool = await getPool();
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

