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

INSERT INTO public.accounts VALUES ('8ad11270-5ee9-4322-b5e0-ef89056ed9b7', '2024-02-05 14:23:47.748568+00', 'Revolut', 'b42f2f4c-0f89-49b7-9eae-25e65566df04');

INSERT INTO public.currencies VALUES ('EUR', 'Euro', 'Europe');
INSERT INTO public.currencies VALUES ('HUF', 'Hungarian Forint', 'Hungary');
INSERT INTO public.currencies VALUES ('RON', 'Romanian Leu', 'Romania');
INSERT INTO public.currencies VALUES ('USD', 'US Dollar', 'United States of America');

INSERT INTO public.exchange_rates VALUES ('EUR', 'RON', 4.98);
INSERT INTO public.exchange_rates VALUES ('EUR', 'USD', 1.08);
INSERT INTO public.exchange_rates VALUES ('HUF', 'RON', 0.013);
INSERT INTO public.exchange_rates VALUES ('HUF', 'USD', 0.0028);
INSERT INTO public.exchange_rates VALUES ('RON', 'EUR', 0.20);
INSERT INTO public.exchange_rates VALUES ('RON', 'HUF', 77.92);
INSERT INTO public.exchange_rates VALUES ('RON', 'USD', 0.22);
INSERT INTO public.exchange_rates VALUES ('USD', 'EUR', 0.93);
INSERT INTO public.exchange_rates VALUES ('USD', 'HUF', 360.23);
INSERT INTO public.exchange_rates VALUES ('USD', 'RON', 4.62);
INSERT INTO public.exchange_rates VALUES ('EUR', 'HUF', 387.94);
INSERT INTO public.exchange_rates VALUES ('HUF', 'EUR', 0.0026);

INSERT INTO public.subaccounts VALUES ('62b36689-cae6-46f6-9870-5df6877d6649', '8ad11270-5ee9-4322-b5e0-ef89056ed9b7', 'EUR', 10, '2024-02-07 11:25:15.743791+00');
INSERT INTO public.subaccounts VALUES ('f3386e7c-4c86-48f3-9c8f-ac99efab4609', '8ad11270-5ee9-4322-b5e0-ef89056ed9b7', 'HUF', 100, '2024-02-07 11:26:45.209338+00');
