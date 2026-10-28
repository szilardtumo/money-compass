CREATE TYPE "public"."category_kind" AS ENUM('expense', 'income', 'excluded');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"name" text NOT NULL,
	"kind" "category_kind" NOT NULL,
	"icon" text DEFAULT 'tag' NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_userId_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "merchant_aliases" (
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"key" text NOT NULL,
	"merchant_id" uuid NOT NULL,
	CONSTRAINT "merchant_aliases_user_id_key_pk" PRIMARY KEY("user_id","key")
);
--> statement-breakpoint
ALTER TABLE "merchant_aliases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"name" text NOT NULL,
	"category_id" uuid,
	"auto_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "merchants_userId_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "merchants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "merchant_key" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "merchant_aliases" ADD CONSTRAINT "merchant_aliases_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "merchant_aliases_merchant_id_index" ON "merchant_aliases" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "merchants_category_id_index" ON "merchants" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_user_id_merchant_key_index" ON "transactions" USING btree ("user_id","merchant_key");--> statement-breakpoint
CREATE INDEX "transactions_category_id_index" ON "transactions" USING btree ("category_id");--> statement-breakpoint
CREATE POLICY "categories_allow_all_for_owner_policy" ON "categories" AS PERMISSIVE FOR ALL TO "authenticated" USING ("categories"."user_id" = (select auth.uid())) WITH CHECK ("categories"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "merchant_aliases_allow_all_for_owner_policy" ON "merchant_aliases" AS PERMISSIVE FOR ALL TO "authenticated" USING ("merchant_aliases"."user_id" = (select auth.uid())) WITH CHECK ("merchant_aliases"."user_id" = (select auth.uid()) AND EXISTS (SELECT 1 FROM "merchants" WHERE "merchants"."id" = "merchant_aliases"."merchant_id" AND "merchants"."user_id" = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "merchants_allow_all_for_owner_policy" ON "merchants" AS PERMISSIVE FOR ALL TO "authenticated" USING ("merchants"."user_id" = (select auth.uid())) WITH CHECK ("merchants"."user_id" = (select auth.uid()) AND ("merchants"."category_id" IS NULL OR EXISTS (SELECT 1 FROM "categories" WHERE "categories"."id" = "merchants"."category_id" AND "categories"."user_id" = (select auth.uid()))));--> statement-breakpoint
ALTER POLICY "transactions_allow_all_for_owner_policy" ON "transactions" TO authenticated USING ("transactions"."user_id" = (select auth.uid())) WITH CHECK ("transactions"."user_id" = (select auth.uid()) AND EXISTS (SELECT 1 FROM "subaccounts" JOIN "accounts" ON "accounts"."id" = "subaccounts"."account_id" WHERE ("subaccounts"."id" = "transactions"."subaccount_id" and "accounts"."user_id" = (select auth.uid()))) AND ("transactions"."category_id" IS NULL OR EXISTS (SELECT 1 FROM "categories" WHERE "categories"."id" = "transactions"."category_id" AND "categories"."user_id" = (select auth.uid()))));--> statement-breakpoint
-- Default categories for every user. Supabase Auth inserts users as supabase_auth_admin, so the
-- functions run as their owner, and they live outside the public schema the API exposes.
CREATE SCHEMA IF NOT EXISTS "private";--> statement-breakpoint
CREATE FUNCTION "private"."seed_default_categories"(_user_id uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  INSERT INTO public.categories (user_id, name, kind, icon, color) VALUES
    (_user_id, 'Groceries', 'expense', 'shopping-basket', '#22c55e'),
    (_user_id, 'Eating out', 'expense', 'utensils', '#f97316'),
    (_user_id, 'Transport', 'expense', 'car', '#3b82f6'),
    (_user_id, 'Shopping', 'expense', 'shopping-bag', '#ec4899'),
    (_user_id, 'Bills', 'expense', 'receipt', '#eab308'),
    (_user_id, 'Housing', 'expense', 'house', '#a855f7'),
    (_user_id, 'Health', 'expense', 'heart-pulse', '#ef4444'),
    (_user_id, 'Sport', 'expense', 'dumbbell', '#14b8a6'),
    (_user_id, 'Entertainment', 'expense', 'ticket', '#8b5cf6'),
    (_user_id, 'Travel', 'expense', 'plane', '#0ea5e9'),
    (_user_id, 'Subscriptions', 'expense', 'repeat', '#6366f1'),
    (_user_id, 'Taxes', 'expense', 'landmark', '#78716c'),
    (_user_id, 'Cash', 'expense', 'banknote', '#84cc16'),
    (_user_id, 'Fees', 'expense', 'percent', '#f43f5e'),
    (_user_id, 'Gifts', 'expense', 'gift', '#d946ef'),
    (_user_id, 'General', 'expense', 'tag', '#64748b'),
    (_user_id, 'Salary', 'income', 'briefcase', '#16a34a'),
    (_user_id, 'Rewards', 'income', 'sparkles', '#f59e0b'),
    (_user_id, 'Other income', 'income', 'arrow-down-left', '#0d9488'),
    (_user_id, 'Own transfers', 'excluded', 'arrow-left-right', '#94a3b8'),
    (_user_id, 'Excluded', 'excluded', 'eye-off', '#9ca3af')
  ON CONFLICT DO NOTHING;
$$;--> statement-breakpoint
CREATE FUNCTION "private"."seed_new_user_categories"() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM private.seed_default_categories(new.id);
  RETURN new;
END;
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION "private"."seed_default_categories"(uuid) FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON FUNCTION "private"."seed_new_user_categories"() FROM PUBLIC, anon, authenticated;--> statement-breakpoint
CREATE TRIGGER "seed_categories_on_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "private"."seed_new_user_categories"();--> statement-breakpoint
SELECT "private"."seed_default_categories"("id") FROM "auth"."users";
