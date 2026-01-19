import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API Route: Get Influencer Data
 * URL: www.networknote.online/?email={email_id}
 * 
 * This route fetches complete influencer data including:
 * - Influencer profile (name, email, promo code, affiliate link)
 * - All users who bought products using their promo code/affiliate link
 * - Earnings and expenses breakdown
 * - Purchase details with timestamps
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET request.'
    });
  }

  try {
    // Get email from query parameters
    const { email } = req.query;

    // Validate email parameter
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email parameter is required. Use: /?email={influencer_email}'
      });
    }

    // Fetch influencer data
    const { data: influencer, error: influencerError } = await supabase
      .from('influencers')
      .select('*')
      .eq('email', email)
      .single();

    if (influencerError || !influencer) {
      return res.status(404).json({
        success: false,
        error: 'Influencer not found with the provided email address'
      });
    }

    // Check if influencer is active
    if (!influencer.is_active) {
      return res.status(403).json({
        success: false,
        error: 'This influencer account is currently inactive'
      });
    }

    // Fetch all users who purchased using this influencer's promo code
    const { data: purchases, error: purchasesError } = await supabase
      .from('users_by_form')
      .select('*')
      .eq('promo_code', influencer.promo_code)
      .order('created_at', { ascending: false });

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch purchase data'
      });
    }

    // Calculate earnings and expenses
    const totalEarnings = influencer.total_revenue || 0;
    const commissionRate = 0.15; // 15% commission (adjust as needed)
    const influencerEarnings = totalEarnings * commissionRate;
    const platformExpenses = totalEarnings * (1 - commissionRate);

    // Process purchase data with detailed information
    const purchaseDetails = purchases.map(purchase => ({
      purchase_id: purchase.id,
      user_details: {
        full_name: purchase.full_name,
        email: purchase.email,
        phone: purchase.phone || 'N/A',
        country: purchase.country || 'N/A'
      },
      purchase_info: {
        payment_status: purchase.payment_status,
        amount: purchase.amount,
        currency: purchase.currency || 'USD',
        promo_code_used: purchase.promo_code
      },
      timestamps: {
        purchase_date: purchase.created_at ? new Date(purchase.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'N/A',
        purchase_time: purchase.created_at ? new Date(purchase.created_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }) : 'N/A',
        purchase_datetime_iso: purchase.created_at,
        updated_at: purchase.updated_at
      },
      additional_info: {
        transaction_id: purchase.transaction_id || 'N/A',
        payment_method: purchase.payment_method || 'N/A'
      }
    }));

    // Separate paid and unpaid purchases
    const paidPurchases = purchaseDetails.filter(p => p.purchase_info.payment_status === 'success');
    const unpaidPurchases = purchaseDetails.filter(p => p.purchase_info.payment_status !== 'success');

    // Generate affiliate link (based on your domain)
    const affiliateLink = `https://www.networknote.online/?ref=${influencer.promo_code}`;
    const directReferralLink = `https://www.networknote.online/?ref=1FVQFLh1T7M01jUuRpQVA`; // From screenshot

    // Build comprehensive response
    const responseData = {
      success: true,
      timestamp: new Date().toISOString(),
      influencer_profile: {
        id: influencer.id,
        name: influencer.name,
        email: influencer.email,
        promo_code: influencer.promo_code,
        affiliate_link: affiliateLink,
        direct_referral_link: directReferralLink,
        account_status: influencer.is_active ? 'Active' : 'Inactive',
        member_since: influencer.created_at ? new Date(influencer.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'N/A',
        last_updated: influencer.updated_at
      },
      statistics: {
        total_signups: influencer.total_signups || 0,
        total_paid_signups: influencer.total_paid_signups || 0,
        total_free_signups: (influencer.total_signups || 0) - (influencer.total_paid_signups || 0),
        conversion_rate: influencer.total_signups > 0 
          ? `${((influencer.total_paid_signups / influencer.total_signups) * 100).toFixed(2)}%`
          : '0%'
      },
      financial_summary: {
        total_revenue_generated: {
          amount: totalEarnings,
          currency: 'INR',
          formatted: `₹${totalEarnings.toFixed(2)}`
        },
        influencer_earnings: {
          amount: influencerEarnings,
          currency: 'INR',
          formatted: `₹${influencerEarnings.toFixed(2)}`,
          commission_rate: `${(commissionRate * 100)}%`
        },
        platform_expenses: {
          amount: platformExpenses,
          currency: 'INR',
          formatted: `₹${platformExpenses.toFixed(2)}`
        },
        average_order_value: influencer.total_paid_signups > 0
          ? {
              amount: totalEarnings / influencer.total_paid_signups,
              currency: 'INR',
              formatted: `₹${(totalEarnings / influencer.total_paid_signups).toFixed(2)}`
            }
          : {
              amount: 0,
              currency: 'INR',
              formatted: '₹0.00'
            }
      },
      purchases_breakdown: {
        total_purchases: purchases.length,
        paid_purchases_count: paidPurchases.length,
        unpaid_purchases_count: unpaidPurchases.length,
        paid_purchases: paidPurchases,
        unpaid_purchases: unpaidPurchases
      },
      all_purchases: purchaseDetails,
      dashboard_data: {
        daily_signups_trend: {
          paid_signups: influencer.total_paid_signups || 0,
          total_signups: influencer.total_signups || 0
        },
        recent_activity: purchaseDetails.slice(0, 10) // Last 10 purchases
      }
    };

    // Return formatted JSON response
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Error in influencer-data API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
