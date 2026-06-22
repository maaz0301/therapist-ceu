import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import {
  listings,
  listingStates,
  listingTags,
  profiles,
  tags,
  type Listing,
} from "@/db/schema";
import { db } from "@/lib/db";

export type TrainerListing = Listing & {
  tagNames: string[];
  states: string[];
};

async function attachTagsAndStates(rows: Listing[]): Promise<TrainerListing[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const tagRows = await db
    .select({ listingId: listingTags.listingId, name: tags.name })
    .from(listingTags)
    .innerJoin(tags, eq(tags.id, listingTags.tagId))
    .where(inArray(listingTags.listingId, ids));

  const stateRows = await db
    .select({
      listingId: listingStates.listingId,
      stateCode: listingStates.stateCode,
    })
    .from(listingStates)
    .where(inArray(listingStates.listingId, ids));

  return rows.map((row) => ({
    ...row,
    tagNames: tagRows.filter((t) => t.listingId === row.id).map((t) => t.name),
    states: stateRows
      .filter((s) => s.listingId === row.id)
      .map((s) => s.stateCode),
  }));
}

export async function getTrainerListings(
  trainerId: string,
): Promise<TrainerListing[]> {
  const rows = await db
    .select()
    .from(listings)
    .where(eq(listings.trainerId, trainerId))
    .orderBy(desc(listings.createdAt));

  return attachTagsAndStates(rows);
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
};

async function composeOwnedListing(row: Listing): Promise<OwnedListing> {
  const tagRows = await db
    .select({ tagId: listingTags.tagId })
    .from(listingTags)
    .where(eq(listingTags.listingId, row.id));
  const stateRows = await db
    .select({ stateCode: listingStates.stateCode })
    .from(listingStates)
    .where(eq(listingStates.listingId, row.id));

  return {
    ...row,
    tagIds: tagRows.map((t) => t.tagId),
    states: stateRows.map((s) => s.stateCode),
  };
}

/** A trainer's own listing by id (for actions). Returns null if not owned. */
export async function getOwnedListing(
  id: string,
  trainerId: string,
): Promise<OwnedListing | null> {
  const [row] = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, id), eq(listings.trainerId, trainerId)))
    .limit(1);
  if (!row) return null;
  return composeOwnedListing(row);
}

/** A trainer's own listing by slug (for the edit page URL). */
export async function getOwnedListingBySlug(
  slug: string,
  trainerId: string,
): Promise<OwnedListing | null> {
  const [row] = await db
    .select()
    .from(listings)
    .where(and(eq(listings.slug, slug), eq(listings.trainerId, trainerId)))
    .limit(1);
  if (!row) return null;
  return composeOwnedListing(row);
}

export type ListingDetail = Listing & {
  trainerName: string | null;
  trainerCredentials: string | null;
  trainerBio: string | null;
  trainerWebsite: string | null;
  tagList: { id: string; name: string; category: string }[];
  states: string[];
};

/**
 * Listing for the public detail page. Visible if approved+active, OR if the
 * viewer owns it / is an admin (so trainers can preview pending listings).
 */
export async function getListingDetail(
  slug: string,
  viewer?: { id: string; isAdmin: boolean } | null,
): Promise<ListingDetail | null> {
  const [row] = await db
    .select({
      listing: listings,
      trainerName: profiles.fullName,
      trainerCredentials: profiles.credentials,
      trainerBio: profiles.bio,
      trainerWebsite: profiles.websiteUrl,
    })
    .from(listings)
    .innerJoin(profiles, eq(profiles.id, listings.trainerId))
    .where(eq(listings.slug, slug))
    .limit(1);

  if (!row) return null;

  const isPublic = row.listing.status === "approved" && row.listing.active;
  const canView =
    isPublic ||
    (viewer && (viewer.isAdmin || viewer.id === row.listing.trainerId));
  if (!canView) return null;

  const tagList = await db
    .select({ id: tags.id, name: tags.name, category: tags.category })
    .from(listingTags)
    .innerJoin(tags, eq(tags.id, listingTags.tagId))
    .where(eq(listingTags.listingId, row.listing.id));

  const stateRows = await db
    .select({ stateCode: listingStates.stateCode })
    .from(listingStates)
    .where(eq(listingStates.listingId, row.listing.id));

  return {
    ...row.listing,
    trainerName: row.trainerName,
    trainerCredentials: row.trainerCredentials,
    trainerBio: row.trainerBio,
    trainerWebsite: row.trainerWebsite,
    tagList,
    states: stateRows.map((s) => s.stateCode),
  };
}
