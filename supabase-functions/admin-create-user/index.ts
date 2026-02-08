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
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { email, password, fullName, role } = await req.json()

        if (!email || !password) {
            throw new Error('Email and password are required')
        }

        // 1. Try to create the user
        // 1. Try to create the user
        let userId: string | null = null;
        let isNewUser = false;

        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName
            }
        })

        if (createError) {
            console.log('User creation failed, checking if user exists...', createError.message)

            // Attempt to find the user to see if we should update instead

            // 1. Try profiles table first (fastest)
            const { data: profileData } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single()

            if (profileData) {
                userId = profileData.id
                console.log('User found in profiles:', userId)
            } else {
                // 2. Fallback: Try listUsers (in case not in profiles yet)
                // Fetch up to 1000 users to be safe
                const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })

                if (!listError && users) {
                    const foundUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
                    if (foundUser) {
                        userId = foundUser.id
                        console.log('User found in auth list:', userId)
                    }
                }
            }

            if (userId) {
                // User exists! Update them.
                console.log('Updating existing user...')
                const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                    userId,
                    { password: password, user_metadata: { full_name: fullName } }
                )

                if (updateError) {
                    console.error('Failed to update existing user:', updateError)
                    throw updateError
                }
            } else {
                // User not found, so the creation error was legitimate (e.g. invalid password, etc)
                console.error('User creation failed and user could not be found:', createError)
                throw createError
            }
        } else {
            userId = userData.user.id
            isNewUser = true
        }

        // 2. Update the profile role if specified
        if (role && userId) {
            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ role: role })
                .eq('id', userId)

            if (updateError) {
                console.error('Failed to update role:', updateError)
                throw updateError
            }
        }

        return new Response(
            JSON.stringify({
                user_id: userId,
                message: isNewUser ? 'User created successfully' : 'Existing user updated to Admin successfully'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
