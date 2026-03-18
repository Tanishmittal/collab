ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.campaign_applications(id) ON DELETE SET NULL;
