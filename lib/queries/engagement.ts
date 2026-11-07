import "server-only";

import { and, avg, count, desc, eq, gt, inArray } from "drizzle-orm";

import {
  listings,
  profiles,
  reviews,
  savedListings,
  searchAlerts,
} from "@/db/schema";
import { db } from "@/lib/db";
import type { DirectoryFilters } from "@/lib/directory-params";
import {
  buildWhere,
  fetchListingPage,
  type DirectoryItem,
} from "@/lib/queries/directory";

export async function getSavedListings(userId: string): Promise<DirectoryItem[]> {
  const saved = await db
    .select({ listingId: savedListings.listingId })
    .from(savedListings)
    .where(eq(savedListings.userId, userId))
    .orderBy(desc(savedListings.createdAt))
    .limit(100);
  if (saved.length === 0) return [];

  const ids = saved.map((s) => s.listingId);
  // buildWhere keeps only currently-bookable listings, so ended or
  // unpublished courses quietly drop off the saved list.
  const items = await fetchListingPage(
    and(buildWhere(EMPTY), inArray(listings.id, ids)),
    100,
    0,
  );
  const order = new Map(ids.map((id, i) => [id, i]));
  return items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function isListingSaved(userId: string, listingId: string) {
  const [row] = await db
    .select({ id: savedListings.listingId })
    .from(savedListings)
    .where(
      and(eq(savedListings.userId, userId), eq(savedListings.listingId, listingId)),
    )
    .limit(1);
  return Boolean(row);
}

export async function getAlerts(userId: string) {
  return db
    .select()
    .from(searchAlerts)
    .where(eq(searchAlerts.userId, userId))
    .orderBy(desc(searchAlerts.createdAt));
}

/** Listings published since `since` that match the alert's keywords. */
export async function findAlertMatches(query: string, since: Date) {
  const terms = query.split(/\s+/).filter(Boolean).slice(0, 8);
  if (terms.length === 0) return [];
  return fetchListingPage(
    and(buildWhere({ ...EMPTY, q: terms }), gt(listings.createdAt, since)),
    10,
    0,
  );
}

const EMPTY: DirectoryFilters = {
  q: [],
  states: [],
  formats: [],
  priceId: null,
  providers: [],
  tagIds: [],
  page: 1,
};

export type ReviewView = {
  id: string;
  rating: number;
  body: string;
  trainerReply: string | null;
  createdAt: Date;
  authorName: string;
  userId: string;
};

/** "Maya Patel" -> "Maya P." so reviewers aren't fully identified publicly. */
function shortName(full: string | null) {
  const parts = (full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Learner";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export async function getReviews(listingId: string): Promise<ReviewView[]> {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      body: reviews.body,
      trainerReply: reviews.trainerReply,
      createdAt: reviews.createdAt,
      userId: reviews.userId,
      fullName: profiles.fullName,
    })
    .from(reviews)
    .innerJoin(profiles, eq(profiles.id, reviews.userId))
    .where(eq(reviews.listingId, listingId))
    .orderBy(desc(reviews.createdAt))
    .limit(50);
  return rows.map(({ fullName, ...r }) => ({ ...r, authorName: shortName(fullName) }));
}

export async function getRatingSummary(listingId: string) {
  const [row] = await db
    .select({
      average: avg(reviews.rating),
      total: count(),
    })
    .from(reviews)
    .where(eq(reviews.listingId, listingId));
  return {
    average: row?.average ? Number(row.average) : null,
    total: row?.total ?? 0,
  };
}
