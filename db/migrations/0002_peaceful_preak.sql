CREATE INDEX "listings_status_active_created_idx" ON "listings" USING btree ("status","active","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "listings_created_at_idx" ON "listings" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "listings_trainer_created_idx" ON "listings" USING btree ("trainer_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "profiles_account_status_idx" ON "profiles" USING btree ("account_status");--> statement-breakpoint
CREATE INDEX "profiles_role_created_idx" ON "profiles" USING btree ("role","created_at" DESC NULLS LAST);