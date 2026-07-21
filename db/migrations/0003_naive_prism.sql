CREATE TABLE "listing_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date
);
--> statement-breakpoint
DROP INDEX "listings_start_date_idx";--> statement-breakpoint
DROP INDEX "listings_end_date_idx";--> statement-breakpoint
ALTER TABLE "listing_dates" ADD CONSTRAINT "listing_dates_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listing_dates_listing_start_idx" ON "listing_dates" USING btree ("listing_id","start_date");--> statement-breakpoint
CREATE INDEX "listing_dates_effective_end_idx" ON "listing_dates" USING btree (coalesce("end_date", "start_date"));--> statement-breakpoint
--> Backfill: every dated listing becomes a single-run listing. Hand-added to
--> this generated file — dropping the columns below without it would discard
--> the schedule of every existing listing.
INSERT INTO "listing_dates" ("listing_id", "start_date", "end_date")
SELECT "id", "start_date", NULLIF("end_date", "start_date")
FROM "listings"
WHERE "start_date" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN "start_date";--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN "end_date";