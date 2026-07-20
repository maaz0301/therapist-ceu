import "server-only";

import { eq } from "drizzle-orm";

import { listings, listingStates, listingTags } from "@/db/schema";
import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_SIZE_ERROR,
  IMAGE_TYPE_ERROR,
  MAX_IMAGE_BYTES,
} from "@/lib/constants";
import { db } from "@/lib/db";
import { listingFormValues } from "@/lib/listings/form-fields";
import { buildListingSchema, type ListingInput } from "@/lib/validation/listing";
import { slugify, shortId } from "@/lib/slug";
import {
  createSupabaseAdminClient,
  LISTING_IMAGE_BUCKET,
} from "@/lib/supabase/admin";


/**
 * @param originalStartDate pass the listing's saved start date when editing, so
 *   an already-past training stays editable. Omit when creating.
 */
export function parseListingForm(
  formData: FormData,
  originalStartDate?: string | null,
) {
  return buildListingSchema(originalStartDate).safeParse(
    listingFormValues(formData),
  );
}

/** Text fields echoed back on a failed submit, keyed by input `name`. */
export type SubmittedValues = Record<string, string>;

const ECHOED_FIELDS = [
  "title",
  "description",
  "presenterNames",
  "credentials",
  "format",
  "startDate",
  "endDate",
  "durationHours",
  "price",
  "registrationUrl",
  "ceCount",
  "accreditingBody",
  "websiteUrl",
] as const;

/**
 * React resets an uncontrolled form once its action resolves, so a validation
 * failure would wipe everything the trainer typed. Echoing the raw strings back
 * as the new `defaultValue`s means the reset restores their input instead of
 * blanking it. (File inputs can't be repopulated — browsers forbid it.)
 */
export function submittedValues(formData: FormData): SubmittedValues {
  const values: SubmittedValues = {};
  for (const field of ECHOED_FIELDS) {
    const raw = formData.get(field);
    if (typeof raw === "string") values[field] = raw;
  }
  return values;
}

export function getImageFile(formData: FormData): File | null {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) return file;
  return null;
}

export async function uploadImage(
  file: File,
  trainerId: string,
): Promise<string> {
  const admin = createSupabaseAdminClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${trainerId}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage
    .from(LISTING_IMAGE_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) throw error;

  return admin.storage.from(LISTING_IMAGE_BUCKET).getPublicUrl(path).data
    .publicUrl;
}

export async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "training";
  let candidate = base;
  for (let i = 0; i < 5; i++) {
    const [existing] = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.slug, candidate))
      .limit(1);
    if (!existing) return candidate;
    candidate = `${base}-${shortId()}`;
  }
  return `${base}-${shortId()}`;
}

export async function replaceStatesAndTags(
  listingId: string,
  data: ListingInput,
  usableTagIds: string[],
) {
  await db.delete(listingStates).where(eq(listingStates.listingId, listingId));
  if (!data.isOnline && data.states.length > 0) {
    await db
      .insert(listingStates)
      .values(data.states.map((stateCode) => ({ listingId, stateCode })));
  }

  await db.delete(listingTags).where(eq(listingTags.listingId, listingId));
  if (usableTagIds.length > 0) {
    await db
      .insert(listingTags)
      .values(usableTagIds.map((tagId) => ({ listingId, tagId })))
      .onConflictDoNothing();
  }
}

export function validateImageFile(
  file: File,
): { error: string } | null {
  if (file.size > MAX_IMAGE_BYTES) return { error: IMAGE_SIZE_ERROR };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: IMAGE_TYPE_ERROR };
  }
  return null;
}
