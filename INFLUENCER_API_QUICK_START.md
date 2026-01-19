# 🚀 Quick Start Guide - Influencer Data API

## What This API Does

This API endpoint fetches **complete influencer data** based on their email address, including:
- ✅ Influencer profile (name, email, promo code, affiliate link)
- ✅ All users who bought products using their promo code/affiliate link
- ✅ Earnings and expenses breakdown
- ✅ Purchase details with timestamps (date, time, user email)
- ✅ Complete data for dashboard visualization (as shown in your screenshot)

## 📍 API Endpoint

```
GET /api/influencer-data?email={influencer_email}
```

## 🎯 Quick Usage

### Option 1: Direct Browser Access
Simply open in your browser:
```
https://www.networknote.online/api/influencer-data?email=influencer@example.com
```

### Option 2: JavaScript/React
```javascript
// Fetch influencer data
const email = 'influencer@example.com';
const response = await fetch(`/api/influencer-data?email=${email}`);
const data = await response.json();

if (data.success) {
  console.log('Total Signups:', data.statistics.total_signups);
  console.log('Earnings:', data.financial_summary.influencer_earnings.formatted);
  console.log('All Purchases:', data.all_purchases);
}
```

### Option 3: cURL (Testing)
```bash
curl "https://www.networknote.online/api/influencer-data?email=influencer@example.com"
```

## 📊 What You Get Back

### Key Data Points (matching your screenshot):

1. **Total Signups** → `data.statistics.total_signups`
2. **Earnings (₹425)** → `data.financial_summary.influencer_earnings.formatted`
3. **Direct Referral Link** → `data.influencer_profile.affiliate_link`
4. **Promo Code** → `data.influencer_profile.promo_code`
5. **Daily Signups Trend** → `data.dashboard_data.daily_signups_trend`
6. **Signups History** → `data.all_purchases` (with user details, date, time, amount)

### Sample Response Structure:
```json
{
  "success": true,
  "influencer_profile": {
    "name": "John Doe",
    "email": "john@example.com",
    "promo_code": "JOHN2024",
    "affiliate_link": "https://www.networknote.online/?ref=JOHN2024"
  },
  "statistics": {
    "total_signups": 1,
    "total_paid_signups": 1,
    "conversion_rate": "100.00%"
  },
  "financial_summary": {
    "influencer_earnings": {
      "formatted": "₹425.00"
    }
  },
  "all_purchases": [
    {
      "user_details": {
        "full_name": "Vinay Gudasi",
        "email": "vinaygudasi@gmail.com"
      },
      "purchase_info": {
        "amount": 12.95,
        "payment_status": "success"
      },
      "timestamps": {
        "purchase_date": "December 12, 2025",
        "purchase_time": "02:30:45 PM"
      }
    }
  ]
}
```

## 🎨 Using in Your Dashboard

### Display Total Signups
```javascript
<div className="stat-card">
  <h3>Total Signups</h3>
  <p className="big-number">{data.statistics.total_signups}</p>
</div>
```

### Display Earnings
```javascript
<div className="earnings-card">
  <h3>Earnings (INR)</h3>
  <p className="amount">{data.financial_summary.influencer_earnings.formatted}</p>
  <small>₹{data.financial_summary.influencer_earnings.amount} per signup</small>
</div>
```

### Display Purchase History Table
```javascript
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Status</th>
      <th>Amount</th>
      <th>Date</th>
    </tr>
  </thead>
  <tbody>
    {data.all_purchases.map(purchase => (
      <tr key={purchase.purchase_id}>
        <td>{purchase.user_details.full_name}</td>
        <td>{purchase.purchase_info.payment_status}</td>
        <td>{purchase.purchase_info.amount}</td>
        <td>{purchase.timestamps.purchase_date}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### Display Affiliate Link
```javascript
<div className="referral-link">
  <label>Direct Referral Link</label>
  <input 
    type="text" 
    value={data.influencer_profile.affiliate_link} 
    readOnly 
  />
  <button onClick={() => navigator.clipboard.writeText(data.influencer_profile.affiliate_link)}>
    Copy Link
  </button>
</div>
```

## 🧪 Testing Locally

1. **Start your development server:**
```bash
npm run dev
```

2. **Test the endpoint:**
```bash
# Replace with actual influencer email from your database
curl "http://localhost:3000/api/influencer-data?email=influencer@example.com"
```

3. **Or use the test script:**
```bash
node api/test-influencer-data.js
```

## ⚠️ Common Issues & Solutions

### Issue: "Email parameter is required"
**Solution:** Make sure you're passing the email in the URL:
```
✅ Correct: /api/influencer-data?email=test@example.com
❌ Wrong:   /api/influencer-data
```

### Issue: "Influencer not found"
**Solution:** 
1. Check if the influencer exists in the database
2. Verify the email is correct (case-sensitive)
3. Run this SQL to check:
```sql
SELECT * FROM influencers WHERE email = 'your@email.com';
```

### Issue: Empty purchases array
**Solution:** This means no users have signed up using this influencer's promo code yet. This is normal for new influencers.

## 📝 Next Steps

1. **Integrate into your dashboard** - Use the data to populate your influencer dashboard UI
2. **Add authentication** - Secure the endpoint so only authorized users can access it
3. **Add caching** - Cache responses for better performance
4. **Add filters** - Add date range filters for historical data

## 🔗 Related Files

- **API Implementation:** `api/influencer-data.js`
- **Full Documentation:** `API_INFLUENCER_DATA_DOCS.md`
- **Test Script:** `api/test-influencer-data.js`
- **Vercel Config:** `vercel.json` (route mapping)

## 💡 Pro Tips

1. **Use the promo_code for tracking** - It's unique per influencer
2. **Cache the response** - If data doesn't change frequently
3. **Filter by date** - Add date range parameters for historical analysis
4. **Export functionality** - Add CSV/PDF export for reports
5. **Real-time updates** - Consider WebSocket for live updates

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify environment variables are set
3. Check Supabase connection
4. Review the full documentation in `API_INFLUENCER_DATA_DOCS.md`

---

**Created:** January 19, 2026  
**Status:** ✅ Ready to use  
**Endpoint:** `/api/influencer-data`
