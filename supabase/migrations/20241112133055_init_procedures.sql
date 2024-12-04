-- Custom SQL migration file, put you code below! --

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

CREATE OR REPLACE FUNCTION "public"."update_transaction_balances"("_subaccount_id" "uuid", "fromdate" timestamp with time zone, "amounttoadd" numeric) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin

update transactions
set balance = balance + amountToAdd
where subaccount_id = _subaccount_id and started_date > fromDate;

end;
$$;
