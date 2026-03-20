INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-media', 'portfolio-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload own portfolio media" ON storage.objects;
CREATE POLICY "Authenticated users can upload own portfolio media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can update own portfolio media" ON storage.objects;
CREATE POLICY "Authenticated users can update own portfolio media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portfolio-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can delete own portfolio media" ON storage.objects;
CREATE POLICY "Authenticated users can delete own portfolio media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolio-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Public can read portfolio media" ON storage.objects;
CREATE POLICY "Public can read portfolio media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'portfolio-media');
