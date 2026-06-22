"use server";

import { and, eq } from "drizzle-orm";

import { analyticsEvents, listings } from "@/db/schema";
import { db } from "@/lib/db";

/** Records a public view of a listing. No-op for non-public listings. */
export async function recordListingView(listingId: string): Promise<void> {
  if (!listingId) return;

  const [listing] = await db
    .select({ id: listings.id })
    .from(listings)
    .where(
      and(
        eq(listings.id, listingId),
        eq(listings.status, "approved"),
        eq(listings.active, true),
      ),
    )
    .limit(1);
  if (!listing) return;

  await db.insert(analyticsEvents).values({ listingId, type: "view" });
}
