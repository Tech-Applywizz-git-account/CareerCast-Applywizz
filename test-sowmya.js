/**
 * Quick Test Script for Influencer Data API
 * Tests with email: sowmyar556@gmail.com
 */

import fetch from 'node-fetch';

const email = 'sowmyar556@gmail.com';
const baseUrl = 'https://www.networknote.online';

console.log('🧪 Testing Influencer Data API');
console.log('━'.repeat(60));
console.log(`📧 Email: ${email}`);
console.log(`🌐 URL: ${baseUrl}/api/influencer-data?email=${email}`);
console.log('━'.repeat(60));
console.log('\n⏳ Fetching data...\n');

try {
    const response = await fetch(`${baseUrl}/api/influencer-data?email=${email}`);
    const data = await response.json();

    console.log('📊 RESPONSE:');
    console.log('━'.repeat(60));
    console.log(JSON.stringify(data, null, 2));
    console.log('━'.repeat(60));

    if (data.success) {
        console.log('\n✅ SUCCESS! Here\'s a summary:');
        console.log('━'.repeat(60));
        console.log(`👤 Name: ${data.influencer_profile.name}`);
        console.log(`📧 Email: ${data.influencer_profile.email}`);
        console.log(`🎫 Promo Code: ${data.influencer_profile.promo_code}`);
        console.log(`🔗 Affiliate Link: ${data.influencer_profile.affiliate_link}`);
        console.log(`\n📈 Statistics:`);
        console.log(`   Total Signups: ${data.statistics.total_signups}`);
        console.log(`   Paid Signups: ${data.statistics.total_paid_signups}`);
        console.log(`   Conversion Rate: ${data.statistics.conversion_rate}`);
        console.log(`\n💰 Financial Summary:`);
        console.log(`   Total Revenue: ${data.financial_summary.total_revenue_generated.formatted}`);
        console.log(`   Influencer Earnings: ${data.financial_summary.influencer_earnings.formatted}`);
        console.log(`   Commission Rate: ${data.financial_summary.influencer_earnings.commission_rate}`);
        console.log(`\n🛒 Purchases: ${data.all_purchases.length} total`);

        if (data.all_purchases.length > 0) {
            console.log(`\n📦 Recent Purchases:`);
            data.all_purchases.slice(0, 3).forEach((purchase, index) => {
                console.log(`\n   ${index + 1}. ${purchase.user_details.full_name}`);
                console.log(`      Email: ${purchase.user_details.email}`);
                console.log(`      Amount: ${purchase.purchase_info.currency} ${purchase.purchase_info.amount}`);
                console.log(`      Status: ${purchase.purchase_info.payment_status}`);
                console.log(`      Date: ${purchase.timestamps.purchase_date} at ${purchase.timestamps.purchase_time}`);
            });
        }
        console.log('━'.repeat(60));
    } else {
        console.log('\n❌ ERROR:');
        console.log(data.error);
    }

} catch (error) {
    console.log('\n❌ FAILED TO FETCH:');
    console.log(error.message);
}
