import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { analyticsEvents, listings } from "@/db/schema";
import { db } from "@/lib/db";

/**
 * Tracked outbound redirect for a listing's registration link.
 * Records a `link_click` event (for public listings) then 302s to the URL.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [listing] = await db
    .select({
      id: listings.id,
      registrationUrl: listings.registrationUrl,
      status: listings.status,
      active: listings.active,
      slug: listings.slug,
    })
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);

  if (!listing) {
    return NextResponse.redirect(new URL("/directory", _request.url));
  }

  if (listing.status === "approved" && listing.active) {
    await db
      .insert(analyticsEvents)
      .values({ listingId: listing.id, type: "link_click" });
  }

  return NextResponse.redirect(listing.registrationUrl);
}
