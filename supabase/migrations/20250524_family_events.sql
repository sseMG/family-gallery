create table if not exists public.family_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  event_time time,
  location text,
  type text not null default 'Other',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists family_events_event_date_idx on public.family_events (event_date asc);
create index if not exists family_events_created_by_idx on public.family_events (created_by);

alter table public.family_events enable row level security;

create policy "Family events are viewable by everyone"
  on public.family_events for select using (true);

create policy "Authenticated users can insert family events"
  on public.family_events for insert to authenticated with check (auth.uid() = created_by);

create policy "Authenticated users can update family events"
  on public.family_events for update to authenticated using (true);

create policy "Authenticated users can delete family events"
  on public.family_events for delete to authenticated using (true);
