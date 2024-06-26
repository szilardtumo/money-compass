
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

CREATE TYPE "public"."account_category" AS ENUM (
    'checking',
    'investment'
);

ALTER TYPE "public"."account_category" OWNER TO "postgres";

CREATE TYPE "public"."transaction_type" AS ENUM (
    'card_payment',
    'transfer',
    'exchange',
    'topup',
    'correction',
    'other'
);

ALTER TYPE "public"."transaction_type" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."query_transaction_history"("date_range" "text", "bucket_interval" "text") RETURNS TABLE("subaccount_id" "uuid", "interval_start" timestamp with time zone, "last_balance" numeric)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query 
    select
      transactions.subaccount_id,
      time_bucket(bucket_interval::interval, started_date) AS interval_start,
      last(balance, started_date) as last_balance
    from transactions
    where started_date >= now() - date_range::interval
    group by transactions.subaccount_id, interval_start
    order by interval_start asc;
end;
$$;

ALTER FUNCTION "public"."query_transaction_history"("date_range" "text", "bucket_interval" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_subaccount"("_id" "uuid", "_currency" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
declare 
  _prev_currency text;
  _rate numeric;
begin

 _prev_currency := (select currency from subaccounts where id = _id);

if _prev_currency != _currency then
  _rate := (select rate from exchange_rates where exchange_rates.from = _prev_currency and exchange_rates.to = _currency);

  update transactions
  set amount = amount * _rate, balance = balance * _rate
  where subaccount_id = _id;

  update subaccounts
  set currency = _currency
  where id = _id;
end if;

end;
$$;

ALTER FUNCTION "public"."update_subaccount"("_id" "uuid", "_currency" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_transaction_balances"("_subaccount_id" "uuid", "fromdate" timestamp with time zone, "amounttoadd" numeric) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin

update transactions
set balance = balance + amountToAdd
where subaccount_id = _subaccount_id and started_date > fromDate;

end;
$$;

ALTER FUNCTION "public"."update_transaction_balances"("_subaccount_id" "uuid", "fromdate" timestamp with time zone, "amounttoadd" numeric) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" DEFAULT ''::"text" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "category" "public"."account_category" NOT NULL
);

ALTER TABLE "public"."accounts" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "external_ref" "text",
    "amount" numeric NOT NULL,
    "started_date" timestamp with time zone NOT NULL,
    "completed_date" timestamp with time zone NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "type" "public"."transaction_type" NOT NULL,
    "subaccount_id" "uuid" NOT NULL,
    "balance" numeric NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "order" numeric NOT NULL
);

ALTER TABLE "public"."transactions" OWNER TO "postgres";

CREATE OR REPLACE VIEW "public"."balances" AS
 SELECT DISTINCT ON ("transactions"."subaccount_id") "transactions"."subaccount_id",
    "transactions"."balance"
   FROM "public"."transactions"
  ORDER BY "transactions"."subaccount_id", "transactions"."started_date" DESC;

ALTER TABLE "public"."balances" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."currencies" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "country" "text" NOT NULL,
    CONSTRAINT "currencies_id_check" CHECK (("lower"("id") = "id"))
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
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."subaccounts" OWNER TO "postgres";

ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."currencies"
    ADD CONSTRAINT "currencies_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."exchange_rates"
    ADD CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("from", "to");

ALTER TABLE ONLY "public"."subaccounts"
    ADD CONSTRAINT "subaccounts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id", "started_date");

CREATE INDEX "transactions_started_date_idx" ON "public"."transactions" USING "btree" ("started_date" DESC);

ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."exchange_rates"
    ADD CONSTRAINT "public_exchange_rates_from_fkey" FOREIGN KEY ("from") REFERENCES "public"."currencies"("id") ON UPDATE CASCADE;

ALTER TABLE ONLY "public"."exchange_rates"
    ADD CONSTRAINT "public_exchange_rates_to_fkey" FOREIGN KEY ("to") REFERENCES "public"."currencies"("id") ON UPDATE CASCADE;

ALTER TABLE ONLY "public"."subaccounts"
    ADD CONSTRAINT "public_subaccounts_currency_fkey" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("id") ON UPDATE CASCADE;

ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "public_transactions_subaccount_id_fkey" FOREIGN KEY ("subaccount_id") REFERENCES "public"."subaccounts"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."subaccounts"
    ADD CONSTRAINT "subaccounts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON UPDATE CASCADE ON DELETE CASCADE;

CREATE POLICY "Enable all for users based on accounts.user_id" ON "public"."subaccounts" USING (("account_id" IN ( SELECT "accounts"."id"
   FROM "public"."accounts"
  WHERE ("accounts"."user_id" = "auth"."uid"())))) WITH CHECK (("account_id" IN ( SELECT "accounts"."id"
   FROM "public"."accounts"
  WHERE ("accounts"."user_id" = "auth"."uid"()))));

CREATE POLICY "Enable all for users based on user_id" ON "public"."accounts" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "Enable all for users based on user_id" ON "public"."transactions" USING (("user_id" = "auth"."uid"()));

CREATE POLICY "Enable read access for all users" ON "public"."currencies" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."exchange_rates" FOR SELECT USING (true);

ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."currencies" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."exchange_rates" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."subaccounts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."query_transaction_history"("date_range" "text", "bucket_interval" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."query_transaction_history"("date_range" "text", "bucket_interval" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."query_transaction_history"("date_range" "text", "bucket_interval" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."update_subaccount"("_id" "uuid", "_currency" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_subaccount"("_id" "uuid", "_currency" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_subaccount"("_id" "uuid", "_currency" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."update_transaction_balances"("_subaccount_id" "uuid", "fromdate" timestamp with time zone, "amounttoadd" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_transaction_balances"("_subaccount_id" "uuid", "fromdate" timestamp with time zone, "amounttoadd" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_transaction_balances"("_subaccount_id" "uuid", "fromdate" timestamp with time zone, "amounttoadd" numeric) TO "service_role";

GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";

GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";

GRANT ALL ON TABLE "public"."balances" TO "anon";
GRANT ALL ON TABLE "public"."balances" TO "authenticated";
GRANT ALL ON TABLE "public"."balances" TO "service_role";

GRANT ALL ON TABLE "public"."currencies" TO "anon";
GRANT ALL ON TABLE "public"."currencies" TO "authenticated";
GRANT ALL ON TABLE "public"."currencies" TO "service_role";

GRANT ALL ON TABLE "public"."exchange_rates" TO "anon";
GRANT ALL ON TABLE "public"."exchange_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."exchange_rates" TO "service_role";

GRANT ALL ON TABLE "public"."subaccounts" TO "anon";
GRANT ALL ON TABLE "public"."subaccounts" TO "authenticated";
GRANT ALL ON TABLE "public"."subaccounts" TO "service_role";

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
