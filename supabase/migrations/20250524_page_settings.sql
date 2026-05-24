-- Editable per-page text settings (eyebrow, title, subtitle, etc.)
create table if not exists public.page_settings (
  page text primary key,
  eyebrow text,
  title text,
  subtitle text,
  updated_at timestamptz not null default now()
);

alter table public.page_settings enable row level security;

drop policy if exists "Anyone can read page_settings" on public.page_settings;
create policy "Anyone can read page_settings" on public.page_settings
  for select using (true);

drop policy if exists "Authenticated users can upsert page_settings" on public.page_settings;
create policy "Authenticated users can upsert page_settings" on public.page_settings
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update page_settings" on public.page_settings;
create policy "Authenticated users can update page_settings" on public.page_settings
  for update using (auth.role() = 'authenticated');

-- Seed defaults for the Family Members page
insert into public.page_settings (page, eyebrow, title, subtitle)
values ('members', 'Silva Family', 'Family Members', 'The people who make us who we are')
on conflict (page) do nothing;
