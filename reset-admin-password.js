// Quick script to reset admin password
// Run with: node reset-admin-password.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Get these from your Supabase project settings
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.VITE_SUPABASE_ANON_KEY; // Fallback to anon key if service key not found

console.log('🔍 Loading credentials...');
console.log('URL:', SUPABASE_URL ? '✅ Found' : '❌ Missing');
console.log('Service Key:', SUPABASE_SERVICE_ROLE_KEY ? '✅ Found' : '❌ Missing');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('\n❌ Error: Missing Supabase credentials in .env file');
    console.error('Please ensure your .env file contains:');
    console.error('  - VITE_SUPABASE_URL');
    console.error('  - VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function resetAdminPassword() {
    const adminEmail = 'admin@test.com';
    const newPassword = 'admin123'; // Change this to your desired password

    try {
        // Find the user by email
        const { data: users, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', adminEmail)
            .eq('role', 'admin')
            .single();

        if (fetchError || !users) {
            console.error('❌ Admin user not found:', fetchError);
            return;
        }

        // Update the password using admin API
        const { data, error } = await supabase.auth.admin.updateUserById(
            users.id,
            { password: newPassword }
        );

        if (error) {
            console.error('❌ Error updating password:', error);
            return;
        }

        console.log('✅ Password reset successfully!');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 New Password: ${newPassword}`);
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

resetAdminPassword();
