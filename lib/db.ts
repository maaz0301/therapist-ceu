import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

/**
 * Drizzle client over a direct Postgres connection (Supabase).
 * This connection runs with elevated privileges and BYPASSES RLS — only use
 * it from server code that has already verified the caller's permissions.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL environment variable.");
}

// Keep the per-instance pool small: serverless functions and build workers
// each open their own pool, and Supabase caps total connections. Use the
// connection pooler (port 6543) in production for best results.
const client = postgres(connectionString, {
  prepare: false,
  max: 3,
  idle_timeout: 20,
});

export const db = drizzle(client, { schema });
