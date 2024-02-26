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


INSERT INTO public.accounts VALUES ('21240762-fdd7-4336-9292-7bc12af37b79', '2024-02-26 11:01:47.818804+00', 'Revolut', 'b42f2f4c-0f89-49b7-9eae-25e65566df04');

INSERT INTO public.currencies VALUES ('eur', 'Euro', 'Europe');
INSERT INTO public.currencies VALUES ('huf', 'Hungarian Forint', 'Hungary');
INSERT INTO public.currencies VALUES ('ron', 'Romanian Leu', 'Romania');
INSERT INTO public.currencies VALUES ('usd', 'US Dollar', 'United States of America');

INSERT INTO public.exchange_rates VALUES ('huf', 'eur', 0.0026);
INSERT INTO public.exchange_rates VALUES ('eur', 'huf', 387.94);
INSERT INTO public.exchange_rates VALUES ('ron', 'eur', 0.20);
INSERT INTO public.exchange_rates VALUES ('ron', 'huf', 77.92);
INSERT INTO public.exchange_rates VALUES ('eur', 'ron', 4.98);
INSERT INTO public.exchange_rates VALUES ('huf', 'ron', 0.013);
INSERT INTO public.exchange_rates VALUES ('usd', 'eur', 0.93);
INSERT INTO public.exchange_rates VALUES ('usd', 'huf', 360.23);
INSERT INTO public.exchange_rates VALUES ('usd', 'ron', 4.62);
INSERT INTO public.exchange_rates VALUES ('eur', 'usd', 1.08);
INSERT INTO public.exchange_rates VALUES ('huf', 'usd', 0.0028);
INSERT INTO public.exchange_rates VALUES ('ron', 'usd', 0.22);

INSERT INTO public.subaccounts VALUES ('65015151-a755-48a7-acd1-a82b2908a2fb', '21240762-fdd7-4336-9292-7bc12af37b79', 'huf', '2024-02-26 11:01:48.091268+00');

INSERT INTO public.transactions VALUES ('4dc21df9-7cdf-43a6-a06b-f8018eb8f6f5', NULL, 122, '2024-02-26 11:02:46.071+00', '2024-02-26 11:02:46.071+00', '', 'other', '65015151-a755-48a7-acd1-a82b2908a2fb', 122);
INSERT INTO public.transactions VALUES ('a4309fd4-3b87-4f9c-988c-46d46f008aff', NULL, 33333, '2024-02-26 11:02:52.398+00', '2024-02-26 11:02:52.398+00', '', 'other', '65015151-a755-48a7-acd1-a82b2908a2fb', 33455);
INSERT INTO public.transactions VALUES ('66da44f3-6637-42c9-9992-c58719af0b03', NULL, 10000, '2024-02-26 11:03:01.283+00', '2024-02-26 11:03:01.283+00', '', 'card_payment', '65015151-a755-48a7-acd1-a82b2908a2fb', 43455);
INSERT INTO public.transactions VALUES ('dd7b85fb-564f-46d3-a9af-f15feeaab37e', NULL, -1000, '2024-02-26 11:03:24.709+00', '2024-02-26 11:03:24.709+00', '', 'other', '65015151-a755-48a7-acd1-a82b2908a2fb', 42455);

