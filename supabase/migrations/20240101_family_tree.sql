-- Family tree members table
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  nickname text,
  relationship text not null,       -- e.g. "Father", "Mother", "Son", "Daughter", "Grandfather"
  birth_year int,
  avatar_url text,
  profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Edges connecting members (parent → child, spouse, etc.)
create table if not exists public.family_edges (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.family_members(id) on delete cascade,
  target_id uuid not null references public.family_members(id) on delete cascade,
  edge_type text not null default 'parent', -- 'parent' | 'spouse' | 'sibling'
  created_at timestamptz default now()
);

-- Tree layout positions (so admin can reposition nodes and save)
alter table public.family_members
  add column if not exists pos_x float default 0,
  add column if not exists pos_y float default 0;

-- Additional fields for 3D tree
alter table public.family_members
  add column if not exists bio text,
  add column if not exists parent_id uuid references public.family_members(id) on delete set null;

-- RLS
alter table public.family_members enable row level security;
alter table public.family_edges enable row level security;

create policy "Anyone can read family_members" on public.family_members
  for select using (true);

create policy "Authenticated users can insert family_members" on public.family_members
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update family_members" on public.family_members
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete family_members" on public.family_members
  for delete using (auth.role() = 'authenticated');

create policy "Anyone can read family_edges" on public.family_edges
  for select using (true);

create policy "Authenticated users can insert family_edges" on public.family_edges
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete family_edges" on public.family_edges
  for delete using (auth.role() = 'authenticated');
