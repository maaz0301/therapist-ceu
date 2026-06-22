import "server-only";

import { eq } from "drizzle-orm";

import { listings, listingStates, listingTags } from "@/db/schema";
import { db } from "@/lib/db";
import { listingSchema, type ListingInput } from "@/lib/validation/listing";
import { slugify, shortId } from "@/lib/slug";
import {
  createSupabaseAdminClient,
  LISTING_IMAGE_BUCKET,
} from "@/lib/supabase/admin";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const s = typeof value === "string" ? value.trim() : "";
  return s.length > 0 ? s : null;
}

export function parseListingForm(formData: FormData) {
  return listingSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    presenterNames: formData.get("presenterNames") ?? "",
    credentials: formData.get("credentials") ?? "",
    format: formData.get("format") ?? "",
    isOnline: formData.get("isOnline") === "true",
    states: formData.getAll("states").map(String),
    onDemand: formData.get("onDemand") === "true",
    startDate: emptyToNull(formData.get("startDate")),
    endDate: emptyToNull(formData.get("endDate")),
    durationHours: (formData.get("durationHours") as string) ?? "",
    price: formData.get("price") ?? "0",
    registrationUrl: formData.get("registrationUrl") ?? "",
    hasCeu: formData.get("hasCeu") === "true",
    ceCount: (formData.get("ceCount") as string) ?? "",
    accreditingBody: emptyToNull(formData.get("accreditingBody")),
    websiteUrl: (formData.get("websiteUrl") as string) ?? "",
    tagIds: formData.getAll("tagIds").map(String),
  });
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
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image must be under 5 MB." };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: "Use a PNG, JPG, or WebP image." };
  }
  return null;
}
