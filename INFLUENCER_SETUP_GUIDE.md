# 🎯 Influencer Setup Guide

## Overview

This guide explains how to add influencers to your system and set their promo codes.

## 📋 Current System Architecture

### Database Structure

1. **`auth.users`** - Supabase authentication table (created when user signs up)
2. **`profiles`** - User profiles with role (admin/influencer/user)
3. **`influencers`** - Influencer details with promo codes
4. **`users_by_form`** - Signups that used promo codes

### How It Works

When someone signs up with a promo code:
- Their info is saved in `users_by_form` with the promo code
- The influencer's stats are automatically updated via database trigger
- The influencer can see all their signups in their dashboard

---

## 🚀 Method 1: Quick Setup via Supabase SQL Editor (Current Method)

### Step 1: Create User Account

First, the influencer needs to sign up through your app:
1. Go to `/auth` (signup page)
2. Fill in the signup form:
   - **Email**: `john@example.com` (influencer's real email)
   - **Password**: Choose a secure password
3. Complete the signup process

### Step 2: Get the User ID

In Supabase SQL Editor, run:
```sql
SELECT id, email FROM auth.users WHERE email = 'john@example.com';
```

Copy the `id` value (it's a UUID like `123e4567-e89b-12d3-a456-426614174000`)

### Step 3: Create Influencer Record

Replace `YOUR_USER_ID_HERE` with the UUID from Step 2:

```sql
INSERT INTO influencers (user_id, promo_code, name, email, is_active)
VALUES (
  'YOUR_USER_ID_HERE',     -- UUID from Step 2
  'JOHN2024',              -- Custom promo code (uppercase, unique)
  'John Doe',              -- Influencer's name
  'john@example.com',      -- Must match auth email
  true                     -- Active status
);
```

### Step 4: Verify

```sql
SELECT * FROM influencers WHERE email = 'john@example.com';
```

### Example: Adding Multiple Influencers

```sql
-- First, sign up these users through your app:
-- - sarah@example.com
-- - mike@example.com

-- Then run this:
DO $$
DECLARE
  sarah_id UUID;
  mike_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO sarah_id FROM auth.users WHERE email = 'sarah@example.com';
  SELECT id INTO mike_id FROM auth.users WHERE email = 'mike@example.com';
  
  -- Create influencer records
  INSERT INTO influencers (user_id, promo_code, name, email, is_active)
  VALUES 
    (sarah_id, 'SARAH2024', 'Sarah Williams', 'sarah@example.com', true),
    (mike_id, 'MIKE2024', 'Mike Johnson', 'mike@example.com', true);
END $$;
```

---

## 🎨 Method 2: Admin Dashboard Interface (RECOMMENDED - Coming Soon)

I'll create an admin interface where you can:
- Add influencers directly from the UI
- Generate promo codes automatically
- Set passwords for influencers
- Activate/deactivate influencers
- View all influencers in a table

This will be added to your Admin Dashboard!

---

## 🔐 Setting Up Passwords

### Password Requirements
When influencers sign up through `/auth`:
- Minimum 6 characters (Supabase default)
- They can set any password they want

### Password Reset
If an influencer forgets their password:
1. Go to `/auth` (login page)
2. Click "Forgot Password?"
3. Enter their email
4. They'll receive a reset link

### As Admin, You Can Also:
Reset passwords via Supabase Dashboard:
1. Go to: `Authentication` > `Users`
2. Find the user
3. Click the three dots > `Reset Password`
4. Send them the reset link

---

## 📝 Promo Code Best Practices

### Naming Convention
- **Format**: `INFLUENCERNAME2024` or `BRANDNAME25`
- **Rules**: 
  - Use uppercase letters
  - No spaces
  - 4-20 characters
  - Letters and numbers only
  - Must be unique

### Examples
- `JOHN2024` - Simple and clean
- `TECHGURU25` - Branded
- `WINTER2024` - Seasonal
- `VIP100` - Special tier

---

## ✅ Testing the Setup

### Test Promo Code Flow

1. **Login as Influencer**:
   - Go to `/auth`
   - Login with: `john@example.com` / password
   - You'll be redirected to `/influencer-dashboard`

2. **Test Signup with Promo Code**:
   - Open incognito/private window
   - Go to your landing page `)
   - Fill the signup form
   - Enter promo code: `JOHN2024`
   - Complete payment (or test payment)

3. **Verify in Dashboard**:
   - Login as influencer again
   - You should see:
     - Total signups increased
     - New signup in the table
     - Updated revenue (if payment successful)

---

## 🔍 Useful SQL Queries

### View All Influencers

```sql
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
```

### View Signups by Promo Code

```sql
SELECT 
  ubf.full_name,
  ubf.email,
  ubf.promo_code,
  ubf.payment_status,
  ubf.amount,
  ubf.created_at
FROM users_by_form ubf
WHERE ubf.promo_code = 'JOHN2024'
ORDER BY ubf.created_at DESC;
```

### View All Users with Roles

```sql
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
ORDER BY p.role NULLS LAST;
```

### Deactivate an Influencer

```sql
UPDATE influencers 
SET is_active = false 
WHERE email = 'john@example.com';
```

### Change Promo Code

```sql
UPDATE influencers 
SET promo_code = 'NEWCODE2024' 
WHERE email = 'john@example.com';
```

---

## 🐛 Troubleshooting

### Issue: Influencer Can't Login
- ✅ Check if user exists: `SELECT * FROM auth.users WHERE email = 'email@example.com'`
- ✅ Verify influencer record: `SELECT * FROM influencers WHERE email = 'email@example.com'`
- ✅ Check if email is confirmed in Supabase Dashboard

### Issue: Promo Code Not Working
- ✅ Check promo code exists: `SELECT * FROM influencers WHERE promo_code = 'CODE2024'`
- ✅ Check if influencer is active: `is_active = true`
- ✅ Verify promo code is exactly uppercase

### Issue: Stats Not Updating
- ✅ Check database trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_influencer_stats'`
- ✅ Verify promo code matches exactly
- ✅ Check logs in Supabase Dashboard

---

## 📞 Need Help?

If you encounter issues:
1. Check the Supabase logs in Dashboard
2. Verify all migrations are run
3. Test with a fresh signup
4. Review the `users_by_form` table for the new entry

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Create influencer | See Step 3 above |
| View all influencers | `SELECT * FROM influencers;` |
| Deactivate influencer | `UPDATE influencers SET is_active = false WHERE email = 'x';` |
| Change promo code | `UPDATE influencers SET promo_code = 'NEW' WHERE email = 'x';` |
| Delete influencer | `DELETE FROM influencers WHERE email = 'x';` |

---

**🎉 You're all set!** Influencers can now login and track their signups.
