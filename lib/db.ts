import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

/**
 * Drizzle client over a direct Postgres connection (Supabase).
 * This connection runs with elevated privileges and BYPASSES RLS — only use
 * it from server code that has already verified the caller's permissions.
 */
const connectionString = process.env.DATABASE_URL?.replace(/^["']|["']$/g, "").trim();

if (!connectionString) {
  throw new Error("Missing DATABASE_URL environment variable.");
}

// Keep the per-instance pool small: serverless functions and build workers
// each open their own pool, and Supabase caps total connections. Use the
// connection pooler (port 6543) in production for best results.
const client = postgres(connectionString, {
  prepare: false,
  /**
   * A page render now fans several independent queries out at once, and the
   * sidebar prefetches the other tabs alongside it, so a pool of 3 became the
   * new bottleneck — queries queued behind each other instead of overlapping.
   * These are transaction-mode pooler connections, which are cheap and are not
   * held between statements.
   */
  max: 8,
  /**
   * Opening a connection to the pooler costs ~1.3s (TLS + auth, and the
   * database is in ap-southeast-2); a warm query costs ~210ms. At the previous
   * 20s the pool went cold between page views, so anyone reading a screen for
   * half a minute paid the full handshake again on their next click — a tab
   * switch measured 1.3s instead of 0.2s. Five minutes spans a normal browsing
   * session, so only genuinely idle instances reconnect. Transaction-mode
   * pooling means these are cheap client connections, not backend ones.
   */
  idle_timeout: 300,
  connect_timeout: 15,
});

export const db = drizzle(client, { schema });
