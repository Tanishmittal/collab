
ALTER TABLE public.influencer_profiles
  ADD COLUMN instagram_url text,
  ADD COLUMN youtube_url text,
  ADD COLUMN twitter_url text,
  ADD COLUMN verification_code text DEFAULT encode(gen_random_bytes(4), 'hex'),
  ADD COLUMN is_verified boolean NOT NULL DEFAULT false;
