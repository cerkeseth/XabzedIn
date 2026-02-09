-- =============================================
-- CerkesKariyer - Complete Database Schema
-- Run this in Supabase SQL Editor to set up everything
-- =============================================

-- =============================================
-- DROP EXISTING TABLES (for fresh start)
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS education CASCADE;
DROP TABLE IF EXISTS experiences CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =============================================
-- 1. PROFILES TABLE
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('seeker', 'employer')),
  avatar_url TEXT,
  bio TEXT,
  linkedin_url TEXT,
  phone TEXT,
  community_reference TEXT,
  skills TEXT[],
  experience_summary TEXT,
  education_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================
-- 2. EXPERIENCES TABLE (Structured work history)
-- =============================================
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. EDUCATION TABLE (Structured education)
-- =============================================
CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  degree TEXT,
  field_of_study TEXT,
  start_date TEXT,
  end_date TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. COMPANIES TABLE (with contact info)
-- =============================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  sector TEXT,
  location TEXT,
  website TEXT,
  description TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. JOBS TABLE (with contact info and expiration)
-- =============================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT CHECK (type IN ('remote', 'onsite', 'hybrid')),
  location TEXT,
  salary_range TEXT,
  -- Contact info for this job
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  -- Expiration settings
  expires_at TIMESTAMPTZ,  -- NULL means no expiration
  is_active BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE,  -- Archived jobs are visible to company but not seekers
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. APPLICATIONS TABLE
-- =============================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  seeker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  cover_letter TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, seeker_id)
);

-- =============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

-- EXPERIENCES POLICIES
CREATE POLICY "Experiences are viewable by everyone"
ON experiences FOR SELECT USING (true);

CREATE POLICY "Users can insert own experiences"
ON experiences FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own experiences"
ON experiences FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own experiences"
ON experiences FOR DELETE USING (auth.uid() = profile_id);

-- EDUCATION POLICIES
CREATE POLICY "Education is viewable by everyone"
ON education FOR SELECT USING (true);

CREATE POLICY "Users can insert own education"
ON education FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own education"
ON education FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own education"
ON education FOR DELETE USING (auth.uid() = profile_id);

-- COMPANIES POLICIES
CREATE POLICY "Companies are viewable by everyone"
ON companies FOR SELECT USING (true);

CREATE POLICY "Employers can insert companies"
ON companies FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their companies"
ON companies FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their companies"
ON companies FOR DELETE USING (auth.uid() = owner_id);

-- JOBS POLICIES
-- Public can only see active, non-archived, non-expired jobs
CREATE POLICY "Active jobs are viewable by everyone"
ON jobs FOR SELECT USING (
  is_active = true 
  AND is_archived = false 
  AND (expires_at IS NULL OR expires_at > NOW())
);

CREATE POLICY "Company owners can view all their jobs"
ON jobs FOR SELECT USING (
  EXISTS (SELECT 1 FROM companies WHERE id = jobs.company_id AND owner_id = auth.uid())
);

CREATE POLICY "Company owners can insert jobs"
ON jobs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM companies WHERE id = jobs.company_id AND owner_id = auth.uid())
);

CREATE POLICY "Company owners can update jobs"
ON jobs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM companies WHERE id = jobs.company_id AND owner_id = auth.uid())
);

CREATE POLICY "Company owners can delete jobs"
ON jobs FOR DELETE USING (
  EXISTS (SELECT 1 FROM companies WHERE id = jobs.company_id AND owner_id = auth.uid())
);

-- APPLICATIONS POLICIES
CREATE POLICY "Seekers can create applications"
ON applications FOR INSERT WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY "Seekers can view own applications"
ON applications FOR SELECT USING (auth.uid() = seeker_id);

CREATE POLICY "Employers can view applications for their jobs"
ON applications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs j
    JOIN companies c ON j.company_id = c.id
    WHERE j.id = applications.job_id AND c.owner_id = auth.uid()
  )
);

CREATE POLICY "Employers can update application status"
ON applications FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM jobs j
    JOIN companies c ON j.company_id = c.id
    WHERE j.id = applications.job_id AND c.owner_id = auth.uid()
  )
);

-- =============================================
-- 8. STORAGE BUCKET FOR IMAGES
-- =============================================

-- Create images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (drop existing first)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors
END $$;

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND (auth.uid())::text = (storage.foldername(name))[1]);
