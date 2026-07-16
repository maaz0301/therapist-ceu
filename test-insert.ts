import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function run() {
  try {
    const { db } = await import("./lib/db");
    const { listings, listingStates } = await import("./db/schema");

    const trainerId = "00000000-0000-0000-0000-000000000000"; // We need a real trainer ID, let me fetch one
    const profiles = await db.execute("SELECT id FROM profiles LIMIT 1");
    if (!profiles.length) {
      console.log("No profiles found");
      return;
    }
    const realTrainerId = profiles[0].id;

    console.log("Inserting listing...");
    const [created] = await db
      .insert(listings)
      .values({
        trainerId: realTrainerId,
        slug: "test-slug-123",
        status: "pending",
        active: false,
        title: "Test Listing",
        description: "Test",
        presenterNames: "Test",
        credentials: "Test",
        format: "In-Person",
        isOnline: false,
        startDate: "2026-07-20",
        endDate: null,
        onDemand: false,
        durationHours: null,
        price: "0",
        registrationUrl: "https://example.com",
        hasCeu: false,
        ceCount: null,
        accreditingBody: null,
        websiteUrl: null,
        imageUrl: null,
      })
      .returning({ id: listings.id });
    
    console.log("Listing inserted", created);
    
    console.log("Inserting listing state...");
    await db.insert(listingStates).values([
      { listingId: created.id, stateCode: "AL" }
    ]);
    console.log("State inserted");
    
    // Cleanup
    await db.delete(listings).where(listings.id.eq(created.id));
    console.log("Cleaned up");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
run();
