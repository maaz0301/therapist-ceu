import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq, inArray } from "drizzle-orm";
import postgres from "postgres";

import { TAG_TAXONOMY, type TagCategory } from "@/lib/constants";
import * as schema from "@/db/schema";

/**
 * Seeds the full Phase 1 tag taxonomy plus demo login accounts (admin + 3
 * trainers) and sample listings so the directory and portals have realistic
 * data to render. Idempotent: re-running updates rather than duplicates.
 *
 * Demo logins (all use DEMO_PASSWORD below):
 *   admin@therapistceu.test   — admin
 *   sarah@therapistceu.test   — trainer (Pro)
 *   marcus@therapistceu.test  — trainer (Basic)
 *   aisha@therapistceu.test   — trainer (Pro)
 */
config({ path: ".env.local" });

const DEMO_PASSWORD = "Password123!";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[()/+]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Missing DATABASE_URL");

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// Legacy fixed-UUID profiles from earlier seeds (pre demo accounts). Cleaned up.
const LEGACY_PROFILE_IDS = [
  "11111111-1111-1111-1111-111111111111",
  "22222222-2222-2222-2222-222222222222",
  "33333333-3333-3333-3333-333333333333",
];

const ADMIN = {
  email: "admin@therapistceu.test",
  fullName: "Megan Ellow",
  credentials: "LCSW",
};

const TRAINERS = [
  {
    key: "sarah",
    email: "sarah@therapistceu.test",
    fullName: "Dr. Sarah Chen",
    credentials: "LCSW, RPT-S",
    bio: "Trauma-focused clinician and EMDR consultant with 15 years of experience training therapists across the country.",
    websiteUrl: "https://example.com/sarah-chen",
    subscriptionTier: "pro" as const,
  },
  {
    key: "marcus",
    email: "marcus@therapistceu.test",
    fullName: "Marcus Rivera",
    credentials: "LMFT",
    bio: "Family systems specialist offering practical, ethics-forward continuing education for couples and family therapists.",
    websiteUrl: "https://example.com/marcus-rivera",
    subscriptionTier: "basic" as const,
  },
  {
    key: "aisha",
    email: "aisha@therapistceu.test",
    fullName: "Dr. Aisha Patel",
    credentials: "PsyD",
    bio: "Perinatal mental health expert and play therapy trainer passionate about accessible, evidence-based CEUs.",
    websiteUrl: "https://example.com/aisha-patel",
    subscriptionTier: "pro" as const,
  },
];

// Filled in by seedAccounts(): maps trainer key -> auth user id.
const trainerIdByKey: Record<string, string> = {};

type SeedListing = {
  slug: string;
  trainerKey: string;
  status: "approved" | "pending";
  active: boolean;
  title: string;
  description: string;
  presenterNames: string;
  credentials: string;
  format: "Live Virtual" | "In-Person" | "Self-Paced" | "Hybrid";
  isOnline: boolean;
  states: string[];
  startDate: string | null;
  endDate: string | null;
  onDemand: boolean;
  durationHours: string | null;
  price: string;
  registrationUrl: string;
  hasCeu: boolean;
  ceCount: number | null;
  accreditingBody: string | null;
  tagSlugs: string[];
};

const LISTINGS: SeedListing[] = [
  {
    slug: "emdr-foundations-trauma-treatment",
    trainerKey: TRAINERS[0].key,
    status: "approved",
    active: true,
    title: "EMDR Foundations for Trauma Treatment",
    description:
      "A comprehensive, EMDRIA-approved introduction to Eight-Phase EMDR therapy. Learn case conceptualization, resourcing, and reprocessing protocols with live demonstrations and small-group practice.",
    presenterNames: "Dr. Sarah Chen",
    credentials: "LCSW, RPT-S",
    format: "Live Virtual",
    isOnline: true,
    states: [],
    startDate: "2026-09-14",
    endDate: "2026-09-16",
    onDemand: false,
    durationHours: "18",
    price: "499.00",
    registrationUrl: "https://example.com/register/emdr-foundations",
    hasCeu: true,
    ceCount: 18,
    accreditingBody: "EMDRIA",
    tagSlugs: ["emdr", slugify("Trauma"), slugify("Adults")],
  },
  {
    slug: "ethics-law-private-practice",
    trainerKey: TRAINERS[1].key,
    status: "approved",
    active: true,
    title: "Ethics & Law for the Private Practice Therapist",
    description:
      "Stay compliant and confident. This workshop covers documentation, dual relationships, mandated reporting, and telehealth regulations with real-world case studies.",
    presenterNames: "Marcus Rivera",
    credentials: "LMFT",
    format: "Self-Paced",
    isOnline: true,
    states: [],
    startDate: null,
    endDate: null,
    onDemand: true,
    durationHours: "3",
    price: "79.00",
    registrationUrl: "https://example.com/register/ethics-law",
    hasCeu: true,
    ceCount: 3,
    accreditingBody: "APA",
    tagSlugs: [slugify("Ethics and Law"), slugify("Documentation and Notes")],
  },
  {
    slug: "perinatal-mental-health-certificate",
    trainerKey: TRAINERS[2].key,
    status: "approved",
    active: true,
    title: "Perinatal Mental Health Certificate Training",
    description:
      "An in-depth training on assessment and treatment of perinatal mood and anxiety disorders. Includes screening tools, treatment planning, and referral best practices.",
    presenterNames: "Dr. Aisha Patel",
    credentials: "PsyD",
    format: "Hybrid",
    isOnline: false,
    states: ["CA", "NV"],
    startDate: "2026-10-02",
    endDate: "2026-10-03",
    onDemand: false,
    durationHours: "14",
    price: "350.00",
    registrationUrl: "https://example.com/register/perinatal-certificate",
    hasCeu: true,
    ceCount: 14,
    accreditingBody: "Postpartum Support International",
    tagSlugs: [
      slugify("Perinatal Mental Health"),
      slugify("Perinatal / Postpartum"),
      slugify("Anxiety"),
    ],
  },
  {
    slug: "play-therapy-fundamentals",
    trainerKey: TRAINERS[2].key,
    status: "approved",
    active: true,
    title: "Child-Centered Play Therapy Fundamentals",
    description:
      "Build core play therapy skills for working with children. Covers the therapeutic powers of play, setting up your playroom, and limit-setting in CCPT.",
    presenterNames: "Dr. Aisha Patel",
    credentials: "PsyD",
    format: "In-Person",
    isOnline: false,
    states: ["TX"],
    startDate: "2026-11-08",
    endDate: "2026-11-08",
    onDemand: false,
    durationHours: "6",
    price: "150.00",
    registrationUrl: "https://example.com/register/play-therapy",
    hasCeu: true,
    ceCount: 6,
    accreditingBody: "APT",
    tagSlugs: [
      slugify("Child-Centered Play Therapy (CCPT)"),
      slugify("Children (under 12)"),
    ],
  },
  {
    slug: "dbt-skills-intensive",
    trainerKey: TRAINERS[0].key,
    status: "approved",
    active: true,
    title: "DBT Skills Intensive: Teaching the Four Modules",
    description:
      "A practical deep dive into teaching mindfulness, distress tolerance, emotion regulation, and interpersonal effectiveness in individual and group settings.",
    presenterNames: "Dr. Sarah Chen",
    credentials: "LCSW",
    format: "Live Virtual",
    isOnline: true,
    states: [],
    startDate: "2026-09-28",
    endDate: "2026-09-29",
    onDemand: false,
    durationHours: "12",
    price: "275.00",
    registrationUrl: "https://example.com/register/dbt-intensive",
    hasCeu: true,
    ceCount: 12,
    accreditingBody: "ASWB",
    tagSlugs: [
      slugify("Dialectical Behavior Therapy (DBT)"),
      slugify("Adolescents"),
    ],
  },
  {
    slug: "free-intro-telehealth-best-practices",
    trainerKey: TRAINERS[1].key,
    status: "approved",
    active: true,
    title: "Intro to Telehealth Best Practices (Free)",
    description:
      "A free primer on delivering effective and ethical telehealth: platform selection, privacy, engagement strategies, and managing clinical emergencies remotely.",
    presenterNames: "Marcus Rivera",
    credentials: "LMFT",
    format: "Self-Paced",
    isOnline: true,
    states: [],
    startDate: null,
    endDate: null,
    onDemand: true,
    durationHours: "1",
    price: "0.00",
    registrationUrl: "https://example.com/register/telehealth-intro",
    hasCeu: false,
    ceCount: null,
    accreditingBody: null,
    tagSlugs: [slugify("Telehealth")],
  },
  {
    slug: "advanced-ifs-pending",
    trainerKey: TRAINERS[0].key,
    status: "pending",
    active: false,
    title: "Advanced Internal Family Systems (IFS) Workshop",
    description:
      "An advanced workshop on working with protective parts, unburdening, and legacy burdens in complex trauma cases. Awaiting review.",
    presenterNames: "Dr. Sarah Chen",
    credentials: "LCSW",
    format: "Live Virtual",
    isOnline: true,
    states: [],
    startDate: "2026-12-05",
    endDate: "2026-12-06",
    onDemand: false,
    durationHours: "12",
    price: "320.00",
    registrationUrl: "https://example.com/register/advanced-ifs",
    hasCeu: true,
    ceCount: 12,
    accreditingBody: "ASWB",
    tagSlugs: [slugify("Internal Family Systems (IFS)"), slugify("Trauma")],
  },
];

async function seedTags() {
  const rows = (Object.entries(TAG_TAXONOMY) as [TagCategory, string[]][])
    .flatMap(([category, names]) =>
      names.map((name) => ({
        name,
        slug: slugify(name),
        category,
        status: "approved" as const,
      })),
    );

  await db
    .insert(schema.tags)
    .values(rows)
    .onConflictDoNothing({ target: schema.tags.slug });

  console.log(`Seeded ${rows.length} tags.`);
}

/** Creates an auth user (email confirmed) or returns the existing one's id. */
async function getOrCreateUser(
  email: string,
  password: string,
): Promise<string> {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.data?.user) return created.data.user.id;

  // Already exists — find it and reset the password to the known demo value.
  const { data: list } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const found = list?.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!found) {
    throw created.error ?? new Error(`Could not create or find user ${email}`);
  }
  await admin.auth.admin.updateUserById(found.id, { password });
  return found.id;
}

async function seedAccounts() {
  const adminId = await getOrCreateUser(ADMIN.email, DEMO_PASSWORD);
  await db
    .insert(schema.profiles)
    .values({
      id: adminId,
      role: "admin",
      fullName: ADMIN.fullName,
      credentials: ADMIN.credentials,
      contactEmail: ADMIN.email,
      subscriptionStatus: "none",
      accountStatus: "active",
    })
    .onConflictDoUpdate({
      target: schema.profiles.id,
      set: {
        role: "admin",
        fullName: ADMIN.fullName,
        credentials: ADMIN.credentials,
        contactEmail: ADMIN.email,
      },
    });

  for (const t of TRAINERS) {
    const id = await getOrCreateUser(t.email, DEMO_PASSWORD);
    trainerIdByKey[t.key] = id;

    await db
      .insert(schema.profiles)
      .values({
        id,
        role: "trainer",
        fullName: t.fullName,
        credentials: t.credentials,
        bio: t.bio,
        websiteUrl: t.websiteUrl,
        contactEmail: t.email,
        subscriptionStatus: "active",
        subscriptionTier: t.subscriptionTier,
        accountStatus: "active",
      })
      .onConflictDoUpdate({
        target: schema.profiles.id,
        set: {
          role: "trainer",
          fullName: t.fullName,
          credentials: t.credentials,
          bio: t.bio,
          websiteUrl: t.websiteUrl,
          contactEmail: t.email,
          subscriptionStatus: "active",
          subscriptionTier: t.subscriptionTier,
        },
      });
  }
  console.log(`Seeded 1 admin + ${TRAINERS.length} trainer accounts.`);
}

async function seedListings() {
  for (const l of LISTINGS) {
    const [row] = await db
      .insert(schema.listings)
      .values({
        slug: l.slug,
        trainerId: trainerIdByKey[l.trainerKey],
        status: l.status,
        active: l.active,
        title: l.title,
        description: l.description,
        presenterNames: l.presenterNames,
        credentials: l.credentials,
        format: l.format,
        isOnline: l.isOnline,
        startDate: l.startDate,
        endDate: l.endDate,
        onDemand: l.onDemand,
        durationHours: l.durationHours,
        price: l.price,
        registrationUrl: l.registrationUrl,
        hasCeu: l.hasCeu,
        ceCount: l.ceCount,
        accreditingBody: l.accreditingBody,
      })
      .onConflictDoUpdate({
        target: schema.listings.slug,
        set: {
          // Repoint ownership to the real demo auth account.
          trainerId: trainerIdByKey[l.trainerKey],
          status: l.status,
          active: l.active,
          title: l.title,
          description: l.description,
          price: l.price,
        },
      })
      .returning({ id: schema.listings.id });

    const listingId = row.id;

    // Reset states/tags for this listing, then re-link.
    await db
      .delete(schema.listingStates)
      .where(inArray(schema.listingStates.listingId, [listingId]));
    if (l.states.length > 0) {
      await db.insert(schema.listingStates).values(
        l.states.map((stateCode) => ({ listingId, stateCode })),
      );
    }

    await db
      .delete(schema.listingTags)
      .where(inArray(schema.listingTags.listingId, [listingId]));

    if (l.tagSlugs.length > 0) {
      const tagRows = await db
        .select({ id: schema.tags.id })
        .from(schema.tags)
        .where(inArray(schema.tags.slug, l.tagSlugs));
      if (tagRows.length > 0) {
        await db
          .insert(schema.listingTags)
          .values(tagRows.map((tag) => ({ listingId, tagId: tag.id })))
          .onConflictDoNothing();
      }
    }
  }
  console.log(`Seeded ${LISTINGS.length} listings.`);
}

async function seedAnalytics() {
  const rows = await db
    .select({ id: schema.listings.id })
    .from(schema.listings)
    .where(
      and(
        eq(schema.listings.status, "approved"),
        eq(schema.listings.active, true),
      ),
    );
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return;

  // Reset so re-running the seed doesn't inflate counts.
  await db
    .delete(schema.analyticsEvents)
    .where(inArray(schema.analyticsEvents.listingId, ids));

  const now = Date.now();
  const values: {
    listingId: string;
    type: "view" | "link_click";
    createdAt: Date;
  }[] = [];

  for (const id of ids) {
    const viewCount = 25 + Math.floor(Math.random() * 90);
    for (let i = 0; i < viewCount; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      values.push({
        listingId: id,
        type: "view",
        createdAt: new Date(
          now - daysAgo * 864e5 - Math.floor(Math.random() * 864e5),
        ),
      });
    }
    const clickCount = Math.floor(viewCount * (0.1 + Math.random() * 0.2));
    for (let i = 0; i < clickCount; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      values.push({
        listingId: id,
        type: "link_click",
        createdAt: new Date(now - daysAgo * 864e5),
      });
    }
  }

  // Insert in chunks to keep the statement size reasonable.
  for (let i = 0; i < values.length; i += 500) {
    await db.insert(schema.analyticsEvents).values(values.slice(i, i + 500));
  }
  console.log(`Seeded ${values.length} analytics events.`);
}

async function cleanupLegacyProfiles() {
  // Listings have already been repointed to the demo auth accounts, so the old
  // fixed-UUID profiles are now childless and safe to remove.
  await db
    .delete(schema.profiles)
    .where(inArray(schema.profiles.id, LEGACY_PROFILE_IDS));
}

async function main() {
  try {
    await seedTags();
    await seedAccounts();
    await seedListings();
    await cleanupLegacyProfiles();
    await seedAnalytics();
    console.log("Seed complete.");
    console.log(
      `\nDemo logins (password: ${DEMO_PASSWORD}):\n` +
        `  ${ADMIN.email} (admin)\n` +
        TRAINERS.map((t) => `  ${t.email} (${t.subscriptionTier} trainer)`).join(
          "\n",
        ),
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
