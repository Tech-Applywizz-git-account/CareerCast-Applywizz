# 🔐 LOGIN GUIDE - Admin & Influencer

## Complete Setup & Login Process

### 📋 STEP 1: Create Test Accounts

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Go to signup page:**
   ```
   http://localhost:5173/signup
   ```

3. **Create Admin Account:**
   - Full Name: `Admin User`
   - Country Code: `+1` (or any)
   - Phone: `1234567890`
   - Email: `admin@test.com`
   - Leave Promo Code blank
   - Check terms & conditions
   - Click "Proceed to Payment"
   - Complete the PayPal payment (or skip if in test mode)
   - **Important:** Remember the password you used!

4. **Create Influencer Account:**
   - Full Name: `Test Influencer`
   - Country Code: `+1` (or any)
   - Phone: `9876543210`
   - Email: `influencer@test.com`
   - Leave Promo Code blank
   - Check terms & conditions
   - Click "Proceed to Payment"
   - Complete the payment
   - **Important:** Remember the password you used!

---

### 📋 STEP 2: Run SQL Script to Assign Roles

1. **Open Supabase Dashboard:**
   - Go to your Supabase project

2. **Navigate to SQL Editor:**
   - Click "SQL Editor" in left sidebar

3. **Copy and paste this script:**

```sql
-- Make admin@test.com an admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@test.com';

-- Create influencer record
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'influencer@test.com';
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO influencers (user_id, promo_code, name, email, is_active)
    VALUES (
      v_user_id,
      'INFLUENCER2024',
      'Test Influencer',
      'influencer@test.com',
      true
    );
  END IF;
END $$;
```

4. **Click "Run"**

---

### 📋 STEP 3: Login

#### 🔵 Login as ADMIN:

1. **Go to login page:**
   ```
   http://localhost:5173/auth
   ```

2. **Enter credentials:**
   - Email: `admin@test.com`
   - Password: `[the password you created during signup]`

3. **Click "Sign In"**

4. **Expected Result:**
   - ✅ Should redirect to: `http://localhost:5173/admin-dashboard`
   - ✅ You'll see: Platform-wide statistics, all influencers list

---

#### 🟢 Login as INFLUENCER:

1. **Go to login page:**
   ```
   http://localhost:5173/auth
   ```

2. **Enter credentials:**
   - Email: `influencer@test.com`
   - Password: `[the password you created during signup]`

3. **Click "Sign In"**

4. **Expected Result:**
   - ✅ Should redirect to: `http://localhost:5173/influencer-dashboard`
   - ✅ You'll see: Your promo code (INFLUENCER2024), signup stats, charts

---

## 📝 IMPORTANT NOTES:

### ⚠️ Password Information:
- The password is **whatever you entered during signup**
- During signup, the system normally generates a password like `firstName@123`
- But if you signed up with custom password, use that

### 🔄 If You Forgot the Password:

**Option 1: Create new test users**
```
Use different emails like:
- admin2@test.com
- influencer2@test.com
```

**Option 2: Reset password in Supabase**
1. Go to Supabase Dashboard
2. Click "Authentication" → "Users"
3. Find the user (admin@test.com or influencer@test.com)
4. Click on the user
5. Click "Send Password Recovery"
6. Or manually set a new password

---

## 🧪 COMPLETE TESTING FLOW:

### Test Sequence:

1. **Test Admin Dashboard:**
   ```
   Login: admin@test.com
   Should see: /admin-dashboard
   Features: Platform stats, influencer list
   ```

2. **Test Influencer Dashboard:**
   ```
   Login: influencer@test.com
   Should see: /influencer-dashboard
   Features: Promo code, signups, charts
   ```

3. **Test Promo Code Signup:**
   ```
   - Logout
   - Go to /signup
   - Create new user: testuser@test.com
   - Enter Promo Code: INFLUENCER2024
   - Complete signup
   - Login as influencer@test.com again
   - You should see testuser@test.com in your dashboard!
   ```

4. **Test Admin View:**
   ```
   - Login as admin@test.com
   - Click on the influencer row to expand
   - You should see testuser@test.com listed under the influencer
   ```

---

## 🎯 Quick Reference Card:

| User Type | Email | Password | Dashboard URL |
|-----------|-------|----------|---------------|
| Admin | admin@test.com | [your signup password] | /admin-dashboard |
| Influencer | influencer@test.com | [your signup password] | /influencer-dashboard |
| Regular User | any other email | [signup password] | /dashboard |

---

## ❓ Troubleshooting:

**Problem:** "Invalid login credentials"
- **Solution:** Make sure you're using the exact password from signup

**Problem:** Redirects to /dashboard instead of /admin-dashboard
- **Solution:** 
  1. Check SQL script ran successfully
  2. Verify role in Supabase: `SELECT email, role FROM profiles WHERE email = 'admin@test.com'`

**Problem:** Redirects to /dashboard instead of /influencer-dashboard
- **Solution:**
  1. Verify influencer record exists: `SELECT * FROM influencers WHERE email = 'influencer@test.com'`
  2. Re-run the influencer creation script

**Problem:** Can't see any data in dashboards
- **Solution:** Create test signups with promo code first

---

## 🎉 Success Checklist:

- [ ] Both admin and influencer accounts created via signup
- [ ] SQL script executed successfully
- [ ] Can login as admin → sees admin dashboard
- [ ] Can login as influencer → sees influencer dashboard
- [ ] Promo code shows correctly on influencer dashboard
- [ ] Test signup with promo code appears in influencer dashboard
- [ ] Admin can see all influencers and their users

---

Need help? Check that:
1. Database migration ran (create_influencer_system.sql)
2. Both users signed up successfully
3. SQL role assignment script executed
4. Using correct passwords from signup
