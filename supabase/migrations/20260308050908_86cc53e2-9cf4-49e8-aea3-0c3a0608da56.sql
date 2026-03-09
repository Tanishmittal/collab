
CREATE TABLE public.campaign_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  influencer_profile_id uuid NOT NULL REFERENCES public.influencer_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

ALTER TABLE public.campaign_applications ENABLE ROW LEVEL SECURITY;

-- Everyone can see applications (brands need to see applicants)
CREATE POLICY "Applications are viewable by campaign owner and applicant"
  ON public.campaign_applications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can apply"
  ON public.campaign_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Applicants can update own applications"
  ON public.campaign_applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Campaign owners can update application status"
  ON public.campaign_applications FOR UPDATE
  TO authenticated
  USING (campaign_id IN (SELECT id FROM public.campaigns WHERE user_id = auth.uid()));

CREATE POLICY "Applicants can delete own applications"
  ON public.campaign_applications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_campaign_applications_updated_at
  BEFORE UPDATE ON public.campaign_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
