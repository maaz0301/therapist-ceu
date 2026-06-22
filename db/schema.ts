import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * TherapistCEU.com database schema (Phase 1).
 * See therapis-ceu-master.md §4–§5. Authorization is enforced in Server Actions;
 * RLS (db/rls.sql) is the backstop. Stripe (Phase 5) writes the subscription_* columns.
 */

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRole = pgEnum("user_role", ["trainer", "admin"]);

export const listingStatus = pgEnum("listing_status", [
  "pending",
  "approved",
  "rejected",
  "inactive",
]);

export const listingFormat = pgEnum("listing_format", [
  "Live Virtual",
  "In-Person",
  "Self-Paced",
  "Hybrid",
]);

export const tagCategory = pgEnum("tag_category", [
  "modality",
  "population",
  "topic",
  "business",
]);

export const tagStatus = pgEnum("tag_status", ["approved", "suggested"]);

export const subscriptionStatus = pgEnum("subscription_status", [
  "none",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
]);

export const subscriptionTier = pgEnum("subscription_tier", ["basic", "pro"]);

export const accountStatus = pgEnum("account_status", ["active", "suspended"]);

export const analyticsType = pgEnum("analytics_type", ["view", "link_click"]);

// ---------------------------------------------------------------------------
// profiles (1:1 with auth.users)
// ---------------------------------------------------------------------------

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  role: userRole("role").notNull().default("trainer"),
  fullName: text("full_name"),
  credentials: text("credentials"),
  bio: text("bio"),
  websiteUrl: text("website_url"),
  contactEmail: text("contact_email"),
  // Subscription state — plain columns now; Stripe drives them in Phase 5.
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionStatus: subscriptionStatus("subscription_status")
    .notNull()
    .default("none"),
  subscriptionTier: subscriptionTier("subscription_tier"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  accountStatus: accountStatus("account_status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// listings
// ---------------------------------------------------------------------------

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trainerId: uuid("trainer_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    status: listingStatus("status").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    active: boolean("active").notNull().default(false),

    title: text("title").notNull(),
    description: text("description").notNull(),
    presenterNames: text("presenter_names").notNull(),
    credentials: text("credentials").notNull(),
    format: listingFormat("format").notNull(),

    // Location: in-person states live in listing_states; online covers any state.
    isOnline: boolean("is_online").notNull().default(false),

    // Schedule: either a start/end window OR available on demand.
    startDate: date("start_date"),
    endDate: date("end_date"),
    onDemand: boolean("on_demand").notNull().default(false),

    durationHours: numeric("duration_hours"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
    registrationUrl: text("registration_url").notNull(),

    hasCeu: boolean("has_ceu").notNull().default(false),
    ceCount: integer("ce_count"),
    accreditingBody: text("accrediting_body"),

    websiteUrl: text("website_url"),
    imageUrl: text("image_url"),

    searchVector: tsvector("search_vector").generatedAlwaysAs(
      sql`to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(presenter_names, ''))`,
    ),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("listings_slug_idx").on(table.slug),
    index("listings_trainer_idx").on(table.trainerId),
    index("listings_status_idx").on(table.status),
    index("listings_active_idx").on(table.active),
    index("listings_format_idx").on(table.format),
    index("listings_has_ceu_idx").on(table.hasCeu),
    index("listings_price_idx").on(table.price),
    index("listings_start_date_idx").on(table.startDate),
    index("listings_end_date_idx").on(table.endDate),
    index("listings_search_idx").using("gin", table.searchVector),
  ],
);

// ---------------------------------------------------------------------------
// listing_states (many-to-many: in-person states)
// ---------------------------------------------------------------------------

export const listingStates = pgTable(
  "listing_states",
  {
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    stateCode: text("state_code").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.listingId, table.stateCode] }),
    index("listing_states_state_idx").on(table.stateCode),
  ],
);

// ---------------------------------------------------------------------------
// tags
// ---------------------------------------------------------------------------

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    category: tagCategory("category").notNull(),
    status: tagStatus("status").notNull().default("approved"),
    suggestedBy: uuid("suggested_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("tags_slug_idx").on(table.slug),
    index("tags_category_idx").on(table.category),
    index("tags_status_idx").on(table.status),
  ],
);

// ---------------------------------------------------------------------------
// listing_tags (many-to-many)
// ---------------------------------------------------------------------------

export const listingTags = pgTable(
  "listing_tags",
  {
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.listingId, table.tagId] }),
    index("listing_tags_tag_idx").on(table.tagId),
  ],
);

// ---------------------------------------------------------------------------
// analytics_events (append-only)
// ---------------------------------------------------------------------------

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    type: analyticsType("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("analytics_listing_type_created_idx").on(
      table.listingId,
      table.type,
      table.createdAt,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
