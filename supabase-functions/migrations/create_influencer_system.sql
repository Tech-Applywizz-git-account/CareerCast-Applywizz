-- Migration: Create Influencer and Admin System
-- This creates the necessary tables and roles for the influencer marketing system

-- 1. Create influencers table
CREATE TABLE IF NOT EXISTS public.influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  promo_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  total_signups INTEGER DEFAULT 0,
  total_paid_signups INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0.00
);

-- 2. Add role column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'promo_code'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN promo_code TEXT;
  END IF;
END $$;

-- 3. Add promo_code to users_by_form if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_by_form' AND column_name = 'promo_code'
  ) THEN
    ALTER TABLE public.users_by_form ADD COLUMN promo_code TEXT;
  END IF;
END $$;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_influencers_promo_code ON public.influencers(promo_code);
CREATE INDEX IF NOT EXISTS idx_influencers_user_id ON public.influencers(user_id);
CREATE INDEX IF NOT EXISTS idx_users_by_form_promo_code ON public.users_by_form(promo_code);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_promo_code ON public.profiles(promo_code);

-- 5. Create trigger function to update influencer stats when new signup occurs
CREATE OR REPLACE FUNCTION update_influencer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.promo_code IS NOT NULL AND NEW.promo_code != '' THEN
    -- Update total signups
    UPDATE public.influencers
    SET total_signups = total_signups + 1,
        updated_at = NOW()
    WHERE promo_code = NEW.promo_code;
    
    -- Update paid signups and revenue if payment is successful
    IF NEW.payment_status = 'success' AND NEW.amount IS NOT NULL THEN
      UPDATE public.influencers
      SET total_paid_signups = total_paid_signups + 1,
          total_revenue = total_revenue + NEW.amount,
          updated_at = NOW()
      WHERE promo_code = NEW.promo_code;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger on users_by_form table (with existence check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_influencer_stats'
  ) THEN
    CREATE TRIGGER trigger_update_influencer_stats
    AFTER INSERT OR UPDATE ON public.users_by_form
    FOR EACH ROW
    EXECUTE FUNCTION update_influencer_stats();
  END IF;
END $$;

-- 7. Create view for influencer dashboard data
CREATE OR REPLACE VIEW influencer_dashboard_stats AS
SELECT 
  i.id,
  i.promo_code,
  i.name,
  i.email,
  i.total_signups,
  i.total_paid_signups,
  i.total_revenue,
  i.created_at,
  (
    SELECT json_agg(
      json_build_object(
        'id', ubf.id,
        'full_name', ubf.full_name,
        'email', ubf.email,
        'payment_status', ubf.payment_status,
        'amount', ubf.amount,
        'currency', ubf.currency,
        'created_at', ubf.created_at
      ) ORDER BY ubf.created_at DESC
    )
    FROM public.users_by_form ubf
    WHERE ubf.promo_code = i.promo_code
  ) AS signups
FROM public.influencers i;

-- Grant permissions on the view
GRANT SELECT ON influencer_dashboard_stats TO authenticated;

-- 8. Add comments for documentation
COMMENT ON TABLE public.influencers IS 'Stores influencer information and their promo codes';
COMMENT ON VIEW influencer_dashboard_stats IS 'Aggregated view of influencer stats with their signups';
