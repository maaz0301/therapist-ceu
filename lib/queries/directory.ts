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
} from "drizzle-orm";

import {
  listings,
  listingStates,
  listingTags,
  profiles,
} from "@/db/schema";
import { db } from "@/lib/db";
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

function buildWhere(filters: DirectoryFilters): SQL | undefined {
  const conditions: SQL[] = [
    eq(listings.status, "approved"),
    eq(listings.active, true),
  ];

  if (filters.formats.length > 0) {
    conditions.push(inArray(listings.format, filters.formats));
  }

  if (filters.providers.length > 0) {
    const providerConds: SQL[] = [];
    for (const p of filters.providers) {
      if (p === "ACE/NASW") {
        providerConds.push(
          ilike(listings.accreditingBody, "%ACE%"),
          ilike(listings.accreditingBody, "%NASW%"),
          ilike(listings.accreditingBody, "%ASWB%")
        );
      } else {
        providerConds.push(ilike(listings.accreditingBody, `%${p}%`));
      }
    }
    const providerOr = or(...providerConds);
    if (providerOr) {
      // Must have CEUs AND match one of the selected providers
      conditions.push(and(eq(listings.hasCeu, true), providerOr)!);
    }
  }

  if (filters.priceId) {
    const range = PRICE_RANGES.find((r) => r.id === filters.priceId);
    if (range) {
      if (range.id === "free") {
        conditions.push(sql`${listings.price} = 0`);
      } else {
        conditions.push(sql`${listings.price} >= ${range.min}`);
        if (range.max !== null) {
          conditions.push(sql`${listings.price} <= ${range.max}`);
        }
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

  if (filters.q) {
    const keyword = or(
      sql`${listings.searchVector} @@ websearch_to_tsquery('english', ${filters.q})`,
      ilike(listings.title, `%${filters.q}%`),
      ilike(listings.presenterNames, `%${filters.q}%`),
    );
    if (keyword) conditions.push(keyword);
  }

  return and(...conditions);
}

function formatPrice(price: string): number {
  return Number(price);
}

function formatSchedule(row: {
  onDemand: boolean;
  startDate: string | null;
  endDate: string | null;
}): string {
  if (row.onDemand) return "On Demand";
  if (!row.startDate) return "Date TBA";
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  if (row.endDate && row.endDate !== row.startDate) {
    return `${fmt(row.startDate)} – ${fmt(row.endDate)}`;
  }
  return `Starts ${fmt(row.startDate)}`;
}

export async function searchListings(
  filters: DirectoryFilters,
): Promise<DirectoryResult> {
  const where = buildWhere(filters);
  const offset = (filters.page - 1) * DIRECTORY_PAGE_SIZE;

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
      startDate: listings.startDate,
      endDate: listings.endDate,
      imageUrl: listings.imageUrl,
      trainerName: profiles.fullName,
      credentials: listings.credentials,
    })
    .from(listings)
    .innerJoin(profiles, eq(profiles.id, listings.trainerId))
    .where(where)
    .orderBy(desc(listings.createdAt))
    .limit(DIRECTORY_PAGE_SIZE)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(listings)
    .where(where);

  // Fetch states for the result set to build the location label.
  const ids = rows.map((r) => r.id);
  const stateRows =
    ids.length > 0
      ? await db
          .select({
            listingId: listingStates.listingId,
            stateCode: listingStates.stateCode,
          })
          .from(listingStates)
          .where(inArray(listingStates.listingId, ids))
      : [];

  const items: DirectoryItem[] = rows.map((row) => {
    const states = stateRows
      .filter((s) => s.listingId === row.id)
      .map((s) => s.stateCode);
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
    .where(and(eq(listings.status, "approved"), eq(listings.active, true)))
    .orderBy(desc(listings.updatedAt));
}

/** A few approved listings for the landing page's featured section. */
export async function getFeaturedListings(
  limit = 3,
): Promise<DirectoryItem[]> {
  const { items } = await searchListings({
    q: "",
    states: [],
    formats: [],
    priceId: null,
    providers: [],
    tagIds: [],
    page: 1,
  });
  return items.slice(0, limit);
}
