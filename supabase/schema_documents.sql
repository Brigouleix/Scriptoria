-- ============================================================
-- SCRIPTORIA — Extension : Documents & Chapitres
-- À exécuter dans l'éditeur SQL Supabase après schema.sql
-- ============================================================

-- ============================================================
-- TABLE: chapters (dossiers par projet)
-- ============================================================
create table if not exists public.chapters (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  description text,
  position    smallint not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists chapters_project_id_idx on public.chapters(project_id);

-- ============================================================
-- TABLE: documents (fichiers par chapitre)
-- ============================================================
create table if not exists public.documents (
  id           uuid primary key default uuid_generate_v4(),
  chapter_id   uuid not null references public.chapters(id) on delete cascade,
  project_id   uuid not null references public.projects(id) on delete cascade,
  name         text not null,
  storage_path text not null,
  mime_type    text not null,
  size_bytes   bigint not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists documents_chapter_id_idx on public.documents(chapter_id);
create index if not exists documents_project_id_idx on public.documents(project_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.chapters enable row level security;
alter table public.documents enable row level security;

-- Chapters policies
create policy "Users can view own chapters"
  on public.chapters for select
  using (exists (
    select 1 from public.projects where id = chapters.project_id and user_id = auth.uid()
  ));

create policy "Users can insert own chapters"
  on public.chapters for insert
  with check (exists (
    select 1 from public.projects where id = chapters.project_id and user_id = auth.uid()
  ));

create policy "Users can update own chapters"
  on public.chapters for update
  using (exists (
    select 1 from public.projects where id = chapters.project_id and user_id = auth.uid()
  ));

create policy "Users can delete own chapters"
  on public.chapters for delete
  using (exists (
    select 1 from public.projects where id = chapters.project_id and user_id = auth.uid()
  ));

-- Documents policies
create policy "Users can view own documents"
  on public.documents for select
  using (exists (
    select 1 from public.projects where id = documents.project_id and user_id = auth.uid()
  ));

create policy "Users can insert own documents"
  on public.documents for insert
  with check (exists (
    select 1 from public.projects where id = documents.project_id and user_id = auth.uid()
  ));

create policy "Users can delete own documents"
  on public.documents for delete
  using (exists (
    select 1 from public.projects where id = documents.project_id and user_id = auth.uid()
  ));

-- ============================================================
-- STORAGE BUCKET
-- Créer manuellement dans Supabase > Storage > New bucket
-- Nom : "documents", Private : oui
-- ============================================================

-- Policy storage : chaque user accède uniquement à son dossier
-- (à appliquer dans Storage > Policies après avoir créé le bucket)
--
-- SELECT : bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
-- INSERT : bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
-- DELETE : bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
