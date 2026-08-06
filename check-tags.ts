import { db } from "./lib/db";
import { tags } from "./db/schema";
import { ilike } from "drizzle-orm";

async function run() {
  const allTags = await db.select().from(tags).where(ilike(tags.name, '%borderline%'));
  console.log("Matching tags:", allTags);
  process.exit(0);
}
run().catch(console.error);
