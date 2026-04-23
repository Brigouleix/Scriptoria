-- ============================================================
-- SCRIPTORIA - Liens entre personnages
-- ============================================================
create table if not exists public.character_links (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  person_a_id uuid not null references public.people(id) on delete cascade,
  person_b_id uuid not null references public.people(id) on delete cascade,
  relationship text not null default '',
  created_at  timestamptz not null default now(),
  unique (person_a_id, person_b_id)
);

create index if not exists character_links_a_idx on public.character_links(person_a_id);
create index if not exists character_links_b_idx on public.character_links(person_b_id);

alter table public.character_links enable row level security;

create policy "Users can view own character_links"
  on public.character_links for select using (auth.uid() = user_id);
create policy "Users can insert own character_links"
  on public.character_links for insert with check (auth.uid() = user_id);
create policy "Users can delete own character_links"
  on public.character_links for delete using (auth.uid() = user_id);
