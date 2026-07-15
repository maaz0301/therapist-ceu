"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";

import { listings, tags } from "@/db/schema";
import { db } from "@/lib/db";
import { requireTrainer } from "@/lib/auth";
import { filterUsableTagIds } from "@/lib/queries/tags";
import { getActiveListingCount } from "@/lib/queries/listings";
import { canPublishMore, getSubscriptionState } from "@/lib/subscription";
import { TAG_CATEGORIES, type TagCategory } from "@/lib/constants";
import { sendListingSubmittedEmail } from "@/lib/email/send";
import { slugify } from "@/lib/slug";
import {
  generateUniqueSlug,
  getImageFile,
  parseListingForm,
  replaceStatesAndTags,
  uploadImage,
  validateImageFile,
} from "@/lib/listings/form-helpers";

export type ListingFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
} | null;

export async function createListing(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const profile = await requireTrainer();

  const parsed = parseListingForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const usableTagIds = await filterUsableTagIds(data.tagIds, profile.id);
  if (usableTagIds.length === 0) {
    return { fieldErrors: { tagIds: ["Choose at least one valid topic tag."] } };
  }

  const file = getImageFile(formData);
  if (file) {
    const imageError = validateImageFile(file);
    if (imageError) return { fieldErrors: { image: [imageError.error] } };
  }

  // Tier gating: auto-publish if there is room, otherwise save as a draft.
  const subscription = getSubscriptionState(profile);
  const activeCount = await getActiveListingCount(profile.id);
  const willActivate = canPublishMore(subscription, activeCount);

  let imageUrl: string | null = null;
  if (file) imageUrl = await uploadImage(file, profile.id);

  const slug = await generateUniqueSlug(data.title);

  const [created] = await db
    .insert(listings)
    .values({
      trainerId: profile.id,
      slug,
      status: "pending",
      active: willActivate,
      title: data.title,
      description: data.description,
      presenterNames: data.presenterNames,
      credentials: data.credentials,
      format: data.format,
      isOnline: data.isOnline,
      startDate: data.onDemand ? null : data.startDate,
      endDate: data.onDemand ? null : data.endDate,
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

  await replaceStatesAndTags(created.id, data, usableTagIds);

  await sendListingSubmittedEmail(profile.id, {
    name: profile.fullName,
    listingTitle: data.title,
  });

  revalidatePath("/listings");
  revalidatePath("/dashboard");
  redirect(`/listings?new=${willActivate ? "published" : "limit"}`);
}

export async function updateListing(
  id: string,
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const profile = await requireTrainer();

  const [existing] = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, id), eq(listings.trainerId, profile.id)))
    .limit(1);
  if (!existing) {
    return { error: "Listing not found." };
  }

  const parsed = parseListingForm(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const usableTagIds = await filterUsableTagIds(data.tagIds, profile.id);
  if (usableTagIds.length === 0) {
    return { fieldErrors: { tagIds: ["Choose at least one valid topic tag."] } };
  }

  const file = getImageFile(formData);
  let imageUrl = existing.imageUrl;
  if (file) {
    const imageError = validateImageFile(file);
    if (imageError) return { fieldErrors: { image: [imageError.error] } };
    imageUrl = await uploadImage(file, profile.id);
  }

  // Editing an approved, rejected, or inactive listing re-submits it for review.
  const nextStatus =
    existing.status === "approved" ||
    existing.status === "rejected" ||
    existing.status === "inactive"
      ? "pending"
      : existing.status;

  await db
    .update(listings)
    .set({
      title: data.title,
      description: data.description,
      presenterNames: data.presenterNames,
      credentials: data.credentials,
      format: data.format,
      isOnline: data.isOnline,
      startDate: data.onDemand ? null : data.startDate,
      endDate: data.onDemand ? null : data.endDate,
      onDemand: data.onDemand,
      durationHours: data.durationHours ? String(data.durationHours) : null,
      price: String(data.price),
      registrationUrl: data.registrationUrl,
      hasCeu: data.hasCeu,
      ceCount: data.hasCeu ? data.ceCount : null,
      accreditingBody: data.hasCeu ? data.accreditingBody : null,
      websiteUrl: data.websiteUrl,
      imageUrl,
      status: nextStatus,
      rejectionReason: nextStatus === "pending" ? null : existing.rejectionReason,
    })
    .where(eq(listings.id, id));

  await replaceStatesAndTags(id, data, usableTagIds);

  revalidatePath("/listings");
  revalidatePath("/dashboard");
  redirect("/listings?updated=1");
}

export async function deleteListing(formData: FormData): Promise<void> {
  const profile = await requireTrainer();
  const id = String(formData.get("id"));

  await db
    .delete(listings)
    .where(and(eq(listings.id, id), eq(listings.trainerId, profile.id)));

  revalidatePath("/listings");
  revalidatePath("/dashboard");
}

export async function setListingActive(formData: FormData): Promise<void> {
  const profile = await requireTrainer();
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";

  const [listing] = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, id), eq(listings.trainerId, profile.id)))
    .limit(1);
  if (!listing) redirect("/listings");

  if (active && !listing.active) {
    const subscription = getSubscriptionState(profile);
    const otherActive = await getOtherActiveCount(profile.id, id);
    if (!canPublishMore(subscription, otherActive)) {
      redirect("/listings?error=limit");
    }
  }

  await db.update(listings).set({ active }).where(eq(listings.id, id));
  revalidatePath("/listings");
  revalidatePath("/dashboard");
  redirect("/listings");
}

async function getOtherActiveCount(
  trainerId: string,
  excludeId: string,
): Promise<number> {
  const rows = await db
    .select({ id: listings.id })
    .from(listings)
    .where(
      and(
        eq(listings.trainerId, trainerId),
        eq(listings.active, true),
        ne(listings.id, excludeId),
      ),
    );
  return rows.length;
}

export type SuggestTagState = {
  error?: string;
  tag?: { id: string; name: string; category: TagCategory };
} | null;

export async function suggestTag(
  _prev: SuggestTagState,
  formData: FormData,
): Promise<SuggestTagState> {
  const profile = await requireTrainer();

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "") as TagCategory;

  if (name.length < 2) return { error: "Enter a tag name." };
  if (!TAG_CATEGORIES.some((c) => c.id === category)) {
    return { error: "Pick a category." };
  }

  const slug = slugify(name);

  // If an approved tag already exists, just reuse it.
  const [existing] = await db
    .select({ id: tags.id, name: tags.name, category: tags.category })
    .from(tags)
    .where(eq(tags.slug, slug))
    .limit(1);
  if (existing) {
    return {
      tag: {
        id: existing.id,
        name: existing.name,
        category: existing.category as TagCategory,
      },
    };
  }

  const [created] = await db
    .insert(tags)
    .values({
      name,
      slug,
      category,
      status: "suggested",
      suggestedBy: profile.id,
    })
    .returning({ id: tags.id, name: tags.name, category: tags.category });

  return {
    tag: {
      id: created.id,
      name: created.name,
      category: created.category as TagCategory,
    },
  };
}
