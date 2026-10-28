ALTER TABLE "transactions" ADD COLUMN "merchant_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_merchant_id_index" ON "transactions" USING btree ("merchant_id");--> statement-breakpoint
-- Transactions keep the merchant their alias pointed to
UPDATE "transactions" SET "merchant_id" = "merchant_aliases"."merchant_id" FROM "merchant_aliases" WHERE "merchant_aliases"."user_id" = "transactions"."user_id" AND "merchant_aliases"."key" = "transactions"."merchant_key";--> statement-breakpoint
ALTER TABLE "merchant_aliases" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "merchant_aliases_allow_all_for_owner_policy" ON "merchant_aliases" CASCADE;--> statement-breakpoint
DROP TABLE "merchant_aliases" CASCADE;--> statement-breakpoint
ALTER POLICY "transactions_allow_all_for_owner_policy" ON "transactions" TO authenticated USING ("transactions"."user_id" = (select auth.uid())) WITH CHECK ("transactions"."user_id" = (select auth.uid()) AND EXISTS (SELECT 1 FROM "subaccounts" JOIN "accounts" ON "accounts"."id" = "subaccounts"."account_id" WHERE ("subaccounts"."id" = "transactions"."subaccount_id" and "accounts"."user_id" = (select auth.uid()))) AND ("transactions"."category_id" IS NULL OR EXISTS (SELECT 1 FROM "categories" WHERE "categories"."id" = "transactions"."category_id" AND "categories"."user_id" = (select auth.uid()))) AND ("transactions"."merchant_id" IS NULL OR EXISTS (SELECT 1 FROM "merchants" WHERE "merchants"."id" = "transactions"."merchant_id" AND "merchants"."user_id" = (select auth.uid()))));
