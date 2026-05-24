-- Fix: Allow any authenticated user to update photos (not just the uploader)
-- This enables admins to edit photo details like caption, year, location, album

drop policy if exists "Authenticated users can update photos" on public.photos;

create policy "Authenticated users can update photos"
  on public.photos for update to authenticated using (true);
