import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkInfluencer(email) {
    console.log(`Checking influencer: ${email}`);

    const { data: influencer, error: influencerError } = await supabase
        .from('influencers')
        .select('*')
        .ilike('email', email)
        .single();

    if (influencerError || !influencer) {
        console.error('Influencer not found:', influencerError);
        return;
    }

    console.log('Influencer found:', influencer);

    const { data: purchases, error: purchasesError } = await supabase
        .from('users_by_form')
        .select('*')
        .ilike('promo_code', influencer.promo_code);

    if (purchasesError) {
        console.error('Error fetching purchases:', purchasesError);
        return;
    }

    console.log(`Total purchases found for promo_code "${influencer.promo_code}": ${purchases.length}`);

    if (purchases.length > 0) {
        const statuses = {};
        purchases.forEach(p => {
            statuses[p.payment_status] = (statuses[p.payment_status] || 0) + 1;
            console.log(`- ID: ${p.id}, Status: ${p.payment_status}, Amount: ${p.amount}, Currency: ${p.currency}, Created: ${p.created_at}`);
        });
        console.log('Status breakdown:', statuses);

        const paid = purchases.filter(p => p.payment_status === 'success' || p.payment_status === 'completed');
        const totalRev = paid.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        console.log(`Calculated Total Revenue: ${totalRev}`);
    } else {
        // Try to search for ANY purchases to see if promo codes are being used at all
        const { data: allPurchases } = await supabase
            .from('users_by_form')
            .select('promo_code')
            .limit(10);
        console.log('Sample promo codes in users_by_form:', allPurchases?.map(p => p.promo_code));
    }
}

const email = process.argv[2] || 'dinesh@applywizz.com';
checkInfluencer(email);
