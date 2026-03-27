-- Tighten bookings UPDATE policies to enforce role-based status transitions
-- Influencer: can only set status to 'accepted' or 'rejected' (on pending bookings)
-- Brand: can only set status to 'in_progress' or 'completed' (brand drives execution)

-- Drop the existing overly-permissive update policies
DROP POLICY IF EXISTS "Influencer can update booking status" ON public.bookings;
DROP POLICY IF EXISTS "Brand can update own bookings" ON public.bookings;

-- Influencer can accept or reject pending bookings
DROP POLICY IF EXISTS "Influencer can accept or reject bookings" ON public.bookings;
CREATE POLICY "Influencer can accept or reject bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = influencer_user_id)
  WITH CHECK (status IN ('accepted', 'rejected'));

-- Brand can start work or mark complete
DROP POLICY IF EXISTS "Brand can advance booking status" ON public.bookings;
CREATE POLICY "Brand can advance booking status" ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = brand_user_id)
  WITH CHECK (status IN ('in_progress', 'completed'));
