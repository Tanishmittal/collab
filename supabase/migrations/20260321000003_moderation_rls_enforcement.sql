-- Moderation RLS Enforcement
-- This migration ensures that only active profiles/campaigns are visible to the public.
-- Admins can still see everything.

-- 1. Helper Function to check Admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update influencer_profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.influencer_profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.influencer_profiles
FOR SELECT USING (is_active = true OR is_admin());

-- 3. Update brand_profiles
DROP POLICY IF EXISTS "Public can view brand profiles" ON public.brand_profiles;
CREATE POLICY "Public can view brand profiles" ON public.brand_profiles
FOR SELECT USING (is_active = true OR is_admin());

-- 4. Update campaigns
-- Existing policy might have a different name, we'll try to find or just overwrite.
DROP POLICY IF EXISTS "Campaigns are viewable by everyone" ON public.campaigns;
CREATE POLICY "Campaigns are viewable by everyone" ON public.campaigns
FOR SELECT USING (is_active = true OR is_admin());
