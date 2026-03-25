-- 20260321114500_add_influencer_stats_history.sql
-- Migration to support per-platform follower counts and history snapshots

-- 1. Create history table for tracking growth and storing raw Apify snapshots
CREATE TABLE IF NOT EXISTS public.influencer_stats_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id UUID NOT NULL REFERENCES public.influencer_profiles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'youtube', 'twitter')),
    follower_count BIGINT NOT NULL,
    engagement_rate NUMERIC,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indices for fast growth analysis
CREATE INDEX IF NOT EXISTS idx_sh_influencer_platform_date ON public.influencer_stats_history(influencer_id, platform, created_at DESC);

-- 2. Add platform-specific latest columns to influencer_profiles
ALTER TABLE public.influencer_profiles 
ADD COLUMN IF NOT EXISTS ig_followers BIGINT,
ADD COLUMN IF NOT EXISTS ig_engagement NUMERIC,
ADD COLUMN IF NOT EXISTS ig_last_verified TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS yt_subscribers BIGINT,
ADD COLUMN IF NOT EXISTS yt_engagement NUMERIC,
ADD COLUMN IF NOT EXISTS yt_last_verified TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS twitter_followers BIGINT,
ADD COLUMN IF NOT EXISTS twitter_engagement NUMERIC,
ADD COLUMN IF NOT EXISTS twitter_last_verified TIMESTAMPTZ;

-- 3. Enable RLS for history
ALTER TABLE public.influencer_stats_history ENABLE ROW LEVEL SECURITY;

-- Allow influencers to see their own history
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Influencers can view their own stats history') THEN
        CREATE POLICY "Influencers can view their own stats history" ON public.influencer_stats_history
            FOR SELECT TO authenticated
            USING (EXISTS (
                SELECT 1 FROM public.influencer_profiles
                WHERE influencer_profiles.id = influencer_stats_history.influencer_id
                AND influencer_profiles.user_id = auth.uid()
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view stats history') THEN
        CREATE POLICY "Public can view stats history" ON public.influencer_stats_history
            FOR SELECT TO anon, authenticated
            USING (true);
    END IF;
END $$;
