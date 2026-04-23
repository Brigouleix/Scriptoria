-- ============================================================
-- SCRIPTORIA - Lieux + Storage media
-- À exécuter dans l'éditeur SQL Supabase
-- ============================================================

-- ============================================================
-- TABLE: locations
-- ============================================================
create table if not exists public.locations (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists locations_user_id_idx on public.locations(user_id);

create trigger locations_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

-- ============================================================
-- TABLE: location_photos
-- ============================================================
create table if not exists public.location_photos (
  id            uuid primary key default uuid_generate_v4(),
  location_id   uuid not null references public.locations(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  storage_path  text not null,
  name          text not null,
  created_at    timestamptz not null default now()
);

create index if not exists location_photos_location_id_idx on public.location_photos(location_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.locations enable row level security;
alter table public.location_photos enable row level security;

create policy "Users can view own locations"
  on public.locations for select using (auth.uid() = user_id);
create policy "Users can insert own locations"
  on public.locations for insert with check (auth.uid() = user_id);
create policy "Users can update own locations"
  on public.locations for update using (auth.uid() = user_id);
create policy "Users can delete own locations"
  on public.locations for delete using (auth.uid() = user_id);

create policy "Users can view own location_photos"
  on public.location_photos for select using (auth.uid() = user_id);
create policy "Users can insert own location_photos"
  on public.location_photos for insert with check (auth.uid() = user_id);
create policy "Users can delete own location_photos"
  on public.location_photos for delete using (auth.uid() = user_id);

-- ============================================================
-- STORAGE bucket "media" — à créer dans le dashboard Supabase
-- Bucket name: media  |  Public: true
-- Puis exécuter ces policies :
-- ============================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Users can upload own media"
  on storage.objects for insert
  with check (bucket_id = 'media' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

create policy "Anyone can view media"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "Users can update own media"
  on storage.objects for update
  using (bucket_id = 'media' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

create policy "Users can delete own media"
  on storage.objects for delete
  using (bucket_id = 'media' AND (string_to_array(name, '/'))[1] = auth.uid()::text);
