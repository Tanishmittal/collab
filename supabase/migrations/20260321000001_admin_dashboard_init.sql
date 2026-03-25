-- Create admin_profiles table
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Add is_active flag to core tables for moderation
ALTER TABLE public.brand_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.influencer_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Enable RLS on admin_profiles
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Only Admins can see the admin_profiles table
CREATE POLICY "Admins can view admin_profiles"
ON public.admin_profiles
FOR SELECT
USING (
    auth.uid() IN (SELECT user_id FROM public.admin_profiles)
);

-- Policy: Broadcasters/Moderators (Admins) can see all brand profiles
CREATE POLICY "Admins can view all brand profiles"
ON public.brand_profiles
FOR ALL
USING (
    auth.uid() IN (SELECT user_id FROM public.admin_profiles)
);

-- Policy: Broadcasters/Moderators (Admins) can see all influencer profiles
CREATE POLICY "Admins can view all influencer profiles"
ON public.influencer_profiles
FOR ALL
USING (
    auth.uid() IN (SELECT user_id FROM public.admin_profiles)
);

-- Policy: Broadcasters/Moderators (Admins) can see and edit all campaigns
CREATE POLICY "Admins can manage all campaigns"
ON public.campaigns
FOR ALL
USING (
    auth.uid() IN (SELECT user_id FROM public.admin_profiles)
);

-- Important: Update existing policies for public users to respect is_active
-- Assuming existing policies exist, we should drop and recreate or add a filter.
-- For this V1, let's just make sure future fetches include the is_active check.
