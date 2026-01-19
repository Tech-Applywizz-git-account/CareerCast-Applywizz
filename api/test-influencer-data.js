/**
 * Test Script for Influencer Data API
 * 
 * This script tests the /api/influencer-data endpoint
 * Run with: node api/test-influencer-data.js
 */

import axios from 'axios';

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_INFLUENCER_EMAIL || 'influencer@example.com';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60));
}

async function testInfluencerDataAPI() {
    logSection('🧪 Testing Influencer Data API');

    try {
        // Test 1: Valid Request
        logSection('Test 1: Valid Request with Email');
        log(`📡 GET ${BASE_URL}/api/influencer-data?email=${TEST_EMAIL}`, 'blue');

        const response = await axios.get(`${BASE_URL}/api/influencer-data`, {
            params: { email: TEST_EMAIL }
        });

        if (response.data.success) {
            log('✅ SUCCESS: API returned valid data', 'green');
            log('\n📊 Influencer Profile:', 'yellow');
            console.log(JSON.stringify(response.data.influencer_profile, null, 2));

            log('\n📈 Statistics:', 'yellow');
            console.log(JSON.stringify(response.data.statistics, null, 2));

            log('\n💰 Financial Summary:', 'yellow');
            console.log(JSON.stringify(response.data.financial_summary, null, 2));

            log(`\n📦 Total Purchases: ${response.data.purchases_breakdown.total_purchases}`, 'yellow');
            log(`   - Paid: ${response.data.purchases_breakdown.paid_purchases_count}`, 'green');
            log(`   - Unpaid: ${response.data.purchases_breakdown.unpaid_purchases_count}`, 'red');

            if (response.data.all_purchases.length > 0) {
                log('\n🛒 Sample Purchase:', 'yellow');
                console.log(JSON.stringify(response.data.all_purchases[0], null, 2));
            }
        } else {
            log('❌ FAILED: API returned error', 'red');
            console.log(response.data);
        }

    } catch (error) {
        if (error.response) {
            log(`❌ ERROR ${error.response.status}: ${error.response.data.error}`, 'red');
            console.log(error.response.data);
        } else {
            log(`❌ ERROR: ${error.message}`, 'red');
        }
    }

    // Test 2: Missing Email Parameter
    try {
        logSection('Test 2: Missing Email Parameter');
        log(`📡 GET ${BASE_URL}/api/influencer-data`, 'blue');

        await axios.get(`${BASE_URL}/api/influencer-data`);
        log('❌ FAILED: Should have returned 400 error', 'red');

    } catch (error) {
        if (error.response && error.response.status === 400) {
            log('✅ SUCCESS: Correctly returned 400 error', 'green');
            log(`Message: ${error.response.data.error}`, 'yellow');
        } else {
            log('❌ FAILED: Unexpected error', 'red');
            console.log(error.message);
        }
    }

    // Test 3: Invalid Email
    try {
        logSection('Test 3: Invalid Email (Non-existent Influencer)');
        const invalidEmail = 'nonexistent@example.com';
        log(`📡 GET ${BASE_URL}/api/influencer-data?email=${invalidEmail}`, 'blue');

        await axios.get(`${BASE_URL}/api/influencer-data`, {
            params: { email: invalidEmail }
        });
        log('❌ FAILED: Should have returned 404 error', 'red');

    } catch (error) {
        if (error.response && error.response.status === 404) {
            log('✅ SUCCESS: Correctly returned 404 error', 'green');
            log(`Message: ${error.response.data.error}`, 'yellow');
        } else {
            log('❌ FAILED: Unexpected error', 'red');
            console.log(error.message);
        }
    }

    // Test 4: Response Time
    try {
        logSection('Test 4: Performance Test');
        log('⏱️  Measuring response time...', 'blue');

        const startTime = Date.now();
        await axios.get(`${BASE_URL}/api/influencer-data`, {
            params: { email: TEST_EMAIL }
        });
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        log(`✅ Response Time: ${responseTime}ms`, responseTime < 1000 ? 'green' : 'yellow');

        if (responseTime < 500) {
            log('   Excellent performance! 🚀', 'green');
        } else if (responseTime < 1000) {
            log('   Good performance ✓', 'yellow');
        } else {
            log('   Consider optimization ⚠️', 'red');
        }

    } catch (error) {
        log('❌ Performance test failed', 'red');
    }

    logSection('🎉 Test Suite Complete');
    log('\nTo test with a different email, run:', 'cyan');
    log(`TEST_INFLUENCER_EMAIL=your@email.com node api/test-influencer-data.js`, 'yellow');
}

// Run tests
testInfluencerDataAPI().catch(error => {
    log('\n❌ Test suite failed with error:', 'red');
    console.error(error);
    process.exit(1);
});
