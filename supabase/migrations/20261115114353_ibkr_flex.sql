ALTER TABLE "integrations" ADD COLUMN "credentials" text;--> statement-breakpoint
ALTER TABLE "integration_accounts" ADD COLUMN "synced_from" date;