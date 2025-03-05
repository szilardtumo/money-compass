CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"external_id" text NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "integrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "integration_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_id" uuid NOT NULL,
	"subaccount_id" uuid NOT NULL,
	"integration_account_id" text NOT NULL,
	"last_synced_at" timestamp with time zone,
	"sync_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integration_links_subaccountId_unique" UNIQUE("subaccount_id")
);
--> statement-breakpoint
ALTER TABLE "integration_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "counterparty_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "data_source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_links" ADD CONSTRAINT "integration_links_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_links" ADD CONSTRAINT "integration_links_subaccount_id_subaccounts_id_fk" FOREIGN KEY ("subaccount_id") REFERENCES "public"."subaccounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "integrations_user_id_index" ON "integrations" USING btree ("user_id");--> statement-breakpoint
CREATE POLICY "integrations_allow_all_for_owner_policy" ON "integrations" AS PERMISSIVE FOR ALL TO "authenticated" USING ("integrations"."user_id" = (select auth.uid())) WITH CHECK ("integrations"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "integration_links_allow_all_for_owner_policy" ON "integration_links" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (SELECT 1 FROM "integrations" WHERE ("integrations"."id" = "integration_links"."integration_id" and "integrations"."user_id" = (select auth.uid())))) WITH CHECK (EXISTS (SELECT 1 FROM "integrations" WHERE ("integrations"."id" = "integration_links"."integration_id" and "integrations"."user_id" = (select auth.uid()))));--> statement-breakpoint
DROP TYPE "public"."transaction_type";