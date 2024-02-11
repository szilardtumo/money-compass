
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA IF NOT EXISTS "public";

ALTER SCHEMA "public" OWNER TO "pg_database_owner";

CREATE TYPE "public"."transaction_type" AS ENUM (
    'card_payment',
    'transfer',
    'exchange',
    'topup',
    'correction',
    'other'
);

ALTER TYPE "public"."transaction_type" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" DEFAULT ''::"text" NOT NULL,
    "user_id" "uuid" NOT NULL
);

ALTER TABLE "public"."accounts" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."currencies" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "country" "text" NOT NULL
);

ALTER TABLE "public"."currencies" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."exchange_rates" (
    "from" "text" NOT NULL,
    "to" "text" NOT NULL,
    "rate" numeric NOT NULL
);

ALTER TABLE "public"."exchange_rates" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."subaccounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "currency" "text" NOT NULL,
    "value" numeric DEFAULT '0'::numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."subaccounts" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "external_ref" "text",
    "amount" numeric NOT NULL,
    "started_date" timestamp with time zone NOT NULL,
    "completed_date" timestamp with time zone NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "type" "public"."transaction_type" NOT NULL,
    "subaccount_id" "uuid"
);

ALTER TABLE "public"."transactions" OWNER TO "postgres";

ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."currencies"
    ADD CONSTRAINT "currencies_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."exchange_rates"
    ADD CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("from", "to");

ALTER TABLE ONLY "public"."subaccounts"
    ADD CONSTRAINT "subaccounts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."exchange_rates"
    ADD CONSTRAINT "exchange_rates_from_fkey" FOREIGN KEY ("from") REFERENCES "public"."currencies"("id");

ALTER TABLE ONLY "public"."exchange_rates"
    ADD CONSTRAINT "exchange_rates_to_fkey" FOREIGN KEY ("to") REFERENCES "public"."currencies"("id");

ALTER TABLE ONLY "public"."subaccounts"
    ADD CONSTRAINT "subaccounts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."subaccounts"
    ADD CONSTRAINT "subaccounts_currency_fkey" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("id");

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_subaccount_id_fkey" FOREIGN KEY ("subaccount_id") REFERENCES "public"."subaccounts"("id") ON UPDATE CASCADE ON DELETE SET NULL;

CREATE POLICY "Enable read access for all users" ON "public"."exchange_rates" FOR SELECT USING (true);

CREATE POLICY "Enable read access for users based on user_id" ON "public"."accounts" FOR SELECT USING (("auth"."uid"() = "user_id"));

ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."currencies" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."exchange_rates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_user_policy" ON "public"."subaccounts" FOR SELECT USING (("auth"."uid"() = ( SELECT "accounts"."user_id"
   FROM "public"."accounts"
  WHERE ("accounts"."id" = "subaccounts"."account_id"))));

ALTER TABLE "public"."subaccounts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";

GRANT ALL ON TABLE "public"."currencies" TO "anon";
GRANT ALL ON TABLE "public"."currencies" TO "authenticated";
GRANT ALL ON TABLE "public"."currencies" TO "service_role";

GRANT ALL ON TABLE "public"."exchange_rates" TO "anon";
GRANT ALL ON TABLE "public"."exchange_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."exchange_rates" TO "service_role";

GRANT ALL ON TABLE "public"."subaccounts" TO "anon";
GRANT ALL ON TABLE "public"."subaccounts" TO "authenticated";
GRANT ALL ON TABLE "public"."subaccounts" TO "service_role";

GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;
