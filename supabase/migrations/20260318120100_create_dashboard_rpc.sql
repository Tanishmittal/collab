-- Create RPC function to fetch all dashboard data in a single query
-- Replaces 26+ separate queries with 1 optimized database call

CREATE OR REPLACE FUNCTION get_dashboard_data(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_influencer_profile jsonb;
  v_brand_profile jsonb;
BEGIN
  -- Get influencer profile (if exists)
  SELECT jsonb_build_object(
    'id', id,
    'name', name,
    'followers', followers,
    'rating', rating,
    'engagement_rate', engagement_rate,
    'avatar_url', avatar_url,
    'city', city,
    'niche', niche
  ) INTO v_influencer_profile
  FROM influencer_profiles
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Get brand profile (if exists)
  SELECT jsonb_build_object(
    'id', id,
    'company_name', company_name,
    'website', website,
    'verified', verified
  ) INTO v_brand_profile
  FROM brand_profiles
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Build complete response
  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'influencer_profile', v_influencer_profile,
    'brand_profile', v_brand_profile,
    'campaigns', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id,
        'brand', c.brand,
        'brand_logo', c.brand_logo,
        'city', c.city,
        'budget', c.budget,
        'influencers_needed', c.influencers_needed,
        'niche', c.niche,
        'status', c.status,
        'description', c.description,
        'created_at', c.created_at,
        'deliverables', c.deliverables
      ) ORDER BY c.created_at DESC), '[]'::jsonb)
      FROM campaigns c
      WHERE c.user_id = p_user_id
    ),
    'applications_received', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', ca.id,
        'campaign_id', ca.campaign_id,
        'user_id', ca.user_id,
        'message', ca.message,
        'status', ca.status,
        'created_at', ca.created_at,
        'influencer', jsonb_build_object(
          'id', ip.id,
          'name', ip.name,
          'city', ip.city,
          'niche', ip.niche,
          'followers', ip.followers,
          'engagement_rate', ip.engagement_rate,
          'rating', ip.rating,
          'avatar_url', ip.avatar_url
        )
      ) ORDER BY ca.created_at DESC), '[]'::jsonb)
      FROM campaign_applications ca
      LEFT JOIN influencer_profiles ip ON ca.influencer_profile_id = ip.id
      WHERE ca.campaign_id IN (
        SELECT id FROM campaigns WHERE user_id = p_user_id
      )
    ),
    'my_applications', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', ca.id,
        'message', ca.message,
        'status', ca.status,
        'created_at', ca.created_at,
        'campaign', jsonb_build_object(
          'id', c.id,
          'brand', c.brand,
          'brand_logo', c.brand_logo,
          'city', c.city,
          'budget', c.budget,
          'niche', c.niche,
          'description', c.description,
          'status', c.status
        )
      ) ORDER BY ca.created_at DESC), '[]'::jsonb)
      FROM campaign_applications ca
      LEFT JOIN campaigns c ON ca.campaign_id = c.id
      WHERE ca.user_id = p_user_id
    ),
    'bookings', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', b.id,
        'brand_user_id', b.brand_user_id,
        'influencer_user_id', b.influencer_user_id,
        'influencer_profile_id', b.influencer_profile_id,
        'items', b.items,
        'notes', b.notes,
        'total_amount', b.total_amount,
        'status', b.status,
        'created_at', b.created_at,
        'influencer_name', ip.name,
        'brand_name', pr.display_name
      ) ORDER BY b.created_at DESC), '[]'::jsonb)
      FROM bookings b
      LEFT JOIN influencer_profiles ip ON b.influencer_profile_id = ip.id
      LEFT JOIN profiles pr ON (
        CASE
          WHEN b.brand_user_id = p_user_id THEN b.influencer_user_id = pr.user_id
          WHEN b.influencer_user_id = p_user_id THEN b.brand_user_id = pr.user_id
        END
      )
      WHERE b.brand_user_id = p_user_id OR b.influencer_user_id = p_user_id
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_data(uuid) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_dashboard_data(uuid) IS 
'Efficiently fetches all dashboard data in a single query. 
Returns: influencer_profile, brand_profile, campaigns, applications_received, my_applications, bookings.
Reduces 26+ queries to 1 with proper joins and aggregations.';
