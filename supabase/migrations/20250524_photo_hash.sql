-- Add hash column for duplicate image detection
alter table public.photos add column if not exists hash text;

-- Create index for fast duplicate lookup
create index if not exists photos_hash_idx on public.photos (hash);

-- Add comment for documentation
comment on column public.photos.hash is 'SHA-256 hash of the image file for duplicate detection';
