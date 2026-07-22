import "server-only";

import { cache } from "react";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";

import {
  listingDates,
  listings,
  listingStates,
  listingTags,
  profiles,
  tags,
  type Listing,
} from "@/db/schema";
import { db } from "@/lib/db";
import type { DateRange } from "@/lib/dates";

/** A listing's schedule, chronological. Empty for on-demand trainings. */
export type ListingSchedule = DateRange[];

export type TrainerListing = Listing & {
  tagNames: string[];
  states: string[];
  dates: ListingSchedule;
};

/** The saved start dates of a listing, used to exempt past runs from editing. */
export async function getListingStartDates(
  listingId: string,
): Promise<string[]> {
  const rows = await db
    .select({ startDate: listingDates.startDate })
    .from(listingDates)
    .where(eq(listingDates.listingId, listingId));
  return rows.map((r) => r.startDate);
}

/**
 * A listing's tags/states/dates as correlated JSON aggregates.
 *
 * Every query through the connection pooler costs ~430ms regardless of how
 * little it returns, so round-trip *count* is what the page waits on. Fetching
 * the listings and then their three relation tables meant two trips minimum;
 * gathering the relations as subqueries makes it one, which measured ~860ms →
 * ~430ms on the listings screen. Drizzle still maps the listing columns
 * itself, so only these three fields are hand-written SQL.
 */
/**
 * The outer listing's id, written out rather than interpolated.
 *
 * Drizzle renders `${listings.id}` inside a `sql` template as a bare `"id"`,
 * with no table qualifier. A correlated subquery then resolves that against
 * its *own* table whenever that table also has an `id` column — `tags` and
 * `listing_dates` both do — so `where d.listing_id = "id"` quietly becomes
 * `d.listing_id = d.id`, matches nothing, and the listing comes back with no
 * tags and no dates. (`listing_states` has a composite key and no `id`, which
 * is why it alone appeared to work.) Qualifying it keeps the reference
 * pointing at the outer query.
 */
const outerListingId = sql.raw('"listings"."id"');

const tagNamesJson = sql<string[]>`coalesce((
  select json_agg(t.name order by t.name)
  from ${listingTags} lt
  join ${tags} t on t.id = lt.tag_id
  where lt.listing_id = ${outerListingId}
), '[]'::json)`;

const stateCodesJson = sql<string[]>`coalesce((
  select json_agg(ls.state_code order by ls.state_code)
  from ${listingStates} ls
  where ls.listing_id = ${outerListingId}
), '[]'::json)`;

const datesJson = sql<ListingSchedule>`coalesce((
  select json_agg(
    json_build_object('startDate', d.start_date, 'endDate', d.end_date)
    order by d.start_date
  )
  from ${listingDates} d
  where d.listing_id = ${outerListingId}
), '[]'::json)`;

export async function getTrainerListings(
  trainerId: string,
): Promise<TrainerListing[]> {
  const rows = await db
    .select({
      listing: listings,
      tagNames: tagNamesJson,
      states: stateCodesJson,
      dates: datesJson,
    })
    .from(listings)
    .where(eq(listings.trainerId, trainerId))
    .orderBy(desc(listings.createdAt));

  return rows.map((row) => ({
    ...row.listing,
    tagNames: row.tagNames,
    states: row.states,
    dates: row.dates,
  }));
}

/** Just enough for the dashboard's "recent listings" rows. */
export type RecentListing = Pick<
  Listing,
  "id" | "title" | "slug" | "format" | "status" | "active"
>;

/**
 * The dashboard shows five rows of title/status/link. Reusing
 * `getTrainerListings` for that pulled every listing the trainer owns plus its
 * tags, states and dates — four round-trips to render data the page throws
 * away. One narrow query instead.
 */
export async function getRecentTrainerListings(
  trainerId: string,
  limit = 5,
): Promise<RecentListing[]> {
  return db
    .select({
      id: listings.id,
      title: listings.title,
      slug: listings.slug,
      format: listings.format,
      status: listings.status,
      active: listings.active,
    })
    .from(listings)
    .where(eq(listings.trainerId, trainerId))
    .orderBy(desc(listings.createdAt))
    .limit(limit);
}

export type ListingCounts = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  inactive: number;
  active: number;
};

export async function getTrainerListingCounts(
  trainerId: string,
): Promise<ListingCounts> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) filter (where ${listings.status} = 'pending')::int`,
      approved: sql<number>`count(*) filter (where ${listings.status} = 'approved')::int`,
      rejected: sql<number>`count(*) filter (where ${listings.status} = 'rejected')::int`,
      inactive: sql<number>`count(*) filter (where ${listings.status} = 'inactive')::int`,
      active: sql<number>`count(*) filter (where ${listings.active} = true)::int`,
    })
    .from(listings)
    .where(eq(listings.trainerId, trainerId));

  return (
    row ?? {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      inactive: 0,
      active: 0,
    }
  );
}

export async function getActiveListingCount(
  trainerId: string,
): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(listings)
    .where(and(eq(listings.trainerId, trainerId), eq(listings.active, true)));
  return row?.n ?? 0;
}

export type OwnedListing = Listing & {
  tagIds: string[];
  states: string[];
  dates: ListingSchedule;
};

const tagIdsJson = sql<string[]>`coalesce((
  select json_agg(lt.tag_id)
  from ${listingTags} lt
  where lt.listing_id = ${outerListingId}
), '[]'::json)`;

/** Shared by the id and slug lookups; both feed the edit form. */
async function selectOwnedListing(where: SQL | undefined) {
  const [row] = await db
    .select({
      listing: listings,
      tagIds: tagIdsJson,
      states: stateCodesJson,
      dates: datesJson,
    })
    .from(listings)
    .where(where)
    .limit(1);

  if (!row) return null;
  return {
    ...row.listing,
    tagIds: row.tagIds,
    states: row.states,
    dates: row.dates,
  };
}

/** A trainer's own listing by id (for actions). Returns null if not owned. */
export async function getOwnedListing(
  id: string,
  trainerId: string,
): Promise<OwnedListing | null> {
  return selectOwnedListing(
    and(eq(listings.id, id), eq(listings.trainerId, trainerId)),
  );
}

/** A trainer's own listing by slug (for the edit page URL). */
export async function getOwnedListingBySlug(
  slug: string,
  trainerId: string,
): Promise<OwnedListing | null> {
  return selectOwnedListing(
    and(eq(listings.slug, slug), eq(listings.trainerId, trainerId)),
  );
}

export type ListingMeta = Pick<
  Listing,
  "title" | "slug" | "description" | "imageUrl"
>;

/**
 * Columns for `generateMetadata`, and nothing else.
 *
 * That hook used to call `getListingDetail`, which fetches tags, states and
 * dates the `<head>` never uses — and did so as a *second* full fetch, because
 * the page's own call passes a viewer and so shares nothing with it. This is
 * one narrow query, request-cached, applying the same public-visibility rule
 * the old call got implicitly by passing no viewer.
 */
export const getListingMeta = cache(
  async (slug: string): Promise<ListingMeta | null> => {
    const [row] = await db
      .select({
        title: listings.title,
        slug: listings.slug,
        description: listings.description,
        imageUrl: listings.imageUrl,
      })
      .from(listings)
      .innerJoin(profiles, eq(profiles.id, listings.trainerId))
      .where(
        and(
          eq(listings.slug, slug),
          eq(listings.status, "approved"),
          eq(listings.active, true),
          eq(profiles.accountStatus, "active"),
        ),
      )
      .limit(1);

    return row ?? null;
  },
);

export type ListingDetail = Listing & {
  trainerName: string | null;
  trainerCredentials: string | null;
  trainerBio: string | null;
  trainerWebsite: string | null;
  tagList: { id: string; name: string; category: string }[];
  states: string[];
  dates: ListingSchedule;
};

/**
 * Listing for the public detail page. Visible if approved+active, OR if the
 * viewer owns it / is an admin (so trainers can preview pending listings).
 */
export type ListingViewer = { id: string; isAdmin: boolean } | null;

export async function getListingDetail(
  slug: string,
  /**
   * Accepts a promise so the caller can start the viewer lookup and the
   * listing fetch together — the viewer is only needed for the visibility
   * check below, which happens after the row is in hand, so making the caller
   * await it first was a wasted round-trip.
   */
  viewer?: ListingViewer | Promise<ListingViewer>,
): Promise<ListingDetail | null> {
  const [row] = await db
    .select({
      listing: listings,
      trainerName: profiles.fullName,
      trainerCredentials: profiles.credentials,
      trainerBio: profiles.bio,
      trainerWebsite: profiles.websiteUrl,
      trainerAccountStatus: profiles.accountStatus,
      tagList: sql<
        { id: string; name: string; category: string }[]
      >`coalesce((
        select json_agg(
          json_build_object('id', t.id, 'name', t.name, 'category', t.category)
          order by t.name
        )
        from ${listingTags} lt
        join ${tags} t on t.id = lt.tag_id
        where lt.listing_id = ${outerListingId}
      ), '[]'::json)`,
      states: stateCodesJson,
      dates: datesJson,
    })
    .from(listings)
    .innerJoin(profiles, eq(profiles.id, listings.trainerId))
    .where(eq(listings.slug, slug))
    .limit(1);

  // Settled before the early return below, so a caller-supplied promise is
  // never left floating on the not-found path. Both queries are already in
  // flight by now, so this costs nothing.
  const v = await viewer;
  if (!row) return null;

  const isPublic =
    row.listing.status === "approved" &&
    row.listing.active &&
    row.trainerAccountStatus === "active";
  const canView =
    isPublic || (v && (v.isAdmin || v.id === row.listing.trainerId));
  if (!canView) return null;

  return {
    ...row.listing,
    trainerName: row.trainerName,
    trainerCredentials: row.trainerCredentials,
    trainerBio: row.trainerBio,
    trainerWebsite: row.trainerWebsite,
    tagList: row.tagList,
    states: row.states,
    dates: row.dates,
  };
}
