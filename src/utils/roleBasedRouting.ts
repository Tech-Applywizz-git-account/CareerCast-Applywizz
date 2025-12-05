// src/utils/roleBasedRouting.ts
// Utility function to determine where to route a user based on their role

import { supabase } from '../integrations/supabase/client';

export async function getRouteForUser(userId: string): Promise<string> {
    try {
        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        // Check if user is influencer
        const { data: influencer } = await supabase
            .from('influencers')
            .select('id')
            .eq('user_id', userId)
            .single();

        // Route based on role
        if (profile?.role === 'admin') {
            return "/admin-dashboard";
        } else if (influencer) {
            return "/influencer-dashboard";
        } else {
            return "/dashboard";
        }
    } catch (error) {
        console.error('Error determining user route:', error);
        return "/dashboard"; // Default fallback
    }
}
