# 🔄 Influencer Data API - Data Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                               │
│  https://www.networknote.online/api/influencer-data?email=xyz.com   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API ROUTE HANDLER                               │
│                   (api/influencer-data.js)                           │
│                                                                       │
│  1. Validate email parameter                                         │
│  2. Query Supabase database                                          │
│  3. Process and format data                                          │
│  4. Return JSON response                                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                               │
│                                                                       │
│  ┌──────────────────────┐        ┌──────────────────────┐          │
│  │  influencers table   │        │  users_by_form table │          │
│  ├──────────────────────┤        ├──────────────────────┤          │
│  │ • id                 │        │ • id                 │          │
│  │ • name               │◄───┐   │ • full_name          │          │
│  │ • email              │    │   │ • email              │          │
│  │ • promo_code         │────┼───│ • promo_code         │          │
│  │ • affiliate_link     │    │   │ • payment_status     │          │
│  │ • total_signups      │    │   │ • amount             │          │
│  │ • total_paid_signups │    │   │ • currency           │          │
│  │ • total_revenue      │    │   │ • created_at         │          │
│  │ • is_active          │    │   │ • transaction_id     │          │
│  │ • created_at         │    │   │ • payment_method     │          │
│  └──────────────────────┘    │   └──────────────────────┘          │
│                               │                                      │
│  JOIN ON: influencers.promo_code = users_by_form.promo_code        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      JSON RESPONSE                                   │
│                                                                       │
│  {                                                                   │
│    "success": true,                                                  │
│    "influencer_profile": { ... },                                   │
│    "statistics": { ... },                                           │
│    "financial_summary": { ... },                                    │
│    "all_purchases": [ ... ]                                         │
│  }                                                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    REACT DASHBOARD                                   │
│              (InfluencerDataDashboard.tsx)                           │
│                                                                       │
│  ┌─────────────────────────────────────────────────────┐            │
│  │              STATS CARDS                             │            │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐│            │
│  │  │ Total    │ │ Earnings │ │  Paid    │ │Conversion││            │
│  │  │ Signups  │ │  ₹425    │ │ Signups  │ │  Rate   ││            │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────┘│            │
│  └─────────────────────────────────────────────────────┘            │
│                                                                       │
│  ┌─────────────────────────────────────────────────────┐            │
│  │         DIRECT REFERRAL LINK                         │            │
│  │  https://networknote.online/?ref=PROMO  [Copy Link] │            │
│  └─────────────────────────────────────────────────────┘            │
│                                                                       │
│  ┌─────────────────────────────────────────────────────┐            │
│  │         SIGNUPS HISTORY TABLE                        │            │
│  │  Name    | Email  | Status  | Amount | Date         │            │
│  │  ──────────────────────────────────────────────────  │            │
│  │  Vinay   | vinay@ | SUCCESS | $12.95 | Dec 12, 2025 │            │
│  │  Gudasi  | gmail  |         |        |              │            │
│  └─────────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Steps

### Step 1: Client Request
```javascript
fetch('/api/influencer-data?email=influencer@example.com')
```

### Step 2: API Validation
```javascript
// Validate email parameter
if (!email) {
  return 400 error
}
```

### Step 3: Database Query - Influencer
```javascript
// Fetch influencer by email
const influencer = await supabase
  .from('influencers')
  .select('*')
  .eq('email', email)
  .single();
```

### Step 4: Database Query - Purchases
```javascript
// Fetch all purchases with this promo code
const purchases = await supabase
  .from('users_by_form')
  .select('*')
  .eq('promo_code', influencer.promo_code)
  .order('created_at', { ascending: false });
```

### Step 5: Data Processing
```javascript
// Calculate earnings
const totalEarnings = influencer.total_revenue;
const commissionRate = 0.15;
const influencerEarnings = totalEarnings * commissionRate;

// Format purchase details
const purchaseDetails = purchases.map(purchase => ({
  user_details: { ... },
  purchase_info: { ... },
  timestamps: { ... }
}));
```

### Step 6: Response Formation
```javascript
return {
  success: true,
  influencer_profile: { ... },
  statistics: { ... },
  financial_summary: { ... },
  all_purchases: purchaseDetails
}
```

### Step 7: Dashboard Rendering
```jsx
<InfluencerDataDashboard 
  influencerEmail="influencer@example.com" 
/>
```

## Request/Response Flow

```
┌──────────┐     GET /api/influencer-data?email=xyz     ┌──────────┐
│          │──────────────────────────────────────────►│          │
│  Client  │                                            │   API    │
│ (Browser)│                                            │  Server  │
│          │◄──────────────────────────────────────────│          │
└──────────┘     JSON Response with all data            └──────────┘
                                                              │
                                                              │
                                                              ▼
                                                        ┌──────────┐
                                                        │ Supabase │
                                                        │ Database │
                                                        └──────────┘
```

## Error Handling Flow

```
┌─────────────────┐
│ Request Arrives │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      NO      ┌──────────────────┐
│ Email provided? │─────────────►│ Return 400 Error │
└────────┬────────┘              └──────────────────┘
         │ YES
         ▼
┌─────────────────┐      NO      ┌──────────────────┐
│ Influencer      │─────────────►│ Return 404 Error │
│ exists?         │              └──────────────────┘
└────────┬────────┘
         │ YES
         ▼
┌─────────────────┐      NO      ┌──────────────────┐
│ Is active?      │─────────────►│ Return 403 Error │
└────────┬────────┘              └──────────────────┘
         │ YES
         ▼
┌─────────────────┐
│ Fetch purchases │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Process & return│
│ JSON response   │
└─────────────────┘
```

## Database Relationship

```
┌──────────────────────────────────────────────────────┐
│                  INFLUENCERS TABLE                    │
│                                                       │
│  promo_code: "JOHN2024"  ◄────────┐                 │
│  total_signups: 10                │                  │
│  total_paid_signups: 5            │                  │
│  total_revenue: 5000.00           │                  │
└───────────────────────────────────┼──────────────────┘
                                    │
                                    │ JOIN
                                    │
┌───────────────────────────────────┼──────────────────┐
│              USERS_BY_FORM TABLE  │                  │
│                                   │                  │
│  Row 1: promo_code: "JOHN2024" ───┘                 │
│         full_name: "User 1"                          │
│         amount: 1000.00                              │
│         payment_status: "success"                    │
│                                                       │
│  Row 2: promo_code: "JOHN2024"                       │
│         full_name: "User 2"                          │
│         amount: 1000.00                              │
│         payment_status: "success"                    │
│                                                       │
│  ... (8 more rows)                                   │
└──────────────────────────────────────────────────────┘
```

## Response Data Structure

```
{
  success: true,
  timestamp: "2026-01-19T12:15:30.000Z",
  
  influencer_profile: {
    ├── id
    ├── name
    ├── email
    ├── promo_code
    ├── affiliate_link
    ├── account_status
    └── member_since
  },
  
  statistics: {
    ├── total_signups
    ├── total_paid_signups
    ├── total_free_signups
    └── conversion_rate
  },
  
  financial_summary: {
    ├── total_revenue_generated: { amount, currency, formatted }
    ├── influencer_earnings: { amount, currency, formatted, commission_rate }
    ├── platform_expenses: { amount, currency, formatted }
    └── average_order_value: { amount, currency, formatted }
  },
  
  purchases_breakdown: {
    ├── total_purchases
    ├── paid_purchases_count
    ├── unpaid_purchases_count
    ├── paid_purchases: [...]
    └── unpaid_purchases: [...]
  },
  
  all_purchases: [
    {
      ├── purchase_id
      ├── user_details: { full_name, email, phone, country }
      ├── purchase_info: { payment_status, amount, currency, promo_code_used }
      ├── timestamps: { purchase_date, purchase_time, purchase_datetime_iso }
      └── additional_info: { transaction_id, payment_method }
    },
    ...
  ],
  
  dashboard_data: {
    ├── daily_signups_trend: { paid_signups, total_signups }
    └── recent_activity: [last 10 purchases]
  }
}
```

## Component Integration

```
┌────────────────────────────────────────────────────────┐
│              InfluencerDataDashboard.tsx               │
│                                                         │
│  useEffect(() => {                                     │
│    fetch('/api/influencer-data?email=...')             │
│      .then(res => res.json())                          │
│      .then(data => setData(data))                      │
│  }, [influencerEmail]);                                │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Stats Cards (using data.statistics)              │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Referral Link (using data.influencer_profile)    │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Purchase Table (using data.all_purchases)        │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

## File Structure

```
NetworkNote-with-admin-influencer-dashboard/
│
├── api/
│   ├── influencer-data.js          ← Main API endpoint
│   ├── test-influencer-data.js     ← Test script
│   ├── send-otp.js
│   ├── generate-introduction.js
│   └── server.js
│
├── src/
│   └── components/
│       └── InfluencerDataDashboard.tsx  ← React component
│
├── vercel.json                      ← Route configuration
├── .env                             ← Environment variables
│
└── Documentation/
    ├── API_INFLUENCER_DATA_DOCS.md       ← Full API docs
    ├── INFLUENCER_API_QUICK_START.md     ← Quick start guide
    ├── INFLUENCER_API_IMPLEMENTATION.md  ← Implementation summary
    └── INFLUENCER_API_DATA_FLOW.md       ← This file
```

## Usage Example

```javascript
// 1. Make API request
const response = await fetch('/api/influencer-data?email=john@example.com');
const data = await response.json();

// 2. Access data
console.log('Name:', data.influencer_profile.name);
console.log('Earnings:', data.financial_summary.influencer_earnings.formatted);
console.log('Purchases:', data.all_purchases.length);

// 3. Display in UI
data.all_purchases.forEach(purchase => {
  console.log(`${purchase.user_details.full_name} - ${purchase.purchase_info.amount}`);
});
```

---

**This diagram shows the complete data flow from client request to dashboard display!** 🎯
