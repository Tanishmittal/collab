ALTER TABLE public.brand_profiles
ADD COLUMN IF NOT EXISTS brand_tagline TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS creator_requirements TEXT,
ADD COLUMN IF NOT EXISTS deliverable_preferences TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS campaign_goals TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS response_time_expectation TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.brand_profiles.monthly_budget IS
'Deprecated for public brand profile display. Keep for internal use only if needed.';

COMMENT ON COLUMN public.brand_profiles.brand_tagline IS
'Short public-facing positioning line for the brand landing page.';

COMMENT ON COLUMN public.brand_profiles.creator_requirements IS
'Public description of the kinds of creators, content quality, and fit the brand expects.';

COMMENT ON COLUMN public.brand_profiles.deliverable_preferences IS
'Preferred deliverable types such as reels, stories, UGC, events.';

COMMENT ON COLUMN public.brand_profiles.campaign_goals IS
'High-level campaign goals such as awareness, footfall, launches, UGC.';
