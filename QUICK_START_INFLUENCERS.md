# 🎯 Influencer Management - Complete Guide

## 📚 Quick Overview

You now have **TWO WAYS** to add influencers and set their promo codes:

### ✨ Method 1: Admin Dashboard (RECOMMENDED - NEW!)
- 🖱️ **Easiest**: Click a button in the Admin Dashboard
- ⚡ **Fastest**: Takes 30 seconds
- 🎯 **User-friendly**: No SQL knowledge needed

### 📝 Method 2: Manual SQL (Advanced)
- 🔧 **Flexible**: For bulk operations or automation
- 💻 **Direct**: Via Supabase SQL Editor
- 📖 **Documented**: See `INFLUENCER_SQL_COMMANDS.sql`

---

## 🚀 Method 1: Using Admin Dashboard (NEW!)

### Step-by-Step:

1. **Login as Admin**
   - Go to `/auth`
   - Login with your admin credentials

2. **Navigate to Admin Dashboard**
   - You'll automatically be redirected to `/admin-dashboard`
   - Or click the admin link from homepage

3. **Click "Add Influencer" Button**
   - Look for the purple button in the "All Influencers" section
   - It says "Add Influencer" with a user icon

4. **Fill in the Form**
   ```
   📝 Full Name: John Doe
   📧 Email: john@example.com
   🔒 Password: securepass123
   🎟️ Promo Code: JOHN2024
   ```

5. **Click "Create Influencer"**
   - A success popup will show the credentials
   - Save these credentials immediately!
   - The influencer list will refresh automatically

6. **Share Credentials**
   - Send the email and password to the influencer
   - They can login at `/auth` immediately
   - They'll see their dashboard at `/influencer-dashboard`

### ✅ Features:
- ✓ Automatic validation
- ✓ Checks for duplicate promo codes
- ✓ Creates auth account + influencer record in one step
- ✓ Shows credentials in a popup
- ✓ Instantly active and ready to use

---

## 📝 Method 2: Manual SQL Setup

See the file: **`INFLUENCER_SETUP_GUIDE.md`** for detailed instructions.

Quick summary:
1. Influencer signs up at `/auth`
2. You get their user_id from Supabase
3. Run SQL to create influencer record
4. They can login immediately

Full SQL commands available in: **`INFLUENCER_SQL_COMMANDS.sql`**

---

## 🔐 Password Management

### Setting Passwords (Admin Dashboard Method)
- You set the password when creating the influencer
- Password must be at least 6 characters
- Password is shown once in the success popup
- **Important**: Save it immediately!

### Resetting Passwords

**Option 1: Influencer Self-Service**
1. Go to `/auth`
2. Click "Forgot Password?"
3. Enter email
4. Check email for reset link

**Option 2: Admin via Supabase**
1. Go to Supabase Dashboard > Authentication > Users
2. Find the user
3. Click three dots (•••) > "Reset Password"
4. Send them the reset link

---

## 🎫 Promo Code Best Practices

### Format Rules:
- ✅ Uppercase letters only: `JOHN2024`
- ✅ Numbers allowed: `PROMO100`
- ✅ 4-20 characters
- ❌ No spaces
- ❌ No special characters
- ❌ No lowercase (automatically converted)

### Good Examples:
- `JOHN2024` - Simple and personal
- `TECHGURU25` - Branded
- `WINTER24` - Seasonal
- `VIP100` - Special tier

### Bad Examples:
- ❌ `john2024` - Lowercase (will be auto-converted)
- ❌ `JOHN-2024` - Special characters not allowed
- ❌ `JO` - Too short
- ❌ Must be unique!

---

## 🧪 Testing the Complete Flow

### Test as Admin:
1. Login as admin
2. Create a test influencer:
   - Name: Test Influencer
   - Email: test-influencer@example.com
   - Password: test123
   - Promo Code: TEST2024

### Test as Influencer:
3. Logout from admin
4. Login as the test influencer
5. You should see the influencer dashboard
6. Note the promo code displayed

### Test Signup Flow:
7. Open an incognito window
8. Go to your landing page
9. Fill signup form
10. Enter promo code: `TEST2024`
11. Complete the flow

### Verify Tracking:
12. Login as test influencer again
13. Check dashboard - you should see:
    - Total signups: 1
    - New signup in the table
    - Updated stats

---

## 📊 Viewing Influencer Stats

### In Admin Dashboard:
- See all influencers at once
- View overall platform stats
- Click any influencer to expand their details
- See all signups per influencer

### In Influencer Dashboard:
- Each influencer sees only their own stats:
  - Total signups
  - Paid signups
  - Total revenue
  - Conversion rate
  - List of all their signups
  - Charts and graphs

---

## 🔧 Management Tasks

### Common Tasks:

#### Deactivate an Influencer
**Via SQL:**
```sql
UPDATE influencers 
SET is_active = false 
WHERE email = 'influencer@example.com';
```

#### Change Promo Code
**Via SQL:**
```sql
UPDATE influencers 
SET promo_code = 'NEWCODE2024' 
WHERE email = 'influencer@example.com';
```

#### View All Influencers
**Via SQL:**
```sql
SELECT name, email, promo_code, is_active, total_signups
FROM influencers
ORDER BY created_at DESC;
```

### More commands in: `INFLUENCER_SQL_COMMANDS.sql`

---

## 🐛 Troubleshooting

### Issue: Can't create influencer via Admin Dashboard

**Possible causes:**
1. ✓ Promo code already exists
   - Solution: Choose a different promo code
2. ✓ Email already registered
   - Solution: Use a different email
3. ✓ Password too short
   - Solution: Use at least 6 characters

### Issue: Influencer can't login

**Check:**
1. ✓ User exists in auth.users
   ```sql
   SELECT * FROM auth.users WHERE email = 'email@example.com';
   ```
2. ✓ Influencer record exists
   ```sql
   SELECT * FROM influencers WHERE email = 'email@example.com';
   ```
3. ✓ Email is confirmed (check Supabase Dashboard)

### Issue: Stats not updating

**Check:**
1. ✓ Trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_influencer_stats';
   ```
2. ✓ Promo code matches exactly (case-sensitive)
3. ✓ Check `users_by_form` table for the signup

**Fix:** Run the refresh stats script in `INFLUENCER_SQL_COMMANDS.sql` (Section 10)

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `INFLUENCER_SETUP_GUIDE.md` | Detailed guide for all methods |
| `INFLUENCER_SQL_COMMANDS.sql` | SQL reference for manual management |
| `QUICK_START_INFLUENCERS.md` | This file - quick overview |
| `AdminDashboard.tsx` | Updated with "Add Influencer" feature |
| `InfluencerDashboard.tsx` | Fixed TypeScript error |

---

## 🎉 You're Ready!

### For Quick Setup (Recommended):
1. Login as admin at `/auth`
2. Click "Add Influencer" button
3. Fill the form
4. Share credentials with influencer
5. Done! 🎊

### For Advanced Management:
- See `INFLUENCER_SQL_COMMANDS.sql`
- Use Supabase SQL Editor
- Full control over all fields

---

## 💡 Pro Tips

1. **Save Credentials**: When creating an influencer, the password is shown only once!
2. **Test First**: Create a test influencer to verify everything works
3. **Unique Codes**: Each promo code must be unique - plan ahead
4. **Monitor Dashboard**: Check the admin dashboard regularly for stats
5. **Bulk Creation**: For many influencers, consider using SQL batch inserts

---

## 📞 Need Help?

If you encounter issues:
1. Check Supabase logs in Dashboard
2. Verify migrations are applied
3. Test with a simple example first
4. Review the troubleshooting section

---

**Happy Influencer Management! 🚀**
