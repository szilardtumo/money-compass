-- admin@admin.com, Admin123
INSERT INTO auth.users ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES ('00000000-0000-0000-0000-000000000000', '26746fa1-ba0b-40d9-b950-b7a6cbe34fec', 'authenticated', 'authenticated', 'admin@admin.com', '$2a$10$qf93vsBKVePNW.tXXlQNUeUVxW4leSnrE30rqr7xw5p4gIKsQ6etm', '2025-02-09 18:00:33.253842+00', null, '', null, '', null, '', '', null, '2025-02-09 18:00:33.258735+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "9dcd96d8-f2b8-45a9-84fc-a6aea582d38a", "email": "admin@admin.com", "email_verified": false, "phone_verified": false}', null, '2025-02-09 18:00:33.238436+00', '2025-02-09 18:00:33.273056+00', null, null, '', '', null, '', '0', null, '', null, 'false', null, 'false');

INSERT INTO public.currencies VALUES ('eur', 'Euro', 'Europe');
INSERT INTO public.currencies VALUES ('huf', 'Hungarian Forint', 'Hungary');
INSERT INTO public.currencies VALUES ('ron', 'Romanian Leu', 'Romania');
INSERT INTO public.currencies VALUES ('usd', 'US Dollar', 'United States of America');

INSERT INTO public.exchange_rates VALUES ('huf', 'eur', 0.0026);
INSERT INTO public.exchange_rates VALUES ('eur', 'huf', 387.94);
INSERT INTO public.exchange_rates VALUES ('ron', 'eur', 0.2);
INSERT INTO public.exchange_rates VALUES ('ron', 'huf', 77.92);
INSERT INTO public.exchange_rates VALUES ('eur', 'ron', 4.98);
INSERT INTO public.exchange_rates VALUES ('huf', 'ron', 0.013);
INSERT INTO public.exchange_rates VALUES ('usd', 'eur', 0.93);
INSERT INTO public.exchange_rates VALUES ('usd', 'huf', 360.23);
INSERT INTO public.exchange_rates VALUES ('usd', 'ron', 4.62);
INSERT INTO public.exchange_rates VALUES ('eur', 'usd', 1.08);
INSERT INTO public.exchange_rates VALUES ('huf', 'usd', 0.0028);
INSERT INTO public.exchange_rates VALUES ('ron', 'usd', 0.22);

INSERT INTO public.accounts VALUES ('fbff501c-c8a2-492b-9c77-1f973ecaecb4', '2024-12-02 19:57:35.41513+00', 'Bank One', '26746fa1-ba0b-40d9-b950-b7a6cbe34fec', 'checking');
INSERT INTO public.accounts VALUES ('4f39e20a-2c0c-476e-90f5-6b52b6dc8eda', '2024-12-02 20:10:37.799737+00', 'Investement Portfolio (Multiple currencies)', '26746fa1-ba0b-40d9-b950-b7a6cbe34fec', 'investment');

INSERT INTO public.subaccounts VALUES ('87f077d0-8610-4387-b374-922bd2b3dfad', 'Default', '2024-12-02 19:57:44.42914+00', 'fbff501c-c8a2-492b-9c77-1f973ecaecb4', 'eur');
INSERT INTO public.subaccounts VALUES ('f61bca0e-ef2e-4f1d-b89f-34604372d645', 'Euro account', '2024-12-02 20:11:11.936259+00', '4f39e20a-2c0c-476e-90f5-6b52b6dc8eda', 'eur');
INSERT INTO public.subaccounts VALUES ('bc965334-ebe9-453c-8c3d-8052fa966e45', 'Dollar account', '2024-12-02 20:11:11.936259+00', '4f39e20a-2c0c-476e-90f5-6b52b6dc8eda', 'usd');

INSERT INTO public.transactions OVERRIDING SYSTEM VALUE VALUES ('f3d3d2ea-dce0-4c15-a464-e8042557c7d5', NULL, 300, '2024-11-12 23:00:00+00', '2024-11-12 23:00:00+00', 'Transfer from XY', 'transfer', '87f077d0-8610-4387-b374-922bd2b3dfad', 2500, '26746fa1-ba0b-40d9-b950-b7a6cbe34fec', '2024-12-02 20:11:58.322674+00', 1);
INSERT INTO public.transactions OVERRIDING SYSTEM VALUE VALUES ('440802a4-0c57-4217-80eb-7631e0713319', NULL, 300, '2024-08-12 23:00:00+00', '2024-08-12 23:00:00+00', 'Transfer from XY', 'transfer', '87f077d0-8610-4387-b374-922bd2b3dfad', 300, '26746fa1-ba0b-40d9-b950-b7a6cbe34fec', '2024-12-02 20:11:58.322674+00', 2);
INSERT INTO public.transactions OVERRIDING SYSTEM VALUE VALUES ('c6778b04-da24-4436-a956-d31fa6f07132', NULL, 2500, '2024-08-12 23:00:00+00', '2024-08-12 23:00:00+00', 'Transfer from XY', 'transfer', '87f077d0-8610-4387-b374-922bd2b3dfad', 2800, '26746fa1-ba0b-40d9-b950-b7a6cbe34fec', '2024-12-02 20:11:58.322674+00', 3);
INSERT INTO public.transactions OVERRIDING SYSTEM VALUE VALUES ('f4bd9178-ad44-42e0-a842-c01db8f28942', NULL, -200, '2024-08-12 23:00:00+00', '2024-08-12 23:00:00+00', 'Transfer to XY', 'transfer', '87f077d0-8610-4387-b374-922bd2b3dfad', 2600, '26746fa1-ba0b-40d9-b950-b7a6cbe34fec', '2024-12-02 20:11:58.322674+00', 4);
INSERT INTO public.transactions OVERRIDING SYSTEM VALUE VALUES ('6f28b9a3-ef22-4786-bf5f-7c0002fee589', NULL, 600, '2024-09-12 23:00:00+00', '2024-09-12 23:00:00+00', 'Transfer from XY', 'transfer', '87f077d0-8610-4387-b374-922bd2b3dfad', 3200, '26746fa1-ba0b-40d9-b950-b7a6cbe34fec', '2024-12-02 20:11:58.322674+00', 5);
INSERT INTO public.transactions OVERRIDING SYSTEM VALUE VALUES ('af9a6338-10a0-45ec-93b6-397026968e18', NULL, 350, '2024-09-15 23:00:00+00', '2024-09-15 23:00:00+00', 'Transfer from XY', 'transfer', '87f077d0-8610-4387-b374-922bd2b3dfad', 3550, '26746fa1-ba0b-40d9-b950-b7a6cbe34fec', '2024-12-02 20:11:58.322674+00', 6);
INSERT INTO public.transactions OVERRIDING SYSTEM VALUE VALUES ('3a307681-be84-4037-9b15-39d25efeef68', NULL, -1350, '2024-10-10 23:00:00+00', '2024-10-10 23:00:00+00', 'Transfer to XY', 'transfer', '87f077d0-8610-4387-b374-922bd2b3dfad', 2200, '26746fa1-ba0b-40d9-b950-b7a6cbe34fec', '2024-12-02 20:11:58.322674+00', 7);
INSERT INTO public.transactions OVERRIDING SYSTEM VALUE VALUES ('40971351-77de-478f-a441-1ce9b8364a30', NULL, 500, '2024-11-12 23:00:00+00', '2024-11-12 23:00:00+00', 'Transfer from XY', 'transfer', '87f077d0-8610-4387-b374-922bd2b3dfad', 3000, '26746fa1-ba0b-40d9-b950-b7a6cbe34fec', '2024-12-02 20:11:58.322674+00', 8);
INSERT INTO public.transactions OVERRIDING SYSTEM VALUE VALUES ('f576ae94-293c-4a3b-919b-d62783fbe0b8', NULL, -500, '2024-11-12 23:00:00+00', '2024-11-12 23:00:00+00', 'Transfer to XY', 'transfer', '87f077d0-8610-4387-b374-922bd2b3dfad', 2500, '26746fa1-ba0b-40d9-b950-b7a6cbe34fec', '2024-12-02 20:11:58.322674+00', 9);

SELECT pg_catalog.setval('public.transactions_sequence_seq', 9, true);
