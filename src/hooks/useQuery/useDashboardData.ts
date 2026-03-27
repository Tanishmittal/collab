import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type InfluencerProfileRow = Tables<'influencer_profiles'>;
type BrandProfileRow = Tables<'brand_profiles'>;
type CampaignRow = Tables<'campaigns'>;
type CampaignApplicationRow = Tables<'campaign_applications'>;
type BookingRow = Tables<'bookings'>;
type ProfileRow = Tables<'profiles'>;

export interface DashboardData {
  user_id: string;
  influencer_profile: {
    id: string;
    name: string;
    followers: string;
    rating: number | null;
    engagement_rate: string | null;
    avatar_url: string | null;
    city: string;
    niche: string;
  } | null;
  brand_profile: {
    id: string;
    company_name: string;
    website: string | null;
    verified: boolean;
  } | null;
  campaigns: Array<{
    id: string;
    user_id: string;
    brand: string;
    brand_logo: string;
    city: string;
    budget: number;
    influencers_needed: number;
    influencers_applied: number;
    niche: string;
    status: string;
    description: string;
    created_at: string;
    deliverables: string[];
  }>;
  applications_received: Array<{
    id: string;
    campaign_id: string;
    user_id: string;
    message: string;
    status: string;
    created_at: string;
    influencer_profiles: {
      id: string;
      name: string;
      city: string;
      niche: string;
      followers: string;
      engagement_rate: string | null;
      rating: number | null;
      avatar_url: string | null;
    } | null;
  }>;
  my_applications: Array<{
    id: string;
    message: string;
    status: string;
    created_at: string;
    campaigns: {
      id: string;
      user_id: string;
      brand: string;
      brand_logo: string;
      city: string;
      budget: number;
      niche: string;
      description: string;
      status: string;
    } | null;
  }>;
  bookings: Array<{
    id: string;
    application_id: string | null;
    brand_user_id: string;
    campaign_id: string | null;
    influencer_user_id: string;
    influencer_profile_id: string;
    items: Array<{ type: string; price: number; qty: number }>;
    notes: string;
    total_amount: number;
    status: string;
    created_at: string;
    influencer_name: string;
    brand_name: string;
  }>;
}

const buildDashboardFallback = async (userId: string): Promise<DashboardData> => {
  const [
    influencerProfileResult,
    brandProfileResult,
    campaignsResult,
    myApplicationsResult,
    bookingsResult,
    profilesResult,
  ] = await Promise.all([
    supabase
      .from('influencer_profiles')
      .select('id, name, followers, rating, engagement_rate, avatar_url, city, niche')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('brand_profiles')
      .select('id, business_name, website')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('campaigns')
      .select('id, user_id, brand, brand_logo, city, budget, influencers_needed, influencers_applied, niche, status, description, created_at, deliverables')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('campaign_applications')
      .select(`
        id,
        message,
        status,
        created_at,
        campaigns (
          id,
          user_id,
          brand,
          brand_logo,
          city,
          budget,
          niche,
          description,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('bookings')
      .select('id, application_id, brand_user_id, campaign_id, influencer_user_id, influencer_profile_id, items, notes, total_amount, status, created_at')
      .or(`brand_user_id.eq.${userId},influencer_user_id.eq.${userId}`)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('user_id, display_name'),
  ]);

  const directErrors = [
    influencerProfileResult.error,
    brandProfileResult.error,
    campaignsResult.error,
    myApplicationsResult.error,
    bookingsResult.error,
    profilesResult.error,
  ].filter(Boolean);

  if (directErrors.length > 0) {
    throw new Error(directErrors[0]?.message || 'Failed to fetch dashboard data');
  }

  const campaigns = (campaignsResult.data || []) as Pick<
    CampaignRow,
    'id' | 'user_id' | 'brand' | 'brand_logo' | 'city' | 'budget' | 'influencers_needed' | 'influencers_applied' | 'niche' | 'status' | 'description' | 'created_at' | 'deliverables'
  >[];

  const campaignIds = campaigns.map((campaign) => campaign.id);

  const applicationsReceivedResult = campaignIds.length
    ? await supabase
        .from('campaign_applications')
        .select(`
          id,
          campaign_id,
          user_id,
          message,
          status,
          created_at,
          influencer_profiles (
            id,
            name,
            city,
            niche,
            followers,
            engagement_rate,
            rating,
            avatar_url
          )
        `)
        .in('campaign_id', campaignIds)
        .order('created_at', { ascending: false })
    : { data: [], error: null };

  if (applicationsReceivedResult.error) {
    throw new Error(applicationsReceivedResult.error.message || 'Failed to fetch dashboard applications');
  }

  const profileNameMap = new Map(
    ((profilesResult.data || []) as Pick<ProfileRow, 'user_id' | 'display_name'>[]).map((profile) => [
      profile.user_id,
      profile.display_name || 'User',
    ])
  );

  const influencerProfile = influencerProfileResult.data as Pick<
    InfluencerProfileRow,
    'id' | 'name' | 'followers' | 'rating' | 'engagement_rate' | 'avatar_url' | 'city' | 'niche'
  > | null;

  const brandProfile = brandProfileResult.data as Pick<
    BrandProfileRow,
    'id' | 'business_name' | 'website'
  > | null;

  return {
    user_id: userId,
    influencer_profile: influencerProfile,
    brand_profile: brandProfile
      ? {
          id: brandProfile.id,
          company_name: brandProfile.business_name,
          website: brandProfile.website,
          verified: false,
        }
      : null,
    applications_received: ((applicationsReceivedResult.data || []) as Array<
      Pick<CampaignApplicationRow, 'id' | 'campaign_id' | 'user_id' | 'message' | 'status' | 'created_at'> & {
        influencer_profiles: DashboardData['applications_received'][number]['influencer_profiles'];
      }
    >).map((application) => ({
      id: application.id,
      campaign_id: application.campaign_id,
      user_id: application.user_id,
      message: application.message,
      status: application.status,
      created_at: application.created_at,
      influencer_profiles: application.influencer_profiles || null,
    })),
    campaigns: campaigns.map((campaign) => ({
      ...campaign,
      deliverables: campaign.deliverables || [],
      influencers_applied: ((applicationsReceivedResult.data || []) as Array<
        Pick<CampaignApplicationRow, 'campaign_id'>
      >).filter((application) => application.campaign_id === campaign.id).length,
    })),
    my_applications: ((myApplicationsResult.data || []) as Array<
      Pick<CampaignApplicationRow, 'id' | 'message' | 'status' | 'created_at'> & {
        campaigns: DashboardData['my_applications'][number]['campaigns'];
      }
    >).map((application) => ({
      id: application.id,
      message: application.message,
      status: application.status,
      created_at: application.created_at,
      campaigns: application.campaigns || null,
    })),
    bookings: ((bookingsResult.data || []) as BookingRow[]).map((booking) => ({
      id: booking.id,
      application_id: booking.application_id || null,
      brand_user_id: booking.brand_user_id,
      campaign_id: booking.campaign_id || null,
      influencer_user_id: booking.influencer_user_id,
      influencer_profile_id: booking.influencer_profile_id,
      items: Array.isArray(booking.items) ? (booking.items as DashboardData['bookings'][number]['items']) : [],
      notes: booking.notes,
      total_amount: booking.total_amount,
      status: booking.status,
      created_at: booking.created_at,
      influencer_name:
        booking.brand_user_id === userId
          ? profileNameMap.get(booking.influencer_user_id) || 'Influencer'
          : profileNameMap.get(booking.influencer_user_id) || 'Influencer',
      brand_name:
        booking.influencer_user_id === userId
          ? profileNameMap.get(booking.brand_user_id) || 'Brand'
          : profileNameMap.get(booking.brand_user_id) || 'Brand',
    })),
  };
};

export const useDashboardData = (userId: string | null | undefined) => {
  return useQuery<DashboardData, Error>({
    queryKey: ['dashboard', userId],
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      if (!userId) {
        throw new Error('userId is required');
      }
      return buildDashboardFallback(userId);
    },
    enabled: !!userId,
  });
};
