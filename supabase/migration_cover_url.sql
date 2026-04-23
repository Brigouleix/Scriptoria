-- Add cover_url to projects table
alter table public.projects add column if not exists cover_url text;
