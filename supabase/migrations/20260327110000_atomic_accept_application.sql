-- Migration to add atomic capacity check when accepting campaign applications
-- This prevents race conditions where multiple brands could accept applications simultaneously 
-- and exceed the influencers_needed limit.

CREATE OR REPLACE FUNCTION accept_campaign_application(p_application_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_application record;
  v_campaign record;
  v_accepted_count int;
  v_result jsonb;
BEGIN
  -- 1. Get the application
  SELECT * INTO v_application 
  FROM public.campaign_applications 
  WHERE id = p_application_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found');
  END IF;

  IF v_application.status = 'accepted' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already accepted', 'campaign_closed', false);
  END IF;

  -- 2. Lock the campaign row to prevent concurrent acceptances
  SELECT * INTO v_campaign 
  FROM public.campaigns 
  WHERE id = v_application.campaign_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Campaign not found');
  END IF;

  -- 3. Validate campaign state
  IF v_campaign.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only active campaigns can accept applications');
  END IF;

  IF v_campaign.expires_at IS NOT NULL AND v_campaign.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Campaign has expired');
  END IF;

  -- 4. Check current capacity
  SELECT count(*) INTO v_accepted_count 
  FROM public.campaign_applications 
  WHERE campaign_id = v_campaign.id AND status = 'accepted';

  IF v_accepted_count >= v_campaign.influencers_needed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Campaign is already full');
  END IF;

  -- 5. Accept the application
  UPDATE public.campaign_applications 
  SET status = 'accepted', updated_at = now() 
  WHERE id = p_application_id;
  
  -- 6. Check if we just hit capacity
  IF (v_accepted_count + 1) >= v_campaign.influencers_needed THEN
    -- Update campaign to closed
    UPDATE public.campaigns 
    SET status = 'closed', updated_at = now() 
    WHERE id = v_campaign.id;
    
    -- Reject all other pending applications for this campaign
    UPDATE public.campaign_applications 
    SET status = 'rejected', updated_at = now() 
    WHERE campaign_id = v_campaign.id AND status = 'pending';

    RETURN jsonb_build_object(
      'success', true, 
      'campaign_closed', true, 
      'campaign_id', v_campaign.id, 
      'brand_user_id', v_campaign.user_id, 
      'brand_name', v_campaign.brand, 
      'influencer_user_id', v_application.user_id,
      'application_id', v_application.id
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'campaign_closed', false, 
    'campaign_id', v_campaign.id, 
    'brand_user_id', v_campaign.user_id, 
    'brand_name', v_campaign.brand, 
    'influencer_user_id', v_application.user_id,
    'application_id', v_application.id
  );
END;
$$;
