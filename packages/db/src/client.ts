import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Set it in the environment before using @corral/db.");
}

/**
 * Singleton postgres connection. `max: 1` keeps the scaffold connection footprint
 * small; tune per-service once domain workloads exist.
 */
export const queryClient = postgres(databaseUrl, { max: 10 });

export const db = drizzle(queryClient, { schema });

export type Database = typeof db;

/**
 * Liveness check used by the api `/health` route. Runs `SELECT 1` and returns
 * whether the database responded. Never throws — failures resolve to `false`.
 */
export async function checkDbHealth(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}
