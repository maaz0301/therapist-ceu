import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { listingDates, listings, listingStates, profiles } from "@/db/schema";
import { db } from "@/lib/db";
import { fromNextRun } from "@/lib/queries/directory";

const visible = and(
  eq(listings.status, "approved"),
  eq(listings.active, true),
  eq(profiles.accountStatus, "active"),
);

/** Listings (by slug) for the compare table, in the order requested. */
export async function getListingsForCompare(slugs: string[]) {
  if (slugs.length === 0) return [];
  const rows = await db
    .select({
      slug: listings.slug,
      title: listings.title,
      trainerName: profiles.fullName,
      credentials: listings.credentials,
      format: listings.format,
      price: listings.price,
      hasCeu: listings.hasCeu,
      ceCount: listings.ceCount,
      accreditingBody: listings.accreditingBody,
      durationHours: listings.durationHours,
      isOnline: listings.isOnline,
      onDemand: listings.onDemand,
      nextStart: sql<string | null>`${fromNextRun(listingDates.startDate)}`,
      nextEnd: sql<string | null>`${fromNextRun(listingDates.endDate)}`,
      states: sql<string[]>`coalesce(array(
        select ${listingStates.stateCode}
        from ${listingStates}
        where ${listingStates.listingId} = ${listings.id}
      ), '{}')`,
    })
    .from(listings)
    .innerJoin(profiles, eq(profiles.id, listings.trainerId))
    .where(and(inArray(listings.slug, slugs), visible));
  return slugs
    .map((s) => rows.find((r) => r.slug === s))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
}

/** Every scheduled run overlapping [monthStart, monthEnd] (ISO dates). */
export async function getCalendarRuns(monthStart: string, monthEnd: string) {
  return db
    .select({
      slug: listings.slug,
      title: listings.title,
      format: listings.format,
      trainerName: profiles.fullName,
      startDate: listingDates.startDate,
      endDate: listingDates.endDate,
    })
    .from(listingDates)
    .innerJoin(listings, eq(listings.id, listingDates.listingId))
    .innerJoin(profiles, eq(profiles.id, listings.trainerId))
    .where(
      and(
        visible,
        sql`${listingDates.startDate} <= ${monthEnd}`,
        sql`coalesce(${listingDates.endDate}, ${listingDates.startDate}) >= ${monthStart}`,
      ),
    )
    .orderBy(listingDates.startDate);
}
