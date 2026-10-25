DROP TABLE "integration_links";--> statement-breakpoint
DROP TABLE "integrations";--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"institution_name" text NOT NULL,
	"institution_country" text NOT NULL,
	"institution_logo_url" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integrations_externalId_unique" UNIQUE("external_id")
);
--> statement-breakpoint
ALTER TABLE "integrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "integration_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"integration_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"identification_hash" text NOT NULL,
	"name" text NOT NULL,
	"iban" text,
	"currency" text NOT NULL,
	"subaccount_id" uuid,
	"linked_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"sync_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integration_accounts_subaccountId_unique" UNIQUE("subaccount_id"),
	CONSTRAINT "integration_accounts_integrationId_identificationHash_unique" UNIQUE("integration_id","identification_hash")
);
--> statement-breakpoint
ALTER TABLE "integration_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_accounts" ADD CONSTRAINT "integration_accounts_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_accounts" ADD CONSTRAINT "integration_accounts_subaccount_id_subaccounts_id_fk" FOREIGN KEY ("subaccount_id") REFERENCES "public"."subaccounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "integrations_user_id_index" ON "integrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "integration_accounts_user_id_index" ON "integration_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_subaccount_id_external_ref_index" ON "transactions" USING btree ("subaccount_id","external_ref");--> statement-breakpoint
CREATE POLICY "integrations_allow_all_for_owner_policy" ON "integrations" AS PERMISSIVE FOR ALL TO "authenticated" USING ("integrations"."user_id" = (select auth.uid())) WITH CHECK ("integrations"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "integration_accounts_allow_all_for_owner_policy" ON "integration_accounts" AS PERMISSIVE FOR ALL TO "authenticated" USING ("integration_accounts"."user_id" = (select auth.uid())) WITH CHECK ("integration_accounts"."user_id" = (select auth.uid()));