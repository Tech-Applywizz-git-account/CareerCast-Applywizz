# Influencer & Admin Dashboard Implementation Guide

This document outlines the implementation of the influencer marketing system with promo codes, influencer dashboard, and admin dashboard.

## ✅ What Has Been Implemented

### 1. Database Schema (`supabase-functions/migrations/create_influencer_system.sql`)
- Created `influencers` table to store influencer data
- Added `role` column to `profiles` table (admin, influencer, user)
- Added `promo_code` column to `profiles` and `users_by_form` tables
- Created triggers to automatically update influencer stats
- Implemented RLS policies for security
- Created views for dashboard analytics

### 2. Influencer Dashboard (`src/pages/InfluencerDashboard.tsx`)
- Real-time statistics (total signups, paid signups, revenue)
- Interactive charts (bar chart for monthly trends, pie chart for payment status)
- Promo code display with copy functionality
- Detailed table showing all users who signed up with their promo code
- User details: name, email, payment status, amount paid, date/time

### 3. Admin Dashboard (`src/pages/AdminDashboard.tsx`)
- Platform-wide statistics (all influencers, total signups, revenue, conversion rates)
- List of all influencers with their stats
- Expandable view showing all users under each influencer
- Beautiful gradient cards with statistics

### 4. Updated Routing (`src/App.tsx`)
- Added routes for `/influencer-dashboard` and `/admin-dashboard`
- Both dashboards accessible via login page

### 5. Role-Based Routing Utility (`src/utils/roleBasedRouting.ts`)
- Helper function to determine correct dashboard based on user role

## 📋 Manual Steps Required

### Step 1: Install Required Dependencies

Run this command to install the charting library:

\`\`\`bash
npm install recharts
\`\`\`

### Step 2: Run Database Migration

Execute the SQL migration in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase-functions/migrations/create_influencer_system.sql`
4. Execute the SQL script

### Step 3: Update Auth.tsx for Role-Based Routing

In `src/pages/Auth.tsx`, find the `handleLogin` function (around line 547) and replace it with:

\`\`\`typescript
// Add this import at the top if not already there:
import { supabase } from '../integrations/supabase/client';

// Replace handleLogin function:
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await login(formData.email, formData.password);
    
    // Get user to check role
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      navigate("/dashboard");
      return;
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Check if user is influencer
    const { data: influencer } = await supabase
      .from('influencers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Route based on role
    if (profile?.role === 'admin') {
      navigate("/admin-dashboard");
    } else if (influencer) {
      navigate("/influencer-dashboard");
    } else {
      navigate("/dashboard");
    }
  } catch (err) {
    // handled in context
  }
};
\`\`\`

### Step 4: Add Promo Code Field to SignupPage.tsx

In `src/pages/SignupPage.tsx`, add the promo code input field after the email field (around line 1955):

\`\`\`tsx
</div>

{/* Promo Code Field */}
<div className="space-y-2">
  <label
    htmlFor="promoCode"
    className="text-sm font-medium text-gray-700"
  >
    Promo Code (Optional)
  </label>
  <input
    id="promoCode"
    name="promoCode"
    type="text"
    value={form.promoCode}
    onChange={handleChange}
    placeholder="Enter promo code if you have one"
    className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
  />
</div>

{/* Terms checkbox */}
<div className="space-y-2">
\`\`\`

## 🎯 Creating Test Data

### Create an Admin User

1. Sign up a user normally through your signup flow
2. In Supabase SQL Editor, run:

\`\`\`sql
-- Replace 'user_email@example.com' with the actual user's email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@example.com';
\`\`\`

### Create an Influencer

1. Sign up a user normally
2. In Supabase SQL Editor, run:

\`\`\`sql
-- Get the user_id first
SELECT id, email FROM auth.users WHERE email = 'influencer@example.com';

-- Insert influencer record (replace USER_ID_HERE with actual UUID)
INSERT INTO influencers (user_id, promo_code, name, email, is_active)
VALUES (
  'USER_ID_HERE',
  'INFLUENCER123',
  'John Doe',
  'influencer@example.com',
  true
);
\`\`\`

### Test Promo Code

1. Go to the signup page
2. Fill out the form
3. Enter the promo code (e.g., 'INFLUENCER123')
4. Complete payment
5. Check the influencer dashboard to see the signup appear

## 🔐 Security Notes

- RLS (Row Level Security) policies are in place
- Influencers can only see their own data
- Admins can see all influencers and their data
- Regular users don't have access to either dashboard

## 📊 Features

### Influencer Dashboard Features
- ✅ Promo code display with copy button
- ✅ Total signups counter
- ✅ Paid signups counter with conversion rate
- ✅ Total revenue tracking
- ✅ Monthly trend bar chart
- ✅ Payment status pie chart
- ✅ Detailed signups table with:
  - User name
  - Email
  - Payment status (paid/pending/failed)
  - Amount paid
  - Signup date/time

### Admin Dashboard Features
- ✅ Platform-wide statistics
- ✅ Active influencers count
- ✅ Total signups across all influencers
- ✅ Total revenue
- ✅ Overall conversion rate
- ✅ Expandable influencer list showing:
  - Influencer name, email, promo code
  - Their total signups, paid signups, revenue
  - All users under each influencer

## 🚀 Usage Flow

1. **Admin creates influencer accounts** (via SQL or later via admin panel)
2. **Influencer shares their promo code** with their audience
3. **Users sign up** using the promo code
4. **Influencer logs in** → sees all their signups and statistics
5. **Admin logs in** → sees all influencers and their performance
6. **Regular users log in** → go to normal dashboard

## 🎨 Design Highlights

- Modern, gradient-based design
- Responsive layouts
- Interactive charts with Recharts library
- Color-coded payment statuses
- Real-time data updates
- Professional UI with Lucide icons

## 🔄 Automatic Updates

The system automatically:
- Updates influencer stats when new signups occur
- Updates stats when payments are completed
- Calculates conversion rates
- Aggregates revenue data

## 📈 Future Enhancements (Optional)

- Email notifications when new signups occur
- Export data to CSV
- Custom date range filtering
- Influencer commission calculations
- Automated payouts tracking
- More detailed analytics (traffic sources, device types, etc.)

---

## Need Help?

If you encounter any issues:
1. Check that all migrations have run successfully
2. Verify RLS policies are enabled
3. Ensure the user has the correct role set
4. Check browser console for any errors
