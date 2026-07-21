import "server-only";

import { eq } from "drizzle-orm";

import { listingDates, listings, listingStates, listingTags } from "@/db/schema";
import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_SIZE_ERROR,
  IMAGE_TYPE_ERROR,
  MAX_IMAGE_BYTES,
} from "@/lib/constants";
import { db } from "@/lib/db";
import { sortDateRanges } from "@/lib/dates";
import { listingDateRows, listingFormValues } from "@/lib/listings/form-fields";
import { buildListingSchema, type ListingInput } from "@/lib/validation/listing";
import { slugify, shortId } from "@/lib/slug";
import {
  createSupabaseAdminClient,
  LISTING_IMAGE_BUCKET,
} from "@/lib/supabase/admin";


/**
 * @param originalStartDates pass the listing's saved start dates when editing,
 *   so runs that have already happened stay editable. Omit when creating.
 */
export function parseListingForm(
  formData: FormData,
  originalStartDates?: readonly string[] | null,
) {
  return buildListingSchema(originalStartDates).safeParse(
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

/**
 * The schedule rows as submitted, echoed back for the same reason as the text
 * fields above — they're repeated inputs rather than one named value, so they
 * can't ride along in {@link SubmittedValues}.
 */
export type SubmittedDates = { startDate: string; endDate: string | null }[];

export function submittedDates(formData: FormData): SubmittedDates {
  return listingDateRows(formData);
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

/**
 * Rewrites the three child tables a listing owns — its dates, its in-person
 * states and its topic tags — to match the submitted form. Delete-then-insert
 * rather than a diff: the sets are tiny, and it keeps "what the trainer sees is
 * exactly what's stored" true without reconciliation logic.
 */
export async function replaceListingRelations(
  listingId: string,
  data: ListingInput,
  usableTagIds: string[],
) {
  await db.delete(listingDates).where(eq(listingDates.listingId, listingId));
  // On-demand trainings have no fixed schedule, so any dates are discarded
  // rather than kept dormant — the same rule the listing columns used to apply.
  if (!data.onDemand && data.dates.length > 0) {
    await db.insert(listingDates).values(
      sortDateRanges(data.dates).map((d) => ({
        listingId,
        startDate: d.startDate,
        endDate: d.endDate,
      })),
    );
  }

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
