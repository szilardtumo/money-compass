CREATE TABLE "securities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"isin" text,
	"symbol" text NOT NULL,
	"exchange" text NOT NULL,
	"quote_symbol" text,
	"name" text NOT NULL,
	"currency" text NOT NULL,
	"kind" text NOT NULL,
	"price_status" text DEFAULT 'priced' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "securities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "security_prices" (
	"security_id" uuid NOT NULL,
	"date" date NOT NULL,
	"close" numeric(65, 30) NOT NULL,
	"currency" text NOT NULL,
	"source" text NOT NULL,
	CONSTRAINT "security_prices_security_id_date_pk" PRIMARY KEY("security_id","date")
);
--> statement-breakpoint
ALTER TABLE "security_prices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "investment_trades" (
	"transaction_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"security_id" uuid NOT NULL,
	"quantity" numeric(65, 30) NOT NULL,
	"price" numeric(65, 30) NOT NULL,
	CONSTRAINT "investment_trades_quantity_check" CHECK ("investment_trades"."quantity" <> 0)
);
--> statement-breakpoint
ALTER TABLE "investment_trades" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "portfolio_valuations" (
	"subaccount_id" uuid NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"date" date NOT NULL,
	"market_value" numeric(65, 30) NOT NULL,
	"cost_basis" numeric(65, 30) NOT NULL,
	CONSTRAINT "portfolio_valuations_subaccount_id_date_pk" PRIMARY KEY("subaccount_id","date")
);
--> statement-breakpoint
ALTER TABLE "portfolio_valuations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "securities" ADD CONSTRAINT "securities_currency_currencies_id_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "security_prices" ADD CONSTRAINT "security_prices_security_id_securities_id_fk" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_prices" ADD CONSTRAINT "security_prices_currency_currencies_id_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "investment_trades" ADD CONSTRAINT "investment_trades_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_trades" ADD CONSTRAINT "investment_trades_security_id_securities_id_fk" FOREIGN KEY ("security_id") REFERENCES "public"."securities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_valuations" ADD CONSTRAINT "portfolio_valuations_subaccount_id_subaccounts_id_fk" FOREIGN KEY ("subaccount_id") REFERENCES "public"."subaccounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "securities_isin_index" ON "securities" USING btree ("isin");--> statement-breakpoint
CREATE UNIQUE INDEX "securities_symbol_exchange_index" ON "securities" USING btree ("symbol","exchange") WHERE "securities"."isin" IS NULL;--> statement-breakpoint
CREATE INDEX "investment_trades_security_id_index" ON "investment_trades" USING btree ("security_id");--> statement-breakpoint
CREATE POLICY "securities_allow_select_for_all_policy" ON "securities" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "security_prices_allow_select_for_all_policy" ON "security_prices" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "investment_trades_allow_all_for_owner_policy" ON "investment_trades" AS PERMISSIVE FOR ALL TO "authenticated" USING ("investment_trades"."user_id" = (select auth.uid())) WITH CHECK ("investment_trades"."user_id" = (select auth.uid()) AND EXISTS (SELECT 1 FROM "transactions" WHERE ("transactions"."id" = "investment_trades"."transaction_id" and "transactions"."user_id" = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "portfolio_valuations_allow_all_for_owner_policy" ON "portfolio_valuations" AS PERMISSIVE FOR ALL TO "authenticated" USING ("portfolio_valuations"."user_id" = (select auth.uid())) WITH CHECK ("portfolio_valuations"."user_id" = (select auth.uid()) AND EXISTS (SELECT 1 FROM "subaccounts" JOIN "accounts" ON "accounts"."id" = "subaccounts"."account_id" WHERE ("subaccounts"."id" = "portfolio_valuations"."subaccount_id" and "accounts"."user_id" = (select auth.uid()))));