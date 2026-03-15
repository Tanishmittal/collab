
-- Drop policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Influencer profiles are viewable by everyone" ON public.influencer_profiles;

-- Ensure influencer profiles are readable by everyone (anon and authenticated)
CREATE POLICY "Influencer profiles are viewable by everyone" ON public.influencer_profiles FOR SELECT USING (true);
