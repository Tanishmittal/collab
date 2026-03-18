import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Campaign {
  id: string;
  user_id: string;
  brand: string;
  brand_logo: string;
  city: string;
  budget: number;
  influencers_needed: number;
  deliverables: string[];
  niche: string;
  status: string;
  description: string;
  created_at: string;
  expires_at?: string | null;
}

interface UseCampaignsOptions {
  limit?: number;
  offset?: number;
  userId?: string;
  onlyActive?: boolean;
}

/**
 * Hook to fetch campaigns with pagination support
 * 
 * @param options - Query options (limit, offset, userId, onlyActive)
 * @returns Query object with campaigns data
 */
export const useCampaigns = (
  options: UseCampaignsOptions = { limit: 20, offset: 0 },
  queryOptions?: Partial<UseQueryOptions<Campaign[], Error>>
) => {
  const { limit = 20, offset = 0, userId, onlyActive = false } = options;

  return useQuery<Campaign[], Error>({
    queryKey: ['campaigns', { limit, offset, userId, onlyActive }],
    queryFn: async () => {
      let query = supabase
        .from('campaigns')
        .select('*', { count: 'exact' });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (onlyActive) {
        query = query.eq('status', 'active');
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(error.message || 'Failed to fetch campaigns');
      }

      const campaigns = (data || []) as Campaign[];
      const campaignIds = campaigns.map((campaign) => campaign.id);

      if (campaignIds.length === 0) {
        return campaigns;
      }

      const { data: applications, error: applicationsError } = await supabase
        .from('campaign_applications')
        .select('campaign_id')
        .in('campaign_id', campaignIds);

      if (applicationsError) {
        throw new Error(applicationsError.message || 'Failed to fetch campaign application counts');
      }

      const applicationCounts = new Map<string, number>();
      (applications || []).forEach((application) => {
        const nextCount = (applicationCounts.get(application.campaign_id) || 0) + 1;
        applicationCounts.set(application.campaign_id, nextCount);
      });

      return campaigns.map((campaign) => ({
        ...campaign,
        influencers_applied: applicationCounts.get(campaign.id) || 0,
      }));
    },
    ...queryOptions,
  });
};
