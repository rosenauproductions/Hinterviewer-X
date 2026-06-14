-- Video answer storage bucket (run once in Supabase SQL Editor)
-- Real Supabase Storage — not the legacy v78 "videos" table.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'video-answers',
  'video-answers',
  false,
  104857600,
  ARRAY['video/webm', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Applicants upload to their own folder: {user_id}/...
CREATE POLICY "Applicants upload own videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'video-answers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Applicants read own videos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'video-answers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Applicants update own videos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'video-answers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Applicants delete own videos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'video-answers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins read all videos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'video-answers'
  AND public.is_admin()
);
