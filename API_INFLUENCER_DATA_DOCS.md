# Influencer Data API Documentation

## Overview
This API endpoint provides comprehensive influencer data including their profile, earnings, expenses, and detailed purchase history.

## Endpoint Details

### URL
```
GET https://www.networknote.online/api/influencer-data?email={influencer_email}
```

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | The email address of the influencer |

### Example Request
```bash
# Using curl
curl "https://www.networknote.online/api/influencer-data?email=influencer@example.com"

# Using JavaScript fetch
fetch('https://www.networknote.online/api/influencer-data?email=influencer@example.com')
  .then(response => response.json())
  .then(data => console.log(data));
```

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "timestamp": "2026-01-19T12:15:30.000Z",
  "influencer_profile": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "promo_code": "JOHN2024",
    "affiliate_link": "https://www.networknote.online/?ref=JOHN2024",
    "direct_referral_link": "https://www.networknote.online/?ref=1FVQFLh1T7M01jUuRpQVA",
    "account_status": "Active",
    "member_since": "December 15, 2025",
    "last_updated": "2026-01-19T12:00:00.000Z"
  },
  "statistics": {
    "total_signups": 10,
    "total_paid_signups": 5,
    "total_free_signups": 5,
    "conversion_rate": "50.00%"
  },
  "financial_summary": {
    "total_revenue_generated": {
      "amount": 5000.00,
      "currency": "INR",
      "formatted": "₹5000.00"
    },
    "influencer_earnings": {
      "amount": 750.00,
      "currency": "INR",
      "formatted": "₹750.00",
      "commission_rate": "15%"
    },
    "platform_expenses": {
      "amount": 4250.00,
      "currency": "INR",
      "formatted": "₹4250.00"
    },
    "average_order_value": {
      "amount": 1000.00,
      "currency": "INR",
      "formatted": "₹1000.00"
    }
  },
  "purchases_breakdown": {
    "total_purchases": 10,
    "paid_purchases_count": 5,
    "unpaid_purchases_count": 5,
    "paid_purchases": [...],
    "unpaid_purchases": [...]
  },
  "all_purchases": [
    {
      "purchase_id": "uuid-here",
      "user_details": {
        "full_name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "+1234567890",
        "country": "United States"
      },
      "purchase_info": {
        "payment_status": "success",
        "amount": 1000.00,
        "currency": "INR",
        "promo_code_used": "JOHN2024"
      },
      "timestamps": {
        "purchase_date": "January 15, 2026",
        "purchase_time": "02:30:45 PM",
        "purchase_datetime_iso": "2026-01-15T14:30:45.000Z",
        "updated_at": "2026-01-15T14:30:45.000Z"
      },
      "additional_info": {
        "transaction_id": "TXN123456",
        "payment_method": "PayPal"
      }
    }
  ],
  "dashboard_data": {
    "daily_signups_trend": {
      "paid_signups": 5,
      "total_signups": 10
    },
    "recent_activity": [...]
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Email Parameter
```json
{
  "success": false,
  "error": "Email parameter is required. Use: /?email={influencer_email}"
}
```

#### 404 Not Found - Influencer Not Found
```json
{
  "success": false,
  "error": "Influencer not found with the provided email address"
}
```

#### 403 Forbidden - Inactive Account
```json
{
  "success": false,
  "error": "This influencer account is currently inactive"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Error details here"
}
```

## Data Structure Details

### Influencer Profile
Contains basic information about the influencer:
- **id**: Unique identifier (UUID)
- **name**: Full name
- **email**: Email address
- **promo_code**: Unique promotional code
- **affiliate_link**: Generated affiliate link
- **account_status**: Active/Inactive status
- **member_since**: Account creation date (formatted)
- **last_updated**: Last update timestamp

### Statistics
Performance metrics:
- **total_signups**: Total number of signups
- **total_paid_signups**: Number of successful payments
- **total_free_signups**: Number of free signups
- **conversion_rate**: Percentage of paid vs total signups

### Financial Summary
Detailed financial breakdown:
- **total_revenue_generated**: Total revenue from all purchases
- **influencer_earnings**: Commission earned (default 15%)
- **platform_expenses**: Platform's share
- **average_order_value**: Average value per paid purchase

### Purchase Details
Each purchase includes:
- **user_details**: Customer information (name, email, phone, country)
- **purchase_info**: Payment status, amount, currency, promo code
- **timestamps**: Purchase date, time, and ISO datetime
- **additional_info**: Transaction ID, payment method

## Use Cases

### 1. Dashboard Visualization
Use this data to populate the influencer dashboard with:
- Total signups count
- Earnings display (₹425 format)
- Daily signups trend chart
- Signups history table

### 2. Analytics
- Track conversion rates
- Monitor revenue trends
- Analyze customer demographics
- Identify top-performing periods

### 3. Reporting
- Generate financial reports
- Export customer lists
- Track commission earnings
- Monitor affiliate link performance

## Implementation Examples

### React Component Example
```javascript
import { useState, useEffect } from 'react';

function InfluencerDashboard({ influencerEmail }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/influencer-data?email=${influencerEmail}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setData(data);
        } else {
          setError(data.error);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [influencerEmail]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>{data.influencer_profile.name}'s Dashboard</h1>
      <p>Total Signups: {data.statistics.total_signups}</p>
      <p>Earnings: {data.financial_summary.influencer_earnings.formatted}</p>
      {/* Add more dashboard elements */}
    </div>
  );
}
```

### Node.js Example
```javascript
const axios = require('axios');

async function getInfluencerData(email) {
  try {
    const response = await axios.get(
      `https://www.networknote.online/api/influencer-data?email=${email}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching influencer data:', error);
    throw error;
  }
}

// Usage
getInfluencerData('influencer@example.com')
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

## Database Schema Reference

### Tables Used
1. **influencers** - Main influencer data
   - id, user_id, promo_code, name, email
   - total_signups, total_paid_signups, total_revenue
   - is_active, created_at, updated_at

2. **users_by_form** - Purchase records
   - id, full_name, email, phone, country
   - promo_code, payment_status, amount, currency
   - transaction_id, payment_method, created_at

## Security Notes

- ✅ CORS enabled for cross-origin requests
- ✅ Input validation for email parameter
- ✅ Service role key used for database access
- ✅ Error handling for all database operations
- ⚠️ Consider adding rate limiting in production
- ⚠️ Consider adding authentication for sensitive data

## Testing

### Local Testing
```bash
# Start the development server
npm run dev

# Test the endpoint
curl "http://localhost:3000/api/influencer-data?email=test@example.com"
```

### Production Testing
```bash
curl "https://www.networknote.online/api/influencer-data?email=influencer@example.com"
```

## Troubleshooting

### Common Issues

1. **"Email parameter is required"**
   - Ensure you're passing the email query parameter
   - Check URL encoding for special characters

2. **"Influencer not found"**
   - Verify the email exists in the influencers table
   - Check for typos in the email address

3. **"Internal server error"**
   - Check Supabase connection
   - Verify environment variables are set
   - Check server logs for detailed error messages

## Environment Variables Required

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SUPABASE_URL=your_supabase_url
```

## Rate Limiting (Recommended)

Consider implementing rate limiting to prevent abuse:
- 100 requests per minute per IP
- 1000 requests per hour per influencer email

## Future Enhancements

- [ ] Add date range filtering
- [ ] Add pagination for large purchase lists
- [ ] Add export to CSV/PDF functionality
- [ ] Add real-time updates via WebSocket
- [ ] Add caching for improved performance
- [ ] Add authentication/API key requirement
- [ ] Add detailed analytics endpoints

## Support

For issues or questions:
- Check the error message in the response
- Review the database schema
- Verify environment variables
- Check server logs in Vercel dashboard

---

**Last Updated**: January 19, 2026  
**API Version**: 1.0.0  
**Maintained by**: NetworkNote Team
