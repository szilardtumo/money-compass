DROP INDEX "transactions_started_date_idx";--> statement-breakpoint
CREATE INDEX "accounts_user_id_index" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subaccounts_account_id_index" ON "subaccounts" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "transactions_user_id_subaccount_id_started_date_sequence_index" ON "transactions" USING btree ("user_id","subaccount_id","started_date" DESC NULLS LAST,"sequence" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "exchange_rates" DROP CONSTRAINT "exchange_rates_pkey";
--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_pkey" PRIMARY KEY("to","from");--> statement-breakpoint
ALTER POLICY "accounts_allow_all_for_owner_policy" ON "accounts" TO authenticated USING ("accounts"."user_id" = (select auth.uid())) WITH CHECK ("accounts"."user_id" = (select auth.uid()));--> statement-breakpoint
ALTER POLICY "profiles_allow_all_for_owner_policy" ON "profiles" TO authenticated USING ("profiles"."id" = (select auth.uid()));--> statement-breakpoint
ALTER POLICY "subaccounts_allow_all_for_owner_policy" ON "subaccounts" TO authenticated USING (EXISTS (SELECT 1 FROM "accounts" WHERE ("accounts"."id" = "subaccounts"."account_id" and "accounts"."user_id" = (select auth.uid())))) WITH CHECK (EXISTS (SELECT 1 FROM "accounts" WHERE ("accounts"."id" = "subaccounts"."account_id" and "accounts"."user_id" = (select auth.uid()))));--> statement-breakpoint
ALTER POLICY "transactions_allow_all_for_owner_policy" ON "transactions" TO authenticated USING ("transactions"."user_id" = (select auth.uid())) WITH CHECK ("transactions"."user_id" = (select auth.uid()));
