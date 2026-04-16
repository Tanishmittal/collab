-- Migration to transition from string-based followers to strictly numeric tracking
-- Date: 2026-04-16

-- 1. Add new numeric tracking columns
ALTER TABLE public.influencer_profiles 
ADD COLUMN IF NOT EXISTS total_followers_count BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_verified_followers_count BIGINT DEFAULT 0;

-- 2. Migrate existing data (Best effort parsing of the string 'followers' column)
UPDATE public.influencer_profiles
SET total_followers_count = 
  CASE 
    WHEN followers ~* '^\d+(\.\d+)?[km]?$' THEN
      CASE
        WHEN followers ~* 'k$' THEN (substring(followers from '^(\d+(\.\d+)?)')::numeric * 1000)::bigint
        WHEN followers ~* 'm$' THEN (substring(followers from '^(\d+(\.\d+)?)')::numeric * 1000000)::bigint
        ELSE followers::bigint
      END
    ELSE
      -- Fallback to the sum of platform-specific BigInt columns if parsing fails
      COALESCE(ig_followers, 0) + COALESCE(yt_subscribers, 0) + COALESCE(twitter_followers, 0)
  END,
  total_verified_followers_count = (
    COALESCE(CASE WHEN ig_last_verified IS NOT NULL THEN ig_followers ELSE 0 END, 0) +
    COALESCE(CASE WHEN yt_last_verified IS NOT NULL THEN yt_subscribers ELSE 0 END, 0) +
    COALESCE(CASE WHEN twitter_last_verified IS NOT NULL THEN twitter_followers ELSE 0 END, 0)
);

-- 3. Drop the legacy string column
ALTER TABLE public.influencer_profiles DROP COLUMN IF EXISTS followers;

-- 4. Add indices for high-performance filtering
CREATE INDEX IF NOT EXISTS idx_ip_total_followers ON public.influencer_profiles(total_followers_count);
CREATE INDEX IF NOT EXISTS idx_ip_verified_followers ON public.influencer_profiles(total_verified_followers_count);
