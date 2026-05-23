-- Silva Family Gallery — run in Supabase SQL Editor

create extension if not exists "uuid-ossp";

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  year integer,
  description text,
  cover_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  public_id text,
  caption text,
  year integer,
  location text,
  album_id uuid references public.albums (id) on delete set null,
  uploaded_by uuid references auth.users (id) on delete set null,
  width integer,
  height integer,
  aspect text,
  created_at timestamptz not null default now()
);

create index if not exists photos_year_idx on public.photos (year desc);
create index if not exists photos_album_id_idx on public.photos (album_id);

alter table public.albums enable row level security;
alter table public.photos enable row level security;

-- Public read
create policy "Albums are viewable by everyone"
  on public.albums for select using (true);

create policy "Photos are viewable by everyone"
  on public.photos for select using (true);

-- Authenticated write (admin)
create policy "Authenticated users can insert albums"
  on public.albums for insert to authenticated with check (true);

create policy "Authenticated users can update albums"
  on public.albums for update to authenticated using (true);

create policy "Authenticated users can insert photos"
  on public.photos for insert to authenticated with check (auth.uid() = uploaded_by);

create policy "Authenticated users can update photos"
  on public.photos for update to authenticated using (auth.uid() = uploaded_by);

create policy "Authenticated users can delete photos"
  on public.photos for delete to authenticated using (auth.uid() = uploaded_by);
