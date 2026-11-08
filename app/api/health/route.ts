import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Deployment self-check: reports which env vars are set and whether the DB answers. Never returns secret values. */
export async function GET() {
  const names = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "DATABASE_URL",
    "STRIPE_SECRET_KEY",
    "CRON_SECRET",
  ];
  const env = Object.fromEntries(names.map((n) => [n, Boolean(process.env[n]?.trim())]));

  let db: string = "ok";
  try {
    const { db: client } = await import("@/lib/db");
    const { sql } = await import("drizzle-orm");
    await client.execute(sql`select 1`);
  } catch (e) {
    db = e instanceof Error ? e.message.slice(0, 160) : "error";
  }
  return NextResponse.json({ env, db }, { status: db === "ok" ? 200 : 503 });
}
