"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import {
  listings,
  reviews,
  savedListings,
  searchAlerts,
} from "@/db/schema";
import { getCurrentProfile } from "@/lib/auth";
import { db } from "@/lib/db";

export type EngagementState = { error?: string; success?: string } | null;

const MAX_ALERTS_PER_USER = 10;

async function requireActiveUser() {
  const profile = await getCurrentProfile();
  if (!profile || profile.accountStatus !== "active") return null;
  return profile;
}

// ---------------------------------------------------------------------------
// Saved courses
// ---------------------------------------------------------------------------

/** Toggles a bookmark. Returns the new saved state, or null if not signed in. */
export async function toggleSavedAction(
  listingId: string,
): Promise<{ saved: boolean } | { needsLogin: true }> {
  const profile = await requireActiveUser();
  if (!profile) return { needsLogin: true };
  if (!z.string().uuid().safeParse(listingId).success) return { saved: false };

  const [existing] = await db
    .select({ id: savedListings.listingId })
    .from(savedListings)
    .where(
      and(
        eq(savedListings.userId, profile.id),
        eq(savedListings.listingId, listingId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .delete(savedListings)
      .where(
        and(
          eq(savedListings.userId, profile.id),
          eq(savedListings.listingId, listingId),
        ),
      );
    revalidatePath("/saved");
    return { saved: false };
  }

  // Only publicly visible listings can be bookmarked.
  const [listing] = await db
    .select({ id: listings.id })
    .from(listings)
    .where(
      and(
        eq(listings.id, listingId),
        eq(listings.status, "approved"),
        eq(listings.active, true),
      ),
    )
    .limit(1);
  if (!listing) return { saved: false };

  await db
    .insert(savedListings)
    .values({ userId: profile.id, listingId })
    .onConflictDoNothing();
  revalidatePath("/saved");
  return { saved: true };
}

// ---------------------------------------------------------------------------
// Search alerts
// ---------------------------------------------------------------------------

export async function createAlertAction(
  _prev: EngagementState,
  formData: FormData,
): Promise<EngagementState> {
  const profile = await requireActiveUser();
  if (!profile) return { error: "Please log in to create alerts." };

  const parsed = z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(80, "Keep it under 80 characters.")
    .safeParse(formData.get("query"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid keywords." };
  }

  const existing = await db
    .select({ id: searchAlerts.id, query: searchAlerts.query })
    .from(searchAlerts)
    .where(eq(searchAlerts.userId, profile.id));
  if (existing.length >= MAX_ALERTS_PER_USER) {
    return { error: `You can have up to ${MAX_ALERTS_PER_USER} alerts.` };
  }
  if (existing.some((a) => a.query.toLowerCase() === parsed.data.toLowerCase())) {
    return { error: "You already have an alert for that." };
  }

  await db
    .insert(searchAlerts)
    .values({ userId: profile.id, query: parsed.data });
  revalidatePath("/saved");
  return { success: "Alert created. We'll email you about new matches." };
}

export async function deleteAlertAction(alertId: string): Promise<void> {
  const profile = await requireActiveUser();
  if (!profile || !z.string().uuid().safeParse(alertId).success) return;
  await db
    .delete(searchAlerts)
    .where(and(eq(searchAlerts.id, alertId), eq(searchAlerts.userId, profile.id)));
  revalidatePath("/saved");
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

const reviewSchema = z.object({
  listingId: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "Pick a rating.").max(5),
  body: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters.")
    .max(2000, "Keep it under 2000 characters."),
});

export async function submitReviewAction(
  _prev: EngagementState,
  formData: FormData,
): Promise<EngagementState> {
  const profile = await requireActiveUser();
  if (!profile) return { error: "Please log in to leave a review." };

  const parsed = reviewSchema.safeParse({
    listingId: formData.get("listingId"),
    rating: formData.get("rating"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid review." };
  }
  const { listingId, rating, body } = parsed.data;

  const [listing] = await db
    .select({
      trainerId: listings.trainerId,
      slug: listings.slug,
      status: listings.status,
      active: listings.active,
    })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (!listing || listing.status !== "approved" || !listing.active) {
    return { error: "This course can't be reviewed right now." };
  }
  if (listing.trainerId === profile.id) {
    return { error: "You can't review your own course." };
  }

  await db
    .insert(reviews)
    .values({ listingId, userId: profile.id, rating, body })
    .onConflictDoUpdate({
      target: [reviews.listingId, reviews.userId],
      set: { rating, body },
    });

  revalidatePath(`/listings/${listing.slug}`);
  return { success: "Thanks! Your review is posted." };
}

export async function replyToReviewAction(
  _prev: EngagementState,
  formData: FormData,
): Promise<EngagementState> {
  const profile = await requireActiveUser();
  if (!profile) return { error: "Please log in." };

  const parsed = z
    .object({
      reviewId: z.string().uuid(),
      reply: z.string().trim().min(2, "Write a reply.").max(1000),
    })
    .safeParse({
      reviewId: formData.get("reviewId"),
      reply: formData.get("reply"),
    });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid reply." };
  }

  const [row] = await db
    .select({ trainerId: listings.trainerId, slug: listings.slug })
    .from(reviews)
    .innerJoin(listings, eq(listings.id, reviews.listingId))
    .where(eq(reviews.id, parsed.data.reviewId))
    .limit(1);
  // Only the trainer who owns the course may reply to its reviews.
  if (!row || row.trainerId !== profile.id) {
    return { error: "You can only reply to reviews on your own courses." };
  }

  await db
    .update(reviews)
    .set({ trainerReply: parsed.data.reply, trainerRepliedAt: new Date() })
    .where(eq(reviews.id, parsed.data.reviewId));

  revalidatePath(`/listings/${row.slug}`);
  return { success: "Reply posted." };
}

/** The author or an admin may delete a review. */
export async function deleteReviewAction(reviewId: string): Promise<void> {
  const profile = await requireActiveUser();
  if (!profile || !z.string().uuid().safeParse(reviewId).success) return;

  const [row] = await db
    .select({ userId: reviews.userId, slug: listings.slug })
    .from(reviews)
    .innerJoin(listings, eq(listings.id, reviews.listingId))
    .where(eq(reviews.id, reviewId))
    .limit(1);
  if (!row) return;
  if (row.userId !== profile.id && profile.role !== "admin") return;

  await db.delete(reviews).where(eq(reviews.id, reviewId));
  revalidatePath(`/listings/${row.slug}`);
}
