-- 1. Fix admin_profiles policy (the root of recursion)
DROP POLICY IF EXISTS "Admins can view admin_profiles" ON public.admin_profiles;
CREATE POLICY "Admins can view own admin_profile" ON public.admin_profiles FOR SELECT USING (auth.uid() = user_id);

-- 2. Fix all other recursive policies from 20260321000001_admin_dashboard_init.sql
DROP POLICY IF EXISTS "Admins can view all brand profiles" ON public.brand_profiles;
CREATE POLICY "Admins can manage all brand profiles" ON public.brand_profiles FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all influencer profiles" ON public.influencer_profiles;
CREATE POLICY "Admins can manage all influencer profiles" ON public.influencer_profiles FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all campaigns" ON public.campaigns;
CREATE POLICY "Admins can manage all campaigns" ON public.campaigns FOR ALL USING (public.is_admin());
