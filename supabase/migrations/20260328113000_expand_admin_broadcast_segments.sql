ALTER TABLE public.admin_broadcasts
DROP CONSTRAINT IF EXISTS admin_broadcasts_segment_check;

ALTER TABLE public.admin_broadcasts
ADD CONSTRAINT admin_broadcasts_segment_check
CHECK (segment IN ('all', 'influencers', 'brands', 'needs_profile'));
