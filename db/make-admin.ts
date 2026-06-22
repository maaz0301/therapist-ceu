import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

/**
 * Promotes an existing user (by email) to the admin role.
 * The user must have already signed up so their profile row exists.
 * Usage: npm run db:make-admin -- someone@example.com
 */
config({ path: ".env.local" });

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run db:make-admin -- <email>");
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing DATABASE_URL");

  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client, { schema });

  try {
    const updated = await db
      .update(schema.profiles)
      .set({ role: "admin" })
      .where(eq(schema.profiles.contactEmail, email))
      .returning({ id: schema.profiles.id, email: schema.profiles.contactEmail });

    if (updated.length === 0) {
      console.error(
        `No profile found with contact_email = ${email}. Have they signed up yet?`,
      );
      process.exit(1);
    }
    console.log(`Promoted ${email} to admin.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
