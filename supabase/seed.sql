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

