-- ============================================================
-- SCRIPTORIA - Schéma Supabase
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: projects
-- ============================================================
create table public.projects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  genre       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index pour les requêtes par utilisateur
create index projects_user_id_idx on public.projects(user_id);

-- ============================================================
-- TABLE: snowflake_steps
-- Stocke le contenu de chaque étape Snowflake par projet
-- step_number: 1=Prémisse, 2=Résumé, 3=Personnages, 4=Synopsis
-- ============================================================
create table public.snowflake_steps (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  step_number   smallint not null check (step_number between 1 and 4),
  content       jsonb not null default '{}',
  updated_at    timestamptz not null default now(),
  unique (project_id, step_number)
);

create index snowflake_steps_project_id_idx on public.snowflake_steps(project_id);

-- ============================================================
-- TRIGGER: mise à jour automatique de updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger snowflake_steps_updated_at
  before update on public.snowflake_steps
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Garantit qu'un utilisateur ne peut accéder qu'à ses propres données
-- ============================================================

-- Activer RLS
alter table public.projects enable row level security;
alter table public.snowflake_steps enable row level security;

-- Politiques pour projects
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Politiques pour snowflake_steps (via project ownership)
create policy "Users can view own steps"
  on public.snowflake_steps for select
  using (
    exists (
      select 1 from public.projects
      where id = snowflake_steps.project_id
      and user_id = auth.uid()
    )
  );

create policy "Users can insert own steps"
  on public.snowflake_steps for insert
  with check (
    exists (
      select 1 from public.projects
      where id = snowflake_steps.project_id
      and user_id = auth.uid()
    )
  );

create policy "Users can update own steps"
  on public.snowflake_steps for update
  using (
    exists (
      select 1 from public.projects
      where id = snowflake_steps.project_id
      and user_id = auth.uid()
    )
  );

create policy "Users can delete own steps"
  on public.snowflake_steps for delete
  using (
    exists (
      select 1 from public.projects
      where id = snowflake_steps.project_id
      and user_id = auth.uid()
    )
  );
