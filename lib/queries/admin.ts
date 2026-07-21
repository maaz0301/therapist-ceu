import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import {
  listingDates,
  listings,
  listingStates,
  listingTags,
  profiles,
  tags,
  type Listing,
  type Profile,
} from "@/db/schema";
import { db } from "@/lib/db";
import { TAG_CATEGORIES, type TagCategory } from "@/lib/constants";
import type { DateRange } from "@/lib/dates";

export type AdminListingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "inactive";

export type AdminListing = Listing & {
  trainerName: string | null;
  trainerAccountStatus: "active" | "suspended";
  dates: DateRange[];
};

export async function getAdminListings(
  status?: AdminListingStatus,
): Promise<AdminListing[]> {
  const rows = await db
    .select({
      listing: listings,
      trainerName: profiles.fullName,
      trainerAccountStatus: profiles.accountStatus,
    })
    .from(listings)
    .innerJoin(profiles, eq(profiles.id, listings.trainerId))
    .where(status ? eq(listings.status, status) : undefined)
    .orderBy(desc(listings.createdAt));

  // One follow-up query for the whole page rather than one per listing — the
  // review queue routinely renders every pending listing at once.
  const dateRows =
    rows.length === 0
      ? []
      : await db
          .select({
            listingId: listingDates.listingId,
            startDate: listingDates.startDate,
            endDate: listingDates.endDate,
          })
          .from(listingDates)
          .where(
            inArray(
              listingDates.listingId,
              rows.map((r) => r.listing.id),
            ),
          )
          .orderBy(listingDates.startDate);

  return rows.map((r) => ({
    ...r.listing,
    trainerName: r.trainerName,
    trainerAccountStatus: r.trainerAccountStatus,
    dates: dateRows
      .filter((d) => d.listingId === r.listing.id)
      .map((d) => ({ startDate: d.startDate, endDate: d.endDate })),
  }));
}

export type AdminListingCounts = {
  pending: number;
  approved: number;
  rejected: number;
  inactive: number;
  all: number;
};

export async function getAdminListingCounts(): Promise<AdminListingCounts> {
  const [row] = await db
    .select({
      pending: sql<number>`count(*) filter (where ${listings.status} = 'pending')::int`,
      approved: sql<number>`count(*) filter (where ${listings.status} = 'approved')::int`,
      rejected: sql<number>`count(*) filter (where ${listings.status} = 'rejected')::int`,
      inactive: sql<number>`count(*) filter (where ${listings.status} = 'inactive')::int`,
      all: sql<number>`count(*)::int`,
    })
    .from(listings);

  return row ?? { pending: 0, approved: 0, rejected: 0, inactive: 0, all: 0 };
}

export type AdminTrainer = Profile & {
  totalListings: number;
  activeListings: number;
};

export async function getAdminTrainers(): Promise<AdminTrainer[]> {
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.role, "trainer"))
    .orderBy(desc(profiles.createdAt));

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const counts = await db
    .select({
      trainerId: listings.trainerId,
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${listings.active} = true)::int`,
    })
    .from(listings)
    .where(inArray(listings.trainerId, ids))
    .groupBy(listings.trainerId);

  return rows.map((r) => {
    const c = counts.find((x) => x.trainerId === r.id);
    return {
      ...r,
      totalListings: c?.total ?? 0,
      activeListings: c?.active ?? 0,
    };
  });
}

export type AdminTag = {
  id: string;
  name: string;
  category: TagCategory;
  status: "approved" | "suggested";
  suggestedByName: string | null;
  usageCount: number;
};

export type AdminTagGroup = {
  category: TagCategory;
  label: string;
  tags: AdminTag[];
};

export async function getAdminTags(): Promise<{
  groups: AdminTagGroup[];
  suggestedCount: number;
}> {
  const suggester = profiles;
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      category: tags.category,
      status: tags.status,
      suggestedByName: suggester.fullName,
      usageCount: sql<number>`(select count(*)::int from ${listingTags} where ${listingTags.tagId} = ${tags.id})`,
    })
    .from(tags)
    .leftJoin(suggester, eq(suggester.id, tags.suggestedBy))
    .orderBy(desc(tags.status), sql`${tags.name} asc`);

  const all: AdminTag[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category as TagCategory,
    status: r.status as "approved" | "suggested",
    suggestedByName: r.suggestedByName,
    usageCount: r.usageCount,
  }));

  const groups: AdminTagGroup[] = TAG_CATEGORIES.map((cat) => ({
    category: cat.id,
    label: cat.label,
    tags: all.filter((t) => t.category === cat.id),
  }));

  const suggestedCount = all.filter((t) => t.status === "suggested").length;

  return { groups, suggestedCount };
}

/** Any listing by id (admin scope), composed for the edit form. */
export async function getAnyListingForEdit(id: string) {
  const [row] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  if (!row) return null;

  const tagRows = await db
    .select({ tagId: listingTags.tagId })
    .from(listingTags)
    .where(eq(listingTags.listingId, id));

  const stateRows = await db
    .select({ stateCode: listingStates.stateCode })
    .from(listingStates)
    .where(eq(listingStates.listingId, id));

  const dateRows = await db
    .select({
      startDate: listingDates.startDate,
      endDate: listingDates.endDate,
    })
    .from(listingDates)
    .where(eq(listingDates.listingId, id))
    .orderBy(listingDates.startDate);

  return {
    ...row,
    tagIds: tagRows.map((t) => t.tagId),
    states: stateRows.map((s) => s.stateCode),
    dates: dateRows,
  };
}

/** A single trainer + their listings, for the account detail view. */
export async function getTrainerWithListings(trainerId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, trainerId), eq(profiles.role, "trainer")))
    .limit(1);
  if (!profile) return null;

  const rows = await db
    .select()
    .from(listings)
    .where(eq(listings.trainerId, trainerId))
    .orderBy(desc(listings.createdAt));

  return { profile, listings: rows };
}
