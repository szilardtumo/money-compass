-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
DO $$ BEGIN
 CREATE TYPE "key_status" AS ENUM('default', 'valid', 'invalid', 'expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "key_type" AS ENUM('aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "account_category" AS ENUM('checking', 'investment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "factor_type" AS ENUM('totp', 'webauthn');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "factor_status" AS ENUM('unverified', 'verified');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "aal_level" AS ENUM('aal1', 'aal2', 'aal3');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "code_challenge_method" AS ENUM('s256', 'plain');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "transaction_type" AS ENUM('card_payment', 'transfer', 'exchange', 'topup', 'correction', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"category" "account_category" NOT NULL,
	CONSTRAINT "accounts_id_key" UNIQUE("id"),
	CONSTRAINT "accounts_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "currencies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subaccounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "balances" (
	"subaccount_id" uuid,
	"balance" numeric
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exchange_rates" (
	"from" text NOT NULL,
	"to" text NOT NULL,
	"rate" numeric NOT NULL,
	CONSTRAINT "exchange_rates_pkey" PRIMARY KEY("from","to")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"external_ref" text,
	"amount" numeric NOT NULL,
	"started_date" timestamp with time zone NOT NULL,
	"completed_date" timestamp with time zone NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"type" "transaction_type" NOT NULL,
	"subaccount_id" uuid NOT NULL,
	"balance" numeric NOT NULL,
	CONSTRAINT "transactions_pkey" PRIMARY KEY("id","started_date")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_started_date_idx" ON "transactions" ("started_date");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subaccounts" ADD CONSTRAINT "public_subaccounts_currency_fkey" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subaccounts" ADD CONSTRAINT "subaccounts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exchange_rates" ADD CONSTRAINT "public_exchange_rates_from_fkey" FOREIGN KEY ("from") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exchange_rates" ADD CONSTRAINT "public_exchange_rates_to_fkey" FOREIGN KEY ("to") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "public_transactions_subaccount_id_fkey" FOREIGN KEY ("subaccount_id") REFERENCES "public"."subaccounts"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

*/