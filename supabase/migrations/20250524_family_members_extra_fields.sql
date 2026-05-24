-- Add extra contact/info fields to family_members
alter table public.family_members add column if not exists phone text;
alter table public.family_members add column if not exists facebook_url text;
alter table public.family_members add column if not exists instagram_url text;
alter table public.family_members add column if not exists birthday date;
alter table public.family_members add column if not exists location text;
