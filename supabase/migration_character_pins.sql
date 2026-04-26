-- ── Épingles personnages sur la carte ───────────────────────────
-- À exécuter dans Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS public.character_pins (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id)      ON DELETE CASCADE,
  chapter_id  uuid        NOT NULL REFERENCES public.chapters(id)  ON DELETE CASCADE,
  person_id   uuid        NOT NULL REFERENCES public.people(id)    ON DELETE CASCADE,
  pin_x       numeric     NOT NULL DEFAULT 50,  -- % largeur du canvas (0-100)
  pin_y       numeric     NOT NULL DEFAULT 50,  -- % hauteur du canvas (0-100)
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS char_pins_chapter_idx ON public.character_pins(chapter_id);

ALTER TABLE public.character_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own character_pins"
  ON public.character_pins FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
