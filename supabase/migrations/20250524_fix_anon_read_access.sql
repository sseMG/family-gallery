-- Grant the anon role SELECT access on all public tables
-- This ensures signed-out visitors can view photos, albums, family members, etc.

grant usage on schema public to anon;
grant select on public.photos to anon;
grant select on public.albums to anon;
grant select on public.profiles to anon;
grant select on public.favorites to anon;
grant select on public.family_members to anon;
grant select on public.family_events to anon;
grant select on public.page_settings to anon;

-- Ensure RLS select policies exist for anonymous access
-- (Re-create only if missing — these use "using (true)" to allow public reads)

do $$
begin
  -- photos
  if not exists (
    select 1 from pg_policies where tablename = 'photos' and policyname = 'Photos are viewable by everyone'
  ) then
    create policy "Photos are viewable by everyone" on public.photos for select using (true);
  end if;

  -- albums
  if not exists (
    select 1 from pg_policies where tablename = 'albums' and policyname = 'Albums are viewable by everyone'
  ) then
    create policy "Albums are viewable by everyone" on public.albums for select using (true);
  end if;

  -- family_members
  if not exists (
    select 1 from pg_policies where tablename = 'family_members' and policyname = 'Anyone can read family_members'
  ) then
    create policy "Anyone can read family_members" on public.family_members for select using (true);
  end if;

  -- favorites
  if not exists (
    select 1 from pg_policies where tablename = 'favorites' and policyname = 'Favorites are viewable by everyone'
  ) then
    create policy "Favorites are viewable by everyone" on public.favorites for select using (true);
  end if;

  -- page_settings
  if not exists (
    select 1 from pg_policies where tablename = 'page_settings' and policyname ilike '%select%'
  ) then
    create policy "Page settings are viewable by everyone" on public.page_settings for select using (true);
  end if;
end $$;
