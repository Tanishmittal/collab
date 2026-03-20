CREATE TABLE IF NOT EXISTS public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.niches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cities are viewable by everyone" ON public.cities;
CREATE POLICY "Cities are viewable by everyone"
ON public.cities
FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Niches are viewable by everyone" ON public.niches;
CREATE POLICY "Niches are viewable by everyone"
ON public.niches
FOR SELECT
USING (is_active = true);

INSERT INTO public.cities (name, slug, sort_order)
VALUES
  ('Meerut', 'meerut', 1),
  ('Delhi', 'delhi', 2),
  ('Noida', 'noida', 3),
  ('Mumbai', 'mumbai', 4),
  ('Bangalore', 'bangalore', 5),
  ('Pune', 'pune', 6),
  ('Jaipur', 'jaipur', 7),
  ('Lucknow', 'lucknow', 8)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    is_active = true;

INSERT INTO public.niches (name, slug, sort_order)
VALUES
  ('Food', 'food', 1),
  ('Fitness', 'fitness', 2),
  ('Fashion', 'fashion', 3),
  ('Tech', 'tech', 4),
  ('Travel', 'travel', 5),
  ('Lifestyle', 'lifestyle', 6),
  ('Beauty', 'beauty', 7),
  ('Comedy', 'comedy', 8)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    is_active = true;

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  action_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  influencer_profile_id UUID NOT NULL REFERENCES public.influencer_profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  external_url TEXT,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Portfolio items are viewable by everyone" ON public.portfolio_items;
CREATE POLICY "Portfolio items are viewable by everyone"
ON public.portfolio_items
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert own portfolio items" ON public.portfolio_items;
CREATE POLICY "Users can insert own portfolio items"
ON public.portfolio_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.influencer_profiles
    WHERE influencer_profiles.id = portfolio_items.influencer_profile_id
      AND influencer_profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own portfolio items" ON public.portfolio_items;
CREATE POLICY "Users can update own portfolio items"
ON public.portfolio_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.influencer_profiles
    WHERE influencer_profiles.id = portfolio_items.influencer_profile_id
      AND influencer_profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete own portfolio items" ON public.portfolio_items;
CREATE POLICY "Users can delete own portfolio items"
ON public.portfolio_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.influencer_profiles
    WHERE influencer_profiles.id = portfolio_items.influencer_profile_id
      AND influencer_profiles.user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at
ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON public.notifications(user_id, read)
WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_portfolio_items_profile_sort
ON public.portfolio_items(influencer_profile_id, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_campaign_id
ON public.portfolio_items(campaign_id);

CREATE INDEX IF NOT EXISTS idx_cities_sort_order
ON public.cities(sort_order, name);

CREATE INDEX IF NOT EXISTS idx_niches_sort_order
ON public.niches(sort_order, name);

CREATE TRIGGER update_portfolio_items_updated_at
BEFORE UPDATE ON public.portfolio_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS fcm_token TEXT,
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio_items;
