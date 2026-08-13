"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { listings, listingTags, profiles, tags } from "@/db/schema";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  sendListingApprovedEmail,
  sendListingRejectedEmail,
  sendTrainerInviteEmail,
} from "@/lib/email/send";
import {
  generateUniqueSlug,
  getImageFile,
  parseListingForm,
  replaceListingRelations,
  submittedDates,
  submittedValues,
  uploadImage,
  validateImageFile,
} from "@/lib/listings/form-helpers";
import { getListingStartDates } from "@/lib/queries/listings";
import { slugify } from "@/lib/slug";
import { TAG_CATEGORIES, type TagCategory } from "@/lib/constants";
import type { ListingFormState } from "@/lib/actions/listings";

export type ActionResult = { ok: true } | { error: string };

const LISTING_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "inactive",
] as const;
type ListingStatusValue = (typeof LISTING_STATUSES)[number];

const SUBSCRIPTION_STATUSES = [
  "none",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
] as const;
type SubscriptionStatusValue = (typeof SUBSCRIPTION_STATUSES)[number];

function revalidateAdminListings() {
  revalidatePath("/admin");
  revalidatePath("/admin/trainers");
  revalidatePath("/directory");
  revalidatePath("/dashboard");
  revalidatePath("/listings");
}

async function trainerName(trainerId: string): Promise<string | null> {
  const [row] = await db
    .select({ name: profiles.fullName })
    .from(profiles)
    .where(eq(profiles.id, trainerId))
    .limit(1);
  return row?.name ?? null;
}

// ---------------------------------------------------------------------------
// Listing moderation
// ---------------------------------------------------------------------------

export async function approveListing(id: string): Promise<ActionResult> {
  await requireAdmin();

  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  if (!listing) return { error: "Listing not found." };

  await db
    .update(listings)
    .set({ status: "approved", active: true, rejectionReason: null })
    .where(eq(listings.id, id));

  // Don't make the admin wait on a name lookup + the SendGrid round-trip.
  after(async () => {
    await sendListingApprovedEmail(listing.trainerId, {
      name: await trainerName(listing.trainerId),
      listingTitle: listing.title,
      slug: listing.slug,
    });
  });

  revalidateAdminListings();
  return { ok: true };
}

export async function rejectListing(
  id: string,
  reason: string,
): Promise<ActionResult> {
  await requireAdmin();

  const trimmed = reason.trim();
  if (trimmed.length < 3) {
    return { error: "Please include a brief reason for the trainer." };
  }

  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  if (!listing) return { error: "Listing not found." };

  await db
    .update(listings)
    .set({ status: "rejected", active: false, rejectionReason: trimmed })
    .where(eq(listings.id, id));

  after(async () => {
    await sendListingRejectedEmail(listing.trainerId, {
      name: await trainerName(listing.trainerId),
      listingTitle: listing.title,
      reason: trimmed,
      slug: listing.slug,
    });
  });

  revalidateAdminListings();
  return { ok: true };
}

export async function setListingActiveAdmin(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  await db.update(listings).set({ active }).where(eq(listings.id, id));
  revalidateAdminListings();
  return { ok: true };
}

export async function overrideListingStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  await requireAdmin();

  if (!LISTING_STATUSES.includes(status as ListingStatusValue)) {
    return { error: "Invalid status." };
  }
  const next = status as ListingStatusValue;

  await db
    .update(listings)
    .set({
      status: next,
      // Only approved listings may be active; clear it otherwise.
      active: next === "approved" ? true : false,
      rejectionReason: next === "rejected" ? undefined : null,
    })
    .where(eq(listings.id, id));

  revalidateAdminListings();
  return { ok: true };
}

export async function deleteListingAdmin(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(listings).where(eq(listings.id, id));
  revalidateAdminListings();
  return { ok: true };
}

export async function adminCreateListing(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  await requireAdmin();

  const values = submittedValues(formData);
  const dates = submittedDates(formData);

  const trainerId = String(formData.get("trainerId") ?? "");
  const [trainer] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, trainerId), eq(profiles.role, "trainer")))
    .limit(1);
  if (!trainer) {
    return { fieldErrors: { trainerId: ["Choose a trainer."] }, values, dates };
  }

  const parsed = parseListingForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values, dates };
  }
  const data = parsed.data;

  // Admin may attach any existing tag.
  let usableTagIds: string[] = [];
  if (data.tagIds.length > 0) {
    const rows = await db
      .select({ id: tags.id })
      .from(tags)
      .where(inArray(tags.id, data.tagIds));
    usableTagIds = rows.map((r) => r.id);
  }
  if (usableTagIds.length === 0) {
    return {
      fieldErrors: { tagIds: ["Choose at least one valid topic tag."] },
      values,
      dates,
    };
  }

  const file = getImageFile(formData);
  if (file) {
    const imageError = validateImageFile(file);
    if (imageError) {
      return { fieldErrors: { image: [imageError.error] }, values, dates };
    }
  }

  let imageUrl: string | null = null;
  if (file) imageUrl = await uploadImage(file, trainerId);

  const slug = await generateUniqueSlug(data.title);

  // Admin-authored listings skip the review queue — the admin is the reviewer.
  const [created] = await db
    .insert(listings)
    .values({
      trainerId,
      slug,
      status: "approved",
      active: true,
      title: data.title,
      description: data.description,
      presenterNames: data.presenterNames,
      credentials: data.credentials,
      format: data.format,
      isOnline: data.isOnline,
      onDemand: data.onDemand,
      durationHours: data.durationHours ? String(data.durationHours) : null,
      price: String(data.price),
      registrationUrl: data.registrationUrl,
      hasCeu: data.hasCeu,
      ceCount: data.hasCeu ? data.ceCount : null,
      accreditingBody: data.hasCeu ? data.accreditingBody : null,
      websiteUrl: data.websiteUrl,
      imageUrl,
    })
    .returning({ id: listings.id });

  await replaceListingRelations(created.id, data, usableTagIds);

  after(async () => {
    await sendListingApprovedEmail(trainerId, {
      name: await trainerName(trainerId),
      listingTitle: data.title,
      slug,
    });
  });

  revalidateAdminListings();
  redirect("/admin/trainers?created=1");
}

export async function adminUpdateListing(
  id: string,
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  await requireAdmin();

  const [existing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  if (!existing) return { error: "Listing not found." };

  let trainerId = existing.trainerId;
  const trainerIdRaw = formData.get("trainerId");
  if (typeof trainerIdRaw === "string" && trainerIdRaw) {
    const [trainer] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(eq(profiles.id, trainerIdRaw), eq(profiles.role, "trainer")))
      .limit(1);
    if (!trainer) {
      return { fieldErrors: { trainerId: ["Choose a trainer."] } };
    }
    trainerId = trainerIdRaw;
  }

  const parsed = parseListingForm(
    formData,
    await getListingStartDates(existing.id),
  );
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      dates: submittedDates(formData),
    };
  }
  const data = parsed.data;

  // Admin may attach any existing tag.
  let usableTagIds: string[] = [];
  if (data.tagIds.length > 0) {
    const rows = await db
      .select({ id: tags.id })
      .from(tags)
      .where(inArray(tags.id, data.tagIds));
    usableTagIds = rows.map((r) => r.id);
  }
  if (usableTagIds.length === 0) {
    return { fieldErrors: { tagIds: ["Choose at least one valid topic tag."] } };
  }

  const file = getImageFile(formData);
  let imageUrl = existing.imageUrl;
  if (file) {
    const imageError = validateImageFile(file);
    if (imageError) return { fieldErrors: { image: [imageError.error] } };
    imageUrl = await uploadImage(file, trainerId);
  }

  await db
    .update(listings)
    .set({
      trainerId,
      title: data.title,
      description: data.description,
      presenterNames: data.presenterNames,
      credentials: data.credentials,
      format: data.format,
      isOnline: data.isOnline,
      onDemand: data.onDemand,
      durationHours: data.durationHours ? String(data.durationHours) : null,
      price: String(data.price),
      registrationUrl: data.registrationUrl,
      hasCeu: data.hasCeu,
      ceCount: data.hasCeu ? data.ceCount : null,
      accreditingBody: data.hasCeu ? data.accreditingBody : null,
      websiteUrl: data.websiteUrl,
      imageUrl,
    })
    .where(eq(listings.id, id));

  await replaceListingRelations(id, data, usableTagIds);

  revalidateAdminListings();
  redirect("/admin?updated=1");
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export async function suspendAccount(profileId: string): Promise<ActionResult> {
  await requireAdmin();
  await db
    .update(profiles)
    .set({ accountStatus: "suspended" })
    .where(eq(profiles.id, profileId));
  // Pull their listings out of the directory while suspended.
  await db
    .update(listings)
    .set({ active: false })
    .where(eq(listings.trainerId, profileId));

  revalidatePath("/admin/trainers");
  revalidateAdminListings();
  return { ok: true };
}

export async function reactivateAccount(
  profileId: string,
): Promise<ActionResult> {
  await requireAdmin();
  await db
    .update(profiles)
    .set({ accountStatus: "active" })
    .where(eq(profiles.id, profileId));
  revalidatePath("/admin/trainers");
  return { ok: true };
}

export async function setSubscription(
  profileId: string,
  tier: "basic" | "pro" | null,
  status: string,
): Promise<ActionResult> {
  await requireAdmin();

  if (!SUBSCRIPTION_STATUSES.includes(status as SubscriptionStatusValue)) {
    return { error: "Invalid subscription status." };
  }

  await db
    .update(profiles)
    .set({
      subscriptionTier: tier,
      subscriptionStatus: status as SubscriptionStatusValue,
    })
    .where(eq(profiles.id, profileId));

  revalidatePath("/admin/trainers");
  return { ok: true };
}

/**
 * `emailSent: false` means the trainer account was created but the invitation
 * mail could not be delivered — the caller should surface `inviteUrl` so an
 * admin can pass it on by hand.
 */
export type InviteTrainerResult =
  | { ok: true; emailSent: boolean; inviteUrl: string }
  | { error: string };

export async function inviteTrainer(
  fullName: string,
  email: string,
  tier: "basic" | "pro" | "none",
  status: "none" | "trialing" | "active" | "past_due" | "canceled" | "unpaid",
): Promise<InviteTrainerResult> {
  await requireAdmin();

  const inviteSchema = z.object({
    fullName: z.string().trim().min(2, "Enter trainer's full name."),
    email: z.string().trim().email("Enter a valid email address."),
    tier: z.enum(["basic", "pro", "none"]),
    status: z.enum(["none", "trialing", "active", "past_due", "canceled", "unpaid"]),
  });

  const parsed = inviteSchema.safeParse({ fullName, email, tier, status });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { fullName: cleanName, email: cleanEmail, tier: selectedTier, status: selectedStatus } = parsed.data;

  // Check if email already exists in auth.users
  const existingUser = await db.execute<{ id: string }>(
    sql`SELECT id FROM auth.users WHERE email = ${cleanEmail} LIMIT 1`
  );

  if (existingUser.length > 0) {
    return { error: "An account with this email address already exists." };
  }

  const invite = await sendTrainerInviteEmail(cleanEmail, cleanName);
  if (!invite.ok) {
    return { error: invite.error };
  }

  await db
    .update(profiles)
    .set({
      fullName: cleanName,
      subscriptionTier: selectedTier === "none" ? null : selectedTier,
      subscriptionStatus: selectedStatus,
    })
    .where(eq(profiles.id, invite.userId));

  revalidatePath("/admin/trainers");
  return { ok: true, emailSent: invite.emailSent, inviteUrl: invite.inviteUrl };
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

function isValidCategory(category: string): category is TagCategory {
  return TAG_CATEGORIES.some((c) => c.id === category);
}

export async function createTag(
  name: string,
  category: string,
): Promise<ActionResult> {
  await requireAdmin();

  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Enter a tag name." };
  if (!isValidCategory(category)) return { error: "Pick a valid category." };

  const slug = slugify(trimmed);
  const [existing] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.slug, slug))
    .limit(1);
  if (existing) return { error: "A tag with that name already exists." };

  await db
    .insert(tags)
    .values({ name: trimmed, slug, category, status: "approved" });

  revalidatePath("/admin/tags");
  return { ok: true };
}

export async function updateTag(
  id: string,
  name: string,
  category: string,
): Promise<ActionResult> {
  await requireAdmin();

  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Enter a tag name." };
  if (!isValidCategory(category)) return { error: "Pick a valid category." };

  await db
    .update(tags)
    .set({ name: trimmed, slug: slugify(trimmed), category })
    .where(eq(tags.id, id));

  revalidatePath("/admin/tags");
  return { ok: true };
}

export async function approveTag(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.update(tags).set({ status: "approved" }).where(eq(tags.id, id));
  revalidatePath("/admin/tags");
  return { ok: true };
}

export async function deleteTag(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(listingTags).where(eq(listingTags.tagId, id));
  await db.delete(tags).where(eq(tags.id, id));
  revalidatePath("/admin/tags");
  return { ok: true };
}
