
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_user_id uuid NOT NULL,
  influencer_user_id uuid NOT NULL,
  influencer_profile_id uuid NOT NULL REFERENCES public.influencer_profiles(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  total_amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Both brand and influencer can view their bookings
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = brand_user_id OR auth.uid() = influencer_user_id);

-- Brands can create bookings
CREATE POLICY "Brands can create bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = brand_user_id);

-- Influencer can update booking status (accept/reject)
CREATE POLICY "Influencer can update booking status" ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = influencer_user_id);

-- Brand can also update (for future approval flow)
CREATE POLICY "Brand can update own bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = brand_user_id);

-- Add updated_at trigger
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
