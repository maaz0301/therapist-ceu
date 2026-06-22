CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."analytics_type" AS ENUM('view', 'link_click');--> statement-breakpoint
CREATE TYPE "public"."listing_format" AS ENUM('Live Virtual', 'In-Person', 'Self-Paced', 'Hybrid');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('pending', 'approved', 'rejected', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('none', 'trialing', 'active', 'past_due', 'canceled', 'unpaid');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('basic', 'pro');--> statement-breakpoint
CREATE TYPE "public"."tag_category" AS ENUM('modality', 'population', 'topic', 'business');--> statement-breakpoint
CREATE TYPE "public"."tag_status" AS ENUM('approved', 'suggested');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('trainer', 'admin');--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"type" "analytics_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_states" (
	"listing_id" uuid NOT NULL,
	"state_code" text NOT NULL,
	CONSTRAINT "listing_states_listing_id_state_code_pk" PRIMARY KEY("listing_id","state_code")
);
--> statement-breakpoint
CREATE TABLE "listing_tags" (
	"listing_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "listing_tags_listing_id_tag_id_pk" PRIMARY KEY("listing_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"status" "listing_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"active" boolean DEFAULT false NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"presenter_names" text NOT NULL,
	"credentials" text NOT NULL,
	"format" "listing_format" NOT NULL,
	"is_online" boolean DEFAULT false NOT NULL,
	"start_date" date,
	"end_date" date,
	"on_demand" boolean DEFAULT false NOT NULL,
	"duration_hours" numeric,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"registration_url" text NOT NULL,
	"has_ceu" boolean DEFAULT false NOT NULL,
	"ce_count" integer,
	"accrediting_body" text,
	"website_url" text,
	"image_url" text,
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(presenter_names, ''))) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" "user_role" DEFAULT 'trainer' NOT NULL,
	"full_name" text,
	"credentials" text,
	"bio" text,
	"website_url" text,
	"contact_email" text,
	"stripe_customer_id" text,
	"subscription_status" "subscription_status" DEFAULT 'none' NOT NULL,
	"subscription_tier" "subscription_tier",
	"current_period_end" timestamp with time zone,
	"account_status" "account_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" "tag_category" NOT NULL,
	"status" "tag_status" DEFAULT 'approved' NOT NULL,
	"suggested_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_states" ADD CONSTRAINT "listing_states_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_tags" ADD CONSTRAINT "listing_tags_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_tags" ADD CONSTRAINT "listing_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_trainer_id_profiles_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_suggested_by_profiles_id_fk" FOREIGN KEY ("suggested_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_listing_type_created_idx" ON "analytics_events" USING btree ("listing_id","type","created_at");--> statement-breakpoint
CREATE INDEX "listing_states_state_idx" ON "listing_states" USING btree ("state_code");--> statement-breakpoint
CREATE INDEX "listing_tags_tag_idx" ON "listing_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "listings_slug_idx" ON "listings" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "listings_trainer_idx" ON "listings" USING btree ("trainer_id");--> statement-breakpoint
CREATE INDEX "listings_status_idx" ON "listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "listings_active_idx" ON "listings" USING btree ("active");--> statement-breakpoint
CREATE INDEX "listings_format_idx" ON "listings" USING btree ("format");--> statement-breakpoint
CREATE INDEX "listings_has_ceu_idx" ON "listings" USING btree ("has_ceu");--> statement-breakpoint
CREATE INDEX "listings_price_idx" ON "listings" USING btree ("price");--> statement-breakpoint
CREATE INDEX "listings_start_date_idx" ON "listings" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "listings_end_date_idx" ON "listings" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "listings_search_idx" ON "listings" USING gin ("search_vector");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tags_category_idx" ON "tags" USING btree ("category");--> statement-breakpoint
CREATE INDEX "tags_status_idx" ON "tags" USING btree ("status");