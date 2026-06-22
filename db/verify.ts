import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

/**
 * Phase 1 smoke test: confirms seed data exists (via the elevated Drizzle
 * connection) and that RLS restricts an anonymous Supabase client correctly.
 */
config({ path: ".env.local" });

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });

  const [tags] = await db.select({ n: count() }).from(schema.tags);
  const [trainers] = await db.select({ n: count() }).from(schema.profiles);
  const [listings] = await db.select({ n: count() }).from(schema.listings);
  const [approved] = await db
    .select({ n: count() })
    .from(schema.listings)
    .where(eq(schema.listings.status, "approved"));

  console.log("— Elevated (Drizzle) counts —");
  console.log(`  tags:     ${tags.n}`);
  console.log(`  profiles: ${trainers.n}`);
  console.log(`  listings: ${listings.n} (approved: ${approved.n})`);

  // Anonymous client — RLS should expose only approved+active listings,
  // zero profiles, and approved tags.
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const anonListings = await anon
    .from("listings")
    .select("id", { count: "exact", head: true });
  const anonProfiles = await anon
    .from("profiles")
    .select("id", { count: "exact", head: true });
  const anonTags = await anon
    .from("tags")
    .select("id", { count: "exact", head: true });

  console.log("\n— Anonymous (RLS-enforced) counts —");
  console.log(`  listings visible: ${anonListings.count} (expect 6)`);
  console.log(`  profiles visible: ${anonProfiles.count} (expect 0)`);
  console.log(`  tags visible:     ${anonTags.count} (expect 50)`);

  const ok =
    anonListings.count === 6 &&
    anonProfiles.count === 0 &&
    anonTags.count === 50;
  console.log(`\nRLS check: ${ok ? "PASS ✅" : "FAIL ❌"}`);

  await client.end();
  if (!ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
