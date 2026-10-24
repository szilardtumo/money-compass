-- Custom SQL migration file, put your code below! --
DROP FUNCTION IF EXISTS "public"."query_transaction_history"(text, text);
DROP FUNCTION IF EXISTS "public"."update_subaccount"(uuid, text);
DROP FUNCTION IF EXISTS "public"."update_transaction_balances"(uuid, timestamp with time zone, numeric);
DROP EXTENSION IF EXISTS timescaledb;
