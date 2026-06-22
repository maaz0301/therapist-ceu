import { NextResponse } from "next/server";
import { and, eq, isNotNull, sql } from "drizzle-orm";

import { listings } from "@/db/schema";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Daily cron (configured in vercel.json): deactivate approved, dated listings
 * whose end_date has passed so they drop out of the public directory.
 * On-demand listings never expire.
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
        isNotNull(listings.endDate),
        sql`${listings.endDate} < current_date`,
      ),
    )
    .returning({ id: listings.id });

  return NextResponse.json({
    ok: true,
    expired: expired.length,
    at: new Date().toISOString(),
  });
}
