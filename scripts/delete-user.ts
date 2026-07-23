import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const targetEmail = "maaz.khan@ccript.com";
  console.log(`Deleting profile for ${targetEmail}...`);

  // Delete listings owned by this profile if any
  await db.execute(
    sql`DELETE FROM public.listings WHERE trainer_id IN (SELECT id FROM public.profiles WHERE contact_email = ${targetEmail})`
  );

  // Delete profile
  const deletedProfiles = await db.execute(
    sql`DELETE FROM public.profiles WHERE contact_email = ${targetEmail} RETURNING id`
  );
  console.log("Deleted profiles:", deletedProfiles);

  // Delete from auth.users if exists
  const deletedUsers = await db.execute(
    sql`DELETE FROM auth.users WHERE email = ${targetEmail} RETURNING id`
  );
  console.log("Deleted auth users:", deletedUsers);

  console.log("Deletion complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
