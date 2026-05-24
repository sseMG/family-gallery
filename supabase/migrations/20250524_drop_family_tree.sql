-- Drop unused family_edges table and tree layout columns from the old Family Tree feature
drop table if exists public.family_edges cascade;

alter table public.family_members
  drop column if exists pos_x,
  drop column if exists pos_y,
  drop column if exists parent_id;
