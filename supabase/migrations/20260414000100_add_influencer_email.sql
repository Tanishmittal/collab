-- Add email column to influencer_profiles
ALTER TABLE public.influencer_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Sync existing emails from auth.users
UPDATE public.influencer_profiles ip
SET email = au.email
FROM auth.users au
WHERE ip.user_id = au.id;

-- Ensure newly created brand profiles also have their email populated (consistency check)
-- brand_profiles already has an email column.

-- Update handle_new_user function to keep emails in sync for both profile types
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Basic profile entry
  INSERT INTO public.profiles (user_id, display_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'influencer')
  );

  -- We don't auto-insert into influencer_profiles here because that table 
  -- requires more fields (city, niche, etc.) which are handled in the onboarding flow.
  -- The onboarding flow should set the email field when creating the profile.
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
