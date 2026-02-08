-- ==========================================
-- QUICK SQL COMMANDS FOR INFLUENCER MANAGEMENT
-- ==========================================
-- Run these commands in Supabase SQL Editor when needed
-- ==========================================

-- ==========================================
-- 1. ADD A NEW INFLUENCER (Manual Method)
-- ==========================================

-- Step 1: First, have the influencer sign up through /auth
-- Step 2: Get their user ID
SELECT id, email FROM auth.users WHERE email = 'influencer@example.com';

-- Step 3: Create influencer record (replace USER_ID_HERE with the ID from Step 2)
INSERT INTO influencers (user_id, promo_code, name, email, is_active)
VALUES (
  'USER_ID_HERE',        -- UUID from Step 2
  'PROMO2024',           -- Unique promo code (uppercase)
  'Influencer Name',     -- Full name
  'influencer@example.com',  -- Email (must match auth.users)
  true                   -- Active status
);


-- ==========================================
-- 2. VIEW ALL INFLUENCERS
-- ==========================================

SELECT 
  name,
  email,
  promo_code,
  is_active,
  total_signups,
  total_paid_signups,
  total_revenue,
  created_at
FROM influencers
ORDER BY created_at DESC;


-- ==========================================
-- 3. UPDATE INFLUENCER PROMO CODE
-- ==========================================

UPDATE influencers 
SET promo_code = 'NEWCODE2024',
    updated_at = NOW()
WHERE email = 'influencer@example.com';


-- ==========================================
-- 4. ACTIVATE/DEACTIVATE INFLUENCER
-- ==========================================

-- Deactivate
UPDATE influencers 
SET is_active = false,
    updated_at = NOW()
WHERE email = 'influencer@example.com';

-- Activate
UPDATE influencers 
SET is_active = true,
    updated_at = NOW()
WHERE email = 'influencer@example.com';


-- ==========================================
-- 5. VIEW SIGNUPS BY PROMO CODE
-- ==========================================

SELECT 
  ubf.full_name,
  ubf.email,
  ubf.promo_code,
  ubf.payment_status,
  ubf.amount,
  ubf.currency,
  ubf.created_at
FROM users_by_form ubf
WHERE ubf.promo_code = 'PROMO2024'
ORDER BY ubf.created_at DESC;


-- ==========================================
-- 6. VIEW ALL USERS WITH THEIR ROLES
-- ==========================================

SELECT 
  au.email,
  p.role,
  CASE 
    WHEN i.id IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as is_influencer,
  i.promo_code,
  i.is_active
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
LEFT JOIN influencers i ON au.id = i.user_id
ORDER BY p.role NULLS LAST, au.email;


-- ==========================================
-- 7. DELETE AN INFLUENCER
-- ==========================================

-- WARNING: This will permanently delete the influencer record
-- The user account in auth.users will remain
DELETE FROM influencers WHERE email = 'influencer@example.com';


-- ==========================================
-- 8. MAKE A USER AN ADMIN
-- ==========================================

-- First, user must sign up through /auth
-- Then run this:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@example.com';


-- ==========================================
-- 9. CHECK INFLUENCER STATS
-- ==========================================

SELECT 
  i.name,
  i.promo_code,
  i.total_signups,
  i.total_paid_signups,
  i.total_revenue,
  CASE 
    WHEN i.total_signups > 0 
    THEN ROUND((i.total_paid_signups::DECIMAL / i.total_signups) * 100, 2)
    ELSE 0
  END as conversion_rate_percent,
  CASE 
    WHEN i.total_paid_signups > 0 
    THEN ROUND(i.total_revenue / i.total_paid_signups, 2)
    ELSE 0
  END as avg_revenue_per_paid_signup
FROM influencers i
ORDER BY i.total_revenue DESC;


-- ==========================================
-- 10. REFRESH INFLUENCER STATS (If out of sync)
-- ==========================================

-- Recalculate stats for a specific influencer
DO $$
DECLARE
  target_promo_code TEXT := 'PROMO2024';
  total_sigs INT;
  paid_sigs INT;
  total_rev DECIMAL(10,2);
BEGIN
  -- Count all signups
  SELECT COUNT(*) INTO total_sigs
  FROM users_by_form 
  WHERE promo_code = target_promo_code;
  
  -- Count paid signups
  SELECT COUNT(*) INTO paid_sigs
  FROM users_by_form 
  WHERE promo_code = target_promo_code 
  AND payment_status = 'success';
  
  -- Sum revenue
  SELECT COALESCE(SUM(amount), 0) INTO total_rev
  FROM users_by_form 
  WHERE promo_code = target_promo_code 
  AND payment_status = 'success';
  
  -- Update influencer
  UPDATE influencers 
  SET total_signups = total_sigs,
      total_paid_signups = paid_sigs,
      total_revenue = total_rev,
      updated_at = NOW()
  WHERE promo_code = target_promo_code;
  
  RAISE NOTICE 'Updated stats for promo code: %', target_promo_code;
END $$;


-- ==========================================
-- 11. VERIFY DATABASE TRIGGER IS WORKING
-- ==========================================

-- Check if the trigger exists
SELECT 
  tgname as trigger_name,
  tgtype as trigger_type,
  tgenabled as is_enabled
FROM pg_trigger 
WHERE tgname = 'trigger_update_influencer_stats';


-- ==========================================
-- 12. TEST DATA INSERTION (For Development)
-- ==========================================

-- Insert a test signup with promo code
-- (Replace with actual user_id if needed)
INSERT INTO users_by_form (
  full_name,
  email,
  phone,
  country,
  promo_code,
  payment_status,
  amount,
  currency
) VALUES (
  'Test User',
  'testuser@example.com',
  '+1234567890',
  'United States',
  'PROMO2024',
  'success',
  99.00,
  'USD'
);


-- ==========================================
-- NOTES
-- ==========================================
-- 1. Always use uppercase for promo codes (e.g., JOHN2024, not john2024)
-- 2. Promo codes must be unique across all influencers
-- 3. Email must match between auth.users and influencers table
-- 4. The trigger automatically updates stats when new signups occur
-- 5. Use the Admin Dashboard UI to add influencers easily (recommended)
-- ==========================================
