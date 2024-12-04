CREATE TYPE "public"."account_category" AS ENUM('checking', 'investment');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('card_payment', 'transfer', 'exchange', 'topup', 'correction', 'other');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"category" "account_category" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "currencies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	CONSTRAINT "currencies_name_unique" UNIQUE("name"),
	CONSTRAINT "currencies_id_check" CHECK ("currencies"."id" = lower("currencies"."id"))
);
--> statement-breakpoint
ALTER TABLE "currencies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exchange_rates" (
	"from" text NOT NULL,
	"to" text NOT NULL,
	"rate" numeric(65, 30) NOT NULL,
	CONSTRAINT "exchange_rates_pkey" PRIMARY KEY("from","to")
);
--> statement-breakpoint
ALTER TABLE "exchange_rates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"main_currency" text DEFAULT 'eur' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subaccounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT 'Default' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"account_id" uuid NOT NULL,
	"currency" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subaccounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_ref" text,
	"amount" numeric(65, 30) NOT NULL,
	"started_date" timestamp with time zone NOT NULL,
	"completed_date" timestamp with time zone NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"type" "transaction_type" NOT NULL,
	"subaccount_id" uuid NOT NULL,
	"balance" numeric(65, 30) NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sequence" integer GENERATED ALWAYS AS IDENTITY (sequence name "transactions_sequence_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	CONSTRAINT "transactions_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_from_currencies_id_fk" FOREIGN KEY ("from") REFERENCES "public"."currencies"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_to_currencies_id_fk" FOREIGN KEY ("to") REFERENCES "public"."currencies"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_main_currency_currencies_id_fk" FOREIGN KEY ("main_currency") REFERENCES "public"."currencies"("id") ON DELETE set default ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subaccounts" ADD CONSTRAINT "subaccounts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subaccounts" ADD CONSTRAINT "subaccounts_currency_currencies_id_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_subaccount_id_subaccounts_id_fk" FOREIGN KEY ("subaccount_id") REFERENCES "public"."subaccounts"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_started_date_idx" ON "transactions" USING btree ("subaccount_id","started_date" DESC NULLS LAST,"sequence");--> statement-breakpoint
CREATE VIEW "public"."balances" WITH (security_invoker = true) AS (select distinct on ("transactions"."subaccount_id") "subaccount_id" as "subaccount_id", "balance", "started_date" as "started_date" from "transactions" order by "transactions"."subaccount_id", "transactions"."started_date" desc, "transactions"."sequence");--> statement-breakpoint
CREATE POLICY "accounts_allow_all_for_owner_policy" ON "accounts" AS PERMISSIVE FOR ALL TO "authenticated" USING ("accounts"."user_id" = auth.uid()) WITH CHECK ("accounts"."user_id" = auth.uid());--> statement-breakpoint
CREATE POLICY "currencies_allow_select_for_all_policy" ON "currencies" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "exchange_rates_allow_select_for_all_policy" ON "exchange_rates" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "profiles_allow_all_for_owner_policy" ON "profiles" AS PERMISSIVE FOR ALL TO "authenticated" USING ("profiles"."id" = auth.uid());--> statement-breakpoint
CREATE POLICY "subaccounts_allow_all_for_owner_policy" ON "subaccounts" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (SELECT 1 FROM "accounts" WHERE ("accounts"."id" = "subaccounts"."account_id" and "accounts"."user_id" = auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM "accounts" WHERE ("accounts"."id" = "subaccounts"."account_id" and "accounts"."user_id" = auth.uid())));--> statement-breakpoint
CREATE POLICY "transactions_allow_all_for_owner_policy" ON "transactions" AS PERMISSIVE FOR ALL TO "authenticated" USING ("transactions"."user_id" = auth.uid()) WITH CHECK ("transactions"."user_id" = auth.uid());