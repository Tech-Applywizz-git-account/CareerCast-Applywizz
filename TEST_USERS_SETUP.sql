-- ==========================================
-- TEST USERS SETUP FOR ADMIN & INFLUENCER
-- ==========================================
-- Run these commands in Supabase SQL Editor
-- ==========================================

-- STEP 1: Create Admin User
-- ==========================================
-- First, you need to sign up normally through your app at /signup
-- Let's say you signed up with email: admin@test.com

-- Then run this to make them admin:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@test.com';

-- Verify admin was created:
SELECT id, email, role FROM profiles WHERE role = 'admin';


-- STEP 2: Create Influencer User
-- ==========================================
-- First, sign up normally through your app at /signup
-- Let's say you signed up with email: influencer@test.com

-- Step 2a: Get the user_id for the influencer
SELECT id, email FROM auth.users WHERE email = 'influencer@test.com';
-- Copy the 'id' value from the result

-- Step 2b: Create influencer record
-- Replace 'PASTE_USER_ID_HERE' with the actual UUID from Step 2a
INSERT INTO influencers (user_id, promo_code, name, email, is_active)
VALUES (
  'PASTE_USER_ID_HERE',  -- Replace this with actual user ID
  'INFLUENCER2024',       -- Promo code that users will enter
  'Test Influencer',      -- Influencer name
  'influencer@test.com',  -- Must match the email from auth.users
  true                    -- Active status
);

-- Verify influencer was created:
SELECT * FROM influencers;


-- STEP 3: Create Another Influencer (Optional)
-- ==========================================
-- Sign up with: influencer2@test.com

-- Get user_id:
SELECT id, email FROM auth.users WHERE email = 'influencer2@test.com';

-- Create influencer:
INSERT INTO influencers (user_id, promo_code, name, email, is_active)
VALUES (
  'PASTE_USER_ID_HERE',
  'PROMO2024',
  'Second Influencer',
  'influencer2@test.com',
  true
);


-- ==========================================
-- COMPLETE TEST SCENARIO (ALL IN ONE)
-- ==========================================
-- If you want to set up everything at once:

-- 1. Sign up these 3 users through your app first:
--    - admin@test.com
--    - influencer@test.com  
--    - influencer2@test.com

-- 2. Then run this (replace the UUIDs):

-- Make admin:
UPDATE profiles SET role = 'admin' WHERE email = 'admin@test.com';

-- Create influencers (replace UUIDs with actual values):
DO $$
DECLARE
  influencer1_id UUID;
  influencer2_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO influencer1_id FROM auth.users WHERE email = 'influencer@test.com';
  SELECT id INTO influencer2_id FROM auth.users WHERE email = 'influencer2@test.com';
  
  -- Create influencer records
  INSERT INTO influencers (user_id, promo_code, name, email, is_active)
  VALUES 
    (influencer1_id, 'INFLUENCER2024', 'Test Influencer', 'influencer@test.com', true),
    (influencer2_id, 'PROMO2024', 'Second Influencer', 'influencer2@test.com', true);
END $$;


-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check all user roles:
SELECT id, email, role FROM profiles WHERE role IS NOT NULL ORDER BY role;

-- Check all influencers:
SELECT 
  i.name,
  i.email,
  i.promo_code,
  i.is_active,
  i.total_signups,
  i.total_paid_signups,
  i.total_revenue
FROM influencers i
ORDER BY i.created_at DESC;

-- Check which users have which roles:
SELECT 
  au.email,
  p.role,
  CASE 
    WHEN i.id IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as is_influencer,
  i.promo_code
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
LEFT JOIN influencers i ON au.id = i.user_id
ORDER BY p.role NULLS LAST, au.email;


-- ==========================================
-- TEST THE PROMO CODE SYSTEM
-- ==========================================

-- After creating influencers, test by:
-- 1. Go to /signup
-- 2. Fill the form
-- 3. Enter promo code: INFLUENCER2024
-- 4. Complete signup and payment
-- 5. Login as influencer@test.com
-- 6. You should see the new signup in the dashboard

-- Check if promo code tracking works:
SELECT 
  ubf.full_name,
  ubf.email,
  ubf.promo_code,
  ubf.payment_status,
  ubf.amount,
  ubf.created_at
FROM users_by_form ubf
WHERE ubf.promo_code IS NOT NULL
ORDER BY ubf.created_at DESC;


-- ==========================================
-- QUICK CLEANUP (if needed)
-- ==========================================

-- Remove all test influencers:
-- DELETE FROM influencers WHERE email LIKE '%@test.com';

-- Remove admin role from test users:
-- UPDATE profiles SET role = 'user' WHERE email LIKE '%@test.com';
