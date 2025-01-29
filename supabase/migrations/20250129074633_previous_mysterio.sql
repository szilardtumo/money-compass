CREATE TABLE "integration_to_subaccounts" (
	"integration_id" uuid NOT NULL,
	"subaccount_id" uuid NOT NULL,
	"integration_account_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integration_to_subaccounts_integration_id_subaccount_id_pk" PRIMARY KEY("integration_id","subaccount_id"),
	CONSTRAINT "integration_to_subaccounts_subaccountId_unique" UNIQUE("subaccount_id"),
	CONSTRAINT "integration_to_subaccounts_integrationAccountId_unique" UNIQUE("integration_account_id")
);
--> statement-breakpoint
ALTER TABLE "integration_to_subaccounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "integration_to_subaccounts" ADD CONSTRAINT "integration_to_subaccounts_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_to_subaccounts" ADD CONSTRAINT "integration_to_subaccounts_subaccount_id_subaccounts_id_fk" FOREIGN KEY ("subaccount_id") REFERENCES "public"."subaccounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "integration_to_subaccounts_allow_all_for_owner_policy" ON "integration_to_subaccounts" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (SELECT 1 FROM "integrations" WHERE ("integrations"."id" = "integration_to_subaccounts"."integration_id" and "integrations"."user_id" = (select auth.uid())))) WITH CHECK (EXISTS (SELECT 1 FROM "integrations" WHERE ("integrations"."id" = "integration_to_subaccounts"."integration_id" and "integrations"."user_id" = (select auth.uid()))));