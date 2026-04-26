-- ── Migration : image de fond de la carte + fix photos ─────────
-- À exécuter dans Supabase > SQL Editor

-- 1. Colonne map_bg_url sur projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS map_bg_url text;

-- 2. FIX PHOTOS : rendre le bucket "media" public
--    (les avatars et photos de lieux ne s'affichent pas si le bucket est privé)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Policies storage (sans IF NOT EXISTS car non supporté sur CREATE POLICY)
--    Supprimer puis recréer pour éviter les conflits
DROP POLICY IF EXISTS "Users can upload own media"  ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view media"        ON storage.objects;
DROP POLICY IF EXISTS "Users can update own media"   ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media"   ON storage.objects;

CREATE POLICY "Users can upload own media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Users can update own media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media' AND (string_to_array(name, '/'))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND (string_to_array(name, '/'))[1] = auth.uid()::text);
