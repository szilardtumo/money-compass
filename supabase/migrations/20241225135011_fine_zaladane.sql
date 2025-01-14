CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"external_id" text NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "integrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "integrations_user_id_index" ON "integrations" USING btree ("user_id");--> statement-breakpoint
CREATE POLICY "integrations_allow_all_for_owner_policy" ON "integrations" AS PERMISSIVE FOR ALL TO "authenticated" USING ("integrations"."user_id" = (select auth.uid())) WITH CHECK ("integrations"."user_id" = (select auth.uid()));