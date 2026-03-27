-- Re-create the update policy for bookings to allow brands to cancel BEFORE in_progress

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "brands_update_bookings" ON public.bookings;

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = brand_user_id OR auth.uid() = influencer_user_id)
  WITH CHECK (
    (
      (auth.uid() = brand_user_id AND (
        -- brands can move from accepted to in_progress
        (status = 'in_progress' AND (SELECT b.status FROM public.bookings b WHERE b.id = id) = 'accepted') OR
        -- brands can move from in_progress to completed
        (status = 'completed' AND (SELECT b.status FROM public.bookings b WHERE b.id = id) = 'in_progress') OR
        -- brands can cancel before in_progress
        (status = 'cancelled' AND (SELECT b.status FROM public.bookings b WHERE b.id = id) IN ('pending', 'accepted'))
      ))
      OR
      (auth.uid() = influencer_user_id AND (
        -- influencers can only accept or reject pending bookings
        (status IN ('accepted', 'rejected') AND (SELECT b.status FROM public.bookings b WHERE b.id = id) = 'pending')
      ))
    )
  );
