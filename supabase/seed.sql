-- Autogenerated by seed.ts
INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,invited_at,confirmation_token,confirmation_sent_at,recovery_token,recovery_sent_at,email_change_token_new,email_change,email_change_sent_at,last_sign_in_at,raw_app_meta_data,raw_user_meta_data,is_super_admin,created_at,updated_at,phone,phone_confirmed_at,phone_change,phone_change_token,phone_change_sent_at,email_change_token_current,email_change_confirm_status,banned_until,reauthentication_token,reauthentication_sent_at,is_sso_user,deleted_at,is_anonymous) VALUES ('00000000-0000-0000-0000-000000000000', 'e59178f1-7ed7-4ffe-9f7d-a471a041a068', 'authenticated', 'authenticated', 'user@example.com', '$2b$10$3XfdNAjhp7WaoL.SD5v2auCVEn7OrfUyRiRG9HVM.L42hQryLGqsm', '2020-02-10T13:34:50.000Z', NULL, '', NULL, '', NULL, '', '', NULL, '2020-08-16T19:13:05.000Z', '{"provider":"email","providers":["email"]}', '{"sub":"e59178f1-7ed7-4ffe-9f7d-a471a041a068","email":"user@example.com","email_verified":false,"phone_verified":false}', NULL, '2020-06-06T05:41:47.000Z', '2020-03-11T02:10:13.000Z', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, 'f', NULL, 'f');
INSERT INTO auth.identities (provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at,id) VALUES ('e59178f1-7ed7-4ffe-9f7d-a471a041a068', 'e59178f1-7ed7-4ffe-9f7d-a471a041a068', '{"sub":"e59178f1-7ed7-4ffe-9f7d-a471a041a068","email":"user@example.com","email_verified":false,"phone_verified":false}', 'email', '2020-08-24T07:21:29.000Z', '2020-06-26T05:05:46.000Z', '2020-04-16T03:36:28.000Z', 'eb2b4a57-df1b-56a8-8a95-ca16989907f9');
INSERT INTO storage.buckets (id,name,owner,created_at,updated_at,public,avif_autodetection,file_size_limit,allowed_mime_types,owner_id) VALUES ('files', 'files', '9eb12398-7fb5-5310-a81f-4bc8ccca4dc9', DEFAULT, DEFAULT, 'f', DEFAULT, 1849508, '{"text/csv"}', 'Neque quid sicin eum vitamus.');
INSERT INTO public.custom_type (id,kind,name,description,rules,examples,not_examples,user_id,created_at,updated_at) VALUES (1, 'enum', 'pdb-ids', 'Unique accession codes for the molecular models (atomic coordinate files) in the Protein Data Bank (PDB).', '{"4 characters in length","alphanumeric","planned to be extended in the future to eight characters prefixed by ''pdb''"}', '{"1AKE","1AKG","1AKH","1AKI","1AKJ"}', DEFAULT, 'e59178f1-7ed7-4ffe-9f7d-a471a041a068', DEFAULT, DEFAULT);
SELECT setval('"public"."custom_type_id_seq"'::regclass, (SELECT MAX("id") FROM "public"."custom_type"));
