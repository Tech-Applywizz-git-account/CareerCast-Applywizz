import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create a Supabase client with the SERVICE_ROLE_KEY to bypass RLS and admin restrictions
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { userId, newPassword } = await req.json()

        if (!userId || !newPassword) {
            throw new Error('Missing userId or newPassword')
        }

        // Update the user's password
        const { data, error } = await supabaseClient.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        )

        if (error) throw error

        return new Response(
            JSON.stringify({ message: 'Password updated successfully', user: data.user }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
