-- Supabase Schema for Video Resume Platform
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role TEXT DEFAULT 'applicant' CHECK (role IN ('applicant', 'low_admin', 'super_admin')),
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  resume_url TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social links
CREATE TABLE social_links (
  id SERIAL PRIMARY KEY,
  applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions (global, managed by admins)
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Answers
CREATE TABLE video_answers (
  id SERIAL PRIMARY KEY,
  applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resume_set_id INTEGER DEFAULT 1,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  video_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist Templates
CREATE TABLE playlist_templates (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  assets JSONB NOT NULL DEFAULT '[]',
  field_visibility JSONB DEFAULT '{}',
  layout_config JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applicant Playlists
CREATE TABLE applicant_playlists (
  id SERIAL PRIMARY KEY,
  applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resume_set_id INTEGER DEFAULT 1,
  template_id INTEGER REFERENCES playlist_templates(id),
  playlist_data JSONB,
  public_url TEXT UNIQUE,
  private_url TEXT UNIQUE,
  password_protected BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'password')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  archived BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_applicants (
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (campaign_id, applicant_id)
);

-- Asset Videos
CREATE TABLE asset_videos (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read/update their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('low_admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('low_admin', 'super_admin')
    )
  );

-- Social links: Users can manage their own
CREATE POLICY "Users can manage own social links" ON social_links
  FOR ALL USING (auth.uid() = applicant_id);

CREATE POLICY "Admins can view all social links" ON social_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('low_admin', 'super_admin')
    )
  );

-- Questions: Anyone can read, only admins can modify
CREATE POLICY "Anyone can read questions" ON questions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage questions" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('low_admin', 'super_admin')
    )
  );

-- Video answers: Users can manage their own, admins can view all
CREATE POLICY "Users can manage own video answers" ON video_answers
  FOR ALL USING (auth.uid() = applicant_id);

CREATE POLICY "Admins can view all video answers" ON video_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('low_admin', 'super_admin')
    )
  );

-- Playlist templates: Admins can manage
CREATE POLICY "Admins can manage playlist templates" ON playlist_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('low_admin', 'super_admin')
    )
  );

-- Applicant playlists: Users can view their own, admins can view all
CREATE POLICY "Users can view own playlists" ON applicant_playlists
  FOR SELECT USING (auth.uid() = applicant_id);

CREATE POLICY "Admins can view all playlists" ON applicant_playlists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('low_admin', 'super_admin')
    )
  );

CREATE POLICY "Users can manage own playlists" ON applicant_playlists
  FOR ALL USING (auth.uid() = applicant_id);

-- Campaigns: Admins can manage
CREATE POLICY "Admins can manage campaigns" ON campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('low_admin', 'super_admin')
    )
  );

-- Campaign applicants: Related policies above

-- Asset videos: Admins can manage
CREATE POLICY "Admins can manage asset videos" ON asset_videos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('low_admin', 'super_admin')
    )
  );

-- Function to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default questions
INSERT INTO questions (text, order_index) VALUES
('Tell us about yourself.', 1),
('What are your career goals?', 2),
('Describe a challenging project you worked on.', 3);
