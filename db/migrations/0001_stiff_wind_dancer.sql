ALTER TABLE "listings" ALTER COLUMN "format" SET DATA TYPE text;--> statement-breakpoint
UPDATE "listings" SET "format" = 'On-Demand' WHERE "format" = 'Self-Paced';--> statement-breakpoint
DROP TYPE "public"."listing_format";--> statement-breakpoint
CREATE TYPE "public"."listing_format" AS ENUM('Live Virtual', 'In-Person', 'On-Demand', 'Hybrid');--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "format" SET DATA TYPE "public"."listing_format" USING "format"::"public"."listing_format";