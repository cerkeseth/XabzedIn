-- =============================================
-- XabzedIn - Veritabanı Şeması
-- Supabase SQL Editor'da çalıştırın
-- =============================================

-- =============================================
-- 1. PROFILES (Kullanıcı Profilleri)
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
  referred_by UUID REFERENCES auth.users(id),
  referral_code_rights INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Yeni kullanıcı kaydolduğunda otomatik profil oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================
-- 2. EXPERIENCES (İş Deneyimleri)
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
-- 3. EDUCATION (Eğitim Bilgileri)
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
-- 4. COMPANIES (Şirketler)
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
-- 5. JOBS (İş İlanları)
-- =============================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT CHECK (type IN ('remote', 'onsite', 'hybrid')),
  location TEXT,
  salary_range TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. APPLICATIONS (Başvurular)
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
-- 7. REFERRAL_CODES (Referans Kodları)
-- =============================================
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- =============================================
-- 8. REFERANS SİSTEMİ FONKSİYONLARI
-- =============================================

-- Benzersiz 8 haneli kod üretme
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  new_code VARCHAR(8);
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Manuel referans kodu oluşturma (kullanıcı butona basınca)
CREATE OR REPLACE FUNCTION generate_my_referral_code()
RETURNS JSON AS $$
DECLARE
  v_rights INTEGER;
  v_existing_unused_count INTEGER;
  v_new_code VARCHAR(8);
BEGIN
  SELECT referral_code_rights INTO v_rights
  FROM profiles WHERE id = auth.uid();

  IF v_rights IS NULL OR v_rights <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Referans kodu oluşturma hakkınız bulunmuyor.');
  END IF;

  SELECT COUNT(*) INTO v_existing_unused_count
  FROM referral_codes
  WHERE owner_id = auth.uid() AND is_used = false;

  IF v_existing_unused_count > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Zaten aktif bir referans kodunuz var.');
  END IF;

  v_new_code := generate_referral_code();

  INSERT INTO referral_codes (code, owner_id)
  VALUES (v_new_code, auth.uid());

  UPDATE profiles SET referral_code_rights = referral_code_rights - 1
  WHERE id = auth.uid();

  RETURN json_build_object('success', true, 'code', v_new_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Referans kodunu kullanma (kayıt sırasında)
CREATE OR REPLACE FUNCTION use_referral_code(p_code VARCHAR(8), p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_code_owner UUID;
BEGIN
  UPDATE referral_codes
  SET is_used = true,
      used_by_id = p_user_id,
      used_at = NOW()
  WHERE code = UPPER(p_code)
    AND is_used = false
  RETURNING owner_id INTO v_code_owner;
  
  IF v_code_owner IS NOT NULL OR FOUND THEN
    UPDATE profiles
    SET referred_by = v_code_owner
    WHERE id = p_user_id;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin: Tek kullanıcıya hak verme
-- Kullanım: SELECT grant_referral_right('kullanici-uuid', 1);
CREATE OR REPLACE FUNCTION grant_referral_right(p_user_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET referral_code_rights = COALESCE(referral_code_rights, 0) + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin: Tüm kullanıcılara hak verme
-- Kullanım: SELECT grant_referral_right_to_all(1);
CREATE OR REPLACE FUNCTION grant_referral_right_to_all(p_amount INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET referral_code_rights = COALESCE(referral_code_rights, 0) + p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonksiyon izinleri
GRANT EXECUTE ON FUNCTION use_referral_code(VARCHAR(8), UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_my_referral_code() TO authenticated;

-- =============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

-- EXPERIENCES
CREATE POLICY "Experiences are viewable by everyone"
ON experiences FOR SELECT USING (true);

CREATE POLICY "Users can insert own experiences"
ON experiences FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own experiences"
ON experiences FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own experiences"
ON experiences FOR DELETE USING (auth.uid() = profile_id);

-- EDUCATION
CREATE POLICY "Education is viewable by everyone"
ON education FOR SELECT USING (true);

CREATE POLICY "Users can insert own education"
ON education FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own education"
ON education FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own education"
ON education FOR DELETE USING (auth.uid() = profile_id);

-- COMPANIES
CREATE POLICY "Companies are viewable by everyone"
ON companies FOR SELECT USING (true);

CREATE POLICY "Employers can insert companies"
ON companies FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their companies"
ON companies FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their companies"
ON companies FOR DELETE USING (auth.uid() = owner_id);

-- JOBS
CREATE POLICY "Active jobs are viewable by everyone"
ON jobs FOR SELECT USING (
  is_active = true AND is_archived = false AND (expires_at IS NULL OR expires_at > NOW())
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

-- APPLICATIONS
CREATE POLICY "Seekers can create applications"
ON applications FOR INSERT WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY "Seekers can view own applications"
ON applications FOR SELECT USING (auth.uid() = seeker_id);

CREATE POLICY "Seekers can delete own applications"
ON applications FOR DELETE USING (auth.uid() = seeker_id);

CREATE POLICY "Employers can view applications for their jobs"
ON applications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs j JOIN companies c ON j.company_id = c.id
    WHERE j.id = applications.job_id AND c.owner_id = auth.uid()
  )
);

CREATE POLICY "Employers can update application status"
ON applications FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM jobs j JOIN companies c ON j.company_id = c.id
    WHERE j.id = applications.job_id AND c.owner_id = auth.uid()
  )
);

-- REFERRAL CODES
CREATE POLICY "Anyone can check valid codes"
ON referral_codes FOR SELECT USING (is_used = false);

CREATE POLICY "Users can see own referral code"
ON referral_codes FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can see codes they used"
ON referral_codes FOR SELECT USING (auth.uid() = used_by_id);

-- =============================================
-- 10. STORAGE (Görsel Bucket'ı)
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'images');

CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- =============================================
-- 11. BAŞLANGIÇ VERİLERİ
-- =============================================

-- 10 adet admin referans kodu oluştur
INSERT INTO referral_codes (code, owner_id) VALUES
  (generate_referral_code(), NULL),
  (generate_referral_code(), NULL),
  (generate_referral_code(), NULL),
  (generate_referral_code(), NULL),
  (generate_referral_code(), NULL),
  (generate_referral_code(), NULL),
  (generate_referral_code(), NULL),
  (generate_referral_code(), NULL),
  (generate_referral_code(), NULL),
  (generate_referral_code(), NULL);

-- Kodları görmek için çalıştırın:
-- SELECT code FROM referral_codes WHERE is_used = false AND owner_id IS NULL;
