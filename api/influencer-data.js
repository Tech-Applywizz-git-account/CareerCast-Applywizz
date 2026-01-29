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
    // Get email from query parameters (trimmed)
    const email = (req.query.email || '').trim();

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
      .ilike('email', email)
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
      .ilike('promo_code', influencer.promo_code)
      .order('created_at', { ascending: false });

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch purchase data'
      });
    }

    // 📊 STATS CALCULATION LOGIC
    // We combine data from the 'influencers' table (counters) and 'users_by_form' (event log)
    // to provide the most accurate picture.

    // 1. Log-based stats (from users_by_form)
    const totalSignupsLog = purchases.length;
    const paidPurchasesLog = purchases.filter(p => p.payment_status === 'success' || p.payment_status === 'completed');
    const totalPaidSignupsLog = paidPurchasesLog.length;
    const totalRevenueLog = paidPurchasesLog.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // 2. Profile-based stats (from influencers table counters)
    const totalSignupsProfile = influencer.total_signups || 0;
    const totalPaidSignupsProfile = influencer.total_paid_signups || 0;
    const totalRevenueProfile = Number(influencer.total_revenue) || 0;

    // 3. Final stats (Use the higher value to ensure we don't miss records not yet in users_by_form or vice versa)
    const totalSignups = Math.max(totalSignupsLog, totalSignupsProfile);
    const totalPaidSignups = Math.max(totalPaidSignupsLog, totalPaidSignupsProfile);
    const totalRevenue = Math.max(totalRevenueLog, totalRevenueProfile);
    const totalFreeSignups = Math.max(0, totalSignups - totalPaidSignups);

    // 4. Financial Calculations (Forced to INR as requested)
    const originalCurrency = paidPurchasesLog.length > 0 ? (paidPurchasesLog[0].currency || 'USD') : 'USD';
    const conversionRate = originalCurrency === 'USD' ? 85 : 1;
    const displayCurrency = 'INR';
    const currencySymbol = '₹';

    const revenueINR = totalRevenue * conversionRate;
    const payoutPerSignupUSD = 5; // $5 USD per paid signup
    const totalEarningsUSD = totalPaidSignups * payoutPerSignupUSD;
    const totalEarningsINR = totalEarningsUSD * conversionRate;
    const platformExpensesINR = revenueINR - totalEarningsINR;

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
        amount: Number((Number(purchase.amount) || 0) * conversionRate).toFixed(2),
        currency: 'INR',
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

    // Generate secure affiliate link (Base64 encoded PromoCode|ReversedCode)
    const generateSecureHash = (code) => {
      const checksum = code.split('').reverse().join('');
      const str = `${code}|${checksum}`;
      // In Node.js environment
      return Buffer.from(str).toString('base64');
    };

    const secureRef = generateSecureHash(influencer.promo_code);
    const affiliateLink = `https://www.networknote.online/?ref=${secureRef}`;

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
        direct_referral_link: affiliateLink,
        account_status: influencer.is_active ? 'Active' : 'Inactive',
        member_since: influencer.created_at ? new Date(influencer.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'N/A',
        last_updated: influencer.updated_at
      },
      statistics: {
        total_signups: totalSignups,
        total_paid_signups: totalPaidSignups,
        total_free_signups: totalFreeSignups,
        conversion_rate: totalSignups > 0
          ? `${((totalPaidSignups / totalSignups) * 100).toFixed(2)}%`
          : '0%'
      },
      financial_summary: {
        total_revenue_generated: {
          amount: revenueINR,
          currency: displayCurrency,
          formatted: `${currencySymbol}${revenueINR.toFixed(2)}`
        },
        influencer_earnings: {
          amount: totalEarningsINR,
          currency: displayCurrency,
          formatted: `${currencySymbol}${totalEarningsINR.toFixed(2)}`,
          payout_per_signup: `$${payoutPerSignupUSD} USD`
        },
        total_earnings: {
          amount: totalEarningsINR,
          currency: displayCurrency,
          formatted: `${currencySymbol}${totalEarningsINR.toFixed(2)}`
        },
        platform_expenses: {
          amount: platformExpensesINR,
          currency: displayCurrency,
          formatted: `${currencySymbol}${platformExpensesINR.toFixed(2)}`
        },
        average_order_value: totalPaidSignups > 0
          ? {
            amount: revenueINR / totalPaidSignups,
            currency: displayCurrency,
            formatted: `${currencySymbol}${(revenueINR / totalPaidSignups).toFixed(2)}`
          }
          : {
            amount: 0,
            currency: displayCurrency,
            formatted: `${currencySymbol}0.00`
          }
      },
      purchases_breakdown: {
        total_purchases: purchaseDetails.length,
        paid_purchases_count: totalPaidSignups,
        unpaid_purchases_count: totalFreeSignups,
        paid_purchases: purchaseDetails.filter(p => p.purchase_info.payment_status === 'success' || p.purchase_info.payment_status === 'completed'),
        unpaid_purchases: purchaseDetails.filter(p => p.purchase_info.payment_status !== 'success' && p.purchase_info.payment_status !== 'completed')
      },
      all_purchases: purchaseDetails,
      dashboard_data: {
        daily_signups_trend: {
          paid_signups: totalPaidSignups,
          total_signups: totalSignups
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
