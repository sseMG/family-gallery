-- Add hash column for duplicate photo detection
alter table public.photos add column if not exists hash text;
