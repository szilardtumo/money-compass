CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"name" text NOT NULL,
	"category_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trips" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "trip_suggestions_dismissed_until" date;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "trip_id" uuid;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trips_user_id_start_date_index" ON "trips" USING btree ("user_id","start_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "trips_category_id_index" ON "trips" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_trip_id_index" ON "transactions" USING btree ("trip_id");--> statement-breakpoint
CREATE POLICY "trips_allow_all_for_owner_policy" ON "trips" AS PERMISSIVE FOR ALL TO "authenticated" USING ("trips"."user_id" = (select auth.uid())) WITH CHECK ("trips"."user_id" = (select auth.uid()) AND ("trips"."category_id" IS NULL OR EXISTS (SELECT 1 FROM "categories" WHERE "categories"."id" = "trips"."category_id" AND "categories"."user_id" = (select auth.uid()))));--> statement-breakpoint
ALTER POLICY "transactions_allow_all_for_owner_policy" ON "transactions" TO authenticated USING ("transactions"."user_id" = (select auth.uid())) WITH CHECK ("transactions"."user_id" = (select auth.uid()) AND EXISTS (SELECT 1 FROM "subaccounts" JOIN "accounts" ON "accounts"."id" = "subaccounts"."account_id" WHERE ("subaccounts"."id" = "transactions"."subaccount_id" and "accounts"."user_id" = (select auth.uid()))) AND ("transactions"."category_id" IS NULL OR EXISTS (SELECT 1 FROM "categories" WHERE "categories"."id" = "transactions"."category_id" AND "categories"."user_id" = (select auth.uid()))) AND ("transactions"."merchant_id" IS NULL OR EXISTS (SELECT 1 FROM "merchants" WHERE "merchants"."id" = "transactions"."merchant_id" AND "merchants"."user_id" = (select auth.uid()))) AND ("transactions"."trip_id" IS NULL OR EXISTS (SELECT 1 FROM "trips" WHERE "trips"."id" = "transactions"."trip_id" AND "trips"."user_id" = (select auth.uid()))));