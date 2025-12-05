-- ==========================================
-- AUTOMATED TEST USERS SETUP
-- ==========================================
-- This script will automatically set up admin and influencer users
-- ==========================================

-- PREREQUISITE: First sign up these users through your app at /signup:
--   1. admin@test.com
--   2. influencer@test.com

-- Then run this entire script in Supabase SQL Editor


-- Step 1: Make admin@test.com an admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@test.com';


-- Step 2: Create influencer automatically (no need to paste UUID)
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user_id for influencer@test.com
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'influencer@test.com';
  
  -- Check if user exists
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User influencer@test.com not found. Please sign up first!';
  ELSE
    -- Create influencer record
    INSERT INTO influencers (user_id, promo_code, name, email, is_active)
    VALUES (
      v_user_id,
      'INFLUENCER2024',
      'Test Influencer',
      'influencer@test.com',
      true
    );
    RAISE NOTICE 'Influencer created successfully with promo code: INFLUENCER2024';
  END IF;
END $$;


-- Step 3: Verify everything was created
SELECT 
  'Admin User' as type,
  email,
  role
FROM profiles 
WHERE role = 'admin'

UNION ALL

SELECT 
  'Influencer User' as type,
  i.email,
  i.promo_code
FROM influencers i;


-- Step 4: Show complete user overview
SELECT 
  au.email,
  COALESCE(p.role, 'user') as role,
  CASE WHEN i.id IS NOT NULL THEN 'Yes' ELSE 'No' END as is_influencer,
  i.promo_code,
  i.total_signups,
  i.total_paid_signups,
  i.total_revenue
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
LEFT JOIN influencers i ON au.id = i.user_id
WHERE au.email IN ('admin@test.com', 'influencer@test.com')
ORDER BY au.email;
