import "server-only";

import { and, asc, eq, inArray, or } from "drizzle-orm";

import { TAG_CATEGORIES, type TagCategory } from "@/lib/constants";
import { tags } from "@/db/schema";
import { db } from "@/lib/db";

export type TagOption = {
  id: string;
  name: string;
  category: TagCategory;
  status: "approved" | "suggested";
};

export type GroupedTags = {
  category: TagCategory;
  label: string;
  options: TagOption[];
}[];

/**
 * Approved tags plus any tags the given trainer has personally suggested
 * (so they can still attach a tag awaiting admin approval), grouped by category.
 */
export async function getGroupedTags(trainerId?: string): Promise<GroupedTags> {
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      category: tags.category,
      status: tags.status,
    })
    .from(tags)
    .where(
      trainerId
        ? or(eq(tags.status, "approved"), eq(tags.suggestedBy, trainerId))
        : eq(tags.status, "approved"),
    )
    .orderBy(asc(tags.name));

  return TAG_CATEGORIES.map((cat) => ({
    category: cat.id,
    label: cat.label,
    options: rows.filter((r) => r.category === cat.id) as TagOption[],
  }));
}

/** Validates that the given tag ids exist and are usable by this trainer. */
export async function filterUsableTagIds(
  tagIds: string[],
  trainerId: string,
): Promise<string[]> {
  if (tagIds.length === 0) return [];
  const rows = await db
    .select({ id: tags.id })
    .from(tags)
    .where(
      and(
        inArray(tags.id, tagIds),
        or(eq(tags.status, "approved"), eq(tags.suggestedBy, trainerId)),
      ),
    );
  const allowed = new Set(rows.map((r) => r.id));
  return tagIds.filter((id) => allowed.has(id));
}
