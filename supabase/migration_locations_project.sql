-- ── Associer les lieux à un projet ───────────────────────────────
-- À exécuter dans Supabase → SQL Editor

-- 1. Ajouter la colonne project_id sur locations
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS locations_project_idx ON public.locations(project_id);

-- 2. Assigner tes lieux existants au bon projet
--    Remplace l'UUID par celui de ton projet (ex: Alphonse Drinh)
UPDATE public.locations
SET project_id = 'dca071d9-1553-4e05-8520-9df5ab3850e5'
WHERE project_id IS NULL;
