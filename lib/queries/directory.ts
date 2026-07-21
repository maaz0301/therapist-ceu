import "server-only";

import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
  type SQLWrapper,
} from "drizzle-orm";

import {
  listingDates,
  listings,
  listingStates,
  listingTags,
  profiles,
} from "@/db/schema";
import { db } from "@/lib/db";
import { formatDateRange } from "@/lib/dates";
import { PRICE_RANGES } from "@/lib/constants";
import {
  DIRECTORY_PAGE_SIZE,
  type DirectoryFilters,
} from "@/lib/directory-params";
import type { ListingCardData } from "@/components/listing-card";

export type DirectoryItem = ListingCardData & { id: string };

export type DirectoryResult = {
  items: DirectoryItem[];
  total: number;
  page: number;
  totalPages: number;
};

/**
 * Matches the rows in `listing_dates` for the current listing whose run hasn't
 * finished yet. Correlated on `listings.id`, so it only ever appears inside a
 * query that already selects from `listings`.
 *
 * `current_date` is re-evaluated on every query rather than cached anywhere,
 * which is what makes a listing roll on to its next date by itself: the run
 * that just finished stops matching, and the following one becomes first.
 */
const isUpcomingRun = sql`
  ${listingDates.listingId} = ${listings.id}
  and coalesce(${listingDates.endDate}, ${listingDates.startDate}) >= current_date
`;

/** Reads one column off the soonest of a listing's upcoming runs. */
function fromNextRun(column: SQLWrapper) {
  return sql`(
    select ${column} from ${listingDates}
    where ${isUpcomingRun}
    order by ${listingDates.startDate}
    limit 1
  )`;
}

function buildWhere(filters: DirectoryFilters): SQL | undefined {
  const conditions: SQL[] = [
    eq(listings.status, "approved"),
    eq(listings.active, true),
    eq(profiles.accountStatus, "active"),
    // A dated training with nothing left on the calendar is over. The nightly
    // cron unpublishes these, but it only runs once a day — this keeps the
    // directory honest in the hours between, without waiting for it.
    or(
      eq(listings.onDemand, true),
      sql`exists (select 1 from ${listingDates} where ${isUpcomingRun})`,
    )!,
  ];

  if (filters.formats.length > 0) {
    conditions.push(inArray(listings.format, filters.formats));
  }

  if (filters.providers.length > 0) {
    const providerConds: SQL[] = [];
    let hasNonCeu = false;
    for (const p of filters.providers) {
      if (p === "ACE/NASW") {
        providerConds.push(
          ilike(listings.accreditingBody, "%ACE%"),
          ilike(listings.accreditingBody, "%NASW%"),
          ilike(listings.accreditingBody, "%ASWB%")
        );
      } else if (p === "State Board Approved") {
        providerConds.push(ilike(listings.accreditingBody, "%State Board%"));
      } else if (p.startsWith("APT")) {
        // Trainers type this field freehand ("APT", "APT Approved Provider",
        // "Association for Play Therapy"), so match the acronym on word
        // boundaries — a bare %APT% would also hit "adapted" and "chapter".
        providerConds.push(
          sql`${listings.accreditingBody} ~* '\mAPT\M'`,
          ilike(listings.accreditingBody, "%Association for Play Therapy%"),
        );
      } else if (p === "Non-CE") {
        hasNonCeu = true;
      } else {
        providerConds.push(ilike(listings.accreditingBody, `%${p}%`));
      }
    }

    const providerOrConditions: SQL[] = [];
    if (providerConds.length > 0) {
      const providerOr = or(...providerConds);
      if (providerOr) {
        providerOrConditions.push(and(eq(listings.hasCeu, true), providerOr)!);
      }
    }
    if (hasNonCeu) {
      providerOrConditions.push(eq(listings.hasCeu, false));
    }

    const finalOr = or(...providerOrConditions);
    if (finalOr) {
      conditions.push(finalOr);
    }
  }

  if (filters.priceId) {
    const range = PRICE_RANGES.find((r) => r.id === filters.priceId);
    if (range) {
      conditions.push(sql`${listings.price} >= ${range.min}`);
      if (range.max !== null) {
        conditions.push(sql`${listings.price} <= ${range.max}`);
      }
    }
  }

  if (filters.states.length > 0) {
    const realStates = filters.states.filter((s) => s !== "ONLINE");
    // Online listings are available in any state, so they match whenever a
    // state filter is applied; in-person listings match by their state code.
    const stateConds: SQL[] = [eq(listings.isOnline, true)];
    if (realStates.length > 0) {
      stateConds.push(
        inArray(
          listings.id,
          db
            .select({ id: listingStates.listingId })
            .from(listingStates)
            .where(inArray(listingStates.stateCode, realStates)),
        ),
      );
    }
    const stateOr = or(...stateConds);
    if (stateOr) conditions.push(stateOr);
  }

  // Topic tags use AND logic: a listing must carry every selected tag.
  if (filters.tagIds.length > 0) {
    conditions.push(
      inArray(
        listings.id,
        db
          .select({ id: listingTags.listingId })
          .from(listingTags)
          .where(inArray(listingTags.tagId, filters.tagIds))
          .groupBy(listingTags.listingId)
          .having(
            sql`count(distinct ${listingTags.tagId}) = ${filters.tagIds.length}`,
          ),
      ),
    );
  }

  if (filters.q.length > 0) {
    const keywordConditions = filters.q.map((term) =>
      or(
        sql`${listings.searchVector} @@ websearch_to_tsquery('english', ${term})`,
        ilike(listings.title, `%${term}%`),
        ilike(listings.presenterNames, `%${term}%`),
      )
    );
    // AND them together so that all tags must match the listing
    const combinedKeyword = and(...keywordConditions);
    if (combinedKeyword) conditions.push(combinedKeyword);
  }

  return and(...conditions);
}

function formatPrice(price: string): number {
  return Number(price);
}

/**
 * The card shows the next run and, when a training repeats, how many more are
 * booked — "Sep 14 – 16 · +2 more dates". Anything already finished is filtered
 * out in SQL, so `nextStart` is always the soonest date still to come.
 */
function formatSchedule(row: {
  onDemand: boolean;
  nextStart: string | null;
  nextEnd: string | null;
  upcomingCount: number;
}): string {
  if (row.onDemand) return "On Demand";
  if (!row.nextStart) return "Date TBA";

  const range = formatDateRange(
    { startDate: row.nextStart, endDate: row.nextEnd },
    "short",
  );
  const label = row.nextEnd && row.nextEnd !== row.nextStart ? range : `Starts ${range}`;

  const more = row.upcomingCount - 1;
  if (more <= 0) return label;
  return `${label} · +${more} more date${more === 1 ? "" : "s"}`;
}

/**
 * Fetches one page of listing rows and stitches on their state labels.
 * Shared by the directory and the landing page's featured strip, so the latter
 * doesn't have to run a full paginated search to get a handful of rows.
 */
async function fetchListingPage(
  where: ReturnType<typeof buildWhere>,
  limit: number,
  offset: number,
): Promise<DirectoryItem[]> {
  const rows = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      title: listings.title,
      description: listings.description,
      format: listings.format,
      hasCeu: listings.hasCeu,
      ceCount: listings.ceCount,
      price: listings.price,
      isOnline: listings.isOnline,
      onDemand: listings.onDemand,
      // The next run, resolved per row. Three correlated subqueries rather than
      // a lateral join because each is a single index hit on
      // (listing_id, start_date) over a page of 25 rows.
      nextStart: sql<string | null>`${fromNextRun(listingDates.startDate)}`,
      nextEnd: sql<string | null>`${fromNextRun(listingDates.endDate)}`,
      upcomingCount: sql<number>`(
        select count(*)::int from ${listingDates} where ${isUpcomingRun}
      )`,
      imageUrl: listings.imageUrl,
      trainerName: profiles.fullName,
      credentials: listings.credentials,
      // Aggregated in SQL rather than a follow-up `inArray` query. That second
      // round-trip could not be parallelized (it needs the page's ids), so it
      // added a full ~220ms to every directory and landing-page render.
      states: sql<string[]>`coalesce(array(
        select ${listingStates.stateCode}
        from ${listingStates}
        where ${listingStates.listingId} = ${listings.id}
      ), '{}')`,
    })
    .from(listings)
    .innerJoin(profiles, eq(profiles.id, listings.trainerId))
    .where(where)
    .orderBy(desc(listings.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => {
    const states = row.states ?? [];
    const location = row.isOnline
      ? "Online"
      : states.length > 0
        ? states.join(", ")
        : "In person";

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      trainerName: row.trainerName ?? "Trainer",
      credentials: row.credentials,
      format: row.format,
      hasCeu: row.hasCeu,
      ceCount: row.ceCount,
      price: formatPrice(row.price),
      location,
      schedule: formatSchedule(row),
      excerpt: row.description.slice(0, 180),
    };
  });
}

export async function searchListings(
  filters: DirectoryFilters,
): Promise<DirectoryResult> {
  const where = buildWhere(filters);
  const offset = (filters.page - 1) * DIRECTORY_PAGE_SIZE;

  // The page fetch and the count are independent — with a ~220ms round-trip to
  // the DB region, running them serially doubled the cost for no reason.
  const [items, [{ total }]] = await Promise.all([
    fetchListingPage(where, DIRECTORY_PAGE_SIZE, offset),
    db
      .select({ total: count() })
      .from(listings)
      .innerJoin(profiles, eq(profiles.id, listings.trainerId))
      .where(where),
  ]);

  return {
    items,
    total,
    page: filters.page,
    totalPages: Math.max(1, Math.ceil(total / DIRECTORY_PAGE_SIZE)),
  };
}

/** Approved + active listing slugs/timestamps for the sitemap. */
export async function getSitemapListings(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  return db
    .select({ slug: listings.slug, updatedAt: listings.updatedAt })
    .from(listings)
    .innerJoin(profiles, eq(profiles.id, listings.trainerId))
    .where(
      and(
        eq(listings.status, "approved"),
        eq(listings.active, true),
        eq(profiles.accountStatus, "active"),
      ),
    )
    .orderBy(desc(listings.updatedAt));
}

/** A few approved listings for the landing page's featured section. */
export async function getFeaturedListings(
  limit = 3,
): Promise<DirectoryItem[]> {
  // Pushes `limit` into SQL and skips the COUNT(*) entirely — this runs on the
  // landing page, which never uses the total.
  const where = buildWhere({
    q: [],
    states: [],
    formats: [],
    priceId: null,
    providers: [],
    tagIds: [],
    page: 1,
  });
  return fetchListingPage(where, limit, 0);
}
