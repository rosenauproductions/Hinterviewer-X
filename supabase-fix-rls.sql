-- Fix infinite recursion in profiles RLS (run once in Supabase SQL Editor)
-- Cause: admin policies subquery profiles while evaluating profiles policies.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('low_admin', 'super_admin')
  );
$$;

-- Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (public.is_admin());

-- Social links
DROP POLICY IF EXISTS "Admins can view all social links" ON social_links;
CREATE POLICY "Admins can view all social links" ON social_links
  FOR SELECT USING (public.is_admin());

-- Questions (split ALL → write-only so anon SELECT does not hit profiles)
DROP POLICY IF EXISTS "Admins can manage questions" ON questions;
DROP POLICY IF EXISTS "Admins can insert questions" ON questions;
DROP POLICY IF EXISTS "Admins can update questions" ON questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON questions;
CREATE POLICY "Admins can insert questions" ON questions
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update questions" ON questions
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete questions" ON questions
  FOR DELETE USING (public.is_admin());

-- Video answers
DROP POLICY IF EXISTS "Admins can view all video answers" ON video_answers;
CREATE POLICY "Admins can view all video answers" ON video_answers
  FOR SELECT USING (public.is_admin());

-- Playlist templates
DROP POLICY IF EXISTS "Admins can manage playlist templates" ON playlist_templates;
CREATE POLICY "Admins can manage playlist templates" ON playlist_templates
  FOR ALL USING (public.is_admin());

-- Applicant playlists
DROP POLICY IF EXISTS "Admins can view all playlists" ON applicant_playlists;
CREATE POLICY "Admins can view all playlists" ON applicant_playlists
  FOR SELECT USING (public.is_admin());

-- Campaigns
DROP POLICY IF EXISTS "Admins can manage campaigns" ON campaigns;
CREATE POLICY "Admins can manage campaigns" ON campaigns
  FOR ALL USING (public.is_admin());

-- Asset videos
DROP POLICY IF EXISTS "Admins can manage asset videos" ON asset_videos;
CREATE POLICY "Admins can manage asset videos" ON asset_videos
  FOR ALL USING (public.is_admin());
