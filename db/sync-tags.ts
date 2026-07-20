/**
 * Syncs the TAG_TAXONOMY in lib/constants.ts into the tags table.
 *
 *   npm run db:sync-tags            # add new tags, rename changed ones, report stale
 *   npm run db:sync-tags -- --prune # also delete stale tags no listing is using
 *
 * Safe to re-run. Adding and renaming happen by default; deleting never does
 * unless you pass --prune, and even then a stale tag that is still attached to
 * a listing is kept and reported rather than silently unlinked.
 */
import "dotenv/config";
import { eq, inArray, notInArray, sql } from "drizzle-orm";

import * as schema from "@/db/schema";
import { db } from "@/lib/db";
import { TAG_TAXONOMY, type TagCategory } from "@/lib/constants";
import { slugify } from "@/lib/slug";

const PRUNE = process.argv.includes("--prune");

async function main() {
  const desired = (Object.entries(TAG_TAXONOMY) as [TagCategory, string[]][])
    .flatMap(([category, names]) =>
      names.map((name) => ({
        name,
        slug: slugify(name),
        category,
        status: "approved" as const,
      })),
    );

  const duplicates = desired
    .map((t) => t.slug)
    .filter((slug, i, all) => all.indexOf(slug) !== i);
  if (duplicates.length > 0) {
    throw new Error(`Taxonomy produces duplicate slugs: ${duplicates.join(", ")}`);
  }

  // Insert new tags; if the slug already exists, refresh its display name and
  // category so renames in constants.ts flow through without losing listing links.
  const result = await db
    .insert(schema.tags)
    .values(desired)
    .onConflictDoUpdate({
      target: schema.tags.slug,
      set: {
        name: sql`excluded.name`,
        category: sql`excluded.category`,
        updatedAt: new Date(),
      },
    })
    .returning({ slug: schema.tags.slug });

  console.log(`Upserted ${result.length} taxonomy tags.`);

  // Anything approved that is no longer in the taxonomy. User-suggested tags
  // (suggestedBy set) are left alone — they aren't ours to manage.
  const stale = await db
    .select({
      id: schema.tags.id,
      name: schema.tags.name,
      slug: schema.tags.slug,
      category: schema.tags.category,
      uses: sql<number>`(
        select count(*)::int from ${schema.listingTags}
        where ${schema.listingTags.tagId} = ${schema.tags.id}
      )`,
    })
    .from(schema.tags)
    .where(
      sql`${notInArray(schema.tags.slug, desired.map((t) => t.slug))}
          and ${eq(schema.tags.status, "approved")}
          and ${schema.tags.suggestedBy} is null`,
    );

  if (stale.length === 0) {
    console.log("No stale tags.");
    return;
  }

  console.log(`\n${stale.length} stale tag(s) not in the taxonomy:`);
  for (const t of stale) {
    console.log(`  ${t.category.padEnd(10)} ${t.name}  (${t.uses} listing(s))`);
  }

  if (!PRUNE) {
    console.log("\nRe-run with --prune to delete the unused ones.");
    return;
  }

  const unused = stale.filter((t) => t.uses === 0);
  const inUse = stale.filter((t) => t.uses > 0);

  if (unused.length > 0) {
    await db.delete(schema.tags).where(
      inArray(
        schema.tags.id,
        unused.map((t) => t.id),
      ),
    );
    console.log(`\nDeleted ${unused.length} unused stale tag(s).`);
  }
  if (inUse.length > 0) {
    console.log(
      `Kept ${inUse.length} stale tag(s) still attached to listings — ` +
        `retag those listings first, then re-run.`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
