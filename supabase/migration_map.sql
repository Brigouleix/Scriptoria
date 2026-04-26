-- ── Migration : Carte des mouvements ────────────────────────────
-- À exécuter dans Supabase > SQL Editor

-- 1. Positions des lieux sur la carte (ajout de colonnes à locations)
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS map_x numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS map_y numeric NOT NULL DEFAULT 50;

-- 2. Table character_movements : qui est où, à quel chapitre
CREATE TABLE IF NOT EXISTS public.character_movements (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  chapter_id  uuid        NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  person_id   uuid        NOT NULL REFERENCES public.people(id)   ON DELETE CASCADE,
  location_id uuid        REFERENCES public.locations(id)         ON DELETE SET NULL,
  note        text        NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chapter_id, person_id)
);

CREATE INDEX IF NOT EXISTS char_mov_chapter_idx ON public.character_movements(chapter_id);
CREATE INDEX IF NOT EXISTS char_mov_person_idx  ON public.character_movements(person_id);

ALTER TABLE public.character_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own movements" ON public.character_movements;
CREATE POLICY "Users manage own movements"
  ON public.character_movements FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Bucket media public (fix photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies storage (idempotent via DO blocks)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Users can upload own media') THEN
    EXECUTE $p$CREATE POLICY "Users can upload own media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND (string_to_array(name, '/'))[1] = auth.uid()::text)$p$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Anyone can view media') THEN
    EXECUTE $p$CREATE POLICY "Anyone can view media" ON storage.objects FOR SELECT USING (bucket_id = 'media')$p$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Users can update own media') THEN
    EXECUTE $p$CREATE POLICY "Users can update own media" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND (string_to_array(name, '/'))[1] = auth.uid()::text)$p$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Users can delete own media') THEN
    EXECUTE $p$CREATE POLICY "Users can delete own media" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND (string_to_array(name, '/'))[1] = auth.uid()::text)$p$;
  END IF;
END $$;
