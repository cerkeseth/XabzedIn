-- =============================================
-- REFERRAL CODE SYSTEM
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. REFERRAL CODES TABLE
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(8) UNIQUE NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- Kodu oluşturan (NULL = admin)
    used_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Kodu kullanan
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- 2. ADD referred_by COLUMN TO PROFILES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);

-- 3. ENABLE RLS ON REFERRAL_CODES
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR REFERRAL_CODES

-- Everyone can check if a code is valid (for registration)
CREATE POLICY "Anyone can check valid codes"
ON referral_codes FOR SELECT
USING (is_used = false);

-- Users can see their own referral code
CREATE POLICY "Users can see own referral code"
ON referral_codes FOR SELECT
USING (auth.uid() = owner_id);

-- Users can see codes they used
CREATE POLICY "Users can see codes they used"
ON referral_codes FOR SELECT
USING (auth.uid() = used_by_id);

-- Service role can do everything (for triggers)
-- Note: Triggers run with SECURITY DEFINER so they bypass RLS

-- 5. FUNCTION TO GENERATE UNIQUE CODE
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(8) AS $$
DECLARE
    new_code VARCHAR(8);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8 character alphanumeric code
        new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
        
        -- Exit loop if unique
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCTION TO CREATE REFERRAL CODE FOR NEW USER
CREATE OR REPLACE FUNCTION create_user_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO referral_codes (code, owner_id)
    VALUES (generate_referral_code(), NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. TRIGGER: Create referral code when profile is created
DROP TRIGGER IF EXISTS on_profile_created_create_referral ON profiles;
CREATE TRIGGER on_profile_created_create_referral
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_user_referral_code();

-- 8. FUNCTION TO MARK REFERRAL CODE AS USED
CREATE OR REPLACE FUNCTION use_referral_code(p_code VARCHAR(8), p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_code_owner UUID;
BEGIN
    -- Get the code owner and mark as used
    UPDATE referral_codes
    SET is_used = true,
        used_by_id = p_user_id,
        used_at = NOW()
    WHERE code = UPPER(p_code)
      AND is_used = false
    RETURNING owner_id INTO v_code_owner;
    
    -- If code was found and updated
    IF v_code_owner IS NOT NULL OR FOUND THEN
        -- Update the profile with referred_by
        UPDATE profiles
        SET referred_by = v_code_owner
        WHERE id = p_user_id;
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. GRANT EXECUTE TO AUTHENTICATED USERS
GRANT EXECUTE ON FUNCTION use_referral_code(VARCHAR(8), UUID) TO authenticated;

-- =============================================
-- ADMIN: CREATE INITIAL REFERRAL CODES
-- Run these to create starter codes
-- =============================================

-- Create 10 admin codes (owner_id is NULL for admin-created codes)
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

-- View all unused codes (run this to see the codes to distribute)
-- SELECT code, created_at FROM referral_codes WHERE is_used = false AND owner_id IS NULL;
