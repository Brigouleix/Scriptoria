-- ============================================================
-- SCRIPTORIA - Schéma Team Projects
-- À exécuter dans l'éditeur SQL Supabase après schema.sql
-- ============================================================

-- ============================================================
-- Ajouter project_type à la table projects
-- ============================================================
alter table public.projects
  add column if not exists project_type text not null default 'novel'
    check (project_type in ('novel', 'team'));

-- ============================================================
-- TABLE: people
-- Profils de personnes (membres d'équipe) créés par un utilisateur
-- ============================================================
create table if not exists public.people (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  bio         text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists people_user_id_idx on public.people(user_id);

create trigger people_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

-- ============================================================
-- TABLE: saved_roles
-- Rôles sauvegardés pour l'autocomplete (par utilisateur)
-- ============================================================
create table if not exists public.saved_roles (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null,
  unique (user_id, role)
);

create index if not exists saved_roles_user_id_idx on public.saved_roles(user_id);

-- ============================================================
-- TABLE: project_members
-- Association personne <-> projet avec un rôle
-- ============================================================
create table if not exists public.project_members (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  person_id   uuid not null references public.people(id) on delete cascade,
  role        text not null default '',
  position    smallint not null default 0,
  created_at  timestamptz not null default now(),
  unique (project_id, person_id)
);

create index if not exists project_members_project_id_idx on public.project_members(project_id);
create index if not exists project_members_person_id_idx on public.project_members(person_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.people enable row level security;
alter table public.saved_roles enable row level security;
alter table public.project_members enable row level security;

-- people: owned by user
create policy "Users can view own people"
  on public.people for select using (auth.uid() = user_id);

create policy "Users can insert own people"
  on public.people for insert with check (auth.uid() = user_id);

create policy "Users can update own people"
  on public.people for update using (auth.uid() = user_id);

create policy "Users can delete own people"
  on public.people for delete using (auth.uid() = user_id);

-- saved_roles: owned by user
create policy "Users can view own saved_roles"
  on public.saved_roles for select using (auth.uid() = user_id);

create policy "Users can insert own saved_roles"
  on public.saved_roles for insert with check (auth.uid() = user_id);

create policy "Users can delete own saved_roles"
  on public.saved_roles for delete using (auth.uid() = user_id);

-- project_members: accessible if user owns the project
create policy "Users can view members of own projects"
  on public.project_members for select
  using (
    exists (
      select 1 from public.projects
      where id = project_members.project_id
      and user_id = auth.uid()
    )
  );

create policy "Users can insert members into own projects"
  on public.project_members for insert
  with check (
    exists (
      select 1 from public.projects
      where id = project_members.project_id
      and user_id = auth.uid()
    )
  );

create policy "Users can update members of own projects"
  on public.project_members for update
  using (
    exists (
      select 1 from public.projects
      where id = project_members.project_id
      and user_id = auth.uid()
    )
  );

create policy "Users can delete members of own projects"
  on public.project_members for delete
  using (
    exists (
      select 1 from public.projects
      where id = project_members.project_id
      and user_id = auth.uid()
    )
  );
