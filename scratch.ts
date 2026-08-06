import { db } from "./lib/db";
import { profiles, listings, tags, listingTags } from "./db/schema";
import { eq, desc } from "drizzle-orm";

async function run() {
  const email = "tess@integratingthewholeself.com";
  
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.contactEmail, email))
    .limit(1);

  if (!profile) {
    console.log(`Profile not found for email: ${email}`);
    process.exit(0);
  }

  console.log(`Found profile:`, profile);

  const userListings = await db
    .select()
    .from(listings)
    .where(eq(listings.trainerId, profile.id))
    .orderBy(desc(listings.createdAt));

  console.log(`\nListings for ${email}:`);
  for (const listing of userListings) {
    console.log(`- [${listing.id}] ${listing.title} (Status: ${listing.status}, Active: ${listing.active})`);
    
    const lTags = await db
      .select({ name: tags.name, category: tags.category })
      .from(listingTags)
      .innerJoin(tags, eq(tags.id, listingTags.tagId))
      .where(eq(listingTags.listingId, listing.id));
      
    console.log(`  Tags: ${lTags.map(t => `${t.name} (${t.category})`).join(", ")}`);
  }

  process.exit(0);
}

run().catch(console.error);
