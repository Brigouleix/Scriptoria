-- ── Migration : person_details ────────────────────────────────────
-- Calepin/fiche de personnage avec champs structurés + champs custom
-- À exécuter dans Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS public.person_details (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id      uuid        NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  user_id        uuid        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,

  -- Champs prédéfinis
  metier         text,
  date_naissance text,       -- texte libre : "12 mars 1985" ou "38 ans"
  traits         text,       -- traits de caractère (texte libre / liste)
  notes          text,       -- grand bloc de notes libres

  -- Champs personnalisés : [{ "name": "Peur", "value": "Le noir" }, ...]
  custom_fields  jsonb       NOT NULL DEFAULT '[]'::jsonb,

  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT person_details_person_unique UNIQUE (person_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_person_details_person_id ON public.person_details (person_id);
CREATE INDEX IF NOT EXISTS idx_person_details_user_id   ON public.person_details (user_id);

-- RLS
ALTER TABLE public.person_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own person details"
  ON public.person_details
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_person_details_updated_at ON public.person_details;
CREATE TRIGGER trg_person_details_updated_at
  BEFORE UPDATE ON public.person_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
