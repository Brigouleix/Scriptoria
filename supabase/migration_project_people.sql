-- ── Migration complète ───────────────────────────────────────────
-- À exécuter dans Supabase > SQL Editor

-- 1. Table character_links (créée seulement si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.character_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_a_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  person_b_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  relationship text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (person_a_id, person_b_id)
);

CREATE INDEX IF NOT EXISTS character_links_a_idx ON public.character_links(person_a_id);
CREATE INDEX IF NOT EXISTS character_links_b_idx ON public.character_links(person_b_id);

ALTER TABLE public.character_links ENABLE ROW LEVEL SECURITY;

-- Politiques character_links
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'character_links' AND policyname = 'Users can view own character_links') THEN
    EXECUTE 'CREATE POLICY "Users can view own character_links" ON public.character_links FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'character_links' AND policyname = 'Users can insert own character_links') THEN
    EXECUTE 'CREATE POLICY "Users can insert own character_links" ON public.character_links FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'character_links' AND policyname = 'Users can update own character_links') THEN
    EXECUTE 'CREATE POLICY "Users can update own character_links" ON public.character_links FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'character_links' AND policyname = 'Users can delete own character_links') THEN
    EXECUTE 'CREATE POLICY "Users can delete own character_links" ON public.character_links FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- 2. Colonne project_id sur people
ALTER TABLE public.people
  ADD COLUMN IF NOT EXISTS project_id uuid
  REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS people_project_id_idx ON public.people(project_id);
