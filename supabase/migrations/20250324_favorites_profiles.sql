-- Run if you already applied schema.sql before favorites/profiles were added

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  photo_id uuid not null references public.photos (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, photo_id)
);

create index if not exists favorites_photo_id_idx on public.favorites (photo_id);
create index if not exists favorites_user_id_idx on public.favorites (user_id);

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

create policy "Favorites are viewable by everyone"
  on public.favorites for select using (true);

create policy "Users can insert own favorites"
  on public.favorites for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can delete own favorites"
  on public.favorites for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Authenticated users can delete photos" on public.photos;
create policy "Authenticated users can delete photos"
  on public.photos for delete to authenticated using (true);
