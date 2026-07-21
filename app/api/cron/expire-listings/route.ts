import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";

import { listingDates, listings } from "@/db/schema";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Daily cron (configured in vercel.json): deactivate approved, dated listings
 * with no runs left on the calendar, so they drop out of the public directory
 * and the trainer is prompted to schedule the next one. A listing that repeats
 * survives as long as any of its dates is still to come. On-demand listings
 * never expire.
 *
 * The directory applies the same rule at query time, so this isn't what keeps
 * finished trainings out of search — it's what flips `active` off, which is the
 * signal the trainer sees on their dashboard.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const expired = await db
    .update(listings)
    .set({ active: false })
    .where(
      and(
        eq(listings.status, "approved"),
        eq(listings.active, true),
        eq(listings.onDemand, false),
        // At least one date on record, but none of them still ahead. A listing
        // with no dates at all has never been scheduled rather than expired,
        // so it's left alone.
        sql`exists (
          select 1 from ${listingDates}
          where ${listingDates.listingId} = ${listings.id}
        )`,
        sql`not exists (
          select 1 from ${listingDates}
          where ${listingDates.listingId} = ${listings.id}
            and coalesce(${listingDates.endDate}, ${listingDates.startDate}) >= current_date
        )`,
      ),
    )
    .returning({ id: listings.id });

  return NextResponse.json({
    ok: true,
    expired: expired.length,
    at: new Date().toISOString(),
  });
}
