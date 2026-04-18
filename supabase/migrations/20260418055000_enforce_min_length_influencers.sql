-- Migration: Enforce minimum length of 4 for names and usernames
-- Created at: 2026-04-18 05:50:00

-- 1. Enforce length on influencer_profiles
ALTER TABLE public.influencer_profiles
  ADD CONSTRAINT influencer_name_length_check CHECK (char_length(name) >= 4) NOT VALID;

ALTER TABLE public.influencer_profiles
  ADD CONSTRAINT influencer_slug_length_check CHECK (char_length(verification_code) >= 4) NOT VALID;

-- 2. Enforce length on main profiles table display_name
ALTER TABLE public.profiles
  ADD CONSTRAINT profile_display_name_length_check CHECK (char_length(display_name) >= 4) NOT VALID;

COMMENT ON CONSTRAINT influencer_name_length_check ON public.influencer_profiles IS 'Ensures influencer names are at least 4 characters long for professional quality.';
COMMENT ON CONSTRAINT influencer_slug_length_check ON public.influencer_profiles IS 'Ensures branded usernames (verification_code) are at least 4 characters long to prevent squatting.';
