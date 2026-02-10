-- ============================================
-- Referans Sistemi v2: Manuel Kod Oluşturma
-- ============================================

-- 1. Eski trigger ve fonksiyonu kaldır
DROP TRIGGER IF EXISTS on_profile_created_create_referral ON profiles;
DROP FUNCTION IF EXISTS create_user_referral_code();

-- 2. Profiles tablosuna referans kodu hakkı ekle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code_rights INTEGER DEFAULT 1;

-- 3. Mevcut kullanıcılara 1 hak ver
UPDATE profiles SET referral_code_rights = 1 WHERE referral_code_rights IS NULL;

-- 4. Manuel referans kodu oluşturma fonksiyonu (kullanıcı butona basınca çalışır)
CREATE OR REPLACE FUNCTION generate_my_referral_code()
RETURNS JSON AS $$
DECLARE
    v_rights INTEGER;
    v_existing_unused_count INTEGER;
    v_new_code VARCHAR(8);
BEGIN
    -- Kullanıcının hakkını kontrol et
    SELECT referral_code_rights INTO v_rights
    FROM profiles WHERE id = auth.uid();

    IF v_rights IS NULL OR v_rights <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Referans kodu oluşturma hakkınız bulunmuyor.');
    END IF;

    -- Kullanıcının zaten kullanılmamış kodu var mı?
    SELECT COUNT(*) INTO v_existing_unused_count
    FROM referral_codes
    WHERE owner_id = auth.uid() AND is_used = false;

    IF v_existing_unused_count > 0 THEN
        RETURN json_build_object('success', false, 'error', 'Zaten aktif bir referans kodunuz var.');
    END IF;

    -- Yeni kod oluştur
    v_new_code := generate_referral_code();

    INSERT INTO referral_codes (code, owner_id)
    VALUES (v_new_code, auth.uid());

    -- Hakkı düşür
    UPDATE profiles SET referral_code_rights = referral_code_rights - 1
    WHERE id = auth.uid();

    RETURN json_build_object('success', true, 'code', v_new_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Admin: Kullanıcıya yeni hak verme fonksiyonu
-- Supabase SQL Editor'dan çalıştırılarak kullanılır:
-- SELECT grant_referral_right('kullanici-uuid-buraya', 1);
CREATE OR REPLACE FUNCTION grant_referral_right(p_user_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET referral_code_rights = COALESCE(referral_code_rights, 0) + p_amount
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Admin: Tüm kullanıcılara hak verme
-- SELECT grant_referral_right_to_all(1);
CREATE OR REPLACE FUNCTION grant_referral_right_to_all(p_amount INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET referral_code_rights = COALESCE(referral_code_rights, 0) + p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
