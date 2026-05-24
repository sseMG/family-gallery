alter table public.family_members add column if not exists generation text default 'kids';
alter table public.family_members add column if not exists nickname text;
alter table public.family_members add column if not exists birth_year int;
alter table public.family_members add column if not exists bio text;
