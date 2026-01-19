/**
 * Direct Database Test for Influencer: sowmyar556@gmail.com
 * This simulates what the API does
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const email = 'sowmyar556@gmail.com';

console.log('🧪 Testing Influencer Data Fetch');
console.log('━'.repeat(60));
console.log(`📧 Email: ${email}`);
console.log('━'.repeat(60));

async function testInfluencerData() {
    try {
        // Step 1: Fetch influencer data
        console.log('\n📊 Step 1: Fetching influencer profile...');
        const { data: influencer, error: influencerError } = await supabase
            .from('influencers')
            .select('*')
            .eq('email', email)
            .single();

        if (influencerError || !influencer) {
            console.log('❌ Influencer not found!');
            console.log('Error:', influencerError?.message || 'No data returned');
            return;
        }

        console.log('✅ Influencer found!');
        console.log(JSON.stringify(influencer, null, 2));

        // Step 2: Fetch purchases
        console.log('\n📦 Step 2: Fetching purchases...');
        const { data: purchases, error: purchasesError } = await supabase
            .from('users_by_form')
            .select('*')
            .eq('promo_code', influencer.promo_code)
            .order('created_at', { ascending: false });

        if (purchasesError) {
            console.log('❌ Error fetching purchases:', purchasesError.message);
            return;
        }

        console.log(`✅ Found ${purchases.length} purchases`);

        // Step 3: Calculate earnings
        const totalEarnings = influencer.total_revenue || 0;
        const commissionRate = 0.15;
        const influencerEarnings = totalEarnings * commissionRate;
        const platformExpenses = totalEarnings * (1 - commissionRate);

        // Step 4: Build response
        const responseData = {
            success: true,
            timestamp: new Date().toISOString(),
            influencer_profile: {
                id: influencer.id,
                name: influencer.name,
                email: influencer.email,
                promo_code: influencer.promo_code,
                affiliate_link: `https://www.networknote.online/?ref=${influencer.promo_code}`,
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
                }
            },
            purchases: purchases.map(p => ({
                user_name: p.full_name,
                user_email: p.email,
                amount: p.amount,
                currency: p.currency,
                status: p.payment_status,
                date: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US') : 'N/A',
                time: p.created_at ? new Date(p.created_at).toLocaleTimeString('en-US') : 'N/A'
            }))
        };

        // Display results
        console.log('\n' + '━'.repeat(60));
        console.log('📊 COMPLETE API RESPONSE:');
        console.log('━'.repeat(60));
        console.log(JSON.stringify(responseData, null, 2));
        console.log('━'.repeat(60));

        console.log('\n✅ SUMMARY:');
        console.log('━'.repeat(60));
        console.log(`👤 Name: ${responseData.influencer_profile.name}`);
        console.log(`📧 Email: ${responseData.influencer_profile.email}`);
        console.log(`🎫 Promo Code: ${responseData.influencer_profile.promo_code}`);
        console.log(`🔗 Affiliate Link: ${responseData.influencer_profile.affiliate_link}`);
        console.log(`📅 Member Since: ${responseData.influencer_profile.member_since}`);
        console.log(`\n📈 Statistics:`);
        console.log(`   Total Signups: ${responseData.statistics.total_signups}`);
        console.log(`   Paid Signups: ${responseData.statistics.total_paid_signups}`);
        console.log(`   Free Signups: ${responseData.statistics.total_free_signups}`);
        console.log(`   Conversion Rate: ${responseData.statistics.conversion_rate}`);
        console.log(`\n💰 Financial Summary:`);
        console.log(`   Total Revenue: ${responseData.financial_summary.total_revenue_generated.formatted}`);
        console.log(`   Influencer Earnings: ${responseData.financial_summary.influencer_earnings.formatted} (${responseData.financial_summary.influencer_earnings.commission_rate})`);
        console.log(`   Platform Expenses: ${responseData.financial_summary.platform_expenses.formatted}`);
        console.log(`\n🛒 Purchases: ${responseData.purchases.length} total`);

        if (responseData.purchases.length > 0) {
            console.log('\n📦 Purchase Details:');
            responseData.purchases.forEach((purchase, index) => {
                console.log(`\n   ${index + 1}. ${purchase.user_name}`);
                console.log(`      Email: ${purchase.user_email}`);
                console.log(`      Amount: ${purchase.currency} ${purchase.amount}`);
                console.log(`      Status: ${purchase.status}`);
                console.log(`      Date: ${purchase.date} at ${purchase.time}`);
            });
        }
        console.log('━'.repeat(60));

    } catch (error) {
        console.log('\n❌ ERROR:', error.message);
        console.error(error);
    }
}

testInfluencerData();
