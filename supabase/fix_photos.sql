-- ── FIX PHOTOS ────────────────────────────────────────────────
-- Colle CE FICHIER dans Supabase → SQL Editor et exécute.
-- C'est tout ce qu'il faut pour que les avatars et photos s'affichent.

-- 1. Créer le bucket "media" en PUBLIC (ou le mettre à jour s'il existe déjà)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Supprimer les anciennes policies si elles existent (évite les conflits)
DROP POLICY IF EXISTS "Users can upload own media"  ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view media"        ON storage.objects;
DROP POLICY IF EXISTS "Users can update own media"   ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media"   ON storage.objects;

-- 3. Recréer les policies proprement
CREATE POLICY "Anyone can view media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Users can upload own media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND auth.role() = 'authenticated');
