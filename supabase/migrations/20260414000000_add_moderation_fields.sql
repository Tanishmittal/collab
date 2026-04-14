-- Migration to add moderation message columns for granular profile and campaign control
-- This allows admins to provide specific feedback when hiding content.

ALTER TABLE IF EXISTS public.influencer_profiles 
ADD COLUMN IF NOT EXISTS moderation_message TEXT;

ALTER TABLE IF EXISTS public.brand_profiles 
ADD COLUMN IF NOT EXISTS moderation_message TEXT;

ALTER TABLE IF EXISTS public.campaigns 
ADD COLUMN IF NOT EXISTS moderation_message TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Ensure RLS allows admins to edit these fields (usually already covered by service_role, but safe to check)
COMMENT ON COLUMN public.influencer_profiles.moderation_message IS 'Reason provided by admin when hiding the profile';
COMMENT ON COLUMN public.brand_profiles.moderation_message IS 'Reason provided by admin when hiding the brand (rarely used, campaigns are preferred)';
COMMENT ON COLUMN public.campaigns.moderation_message IS 'Reason provided by admin when hiding this specific campaign';
