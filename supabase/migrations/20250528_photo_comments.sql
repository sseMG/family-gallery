-- Photo Comments Migration
-- Creates table for family members to comment on photos

create table if not exists public.photo_comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(content) <= 500),
  parent_id uuid references public.photo_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
comment on table public.photo_comments is 'Comments on photos by family members';

create index idx_photo_comments_photo_id on public.photo_comments(photo_id);
create index idx_photo_comments_user_id on public.photo_comments(user_id);
create index idx_photo_comments_parent_id on public.photo_comments(parent_id);
create index idx_photo_comments_created_at on public.photo_comments(created_at desc);

-- Enable RLS
alter table public.photo_comments enable row level security;

-- RLS Policies

-- Everyone can view comments
create policy "Comments are viewable by everyone"
  on public.photo_comments for select
  using (true);

-- Authenticated users can insert their own comments
create policy "Authenticated users can insert comments"
  on public.photo_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update own comments
create policy "Users can update own comments"
  on public.photo_comments for update
  to authenticated
  using (auth.uid() = user_id);

-- Users can delete own comments
create policy "Users can delete own comments"
  on public.photo_comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger update_photo_comments_updated_at
  before update on public.photo_comments
  for each row
  execute function update_updated_at_column();
